'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  FileText,
  Car,
  ClipboardList,
  Save,
  History,
  Minus,
  ShoppingCart,
  Mail,
  AlertTriangle,
  BarChart3,
  X
} from 'lucide-react';
import Link from "next/link";
import DashboardHeader from '@/components/shared/DashboardHeader';
import DashboardTabs from '@/components/shared/DashboardTabs';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import NewAssignPartsModal from '@/components/ui-personal/new-assign-parts-modal';
import { en } from 'zod/v4/locales';
import { redirect } from 'next/navigation';

export default function InventoryPage() {
  const supabase = createClient();
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedPartLogs, setSelectedPartLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('job-cards');
  const [orderForm, setOrderForm] = useState({
    supplier_id: '',
    parts: [],
    notes: ''
  });

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


  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    fetchData();
    checkLowStock();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchParts(), fetchCategories(), fetchSuppliers(), fetchJobCards()]);
    setLoading(false);
  };

  const checkLowStock = async () => {
    const { data: lowStockParts } = await supabase
      .from('parts')
      .select('*')
      .lte('quantity', 10);

    if (lowStockParts?.length > 0) {
      await fetch('/api/low-stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts: lowStockParts })
      });
    }
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

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch suppliers');
      return;
    }
    setSuppliers(data || []);
  };

  const fetchJobCards = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from('workshop_job')
        .select('*')
        .neq('status', 'Awaiting Approval')
        .or('status.neq.Completed')
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

      // const partsByJob = new Map();
      // (partsData || []).forEach((p) => {
      //   const jobId = p.job_id;
      //   if (jobId == null) return;
      //   const arr = [];
      //   if (Array.isArray(p.job_parts)) arr.push(...p.job_parts);
      //   if (Array.isArray(p.given_parts)) arr.push(...p.given_parts);
      //   if (!partsByJob.has(jobId)) partsByJob.set(jobId, []);
      //   partsByJob.get(jobId).push(...arr);
      // });

      const partsByJob = new Map();
      (partsData || []).forEach((p) => {
        const jobId = p.job_id;
        if (jobId == null) return;

        const arr = [];

        if (Array.isArray(p.job_parts)) {
          arr.push(
            ...p.job_parts.map((part) =>
              (typeof part === 'string'
                ? { description: part, quantity: 1 }
                : { ...part }
              ))
              .map((partObj) => ({ ...partObj, __parent_row_id: p.id, __parent_field: 'job_parts' }))
          );
        }

        if (Array.isArray(p.given_parts)) {
          arr.push(
            ...p.given_parts.map((partObj) => ({ ...partObj, __parent_row_id: p.id, __parent_field: 'given_parts' }))
          );
        }

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
    const hasNoParts = job.job_parts?.length > 0 || !job.given_parts || !Array.isArray(job.given_parts) || job.given_parts.length === 0 && job.status !== 'Part Assigned';
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
    setShowLogsModal(true);
    setIsLoadingLogs(true);
    try {
      const { data: logs, error: logsError } = await supabase
        .from("inventory_logs")
        .select(`*, parts(description, item_code)`)
        .eq("part_id", partId)
        .order("timestamp", { ascending: false });

      console.log("Fetched logs:", logs);


      if (logsError) {
        toast.error("Failed to fetch logs");
        console.error("inventory_logs error:", logsError);
        return;
      }

      // collect unique job_ids from the logs
      const jobIds = Array.from(
        new Set((logs || []).map((l) => l.job_id).filter(Boolean))
      );

      console.log("Unique job IDs from logs:", jobIds);

      let jobsMap = {};
      if (jobIds.length > 0) {
        const { data: jobsData, error: jobsError } = await supabase
          .from("workshop_job")
          .select("id, jobId_workshop, registration_no")
          .in("id", jobIds);

        console.log("Fetched jobs for logs:", jobsData);

        if (!jobsError && jobsData) {
          jobsMap = Object.fromEntries(
            jobsData.map((j) => [String(j.id), j])
          );
        } else if (jobsError) {
          console.error("workshop_job fetch error:", jobsError);
        }
      }

      // attach job info to each log entry for UI rendering
      const enriched = (logs || []).map((l) => ({
        ...l,
        job: l.job_id ? jobsMap[String(l.job_id)] ?? null : null,
      }));
      setSelectedPartLogs(enriched);
      setIsLoadingLogs(false);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      toast.error("Failed to fetch logs");
    }
  };

  const handleAssignParts = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowAssignModal(true);

  };

  const handlePartsAssigned = () => {
    const updateJobStatus = async () => {
      const { error } = await supabase
        .from('workshop_job')
        .update({ job_status: 'Started' })
        .eq('id', selectedJobCard.id);
    }

    updateJobStatus();
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
  const handleOrderParts = async () => {
    try {
      const response = await fetch('/api/parts-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderForm)
      });

      if (response.ok) {
        toast.success('Parts order sent to supplier!');
        setShowOrderModal(false);
        setOrderForm({ supplier_id: '', parts: [], notes: '' });
      } else {
        toast.error('Failed to send order');
      }
    } catch (error) {
      toast.error('Failed to send order');
    }
  };

  const jobCardsContent = (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
          <Input
            placeholder="Search job cards..."
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

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredJobCards.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{job.job_number}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{job.job_description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.customer_name}</div>
                    <div className="text-sm text-gray-500">{job.customer_address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Car className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{job.vehicle_registration || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(job.job_status || job.status)}>
                      {job.job_status || job.status || 'Not Started'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(job.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      size="sm"
                      onClick={() => handleAssignParts(job)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-1 w-3 h-3" />
                      Assign Parts
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredJobCards.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <h3 className="mb-2 font-medium text-gray-900 text-lg">No job cards found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No job cards match your search criteria.' : 'No job cards available.'}
            </p>
          </div>
        )}
      </div>
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
                        <X className="w-3 h-3 text-red-500 cursor-pointer" onClick={() => handleRemovePart(job, part)} />
                      </div>
                    ))}
                    {job.parts_required?.length > 3 && (
                      <div className="text-gray-500 text-xs">
                        +{job.parts_required.length - 3} more parts
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAssignParts(job)}
                    >Edit/View</Button>
                  </div>
                </div>


                <div className="text-sm">
                  <p className="font-medium text-gray-700">
                    Total parts Cost: R{
                      (() => {
                        const sum = (job.parts_required || []).reduce((acc, req) => {
                          const partPrice =
                            parts.find(p => p.id === req.id)?.price ?? req.price ?? 0;
                          const qty = req.quantity ?? 1;
                          return acc + partPrice * qty;
                        }, 0);

                        // fire-and-forget Supabase update
                        supabase
                          .from("workshop_job")
                          .update({ total_parts_cost: sum })
                          .eq("id", job?.id)
                          .then(({ error }) => {
                            if (error) console.error("Supabase update error:", error);
                          });

                        return sum.toFixed(2);
                      })()
                    }
                  </p>
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
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <ShoppingCart className="mr-2 w-4 h-4" />
              Order Parts
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create Parts Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <Input value={`PO-${Date.now().toString().slice(-6)}`} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Supplier *</Label>
                  <Select value={orderForm.supplier_id} onValueChange={(v) => setOrderForm({ ...orderForm, supplier_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Search & Add Parts</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search existing parts or type new item..."
                    className="pl-10"
                    onChange={(e) => {
                      const searchValue = e.target.value;
                      if (searchValue) {
                        const matchingParts = parts.filter(p =>
                          p.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
                          p.item_code?.toLowerCase().includes(searchValue.toLowerCase())
                        );
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Order Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setOrderForm(prev => ({
                        ...prev,
                        parts: [...prev.parts, { id: `custom-${Date.now()}`, description: '', quantity: 1, price: 0, isCustom: true }]
                      }));
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Custom Item
                  </Button>
                </div>

                <div className="border rounded-lg">
                  <div className="bg-gray-50 px-4 py-2 border-b grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                    <div className="col-span-5">Description</div>
                    <div className="col-span-2">Available</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit Price</div>
                    <div className="col-span-1">Action</div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {orderForm.parts.map((orderPart, index) => {
                      const stockPart = parts.find(p => p.id === orderPart.id);
                      return (
                        <div key={orderPart.id || index} className="px-4 py-3 border-b grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            {orderPart.isCustom ? (
                              <Input
                                placeholder="Enter item description"
                                value={orderPart.description}
                                onChange={(e) => {
                                  const newParts = [...orderForm.parts];
                                  newParts[index].description = e.target.value;
                                  setOrderForm({ ...orderForm, parts: newParts });
                                }}
                              />
                            ) : (
                              <div>
                                <div className="font-medium">{orderPart.description}</div>
                                <div className="text-sm text-gray-500">{stockPart?.item_code}</div>
                              </div>
                            )}
                          </div>
                          <div className="col-span-2">
                            <span className={`text-sm ${stockPart?.quantity <= 5 ? 'text-red-600' : 'text-green-600'
                              }`}>
                              {stockPart?.quantity || (orderPart.isCustom ? 'N/A' : '0')}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="1"
                              value={orderPart.quantity}
                              onChange={(e) => {
                                const newParts = [...orderForm.parts];
                                newParts[index].quantity = parseInt(e.target.value) || 1;
                                setOrderForm({ ...orderForm, parts: newParts });
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={orderPart.price || ''}
                              onChange={(e) => {
                                const newParts = [...orderForm.parts];
                                newParts[index].price = parseFloat(e.target.value) || 0;
                                setOrderForm({ ...orderForm, parts: newParts });
                              }}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newParts = orderForm.parts.filter((_, i) => i !== index);
                                setOrderForm({ ...orderForm, parts: newParts });
                              }}
                            >
                              <Minus className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {orderForm.parts.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No items added. Search for parts above or add custom items.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Quick Add Low Stock Items</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {parts.filter(p => p.quantity <= 5).map(part => (
                    <Button
                      key={part.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto p-2"
                      onClick={() => {
                        if (!orderForm.parts.find(op => op.id === part.id)) {
                          setOrderForm(prev => ({
                            ...prev,
                            parts: [...prev.parts, {
                              id: part.id,
                              description: part.description,
                              quantity: Math.max(10 - part.quantity, 1),
                              price: part.price || 0
                            }]
                          }));
                        }
                      }}
                    >
                      <div>
                        <div className="font-medium text-xs">{part.description}</div>
                        <div className="text-xs text-gray-500">Stock: {part.quantity}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Order Notes</Label>
                <Textarea
                  value={orderForm.notes}
                  onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  placeholder="Additional notes, delivery instructions, or special requirements..."
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Items: {orderForm.parts.length}</span>
                  <span className="font-bold text-lg">
                    Total: R{orderForm.parts.reduce((sum, part) => sum + ((part.quantity || 0) * (part.price || 0)), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleOrderParts}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!orderForm.supplier_id || orderForm.parts.length === 0}
              >
                <Mail className="mr-2 w-4 h-4" />
                Send Order to Supplier
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold">{parts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{parts.filter(p => p.quantity <= 5).length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{parts.filter(p => p.quantity === 0).length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">R{parts.reduce((sum, p) => sum + (p.quantity * (p.price || 0)), 0).toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParts.map(part => {
                const isLowStock = part.quantity <= 5;
                const isOutOfStock = part.quantity === 0;
                return (
                  <tr key={part.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{part.description}</div>
                        <div className="text-sm text-gray-500">{part.item_code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {part.categories?.name || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {part.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      R{(part.price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      R{(part.quantity * (part.price || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge className={
                        isOutOfStock ? 'bg-red-100 text-red-800' :
                          isLowStock ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                      }>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLogs(part.id)}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        {isLowStock && (
                          <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => {
                              setOrderForm({
                                supplier_id: '',
                                parts: [{ id: part.id, quantity: 10, description: part.description }],
                                notes: `Reorder for ${part.description} - Current stock: ${part.quantity}`
                              });
                              setShowOrderModal(true);
                            }}
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          {isLoadingLogs ? (
            <div className="flex justify-center items-center py-12">
              <div className="border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
              <span className="ml-2">Loading logs...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedPartLogs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No inventory logs found for this part.
                </div>
              ) : (
                <>
                  {selectedPartLogs.map((log) => (
                    <div key={log.id} className="border rounded p-3">
                      <div className="flex justify-self-start items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${log.change_type === "add"
                                ? "bg-green-100 text-green-800"
                                : log.change_type === "remove"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {log.change_type
                                ? log.change_type.charAt(0).toUpperCase() +
                                log.change_type.slice(1)
                                : "Update"}
                            </span>
                            <span className="ml-2 font-medium">
                              {log.quantity_change > 0 ? "+" : ""}
                              {log.quantity_change}
                            </span>
                          </div>

                          {/* Show associated job info when available */}
                          {log.job ? (
                            <div className="text-sm text-gray-700 mb-1 items-center gap-2">
                              <div className="">
                                <strong>Job:</strong>{" "}
                                {log.job.jobId_workshop ?? `#${log.job.id}`}{" "}
                                {log.job.registration_no ? (
                                  <span className="ml-2 text-gray-500">
                                    • Vehicle : {log.job.registration_no}
                                  </span>
                                ) : null}
                              </div>
                              <div className="ml-auto border-2 rounded-md px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 text-center">
                                <Button
                                  variant="link"
                                  className="text-xs text-indigo-600 hover:underline"
                                  onClick={
                                    () => {
                                      redirect(`/jobWorkShop/${log.job.id}`)
                                    }
                                  }
                                >
                                  View Job
                                </Button>
                              </div>
                            </div>
                          ) : log.job_id ? (
                            <div className="text-sm text-gray-700 mb-1">
                              <strong>Job ID:</strong> {log.job_id}
                            </div>
                          ) : null}

                          {log.parts && log.parts.description ? (
                            <div className="text-sm text-gray-600">
                              <strong>Part:</strong> {log.parts.description}{" "}
                              {log.parts.item_code ? (
                                <span className="text-gray-500">• {log.parts.item_code}</span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="text-sm text-gray-600 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()
                          }
                        </div>
                      </div>
                    </div>
                  ))
                  }
                </>
              )}
            </div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}