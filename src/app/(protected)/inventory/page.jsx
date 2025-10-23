'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Package,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  QrCode,
  Printer,
  MapPin,
  User,
  Calendar,
  Receipt,
  Download,
  ClipboardList,
  Filter,
  Save,
  History,
  Minus
} from 'lucide-react';
import DashboardHeader from '@/components/shared/DashboardHeader';
import DashboardTabs from '@/components/shared/DashboardTabs';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import NewAssignPartsModal from '@/components/ui-personal/new-assign-parts-modal';

export default function InventoryPage() {
  const supabase = createClient();
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedPartLogs, setSelectedPartLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('job-cards');

  // Stock Take state
  const [stockTakeMode, setStockTakeMode] = useState(false);
  const [updatedItems, setUpdatedItems] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [stockTakeSearchTerm, setStockTakeSearchTerm] = useState('');
  const [selectedStockType, setSelectedStockType] = useState('all');
  const [stockTypes, setStockTypes] = useState([]);
  const [stockTakeActiveTab, setStockTakeActiveTab] = useState('stock-take');
  const [thresholds, setThresholds] = useState({});
  const [defaultThreshold, setDefaultThreshold] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchParts(), fetchCategories(), fetchJobCards()]);
    setLoading(false);
  };

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

  const fetchJobCards = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('workshop_job')
        .select('*')
        .neq('status', 'Awaiting Approval')
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error fetching job cards:', jobsError);
        toast.error('Failed to load job cards');
        setJobCards([]);
        return;
      }

      // Fetch parts for jobs and group by job_id
      const { data: partsData, error: partsError } = await supabase
        .from('workshop_jobpart')
        .select('*');

      if (partsError) {
        console.error('Error fetching workshop job parts:', partsError);
      }

      const partsByJob = new Map();
      (partsData || []).forEach((p) => {
        const jobId = p.job_id;
        if (jobId == null) return;
        const arr = [];
        if (Array.isArray(p.job_parts)) arr.push(...p.job_parts);
        if (Array.isArray(p.given_parts)) arr.push(...p.given_parts);
        if (!partsByJob.has(jobId)) partsByJob.set(jobId, []);
        partsByJob.get(jobId).push(...arr);
      });

      const jobsWithParts = (jobsData || []).map((job) => ({
        ...job,
        job_number: job.job_number || job.jobId_workshop || job.job_id,
        customer_name: job.customer_name || job.client_name,
        vehicle_registration: job.vehicle_registration || job.registration_no,
        job_description: job.job_description || job.description,
        parts_required: partsByJob.get(job.id) || [],
      }));

      setJobCards(jobsWithParts || []);
    } catch (err) {
      console.error('Unexpected error fetching job cards:', err);
      toast.error('Failed to load job cards');
      setJobCards([]);
    }
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.item_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || part.category_id?.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredJobCards = jobCards.filter(job => {
    const matchesSearch =
      job.job_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle_registration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_description?.toLowerCase().includes(searchTerm.toLowerCase());

    // const hasNoParts = !job.parts_required || !Array.isArray(job.parts_required) || job.parts_required.length === 0;
    const hasNoParts = job.job_parts?.length > 0 || !job.given_parts || !Array.isArray(job.given_parts) || job.given_parts.length === 0  || job.status !== 'Part Assigned';
    return matchesSearch && hasNoParts;
  });

  const jobCardsWithParts = jobCards.filter(job =>
    job.parts_required && Array.isArray(job.parts_required) && job.parts_required.length > 0 && (job.status === 'Part Assigned' || job.status === 'completed')
  );

  const completedJobs = jobCards.filter(job =>
    job.given_parts && job.given_parts.length > 0 &&
    (job.status === 'Part Assigned' || job.status === 'completed')
  );

  const handleViewLogs = async (partId) => {
    const { data, error } = await supabase
      .from('inventory_logs')
      .select(`
        *,
        parts(description, item_code)
      `)
      .eq('part_id', partId)
      .order('timestamp', { ascending: false });

    if (error) {
      toast.error('Failed to fetch logs');
      return;
    }

    setSelectedPartLogs(data || []);
    setShowLogsModal(true);
  };

  const handleAssignParts = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowAssignModal(true);
  };

  const handlePartsAssigned = () => {
    fetchData();
    setShowAssignModal(false);
    setSelectedJobCard(null);
  };

  // Stock Take Functions
  const handleStartStockTake = () => {
    setStockTakeMode(true);
    setUpdatedItems({});
    setHasChanges(false);
    toast.success('Stock take mode activated. You can now update quantities.');
  };

  const handleCancelStockTake = () => {
    setStockTakeMode(false);
    setUpdatedItems({});
    setHasChanges(false);
    toast.info('Stock take cancelled. No changes were saved.');
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    const currentQuantity = parseInt(parts.find(item => item.id === itemId)?.quantity || '0');
    const parsedQuantity = parseInt(newQuantity) || 0;

    setUpdatedItems(prev => ({
      ...prev,
      [itemId]: {
        id: itemId,
        current_quantity: currentQuantity,
        new_quantity: parsedQuantity,
        difference: parsedQuantity - currentQuantity
      }
    }));

    setHasChanges(true);
  };

  const handlePublishStockTake = async () => {
    if (!hasChanges) {
      toast.error('No changes to publish');
      return;
    }

    try {
      setPublishing(true);

      for (const update of Object.values(updatedItems)) {
        // Update part quantity
        await supabase
          .from('parts')
          .update({
            quantity: update.new_quantity,
            total: update.new_quantity * (parts.find(p => p.id === update.id)?.price || 0)
          })
          .eq('id', update.id);

        // Log the change
        await supabase
          .from('inventory_logs')
          .insert({
            part_id: update.id,
            change_type: 'adjust',
            quantity_change: update.difference
          });
      }

      toast.success(`Stock take published successfully! ${Object.keys(updatedItems).length} items updated.`);

      setStockTakeMode(false);
      setUpdatedItems({});
      setHasChanges(false);
      fetchData();
    } catch (error) {
      console.error('Error publishing stock take:', error);
      toast.error('Failed to publish stock take');
    } finally {
      setPublishing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType?.toLowerCase()) {
      case 'installation':
        return 'bg-blue-100 text-blue-800';
      case 'de-installation':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Tab content components
  const jobCardsContent = (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
          <Input
            placeholder="Search job cards by job number, customer, vehicle, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 w-4 h-4" />
          Refresh
        </Button>
      </div>

      {filteredJobCards.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 w-12 h-12 text-gray-400" />
          <h3 className="mb-2 font-medium text-gray-900 text-lg">No job cards found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'No job cards match your search criteria.' : 'No job cards available.'}
          </p>
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobCards.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.job_number}</CardTitle>
                    <p className="text-gray-600 text-sm">{job.customer_name}</p>
                  </div>
                  <div className="flex gap-1">
                    <Badge className={`text-xs ${getStatusColor(job.job_status || job.status)}`}>
                      {job.job_status || job.status || 'Not Started'}
                    </Badge>
                    {job.job_type && (
                      <Badge variant="outline" className={`text-xs ${getJobTypeColor(job.job_type)}`}>
                        {job.job_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span>{job.vehicle_registration || 'No vehicle'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{job.customer_address || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Due: {formatDate(job.due_date)}</span>
                  </div>
                </div>

                {job.job_description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {job.job_description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAssignParts(job)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-1 w-3 h-3" />
                    Assign Parts
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const assignedPartsContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-xl">Jobs with Assigned Parts</h2>
        <Badge variant="outline">{jobCardsWithParts.length} jobs</Badge>
      </div>

      {jobCardsWithParts.length === 0 ? (
        <div className="py-12 text-center">
          <Package className="mx-auto mb-4 w-12 h-12 text-gray-400" />
          <h3 className="mb-2 font-medium text-gray-900 text-lg">No jobs with assigned parts</h3>
          <p className="text-gray-500">Jobs will appear here once parts are assigned.</p>
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {jobCardsWithParts.map((job) => (
            <Card key={job.id} className="bg-green-50 hover:shadow-md border-green-200 transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{job.job_number}</CardTitle>
                    <p className="text-gray-600 text-sm">{job.customer_name}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <Package className="mr-1 w-3 h-3" />
                    Parts Assigned
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-gray-400" />
                    <span>{job.vehicle_registration || 'No vehicle'}</span>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="font-medium text-gray-700">Assigned Parts:</p>
                  <div className="space-y-1 mt-1">
                    {job.parts_required?.slice(0, 3).map((part, index) => (
                      <div key={index} className="flex justify-between text-gray-600 text-xs">
                        <span>• {part.description}</span>
                        <span className="text-green-600">Qty: {part.quantity}</span>
                      </div>
                    ))}
                    {job.parts_required?.length > 3 && (
                      <div className="text-gray-500 text-xs">
                        +{job.parts_required.length - 3} more parts
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignParts(job)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Plus className="mr-1 w-3 h-3" />
                    Reassign Parts
                  </Button>
                  <Badge variant="outline" className="text-xs">
                    {job.parts_required.length} parts
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const partsInventoryContent = (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search parts by description or code..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParts.map(part => (
          <Card key={part.id} className={`${part.quantity <= 5 ? 'border-red-200 bg-red-50' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{part.description}</CardTitle>
                  <p className="text-sm text-gray-600">{part.item_code}</p>
                </div>
                <Badge variant={part.quantity <= 5 ? 'destructive' : 'default'}>
                  Qty: {part.quantity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm">{part.categories?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-sm">R{part.price?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <span className="text-sm font-medium">R{(part.quantity * (part.price || 0)).toFixed(2)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewLogs(part.id)}
                  className="w-full mt-2"
                >
                  <History className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const stockTakeContent = (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">Stock Take</h3>
          <p className="text-gray-600 text-sm">Perform physical stock counts and update inventory</p>
        </div>
        <Button
          onClick={stockTakeMode ? handleCancelStockTake : handleStartStockTake}
          variant={stockTakeMode ? "outline" : "default"}
          className={stockTakeMode ? "text-red-600 hover:text-red-700" : ""}
        >
          {stockTakeMode ? (
            <>
              <AlertCircle className="mr-2 w-4 h-4" />
              Cancel Stock Take
            </>
          ) : (
            <>
              <ClipboardList className="mr-2 w-4 h-4" />
              Start Stock Take
            </>
          )}
        </Button>
      </div>

      {stockTakeMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Stock Take Mode Active</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePublishStockTake}
                  disabled={!hasChanges || publishing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="mr-2 w-4 h-4" />
                  {publishing ? 'Publishing...' : 'Publish Changes'}
                </Button>
              </div>
            </div>
            {hasChanges && (
              <div className="mt-2 text-blue-700 text-sm">
                {Object.keys(updatedItems).length} items have been modified
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto">
        <table className="border border-gray-200 w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 border border-gray-200 font-medium text-gray-700 text-sm text-left">
                Item Description
              </th>
              <th className="px-4 py-3 border border-gray-200 font-medium text-gray-700 text-sm text-left">
                Code
              </th>
              <th className="px-4 py-3 border border-gray-200 font-medium text-gray-700 text-sm text-center">
                Category
              </th>
              <th className="px-4 py-3 border border-gray-200 font-medium text-gray-700 text-sm text-center">
                Current Qty
              </th>
              {stockTakeMode && (
                <>
                  <th className="px-4 py-3 border border-gray-200 font-medium text-gray-700 text-sm text-center">
                    New Qty
                  </th>
                  <th className="px-4 py-3 border border-gray-200 font-medium text-gray-700 text-sm text-center">
                    Difference
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredParts.map((item) => {
              const update = updatedItems[item.id];
              const currentQuantity = update?.new_quantity ?? parseInt(item.quantity || '0');
              const difference = update?.difference ?? 0;

              return (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.quantity <= 5 ? 'bg-red-50 border-red-200' : ''}`}>
                  <td className="px-4 py-3 border border-gray-200 text-sm">
                    <div>
                      <div className="font-medium text-gray-900">{item.description || ''}</div>
                      {item.quantity <= 5 && (
                        <Badge className="bg-red-100 mt-1 text-red-800 text-xs">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-gray-600 text-sm">
                    {item.item_code || 'N/A'}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-sm text-center">
                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                      {item.categories?.name || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-sm text-center">
                    <span className={`font-medium ${item.quantity <= 5 ? 'text-red-600' : ''}`}>
                      {parseInt(item.quantity || '0')}
                    </span>
                  </td>
                  {stockTakeMode && (
                    <>
                      <td className="px-4 py-3 border border-gray-200 text-sm text-center">
                        <Input
                          type="number"
                          min="0"
                          value={currentQuantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          className="w-20 text-center"
                        />
                      </td>
                      <td className="px-4 py-3 border border-gray-200 text-sm text-center">
                        {update && (
                          <span className={`font-medium ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {difference > 0 ? '+' : ''}{difference}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const tabs = [
    {
      value: 'job-cards',
      label: 'Job Cards',
      icon: FileText,
      content: jobCardsContent
    },
    {
      value: 'assigned-parts',
      label: 'Assigned Parts',
      icon: Package,
      content: assignedPartsContent
    },
    {
      value: 'parts-inventory',
      label: 'Parts Inventory',
      icon: Package,
      content: partsInventoryContent
    },
    {
      value: 'stock-take',
      label: 'Stock Take',
      icon: ClipboardList,
      content: stockTakeContent
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <DashboardHeader
          title="Inventory Management"
          subtitle="Manage job cards, assign parts, and track inventory"
          icon={Package}
        />
        <div className="flex justify-center items-center py-12">
          <div className="border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
          <span className="ml-2">Loading inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader
        title="Inventory Management"
        subtitle="Manage job cards, assign parts, and track inventory"
        icon={Package}
      />

      <div className="flex justify-end">
        <Button
          onClick={async () => {
            try {
              const response = await fetch('/api/seed', { method: 'POST' });
              if (response.ok) {
                toast.success('Sample data created successfully');
                fetchData();
              } else {
                toast.error('Failed to create sample data');
              }
            } catch (error) {
              toast.error('Failed to create sample data');
            }
          }}
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Seed Sample Data
        </Button>
      </div>

      <DashboardTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <NewAssignPartsModal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedJobCard(null);
          setSelectedParts([]);
        }}
        jobCard={selectedJobCard}
        onPartsAssigned={handlePartsAssigned}
      />

      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventory History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedPartLogs.map(log => (
              <div key={log.id} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${log.change_type === 'add' ? 'bg-green-100 text-green-800' :
                      log.change_type === 'remove' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {log.change_type}
                    </span>
                    <span className="ml-2 font-medium">
                      {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}