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
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export default function WorkshopJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<WorkshopJob | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();

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
        .select("id, tech_id")
        .eq("job_id", jobData.id);

      const tech =
        techData && techData.length > 0
          ? techData.forEach((assignment) => assignment.tech_id)
          : null;
      // Fetch technician if assigned
      if (tech) {
        const { data: technicianData, error: techError } = await supabase
          .from("technicians")
          .select("*")
          .eq("id", tech)
          .single();

        if (!techError && technicianData) {
          setTechnician(technicianData as Technician);
        }
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
      case "Awaiting Workshop Acceptance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Awaiting Approval":
        return "bg-purple-100 text-purple-800 border-purple-200";
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
                  <p className="text-sm text-gray-600">Client Name</p>
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
              {technician ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{technician.name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{technician.phone}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{technician.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No technician assigned</p>
                  <p className="text-sm text-gray-500">
                    Technician will be assigned after approval
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
                  <p className="text-sm text-green-700">Estimated Cost</p>
                  <p className="text-xl font-bold text-green-800">
                    {job.estimated_cost
                      ? `R ${job.estimated_cost.toFixed(2)}`
                      : "TBD"}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">Actual Cost</p>
                  <p className="text-xl font-bold text-blue-800">
                    {job.actual_cost
                      ? `R ${job.actual_cost.toFixed(2)}`
                      : "Pending"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={() => updateWorkshopJobStatus(job.id, "Approved")}
                  disabled={updating}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {updating ? "Processing..." : "Approve Job"}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => updateWorkshopJobStatus(job.id, "Rejected")}
                  disabled={updating}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {updating ? "Processing..." : "Reject Job"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-300"
                  onClick={() => router.push("/jobWorkShop")}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
