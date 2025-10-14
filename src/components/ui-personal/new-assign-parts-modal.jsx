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

        // Log the transaction
        await supabase
          .from('inventory_logs')
          .insert({
            part_id: partId,
            change_type: 'remove',
            quantity_change: -quantity
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
          job_parts: assignedParts
        });

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Assign Parts to Job: {jobCard?.job_number || jobCard?.jobId_workshop}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Selected Parts Summary */}
          {selectedParts.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Selected Parts ({selectedParts.length})</h4>
              <div className="space-y-1">
                {selectedParts.map(sp => (
                  <div key={sp.partId} className="flex justify-between text-sm">
                    <span>{sp.part.description} x{sp.quantity}</span>
                    <span>R{((sp.part.price || 0) * sp.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 font-medium">
                Total: R{totalCost.toFixed(2)}
              </div>
            </div>
          )}

          {/* Parts List */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredParts.map(part => (
                <div key={part.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{part.description}</h4>
                      <p className="text-xs text-gray-600">{part.item_code}</p>
                      <p className="text-xs text-gray-600">
                        Category: {part.categories?.name || 'N/A'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={part.quantity <= 5 ? 'destructive' : 'default'} className="text-xs">
                          Stock: {part.quantity}
                        </Badge>
                        <span className="text-xs text-gray-600">
                          R{(part.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(part.id, getSelectedQuantity(part.id) - 1)}
                        disabled={getSelectedQuantity(part.id) <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        max={part.quantity}
                        value={getSelectedQuantity(part.id)}
                        onChange={(e) => handleQuantityChange(part.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(part.id, getSelectedQuantity(part.id) + 1)}
                        disabled={getSelectedQuantity(part.id) >= part.quantity}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignParts} 
              disabled={selectedParts.length === 0 || loading}
            >
              <Package className="w-4 h-4 mr-2" />
              {loading ? 'Assigning...' : `Assign ${selectedParts.length} Parts`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}