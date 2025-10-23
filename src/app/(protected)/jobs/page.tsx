"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Clock,
  MapPin,
  User,
  Truck,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Edit,
  MessageSquare,
  FileImage,
  Download,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { nullable } from "zod";
import { toast } from "sonner";
// import { getVehicleByRegistrationNumber } from "@/lib/action/function"

interface Job {
  id: number;
  job_id: string;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high" | "emergency";
  created_at: string;
  updated_at: string;
  drivers: {
    first_name: string | null;
    surname: string | null;
    cell_number: string | null;
    job_allocated: boolean;
  }[];
  vehiclesc: {
    registration_number: string | null;
    make: string | null;
    model: string | null;
  }[];
  location: string;
  coordinates: { lat: number; lng: number };
  technician_id: number | null;
  technicians: {
    name: string;
    phone: string;
  } | null;
  estimatedCost?: number;
  actualCost?: number;
  clientType: "internal" | "external";
  clientName?: string;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: string;
  notes: string;
  attachments: string[];
  completed_at: string;
}

// Form interface for creating new workshop jobs
interface CreateWorkshopJobForm {
  registration_number: string;
  job_type: string;
  description: string;
  estimated_cost?: number;
  client_name?: string;
  client_phone?: string;
  location?: string;
  notes?: string;
  selected_workshop_id?: string;
}
interface WorkshopJob {
  id: number;
  jobId_workshop: string;
  job_type: string;
  description: string;
  estimated_cost?: number;
  client_name: string;
  client_phone: string;
  location: string;
  notes: string;
  work_notes?: string;
  workshop_id?: number;
  created_at: string;
  status: string;
  registration_no: string;
  technician_id?: string;
  priority?: string;
  job_status?: string;
}

