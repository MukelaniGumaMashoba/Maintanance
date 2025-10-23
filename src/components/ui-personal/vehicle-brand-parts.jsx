'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function VehicleBrandParts({ isOpen, onClose, onPartSelect }) {
  const supabase = createClient();
  const [brands, setBrands] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBrands();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedBrand) {
      fetchPartsByBrand(selectedBrand.id);
    }
  }, [selectedBrand]);

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('vehicle_brands')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch vehicle brands');
      return;
    }
    setBrands(data || []);
  };

  const fetchPartsByBrand = async (brandId) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parts')
      .select(`
        *,
        categories(name)
      `)
      .eq('vehicle_brand_id', brandId)
      .gt('current_stock', 0)
      .order('name');

    if (error) {
      toast.error('Failed to fetch parts');
      return;
    }
    setParts(data || []);
    setLoading(false);
  };

  const filteredParts = parts.filter(part =>
    part.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePartSelect = (part) => {
    onPartSelect(part);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Parts by Vehicle Brand
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-96">
          {/* Brand Selection */}
          <div className="w-1/3 border-r pr-4">
            <h4 className="font-medium mb-3">Vehicle Brands</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {brands.map(brand => (
                <Button
                  key={brand.id}
                  variant={selectedBrand?.id === brand.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedBrand(brand)}
                >
                  {brand.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Parts List */}
          <div className="flex-1 pl-4">
            {selectedBrand ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <h4 className="font-medium">{selectedBrand.name} Parts</h4>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search parts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading parts...</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredParts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No parts found for {selectedBrand.name}
                      </div>
                    ) : (
                      filteredParts.map(part => (
                        <div
                          key={part.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handlePartSelect(part)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{part.name}</div>
                            <div className="text-sm text-gray-600">
                              {part.part_number} • {part.categories?.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              R{(part.price || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={part.current_stock <= part.minimum_stock ? 'destructive' : 'default'}>
                              Stock: {part.current_stock}
                            </Badge>
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a vehicle brand to view parts
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}