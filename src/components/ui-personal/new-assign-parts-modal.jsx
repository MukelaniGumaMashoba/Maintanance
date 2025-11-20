'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function NewAssignPartsModal({ isOpen, onClose, jobCard, onPartsAssigned }) {
  const supabase = createClient();
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedParts, setSelectedParts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchParts();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from('parts')
      .select(`
        *,
        categories(name)
      `)
      .order('description');

    if (error) {
      toast.error('Failed to fetch parts');
      return;
    }
    setParts(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch categories');
      return;
    }
    setCategories(data || []);
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.item_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || part.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory && part.quantity > 0;
  });

  const handleQuantityChange = (partId, quantity) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    if (quantity <= 0) {
      setSelectedParts(prev => prev.filter(p => p.partId !== partId));
      return;
    }

    if (quantity > part.quantity) {
      toast.error(`Only ${part.quantity} available`);
      return;
    }

    setSelectedParts(prev => {
      const existing = prev.find(p => p.partId === partId);
      if (existing) {
        return prev.map(p => p.partId === partId ? { ...p, quantity } : p);
      }
      return [...prev, { partId, quantity, part }];
    });
  };

  const handleAssignParts = async () => {
    if (selectedParts.length === 0) {
      toast.error('Please select parts to assign');
      return;
    }

    setLoading(true);
    try {
      // Update part quantities and create logs
      for (const assignment of selectedParts) {
        const { partId, quantity } = assignment;
        const part = parts.find(p => p.id === partId);

        // Update part quantity
        await supabase
          .from('parts')
          .update({
            quantity: part.quantity - quantity,
            total: (part.quantity - quantity) * (part.price || 0)
          })
          .eq('id', partId);

        await supabase
          .from('workshop_job')
          .update({
            total_parts_cost: (part.quantity - quantity) * (part.price || 0),
            grand_total: (part.price * part.quantity) + (jobCard?.labour_total || 0)
          })
          .eq('id', jobCard.id);

        // Log the transaction
        await supabase
          .from('inventory_logs')
          .insert({
            part_id: partId,
            change_type: 'remove',
            quantity_change: -quantity,
            job_id: jobCard.id,
          });
      }

      // Update job card with assigned parts
      const assignedParts = selectedParts.map(sp => ({
        id: sp.partId,
        description: sp.part.description,
        item_code: sp.part.item_code,
        quantity: sp.quantity,
        price: sp.part.price,
        total_cost: (sp.part.price || 0) * sp.quantity
      }));

      await supabase
        .from('workshop_jobpart')
        .upsert({
          job_id: jobCard.id,
          given_parts: assignedParts
        });


      await supabase
        .from('workshop_job')
        .update({ status: 'Part Assigned' })
        .eq('id', jobCard.id);


      toast.success('Parts assigned successfully');
      onPartsAssigned();
      onClose();
    } catch (error) {
      console.error('Error assigning parts:', error);
      toast.error('Failed to assign parts');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedQuantity = (partId) => {
    const selected = selectedParts.find(p => p.partId === partId);
    return selected ? selected.quantity : 0;
  };

  const totalCost = selectedParts.reduce((sum, sp) => sum + ((sp.part.price || 0) * sp.quantity), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-4 max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Assign Parts to Job
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Job: <span className="font-medium">{jobCard?.job_number || jobCard?.jobId_workshop}</span>
            {jobCard?.customer_name && (
              <span className="ml-2">• Customer: <span className="font-medium">{jobCard.customer_name}</span></span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search parts by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm w-full sm:w-48"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Selected Parts Summary */}
          {selectedParts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900">Selected Parts</h4>
                <Badge className="bg-blue-100 text-blue-800">{selectedParts.length} items</Badge>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedParts.map(sp => (
                  <div key={sp.partId} className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded border">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{sp.part.description}</div>
                      <div className="text-xs text-gray-500">Qty: {sp.quantity} • Unit: R{(sp.part.price || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-right ml-2">
                      <div className="font-medium text-green-600">R{((sp.part.price || 0) * sp.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-blue-200 mt-3 pt-3 flex justify-between items-center">
                <span className="font-medium text-blue-900">Total Cost:</span>
                <span className="text-lg font-bold text-blue-900">R{totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Parts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Available Parts</h4>
              <Badge variant="outline">{filteredParts.length} parts</Badge>
            </div>

            {filteredParts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">No parts found</div>
                <div className="text-xs mt-1">Try adjusting your search or category filter</div>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border rounded-lg">
                <div className="grid grid-cols-1 divide-y">
                  {filteredParts.map(part => (
                    <div key={part.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Part Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-gray-900 truncate">{part.description}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">{part.item_code}</span>
                                <Badge variant="outline" className="text-xs">
                                  {part.categories?.name || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="text-right">
                                <div className={`font-medium ${part.quantity <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                  Stock: {part.quantity}
                                </div>
                                <div className="text-xs text-gray-500">
                                  R{(part.price || 0).toFixed(2)} each
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 justify-center sm:justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(part.id, getSelectedQuantity(part.id) - 1)}
                            disabled={getSelectedQuantity(part.id) <= 0}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            max={part.quantity}
                            value={getSelectedQuantity(part.id)}
                            onChange={(e) => handleQuantityChange(part.id, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center text-sm"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(part.id, getSelectedQuantity(part.id) + 1)}
                            disabled={getSelectedQuantity(part.id) >= part.quantity}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sticky Actions Footer */}
        <div className="flex-shrink-0 bg-white border-t p-4 -mx-6 -mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleAssignParts}
              disabled={selectedParts.length === 0 || loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              {loading ? 'Assigning Parts...' : selectedParts.length > 0 ? `Assign ${selectedParts.length} Part${selectedParts.length !== 1 ? 's' : ''}` : 'Select Parts to Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}