export default function FleetJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const supabase = createClient();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);
  const [selectedJobForWorkshop, setSelectedJobForWorkshop] =
    useState<Job | null>(null);
  const [searchWorkshop, setSearchWorkshop] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [partName, setPartName] = useState("");
  const [parts, setParts] = useState<string[]>([]);

  // Form state for creating new workshop jobs
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [createJobForm, setCreateJobForm] = useState<CreateWorkshopJobForm>({
    registration_number: "",
    job_type: "",
    description: "",
    estimated_cost: undefined,
    client_name: "",
    client_phone: "",
    location: "",
    notes: "",
    selected_workshop_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null);
  const [workshopJob, setWorkshopsJob] = useState<WorkshopJob[]>([]);

  // fetch workshops from Supabase
  const fetchWorkshops = async () => {
    const { data, error } = await supabase.from("workshop").select(`
      *,
      workshop_assign (
        workshop_id,
        created_at
      )
    `);
    if (error) {
      console.error("Error fetching workshops:", error);
    } else {
      // Map the database response to match your schema
      const mappedWorkshops = data.map((workshop) => ({
        id: workshop.id,
        work_name: workshop.work_name,
        trading_name: workshop.trading_name,
        city: workshop.city,
        town: workshop.town,
        province: workshop.province,
        street: workshop.street,
        labour_rate: workshop.labour_rate,
        fleet_rate: workshop.fleet_rate,
        created_at: workshop.created_at,
      }));
      setWorkshops(mappedWorkshops);
    }
  };

  // Check if vehicle exists by registration number
  const checkVehicleExists = async (registrationNumber: string) => {
    if (!registrationNumber) {
      setVehicleExists(null);
      return null;
    }

    try {
      const vehicle = await getVehicleByRegistrationNumber(registrationNumber);
      setVehicleExists(!!vehicle);
      return vehicle;
    } catch (error) {
      console.error("Error checking vehicle:", error);
      setVehicleExists(false);
      return null;
    }
  };

  useEffect(() => {
    fetchWorkshops();
    // Check vehicle when registration number changes
    if (createJobForm.registration_number) {
      checkVehicleExists(createJobForm.registration_number);
    } else {
      setVehicleExists(null);
    }

    const assignements = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignements" },
        (payload) => {
          console.log("Change received!", payload);
        }
      )
      .subscribe();

    const jobAssignments = supabase
      .channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_assignments" },
        (payload) => {
          console.log("Change received!", payload);
        }
      )
      .subscribe();
    // Get user role from localStorage
    const role = localStorage.getItem("userRole") || "call-center";
    setUserRole(role);

    const getJobs = async () => {
      const { data: jobs, error } = await supabase
        .from("job_assignments")
        .select(`*, vehiclesc_workshop(*)`)
        .neq("status", "completed")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
      } else {
        setJobs(jobs as unknown as Job[]);
        console.log(jobs);
      }
    };
    getJobs();
    setFilteredJobs(jobs);

    return () => {
      assignements.unsubscribe();
      jobAssignments.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const getJobsWithParts = async () => {
      // Fetch jobs and parts separately, then group parts by job_id
      const { data: jobsData, error: jobsError } = await supabase
        .from("workshop_job")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Error fetching workshop jobs:", jobsError);
        return;
      }

      const { data: partsData, error: partsError } = await supabase
        .from("workshop_jobpart")
        .select("*");

      if (partsError) {
        console.error("Error fetching workshop job parts:", partsError);
        // Still proceed with jobs but no parts
      }

      const partsByJob = new Map<number, any[]>();
      (partsData || []).forEach((p: any) => {
        const jobId = p.job_id;
        if (jobId == null) return;
        const arr: any[] = [];
        if (Array.isArray(p.job_parts)) arr.push(...p.job_parts);
        if (Array.isArray(p.given_parts)) arr.push(...p.given_parts);
        if (!partsByJob.has(jobId)) partsByJob.set(jobId, []);
        partsByJob.get(jobId)!.push(...arr);
      });

      const jobsWithCombinedParts = (jobsData || []).map((job: any) => ({
        ...job,
        parts: partsByJob.get(job.id) || [],
      }));

      setWorkshopsJob(jobsWithCombinedParts as unknown as WorkshopJob[]);
    };

    getJobsWithParts();
  }, []);

  useEffect(() => {
    let filtered = jobs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((job) => {
        const searchLower = searchTerm.toLowerCase();

        // Basic job fields
        if (
          job.job_id?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower)
        ) {
          return true;
        }

        // Driver information
        if (job.drivers) {
          const driverName = job.drivers?.[0]?.first_name?.toLowerCase() || "";
          const driverSurname = job.drivers?.[0]?.surname?.toLowerCase() || "";
          if (
            driverName.includes(searchLower) ||
            driverSurname.includes(searchLower)
          ) {
            return true;
          }
        }

        // Vehicle information
        if (job.vehiclesc) {
          const regNumber = job.vehiclesc[0].registration_number || "";
          const make = job.vehiclesc[0].make || "";
          const model = job.vehiclesc[0].model || "";
          if (
            regNumber.toLowerCase().includes(searchLower) ||
            make.toLowerCase().includes(searchLower) ||
            model.toLowerCase().includes(searchLower)
          ) {
            return true;
          }
        }

        return false;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((job) => job.priority === priorityFilter);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "inprogress":
        return "bg-orange-100 text-orange-800";
      case "awaiting-approval":
        return "bg-purple-100 text-purple-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "emergency":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  useEffect(() => {
    const getWorkshopJob = async () => {
      const { data: WorkJ, error: workError } = await supabase
        .from("workshop_job")
        .select("*")
        .order("created_at", { ascending: false });

      if (!workError && WorkJ) {
        setWorkshopsJob(WorkJ as unknown as WorkshopJob[]);
      } else {
        console.error("Error fetching workshop jobs:", workError);
      }
    };
    getWorkshopJob();
  }, []);

  const handleUpdateJobStatus = async (
    jobId: number,
    status: string,
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from("workshop_job")
        .update({
          status: status,
          notes: notes || "",
          work_notes: notes || "",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      if (error) {
        console.error("Error updating job status:", error);
        return;
      }

      setIsUpdateDialogOpen(false);
      setNewStatus("");
      setUpdateNotes("");
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  async function getVehicleByRegistrationNumber(registrationNumber: string) {
    if (!registrationNumber) {
      console.error("Registration number is required");
      return null;
    }
    const { data, error } = await supabase
      .from("vehiclesc_workshop")
      .select()
      .eq("registration_number", registrationNumber)
      .single();

    if (error) {
      console.error("Error fetching vehicle by registration number:", error);
      return null;
    }
    return data;
  }

  // Create new job card without workshop assignment
  const createWorkshopJob = async () => {
    if (
      !createJobForm.registration_number ||
      !createJobForm.job_type ||
      !createJobForm.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if vehicle exists and get vehicle data
      const vehicleData = await checkVehicleExists(
        createJobForm.registration_number
      );

      if (!vehicleData) {
        toast.error(
          "Vehicle not found in database. Please enter a valid registration number."
        );
        return;
      }

      const year = new Date().getFullYear();
      const job_id = "JC-" + year + "-" + Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      
      // Create the job in workshop_job table
      const { data: newJob, error: jobError } = await supabase
        .from("workshop_job")
        .insert({
          registration_no: createJobForm.registration_number,
          job_type: createJobForm.job_type,
          description: createJobForm.description,
          jobId_workshop: job_id,
          notes: createJobForm.notes,
          work_notes: createJobForm.notes,
          location: createJobForm.location,
          client_name: createJobForm.client_name,
          client_phone: createJobForm.client_phone,
          vehicle_id: vehicleData.id,
          status: "Awaiting Approval",
          estimated_cost: createJobForm.estimated_cost || 0
        })
        .select()
        .single();

      if (jobError) {
        console.error("Job creation failed:", jobError);
        toast.error("Failed to create job card");
        return;
      }

      toast.success(`Job card ${job_id} created successfully for vehicle ${createJobForm.registration_number}`);
      setIsCreateJobDialogOpen(false);

      // Reset form
      setCreateJobForm({
        registration_number: "",
        job_type: "",
        description: "",
        client_name: "",
        client_phone: "",
        location: "",
        notes: "",
        selected_workshop_id: "",
      });

      // Refresh jobs list
      const getWorkshopJob = async () => {
        const { data: WorkJ, error: workError } = await supabase
          .from("workshop_job")
          .select("*")
          .order("created_at", { ascending: false });

        if (!workError && WorkJ) {
          setWorkshopsJob(WorkJ as unknown as WorkshopJob[]);
        }
      };
      getWorkshopJob();

    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("An error occurred while creating the job card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (job: WorkshopJob) => {
    alert(
      `Viewing details for job:\n\n` +
        `Job Type: ${job.job_type}\n` +
        `Vehicle Reg: ${job.registration_no}\n` +
        `Description: ${job.description}`
    );
    // TODO: Replace alert with modal open or route change
  };

  const handleDelete = async (job: WorkshopJob) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete job for vehicle ${job.registration_no}?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("workshop_job").delete().eq('id', job.id);
      // .eq('id', job?.id); // Make sure your `WorkshopJob` type includes `id`

      if (error) {
        throw error;
      }

      alert("Job deleted successfully.");

      // Optionally refetch the jobs to update the UI:
      const { data, error: fetchError } = await supabase
        .from("workshop_job")
        .select("*");

      if (!fetchError && data) {
        setWorkshopsJob(data as unknown as WorkshopJob[]);
      } else {
        console.error("Error refetching jobs:", fetchError);
      }
    } catch (err: any) {
      alert(`Failed to delete job: ${err.message}`);
    }
  };

  const handleEdit = (job: WorkshopJob) => {
    alert(`Editing job for vehicle: ${job.registration_no}`);
    // TODO: Replace with modal or navigate to edit page
  };

  const extractLocationKeywords = (input: string): string[] => {
    return input
      .toLowerCase()
      .split(/[\s,]+/) // split by spaces or commas
      .filter(Boolean); // remove empty strings
  };

  const [lastAssigned, setLastAssigned] = useState<{ [key: string]: number }>(
    {}
  );
  const normalizedSearch = searchWorkshop?.toLowerCase() || "";

  const availableWorkshops = useMemo(() => {
    return workshops
      .filter((w) => {
        const city = w.city?.toLowerCase() || "";
        const town = w.town?.toLowerCase() || "";
        const province = w.province?.toLowerCase() || "";
        return (
          normalizedSearch.includes(city) ||
          normalizedSearch.includes(town) ||
          normalizedSearch.includes(province)
        );
      })
      .sort((a, b) => {
        const aLast = lastAssigned[a.id] || 0;
        const bLast = lastAssigned[b.id] || 0;

        if (aLast === 0 && bLast !== 0) return -1;
        if (aLast !== 0 && bLast === 0) return 1;

        return aLast - bLast;
      });
  }, [workshops, normalizedSearch, lastAssigned]);

  useEffect(() => {
    if (availableWorkshops.length === 0) return;

    // Find first workshop without recent job assigned
    const noRecentJobWorkshop = availableWorkshops.find(
      (w) => !lastAssigned[w.id]
    );

    if (noRecentJobWorkshop) {
      setCreateJobForm((prev) => ({
        ...prev,
        selected_workshop_id: noRecentJobWorkshop.id,
      }));
    } else {
      // All have recent jobs, select the one with the oldest lastAssigned timestamp
      const sortedByOldest = [...availableWorkshops].sort((a, b) => {
        const aLast = lastAssigned[a.id] || 0;
        const bLast = lastAssigned[b.id] || 0;
        return aLast - bLast;
      });
      setCreateJobForm((prev) => ({
        ...prev,
        selected_workshop_id: sortedByOldest[0].id,
      }));
    }
  }, [availableWorkshops, lastAssigned]);

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">All Jobs</h2>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="awaiting-approval">
                  Awaiting Approval
                </SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Dialog
            open={isCreateJobDialogOpen}
            onOpenChange={setIsCreateJobDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>Create Job Card</Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Card</DialogTitle>
                <DialogDescription>
                  Create a new job card. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createWorkshopJob();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registration_number">
                      Registration Number *
                    </Label>
                    <Input
                      id="registration_number"
                      placeholder="DD80MKGP"
                      value={createJobForm.registration_number}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          registration_number: e.target.value.toUpperCase(),
                        })
                      }
                      className={
                        vehicleExists === false
                          ? "border-red-500"
                          : vehicleExists === true
                          ? "border-green-500"
                          : ""
                      }
                    />
                    {vehicleExists === false && (
                      <p className="text-sm text-red-500 mt-1">
                        Vehicle not found in database
                      </p>
                    )}
                    {vehicleExists === true && (
                      <p className="text-sm text-green-500 mt-1">
                        Vehicle found ✓
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="job_type">Type of Work *</Label>
                    <Select
                      value={createJobForm.job_type}
                      onValueChange={(value) =>
                        setCreateJobForm({
                          ...createJobForm,
                          job_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type of work" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="breakdown">Breakdown</SelectItem>
                        <SelectItem value="accident">Accident Repair</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="mechanical">Mechanical</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="panel-beating">Panel Beating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Problem Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the problem..."
                    value={createJobForm.description}
                    onChange={(e) =>
                      setCreateJobForm({
                        ...createJobForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      placeholder="Client name"
                      value={createJobForm.client_name}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          client_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_phone">Client Phone</Label>
                    <Input
                      id="client_phone"
                      placeholder="Phone number"
                      value={createJobForm.client_phone}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          client_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Job Location</Label>
                  <Input
                    id="location"
                    placeholder="Enter job location"
                    value={createJobForm.location}
                    onChange={(e) =>
                      setCreateJobForm({
                        ...createJobForm,
                        location: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Job Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={createJobForm.notes}
                    onChange={(e) =>
                      setCreateJobForm({
                        ...createJobForm,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateJobDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !createJobForm.registration_number ||
                      !createJobForm.job_type ||
                      !createJobForm.description
                    }
                  >
                    {isSubmitting ? "Creating..." : "Create Job Card"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="workshopJobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workshopJobs">Workshop Jobs</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent
            value="workshopJobs"
            className="space-y-6 p-6 bg-gray-50 min-h-screen"
          >
            <div className="flex flex-col space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage, update, and assign parts for ongoing workshop
                    repairs.
                  </p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
              </div>

              {/* Jobs List */}
              {workshopJob.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500 italic text-lg">
                    No workshop jobs found 🚗
                  </p>
                  <p className="text-gray-400 text-sm">
                    Try refreshing or adding a new one.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {workshopJob.map((job) => (
                    <Card
                      key={job.id || job.jobId_workshop}
                      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      {/* Accent bar */}
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl" />

                      <CardHeader className="pb-4 flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {job.jobId_workshop || "Untitled Job"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Created on{" "}
                            {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 shadow-sm">
                          Active
                        </span>
                      </CardHeader>

                      {/* Job details */}
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                        <div className="space-y-2">
                          <p>
                            <span className="font-medium text-gray-900">
                              Vehicle Reg:
                            </span>{" "}
                            {job.registration_no || "N/A"}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-gray-900">
                              Description:
                            </span>{" "}
                            {job.description || "No description"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Estimated Cost:
                            </span>{" "}
                            {job.estimated_cost
                              ? `R ${job.estimated_cost.toFixed(2)}`
                              : "N/A"}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p>
                            <span className="font-medium text-gray-900">
                              Client Name:
                            </span>{" "}
                            {job.client_name || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium text-gray-900">
                              Client Phone:
                            </span>{" "}
                            {job.client_phone || "N/A"}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-gray-900">
                              Location:
                            </span>{" "}
                            {job.location || "Unknown"}
                          </p>
                          <p className="truncate">
                            <span className="font-medium text-gray-900">
                              Notes:
                            </span>{" "}
                            {job.notes || job.work_notes || "-"}
                          </p>

                          {/* Parts List */}
                          {parts.length > 0 ? (
                            <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 p-2 max-h-40 overflow-auto">
                              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                                Added Parts
                              </h4>
                              <ul className="space-y-1">
                                {parts.map((part, index) => (
                                  <li
                                    key={index}
                                    className="flex justify-between items-center text-sm bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-100 hover:bg-indigo-50 transition"
                                  >
                                    {part}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm italic mt-3">
                              No parts added yet.
                            </p>
                          )}
                        </div>
                      </CardContent>

                      {/* Footer buttons */}
                      <CardFooter className="flex justify-end gap-3 pt-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-b-2xl">
                        <Link href={`/jobs/${job.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </Button>
                        </Link>

                        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-medium hover:from-yellow-500 hover:to-yellow-600 transition rounded-lg shadow-sm"
                            >
                              Add Parts
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-semibold text-gray-800">
                                Add Parts to Job
                              </DialogTitle>
                              <DialogDescription className="text-sm text-gray-500">
                                Add and save parts used in this repair job.
                              </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                              {/* Add part input */}
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Enter part name"
                                  value={partName}
                                  onChange={(e) => setPartName(e.target.value)}
                                  className="flex-1 border-gray-300 focus:border-indigo-400 focus:ring-indigo-300"
                                />
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    if (partName.trim()) {
                                      setParts((prev) => [
                                        ...prev,
                                        partName.trim(),
                                      ]);
                                      setPartName("");
                                    }
                                  }}
                                  className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                                >
                                  +
                                </Button>
                              </div>

                              {/* Parts list inside modal */}
                              {parts.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1 max-h-40 overflow-auto border rounded p-2 bg-gray-50">
                                  {parts.map((part, index) => (
                                    <li
                                      key={index}
                                      className="flex justify-between items-center text-sm text-gray-700 bg-white px-2 py-1 rounded-md border border-gray-100 hover:bg-indigo-50 transition"
                                    >
                                      {part}
                                      <button
                                        onClick={() =>
                                          setParts((prev) =>
                                            prev.filter((_, i) => i !== index)
                                          )
                                        }
                                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                                      >
                                        ✕
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-400 text-sm italic">
                                  No parts added yet.
                                </p>
                              )}

                              {/* Save Button */}
                              <Button
                                onClick={async () => {
                                  if (parts.length === 0) {
                                    toast.error(
                                      "Please add at least one part."
                                    );
                                    return;
                                  }

                                  const { error } = await supabase
                                    .from("workshop_jobpart")
                                    .insert({
                                      job_parts: parts,
                                      job_id: job.id,
                                    });

                                  if (error) {
                                    console.error(error);
                                    toast.error("Failed to save parts.");
                                  } else {
                                    toast.success("Parts saved successfully.");
                                    setParts([]);
                                    setIsEditOpen(false);
                                  }
                                }}
                                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold shadow-md"
                              >
                                Add Parts
                              </Button>
                            </div>

                            <DialogFooter>
                              <DialogClose asChild>
                                <Button
                                  variant="outline"
                                  className="hover:bg-gray-100"
                                >
                                  Close
                                </Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="kanban" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {["pending", "inprogress", "awaiting-approval", "completed"].map(
                (status) => (
                  <Card key={status}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium capitalize">
                        {status}
                        <Badge className="ml-2" variant="secondary">
                          {
                            filteredJobs.filter((job) => job.status === status)
                              .length
                          }
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {filteredJobs
                        .filter((job) => job.status === status)
                        .map((job) => (
                          <Card
                            key={job.id}
                            className="p-3 hover:shadow-sm transition-shadow cursor-pointer"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                  {job.job_id}
                                </p>
                                <Badge
                                  className={getPriorityColor(job.priority)}
                                >
                                  {job.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {job.description}
                              </p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                {job.estimatedCost && (
                                  <span>R {job.estimatedCost}</span>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Jobs
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    In Progress
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobs.filter((job) => job.status === "inprogress").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active jobs being worked on
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Completed
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobs.filter((job) => job.status === "completed").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully completed jobs
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Cost
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R{" "}
                    {(
                      jobs.reduce(
                        (sum, job) =>
                          sum + (job.actualCost || job.estimatedCost || 0),
                        0
                      ) / jobs.length
                    ).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average job cost
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Overview of all job statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "pending",
                    "assigned",
                    "inprogress",
                    "awaiting-approval",
                    "approved",
                    "completed",
                    "cancelled",
                  ].map((status) => {
                    const count = jobs.filter(
                      (job) => job.status === status
                    ).length;
                    const percentage =
                      jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(status)}>
                            {status}
                          </Badge>
                          <span className="text-sm">{count} jobs</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <Dialog
            open={isWorkshopDialogOpen}
            onOpenChange={setIsWorkshopDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Assign Workshop to Job: {selectedJobForWorkshop?.job_id}
                </DialogTitle>
                <DialogDescription>
                  Search and select a workshop based on location, type, or
                  capability.
                </DialogDescription>
              </DialogHeader>

              <div className="mb-3">
                <Input
                  placeholder="Search by name, location, type, capability..."
                  value={searchWorkshop}
                  onChange={(e) => setSearchWorkshop(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {workshops
                  .filter(
                    (w) =>
                      w.name
                        ?.toLowerCase()
                        .includes(searchWorkshop.toLowerCase()) ||
                      w.type
                        ?.toLowerCase()
                        .includes(searchWorkshop.toLowerCase()) ||
                      w.location
                        ?.toLowerCase()
                        .includes(searchWorkshop.toLowerCase()) ||
                      w.capabilities
                        ?.toLowerCase()
                        .includes(searchWorkshop.toLowerCase())
                  )
                  .map((workshop) => (
                    <div
                      key={workshop.id}
                      className="p-3 border rounded hover:bg-gray-100 flex justify-between items-start"
                    >
                      <div>
                        <p className="font-bold">{workshop.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Type:</strong> {workshop.type}
                          <br />
                          <strong>Location:</strong> {workshop.location}
                          <br />
                          <strong>Capabilities:</strong> {workshop.capabilities}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!selectedJobForWorkshop) return;

                          const { error } = await supabase
                            .from("job_assignments")
                            .update({
                              workshop_id: workshop.id,
                              updated_at: new Date().toISOString(),
                            })
                            .eq("id", selectedJobForWorkshop.id);

                          if (error) {
                            toast.error("Failed to assign workshop.");
                            console.error(error);
                          } else {
                            toast.success(`Assigned ${workshop.name} to job.`);
                            setIsWorkshopDialogOpen(false);
                          }
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
              </div>
            </DialogContent>
          </Dialog>
        </Tabs>
      </div>
    </>
  );
}
