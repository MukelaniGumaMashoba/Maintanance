"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  User2,
  Truck,
  MapPin,
  Phone,
  User,
  Calendar,
  DollarSign,
  Wrench,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkshopJob {
  id: number;
  jobId_workshop: string;
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
  job_type?: string;
  updated_at?: string;
  technician_id?: number;
  due_date?: string;
  priority?: string;
  completed_at?: string;

  // labour fields (optional)
  labour_hours?: number;
  labor_cost?: number;
  total_labor_cost?: number;
  total_sublet_cost?: number;
  grand_total?: number;
  total_parts_cost?: number;
  technician?: boolean;
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
  surname: string;
  phone: string;
  location: string;
  rating: string;
  specialties: string[];
  email?: string;
}

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

  // Technician assignment state (from original jobs page)
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignedTechId, setAssignedTechId] = useState<number | null>(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [searchTechnician, setSearchTechnician] = useState("");
  const [selectedJobForTech, setSelectedJobForTech] =
    useState<WorkshopJob | null>(null);
  const [isTechDialogOpen, setIsTechDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<Technician | null>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from("workshop_jobpart")
      .select("*")
      .eq("job_id", Number(params.id));
    if (error) {
      console.error("Error fetching parts:", error);
      return;
    }
    setParts(data || []);
  };

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
      setSelectedJobForTech(jobData as any);

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

      // Fetch technician assignment
      const { data: techData, error: insertError } = await supabase
        .from("workshop_assignments")
        .select("*")
        .eq("job_id", jobData.id)
        .single();

      const tech = techData?.tech_id || null;
      if (tech) {
        const { data: technicianData, error: techError } = await supabase
          .from("technicians_klaver")
          .select("*")
          .eq("id", tech)
          .single();

        if (!techError && technicianData) {
          setTechnician(technicianData as unknown as Technician);
          setSelectedTechnician(technicianData as unknown as Technician);
          setAssignedTechId(tech);
          setIsAssigned(true);
        }
      } else {
        setAssignedTechId(null);
        setIsAssigned(false);
      }

      // Fetch parts
      await fetchParts();

      setIsLoading(false);
    };
    if (params.id) fetchJobAndVehicle();
  }, [params.id, supabase]);

  useEffect(() => {
    const fetchTechnician = async () => {
      const { data, error } = await supabase
        .from("technicians_klaver")
        .select("*");

      if (error) {
        console.error("Error fetching technician:", error);
        return;
      }
      setTechnicians(data as unknown as Technician[]);
    };

    fetchTechnician();
  }, []);

  // get the assigned technician from the workshop_assignments table and technician table
  const getAssignedTechnician = async () => {
    if (!selectedJobForTech) return;

    const { data, error } = await supabase
      .from("workshop_assignments")
      .select("*")
      .eq("job_id", selectedJobForTech.id)
      .single();

    if (!data) {
      setError("No technician assigned yet");
      return;
    }

    if (error) {
      setError("Error fetching assigned technician:" + error);
      return;
    }
    const techId = data.tech_id;

    const { data: techData, error: techError } = await supabase
      .from("technicians_klaver")
      .select("*")
      .eq("id", techId || 0)
      .single();

    if (techError) {
      console.error("Error fetching technician:", techError);
      return;
    }
    if (!techData) return;

    setSelectedTechnician(techData as unknown as Technician);
  };

  useEffect(() => {
    if (selectedJobForTech) {
      getAssignedTechnician();
    }
  }, [selectedJobForTech]);

  useEffect(() => {
    if (assignedTechId) {
      const fetchTech = async () => {
        const { data, error } = await supabase
          .from("technicians_klaver")
          .select("*")
          .eq("id", assignedTechId)
          .single();
        if (!error && data)
          setSelectedTechnician(data as unknown as Technician as any);
      };
      fetchTech();
    }
  }, [assignedTechId, supabase]);

  const updateWorkshopJobStatus = async (jobId: number, status: string) => {
    setUpdating(true);
    const { data, error } = await supabase
      .from("workshop_job")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        approved: status === "Approved",
      })
      .eq("id", jobId);

    if (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update job status");
      setUpdating(false);
      return { success: false, error };
    } else {
      toast.success(
        `Job ${status === "Approved" ? "approved" : "submitted for approval"} successfully`
      );
      setJob((prev) => (prev ? { ...prev, status } : null));
      setUpdating(false);
      setTimeout(() => router.push("/jobs"), 1500);
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
      case "Approved - Ready for Parts Assignment":
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
          total_sublet_cost: job?.total_sublet_cost ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      if (error) {
        console.error("Error saving labour:", error);
        toast.error("Failed to save labour");
      } else {
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
        toast.success("Costs saved");
        setIsLabourDialogOpen(false);
      }
    } catch (e) {
      console.error("Save labour failed:", e);
      toast.error("Failed to save labour");
    } finally {
      setIsSavingLabour(false);
    }
  };

  const changeTechnician = async (
    technicianId: number,
    technicianName: string
  ) => {
    if (!selectedJobForTech) return;
    try {
      const { error: updateError } = await supabase
        .from("workshop_job")
        .update({
          updated_at: new Date().toISOString(),
          technician: true,
        })
        .eq("id", selectedJobForTech.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from("workshop_assignments")
        .update({
          tech_id: technicianId,
          assigned_at: new Date().toISOString(),
        })
        .eq("job_id", selectedJobForTech.id);

      if (insertError) throw insertError;

      setAssignedTechId(technicianId);
      setIsAssigned(true);
      toast.success("Technician changed to " + technicianName + " assigned.");
      setIsTechDialogOpen(false);
      // Refresh technician data
      const { data: techData } = await supabase
        .from("technicians_klaver")
        .select("*")
        .eq("id", technicianId)
        .single();
      if (techData) {
        setTechnician(techData as unknown as Technician);
        setSelectedTechnician(techData as unknown as Technician);
      }
    } catch (err) {
      console.error("Assign error:", err);
      toast.error("Failed to assign technician.");
    }
  };

  const assignTechnicianToJob = async (
    technicianId: number,
    technicianName: string
  ) => {
    if (!selectedJobForTech) return;
    try {
      const { error: updateError } = await supabase
        .from("workshop_job")
        .update({
          updated_at: new Date().toISOString(),
          status: "Assigned",
          technician: true,
        })
        .eq("id", selectedJobForTech.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from("workshop_assignments")
        .insert([
          {
            job_id: selectedJobForTech.id,
            tech_id: technicianId,
            assigned_at: new Date().toISOString(),
            vehicle_id: selectedJobForTech.registration_no,
          },
        ]);

      if (insertError) throw insertError;

      setAssignedTechId(technicianId);
      setIsAssigned(true);
      toast.success("Technician " + technicianName + " assigned.");
      setIsTechDialogOpen(false);
      // Refresh technician data
      const { data: techData } = await supabase
        .from("technicians_klaver")
        .select("*")
        .eq("id", technicianId)
        .single();
      if (techData) {
        setTechnician(techData as unknown as Technician as any);
        setSelectedTechnician(techData as unknown as Technician);
      }
    } catch (err) {
      console.error("Assign error:", err);
      toast.error("Failed to assign technician.");
    }
  };

  if (isLoading) return <div className="p-8 text-center">
    <Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;
  if (!job) return <div className="p-8 text-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/jobs">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Jobs
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-black">
            Job Card Details
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
                Driver Information
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
                  <p className="text-sm text-gray-600">Driver Phone</p>
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

              {/* Parts Section */}
              {parts && parts.length > 0 ? (
                (() => {
                  const validParts = parts.filter((part) => {
                    const jp = part.job_parts;
                    if (jp == null) return false;
                    if (typeof jp === "string") return jp.trim() !== "";
                    if (Array.isArray(jp)) return jp.length > 0;
                    if (typeof jp === "object") return Object.keys(jp).length > 0;
                    return false;
                  });

                  if (validParts.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 italic mt-4">
                        No part requested
                      </p>
                    );
                  }

                  return (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2 text-base">
                        Parts Required
                      </h4>
                      <ul className="space-y-2 max-h-48 overflow-auto border border-gray-200 bg-gray-50 p-3 rounded-lg">
                        {validParts.map((part, index) => {
                          let displayText = "";
                          const jobParts = part.job_parts;
                          if (typeof jobParts === "string") {
                            displayText = jobParts;
                          } else if (Array.isArray(jobParts)) {
                            displayText = jobParts.join(", ");
                          } else if (typeof jobParts === "object") {
                            displayText =
                              jobParts.description ||
                              jobParts.part_name ||
                              JSON.stringify(jobParts);
                          }
                          return (
                            <li
                              key={index}
                              className="flex items-center justify-between bg-white border border-gray-100 rounded-md px-3 py-2 shadow-sm hover:bg-indigo-50 transition"
                            >
                              <span className="text-sm text-gray-800">
                                {displayText}
                              </span>
                              <span className="text-xs text-gray-500 italic">{`Part #${index + 1
                                }`}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-500 italic mt-4">No part requested</p>
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
                      {technician?.name} {technician?.surname}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{technician?.phone}</p>
                  </div>
                  {technician?.email && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold">{technician?.email}</p>
                    </div>
                  )}
                  {technician?.location && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold">{technician?.location}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No technician assigned</p>
                  <p className="text-sm text-gray-500">
                    Technician will be assigned by using the assign technician button below
                  </p>
                </div>
              )}

              {/* Technician Assignment Button */}
              <div className="mt-4 pt-4 border-t">
                {isAssigned
                  // && (job.status === "Approved" || job.status === "Approved - Ready for Parts Assignment") 
                  ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="flex items-center gap-2 text-gray-500 cursor-not-allowed"
                      >
                        <User2 className="h-4 w-4" />
                        Assigned
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsTechDialogOpen(true);
                          setSelectedJobForTech(job);
                        }}
                        disabled={job.status?.toLowerCase() === 'completed'}
                      >
                        Change Technician
                      </Button>
                    </div>
                  ) :
                  // job.status?.toLowerCase() === "awaiting approval" || job.status?.toLowerCase() === "approved - ready for parts assignment" || job.status?.toLowerCase() === "approved"
                  // ? 
                  // &&
                  (
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsTechDialogOpen(true);
                        setSelectedJobForTech(job);
                      }}
                      className="w-full flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition rounded-md shadow-sm"
                      disabled={job.status?.toLowerCase() === 'completed'}
                    >
                      <User2 className="h-4 w-4" />
                      Assign Technician
                    </Button>
                  )
                  // : (
                  //   <div>
                  //     <p className="text-sm text-orange-600">
                  //       Awaiting Approval or Ready for Parts Assignment Before Assign Technician
                  //     </p>
                  //   </div>
                  // )
                }
              </div>
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
                      : "Pending"}
                  </p>
                </div>


                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">Total Sublet Cost</p>
                  <p className="text-xl font-bold text-blue-800">
                    {job.total_sublet_cost
                      ? `R ${job.total_sublet_cost.toFixed(2)}`
                      : "Pending"}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">Total Cost (Labour & Sublet & Parts)</p>
                  <p className="text-xl font-bold text-blue-800">
                    {(Number(labourRate ?? 0) * Number(labourHours ?? 0) + Number(job.total_sublet_cost ?? 0) + Number(job.total_parts_cost ?? 0)) > 0
                      ? `R ${(Number(labourRate ?? 0) * Number(labourHours ?? 0) + Number(job.total_sublet_cost ?? 0) + Number(job.total_parts_cost ?? 0)).toFixed(2)}`
                      : "Pending"}
                  </p>
                </div>

                {/* Labour & Parts Section */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Labour & Sublet Cost</h4>
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
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => setIsLabourDialogOpen(true)}
                      disabled={job.status?.toLowerCase() === 'completed' || job.status?.toLowerCase() !== "Approved"}
                    >
                      Edit Cost (Labour & Sublet)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {job.status?.toLowerCase() !== "completed" && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      updateWorkshopJobStatus(job.id, "Awaiting Approval");
                    }}
                    disabled={updating || job.status?.toLowerCase() === 'completed' || job.status?.toLowerCase() === 'awaiting approval' || job.status?.toLowerCase() !== "Approved"}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updating ? "Processing..." : "Submit Job for Approval"}
                  </Button>
                )}
                {job.status?.toLowerCase() === "approved"
                  && (
                    <TooltipProvider>
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
                                  completion_date: new Date().toISOString(),
                                })
                                .eq("id", job.id);

                              toast.success("Job closed successfully");
                              setJob((prev) =>
                                prev ? { ...prev, status: "Completed" } : null
                              );
                              setTimeout(() => router.push("/jobs"), 1500);
                            }}
                            disabled={job.status?.toLowerCase() === 'completed' || job.status?.toLowerCase() === 'awaiting approval'}
                          >
                            Close/Complete
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This for completed job to be closed!</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Labour Edit Dialog */}
        <Dialog open={isLabourDialogOpen} onOpenChange={setIsLabourDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Cost (Labour & Sublet)</DialogTitle>
              <DialogDescription>
                Set labour hours and rate (total = hours × rate) and sublet cost
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Hours</Label>
                <Input
                  type="number"
                  min={0}
                  value={labourHours}
                  onChange={(e) => setLabourHours(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Rate (R/hr)</Label>
                <Input
                  type="number"
                  min={0}
                  value={labourRate}
                  onChange={(e) => setLabourRate(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Sublet Cost</Label>
                <Input
                  type="number"
                  min={0}
                  value={job?.total_sublet_cost ?? 0}
                  onChange={(e) => setJob((prev: any) =>
                    prev
                      ? { ...prev, total_sublet_cost: Number(e.target.value) || 0 }
                      : prev as any
                  ) as any}
                />
              </div>
              <div>
                <Label>Total Cost</Label>
                <p className="font-medium text-green-600">
                  {`R ${(
                    Number(labourRate ?? 0) * Number(labourHours ?? 0) + Number(job?.total_sublet_cost ?? 0)
                  ).toFixed(2)}`}
                </p>
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

        {/* Technician assignment dialog */}
        <Dialog open={isTechDialogOpen} onOpenChange={setIsTechDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Assign Technician to Job: {selectedJobForTech?.id} -{" "}
                {selectedJobForTech?.jobId_workshop}
              </DialogTitle>
              <DialogDescription>
                Search and select a technician based on Job Type, name, location,
                or specialties.
              </DialogDescription>
            </DialogHeader>

            <div className="mb-3">
              <Input
                placeholder="Search for technician..."
                value={searchTechnician}
                onChange={(e) => setSearchTechnician(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {technicians
                .filter((tech) => {
                  const searchTerms = searchTechnician.toLowerCase();
                  return (
                    tech.name?.toLowerCase().includes(searchTerms) ||
                    tech.surname?.toLowerCase().includes(searchTerms) ||
                    tech.location?.toLowerCase().includes(searchTerms) ||
                    tech.specialties
                      ?.map((s) => s.toLowerCase())
                      .some((s) => s.includes(searchTerms))
                  );
                })
                .map((tech) => (
                  <div
                    key={tech.id}
                    className="p-3 border rounded hover:bg-gray-100 flex justify-between items-center cursor-pointer"
                  >
                    <div>
                      <p className="font-bold">
                        <strong>
                          Name: {tech.name} {tech.surname}
                        </strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Location:</strong> {tech.location} <br />
                        <strong>Phone:</strong> {tech.phone} <br />
                        {tech.rating && (
                          <>
                            <strong>Rating:</strong> {tech.rating}
                          </>
                        )}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-gray-600">Specialties:</span>{" "}
                        {tech.specialties?.length > 0
                          ? tech.specialties.join(", ")
                          : "None"}
                      </div>
                    </div>

                    {!isAssigned ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          assignTechnicianToJob(tech.id, `${tech.name}`)
                        }
                      >
                        Assign
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => changeTechnician(tech.id, `${tech.name}`)}
                      >
                        Change Technician
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
