"use client";

import { useState, useEffect } from "react";
import { redirect, useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Truck,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Wrench,
  Clock,
  AlertTriangle,
  Droplet,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface WorkshopJob {
  id: number;
  jobId_workshop: string;
  job_type: string;
  description?: string;
  status: string;
  estimated_cost?: number;
  actual_cost?: number;
  client_name?: string;
  client_phone?: string;
  registration_no?: string;
  location?: string;
  notes?: string;
  attachments?: string[];
  created_at: string;
  updated_at?: string;
  technician_id?: number;

  // labour fields (optional)
  labour_hours?: number;
  labor_cost?: number;
  total_labor_cost?: number;
  grand_total?: number;
  total_parts_cost?: number;
  total_sublet_cost?: number;
}

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  manufactured_year: string;
  vehicle_type: string;
  fuel_type: string;
  colour: string;
}

interface Technician {
  id: number;
  name: string;
  phone: string;
  email: string;
}


const notAllowedStatuses = ["completed", "approved", "rejected", "assigned", "part assigned", "part ordered"];

export default function WorkshopJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<WorkshopJob | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

  // Labour state
  const [labourHours, setLabourHours] = useState<number>(0);
  const [labourRate, setLabourRate] = useState<number>(0);
  const [labourTotal, setLabourTotal] = useState<number>(0);
  const [isLabourDialogOpen, setIsLabourDialogOpen] = useState(false);
  const [isSavingLabour, setIsSavingLabour] = useState(false);
  const [consumables, setConsumables] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobAndVehicle = async () => {
      const { data: jobData, error: jobError } = await supabase
        .from("workshop_job")
        .select("*")
        .eq("id", Number(params.id))
        .single();

      if (jobError) {
        console.error("Error fetching workshop job:", jobError);
        setIsLoading(false);
        return;
      }

      setJob(jobData as any as WorkshopJob);

      // populate labour state from job row if present
      setLabourHours(jobData?.labour_hours ?? 0);
      setLabourRate(jobData?.labor_cost ?? 0);
      const total =
        jobData?.total_labor_cost ??
        (jobData?.labour_hours ?? 0) * (jobData?.labor_cost ?? 0);
      setLabourTotal(total ?? 0);

      if (jobData.registration_no) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehiclesc_workshop")
          .select("*")
          .eq("registration_number", jobData.registration_no)
          .single();

        if (!vehicleError && vehicleData) {
          setVehicle(vehicleData as Vehicle);
        }
      }

      const { data: techData, error: insertError } = await supabase
        .from("workshop_assignments")
        .select("*")
        .eq("job_id", jobData.id);

      console.log("Tech Assignment Data:", techData);
      const tech = techData && techData.length > 0 ? techData[0].tech_id : null;
      // Fetch technician if assigned
      console.log("Assigned Technician ID:", tech);
      if (tech) {
        const { data: technicianData, error: techError } = await supabase
          .from("technicians_klaver")
          .select("*")
          .eq("id", tech)
          .single();

        if (!techError && technicianData) {
          setTechnician(technicianData as Technician);
          console.log("Technician Data:", technicianData);
        }
      }

      // Fetch consumables
      const { data: consumablesData, error: consumError } = await supabase
        .from("workshop_jobpart")
        .select("*")
        .eq("job_id", jobData.id);
      if (!consumError && consumablesData) {
        const consumablesList = consumablesData?.flatMap((item) => item.consumables || []) || [];
        setConsumables(consumablesList);
      }

      setIsLoading(false);
    };
    if (params.id) fetchJobAndVehicle();
  }, [params.id, supabase]);

  const updateWorkshopJobStatus = async (jobId: number, status: string) => {
    setUpdating(true);
    const { data, error } = await supabase
      .from("workshop_job")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        approved: true,
      })
      .eq("id", jobId);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update job status");
      setUpdating(false);
      return { success: false, error };
    } else {
      toast.success(
        `Job ${status === "Approved" ? "approved" : "rejected"} successfully`
      );
      setJob((prev) => (prev ? { ...prev, status } : null));
      setUpdating(false);
      setTimeout(() => router.push("/jobWorkShop"), 1500);
      return { success: true, data };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Awaiting Approval":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case "mechanical":
        return <Wrench className="h-5 w-5 text-blue-600" />;
      case "electrical":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "towing":
        return <Truck className="h-5 w-5 text-green-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!job) return <div className="p-8 text-center">Job not found</div>;

  // Save labour details to DB
  const handleSaveLabour = async () => {
    if (!job) return;
    setIsSavingLabour(true);
    try {
      const updatedTotal = Number((labourHours || 0) * (labourRate || 0));
      const { error } = await supabase
        .from("workshop_job")
        .update({
          labour_hours: labourHours,
          labor_cost: labourRate,
          total_labor_cost: updatedTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      if (error) {
        console.error("Error saving labour:", error);
        toast.error("Failed to save labour");
      } else {
        // update local state & job object
        setLabourTotal(updatedTotal);
        setJob((prev) =>
          prev
            ? {
              ...prev,
              labour_hours: labourHours,
              labor_cost: labourRate,
              total_labor_cost: updatedTotal,
            }
            : prev
        );
        toast.success("Labour saved");
        setIsLabourDialogOpen(false);
      }
    } catch (e) {
      console.error("Save labour failed:", e);
      toast.error("Failed to save labour");
    } finally {
      setIsSavingLabour(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/jobWorkShop">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-black">
            Klava Plant Hire - Job Details
          </h1>
        </div>
      </div>

      <div className="p-6">
        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader className="bg-orange-500 text-white">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl">{job.jobId_workshop}</CardTitle>
                <p className="text-orange-100 capitalize">
                  {job.job_type} Service
                </p>
              </div>
              <div className="text-right">
                <Badge className={`${getStatusColor(job.status)} px-3 py-1`}>
                  {job.status}
                </Badge>
                <p className="text-orange-100 text-sm mt-1">
                  {new Date(job.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Section */}
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-black">
                <Truck className="h-5 w-5 text-orange-500" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {vehicle ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Registration</p>
                    <p className="font-semibold text-lg">
                      {vehicle.registration_number}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Make & Model</p>
                    <p className="font-semibold">
                      {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="font-semibold">{vehicle.manufactured_year}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold capitalize">
                      {vehicle.vehicle_type}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Fuel</p>
                    <p className="font-semibold capitalize">
                      {vehicle.fuel_type}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Colour</p>
                    <p className="font-semibold">{vehicle.colour}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Vehicle not found</p>
                  <p className="text-sm text-gray-500">
                    Registration: {job.registration_no}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Section */}
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-black">
                <User className="h-5 w-5 text-orange-500" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Driver Name</p>
                  <p className="font-semibold">
                    {job.client_name || "Not specified"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-semibold">
                    {job.client_phone || "Not provided"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-semibold">
                    {job.location || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Job Description Section */}
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-black">
                <FileText className="h-5 w-5 text-orange-500" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p className="text-gray-800">
                  {job.description || "No description provided"}
                </p>
              </div>
              {job.notes && (
                <div>
                  <h4 className="font-semibold text-black mb-2">
                    Additional Notes:
                  </h4>
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded">
                    <p className="text-gray-700">{job.notes}</p>
                  </div>
                </div>
              )}

              {/* Consumables Section */}
              {consumables && consumables.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2 text-base flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-purple-600" />
                    Consumables Used
                  </h4>
                  <ul className="space-y-2 max-h-48 overflow-auto border border-purple-200 bg-purple-50 p-3 rounded-lg">
                    {consumables.map((consumable, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-white border border-purple-100 rounded-md px-3 py-2 shadow-sm hover:bg-purple-50 transition"
                      >
                        <div className="flex-1">
                          <span className="text-sm text-gray-800 font-medium">
                            {consumable.name || "Unnamed"}
                          </span>
                          {consumable.quantity && consumable.unit && (
                            <p className="text-xs text-gray-500">
                              Qty: {consumable.quantity} {consumable.unit}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-purple-600">
                          R{parseFloat(consumable.price || 0).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">
                        Consumables Total:
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        R{consumables.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technician Section */}
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-black">
                <User className="h-5 w-5 text-orange-500" />
                Assigned Technician
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {technician?.id !== null && technician ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-black">
                      {technician?.name}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{technician?.phone}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{technician?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No technician assigned</p>
                  <p className="text-sm text-gray-500">
                    Technician will be assigned after parts are assigned
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost & Actions Section */}
          <Card>
            <CardHeader className="bg-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-black">
                <DollarSign className="h-5 w-5 text-orange-500" />
                Cost & Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <p className="text-sm text-green-700">Labour Cost</p>
                  <p className="text-xl font-bold text-green-800">
                    {job.total_labor_cost
                      ? `R ${job.total_labor_cost.toFixed(2)}`
                      : "TBD"}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">Total Parts Cost</p>
                  <p className="text-xl font-bold text-blue-800">
                    {job.total_parts_cost
                      ? `R ${job.total_parts_cost.toFixed(2)}`
                      : "0.00"}
                  </p>
                </div>

                {/* Sublet Cost Section */}
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-500">Total Sublet Cost</p>
                  <p className="text-xl font-bold text-yellow-800">
                    {job.total_sublet_cost
                      ? `R ${job.total_sublet_cost.toFixed(2)}`
                      : "0.00"}
                  </p>
                </div>

                {consumables && consumables.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <p className="text-sm text-purple-700">Total Consumables Cost</p>
                    <p className="text-xl font-bold text-purple-800">
                      R{consumables.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0).toFixed(2)}
                    </p>
                  </div>
                )}



                {/* Labour Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Labour</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hours</span>
                      <p className="font-medium">{labourHours ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate (R/hr)</span>
                      <p className="font-medium">
                        {labourRate !== undefined ? `R ${labourRate}` : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Labour Total</span>
                      <p className="font-medium text-green-600">{`R ${(
                        labourTotal ?? labourHours * labourRate
                      ).toFixed(2)}`}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">Total Cost (Labour & Sublet & Parts & Consumables)</p>
                    <p className="text-xl font-bold text-blue-800">
                      {(job.total_labor_cost ?? 0) + (job.total_parts_cost ?? 0) + (job.total_sublet_cost ?? 0) + (consumables ? consumables.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0) : 0) >
                        0
                        ? `R ${(
                          (job.total_labor_cost ?? 0) +
                          (job.total_parts_cost ?? 0) +
                          (job.total_sublet_cost ?? 0) +
                          (consumables ? consumables.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0) : 0)
                        ).toFixed(2)}`
                        : "Pending"}
                    </p>
                  </div>
                  {/* <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => setIsLabourDialogOpen(true)}
                      disabled={job.status?.toLowerCase() === 'completed'}
                    >
                      Edit Labour
                    </Button>
                  </div> */}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {job.status?.toLowerCase() !== "completed" && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => updateWorkshopJobStatus(job.id, "Approved")}
                    disabled={updating || notAllowedStatuses.includes(job.status?.toLowerCase() || "") || technician?.id === null}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updating ? "Processing..." : "Approve Job"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => updateWorkshopJobStatus(job.id, "Rejected")}
                  disabled={updating || notAllowedStatuses.includes(job.status?.toLowerCase() || "") || technician?.id === null}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {updating ? "Processing..." : "Reject Job"}
                </Button>

                {/* <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-gray-300"
                        onClick={async () => {
                          await supabase
                            .from("workshop_job")
                            .update({
                              status: "Completed",
                              updated_at: new Date().toISOString(),
                              completed_at: new Date().toISOString(),
                            })
                            .eq("id", job.id);

                          toast.success("Job closed successfully");
                          setJob((prev) =>
                            prev ? { ...prev, status: "Completed" } : null
                          );
                          setTimeout(() => router.push("/jobWorkShop"), 1500);
                        }}
                        disabled={job.status?.toLowerCase() === 'completed'}
                      >
                        Close/Complete
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This for completed job to be closed!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider> */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Labour Edit Dialog */}
        <Dialog open={isLabourDialogOpen} onOpenChange={setIsLabourDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Labour</DialogTitle>
              <DialogDescription>
                Set labour hours and rate (total = hours × rate)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label>Hours</label>
                <Input
                  type="number"
                  min={0}
                  value={labourHours}
                  onChange={(e) => setLabourHours(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label>Rate (R/hr)</label>
                <Input
                  type="number"
                  min={0}
                  value={labourRate}
                  onChange={(e) => setLabourRate(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label>Total</label>
                <div className="p-2 bg-gray-50 rounded border">{`R ${(
                  (labourHours || 0) * (labourRate || 0)
                ).toFixed(2)}`}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLabourDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveLabour}
                disabled={isSavingLabour}
              >
                {isSavingLabour ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
