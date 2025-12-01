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
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { nullable } from "zod";
import { toast } from "sonner";
import JobCardWorkflow from "@/components/ui-personal/job-card-workflow";
import RequestedParts from "@/components/RequestedParts";

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
  technician: boolean;
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
  due_date?: string;
  priority: "low" | "medium" | "high" | "emergency";
}
interface WorkshopJob {
  id: number;
  registration_no: string;
  job_type: string;
  description: string;
  estimated_cost?: number;
  client_name: string;
  client_phone: string;
  location: string;
  notes: string;
  selected_workshop_id: string;
  created_at: Date;
  jobId_workshop: string;
  status: string;
  technician?: boolean;
  priority: "low" | "medium" | "high" | "emergency";
  completed_at?: Date;
  due_date?: string;
  total_labor_cost?: number;
  total_parts_cost?: number;
}

export default function FleetJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<WorkshopJob[]>([]);
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
  const [parts, setParts] = useState([]);
  const [selectedJobForWorkflow, setSelectedJobForWorkflow] =
    useState<WorkshopJob | null>(null);
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);

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
    due_date: "",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null);
  const [workshopJob, setWorkshopsJob] = useState<WorkshopJob[]>([]);

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

  const formatStatusDisplay = (status: string) => {
    return (
      status
        ?.split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ") || "Unknown"
    );
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

    // const getJobs = async () => {
    //   const { data: jobs, error } = await supabase
    //     .from('job_assignments')
    //     .select(`*, vehiclesc_workshop(*)`)
    //     .neq('status', 'completed')
    //     .neq('status', 'cancelled')
    //     .order('created_at', { ascending: false });
    //   if (error) {
    //     console.error(error)
    //   } else {
    //     setJobs(jobs as unknown as Job[])
    //     console.log(jobs)
    //   }
    // }
    // getJobs()
    // setFilteredJobs(jobs)

    return () => {
      assignements.unsubscribe();
      // jobAssignments.unsubscribe()
    };
  }, []);

  useEffect(() => {
    // Use workshopJob (fetched from workshop_job table) as the source
    let filtered = workshopJob || [];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((job) => {
        // check commonly available fields on workshop_job rows
        if (
          (job.jobId_workshop || "")
            .toString()
            .toLowerCase()
            .includes(searchLower)
        )
          return true;
        if ((job.description || "").toLowerCase().includes(searchLower))
          return true;
        if ((job.registration_no || "").toLowerCase().includes(searchLower))
          return true;
        if ((job.client_name || "").toLowerCase().includes(searchLower))
          return true;
        if ((job.client_phone || "").toLowerCase().includes(searchLower))
          return true;
        return false;
      });
    }

    // Apply status filter. Special-case "requires-technician" (not a status column)
    if (statusFilter === "requires-technician") {
      // Any job where technician !== true needs a technician (covers false/null/undefined)
      filtered = filtered.filter((job) => (job as any).technician !== true);
    } else if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (job) => (job.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // workshop_job may or may not have a priority field; check defensively
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (job) => ((job as any).priority || "").toString() === priorityFilter
      );
    }

    // cast to the component's expected filteredJobs shape
    setFilteredJobs(filtered as unknown as WorkshopJob[]);
  }, [workshopJob, searchTerm, statusFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "awaiting approval":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "part assigned":
        return "bg-purple-100 text-purple-800";
      case "part ordered":
        return "bg-orange-100 text-orange-800";
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

  // Update job status
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

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[priority as keyof typeof colors]}>
        {priority}
      </Badge>
    );
  };

  // Create new workshop job and assign to workshop
  const createWorkshopJob = async () => {
    if (
      !createJobForm.registration_number ||
      !createJobForm.job_type ||
      !createJobForm.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!createJobForm.selected_workshop_id) {
      toast.error("Please select a workshop");
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

      // Workshop-2025-034
      const year = new Date()
        .setFullYear(new Date().getFullYear() + 1)
        .toString()
        .slice(0, 4);
      const job_id =
        "Workshop-" +
        year +
        "-" +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");
      console.log("Generated workshop ID:", job_id);
      // First, create the job in workshop_job table
      const { data: newJob, error: jobError } = await (supabase as any)
        .from("workshop_job")
        .insert({
          registration_no: createJobForm.registration_number,
          job_type: createJobForm.job_type,
          description: createJobForm.description,
          jobId_workshop: job_id,
          notes: createJobForm.notes,
          location: createJobForm.location,
          client_name: createJobForm.client_name,
          client_phone: createJobForm.client_phone,
          status: "Awaiting Approval",
          due_date: createJobForm.due_date,
          priority: createJobForm.priority || "medium",
        })
        .select()
        .single();

      if (jobError) {
        console.error("Job creation failed:", jobError);
        toast.error("Failed to create job");
        return;
      }

      // Then assign the job to the selected workshop
      const { error: assignError } = await (supabase as any)
        .from("workshop_assign")
        .insert({
          job_id: newJob.id,
          workshop_id: createJobForm.selected_workshop_id,
        });

      if (assignError) {
        console.error("Assignment failed:", assignError);
        toast.error("Failed to assign job to workshop");
        return;
      }
      // Update lastAssigned so that workshop moves to last in sorting
      setLastAssigned((prev) => ({
        ...prev,
        [String(createJobForm.selected_workshop_id)]: Date.now(),
      }));
      // Get selected workshop name for success message
      const selectedWorkshop = workshops.find(
        (w) => String(w.id) === String(createJobForm.selected_workshop_id)
      );
      const workshopName = selectedWorkshop?.work_name || "Unknown Workshop";

      toast.success(
        `Job created successfully! Vehicle: ${vehicleData.make} ${vehicleData.model} (${createJobForm.registration_number}) assigned to ${workshopName}`
      );
      setIsCreateJobDialogOpen(false);

      // Reset form
      setCreateJobForm({
        registration_number: "",
        job_type: "",
        description: "",
        client_name: "",
        client_phone: "",
        selected_workshop_id: "",
        due_date: "",
        priority: "medium",
      });

      // Empty jobs after creating a new one
      setWorkshopsJob([]);
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("An error occurred while creating the job");
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
  };

  const handleDelete = async (job: WorkshopJob) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete job for vehicle ${job.registration_no}?`
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("workshop_job").delete();
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
                <SelectItem value="Awaiting Approval">Pending</SelectItem>
                <SelectItem value="Part Assigned">Part Assigned</SelectItem>
                <SelectItem value="Part Ordered">In Progress</SelectItem>
                <SelectItem value="awaiting-approval">
                  Awaiting Approval
                </SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="requires-technician">
                  Requires Technicians
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="workshopJobs" className="space-y-6">
          <TabsList className="bg-white shadow rounded-lg border flex">
            {["workshopJobs", "kanban", "analytics"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md text-sm px-4 py-2"
              >
                {tab === "workshopJobs"
                  ? "Workshop Jobs"
                  : tab === "kanban"
                  ? "Kanban Board"
                  : "Analytics"}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent
            value="workshopJobs"
            className="space-y-6 p-6 bg-gray-50 min-h-screen"
          >
            <div className="flex flex-col space-y-4">
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-gray-300 pb-3">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Workshop Jobs
                </h2>
                <FileText className="h-5 w-5 text-gray-500" />
              </div>

              {/* Jobs List */}
              {filteredJobs.length === 0 ? (
                <p className="text-center text-gray-500 mt-6">
                  No workshop jobs found.
                </p>
              ) : (
                <div className="grid gap-4">
                  {filteredJobs.map((job) => (
                    <Card
                      key={job.id || job.jobId_workshop}
                      className="hover:shadow-md transition-shadow rounded-lg border border-gray-200 p-6 bg-white"
                    >
                      <CardHeader className="pb-3 flex justify-between items-center">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <CardTitle className="text-lg">
                            {job.jobId_workshop}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(job.status)}>
                              {formatStatusDisplay(job.status)}
                              {job.status?.toLowerCase() ===
                                "awaiting approval" && (
                                <AlertCircle className="h-4 w-4 text-red-500 animate-ping" />
                              )}
                              {job.status?.toLowerCase() === "completed" && (
                                <>
                                  <span className="sr-only">Job Completed</span>
                                  <CheckCircle className="h-4 w-4 text-green-500 animate-none" />
                                </>
                              )}
                              {/* {job.status?.toLowerCase() === "part ordered" && (
                                <AlertCircle className="h-4 w-4 text-red-500 animate-ping" />
                              )} */}
                            </Badge>
                            <Badge className={getPriorityColor(job.priority)}>
                              {job.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>
                            <p>
                              <strong>Vehicle Reg:</strong>{" "}
                              {job.registration_no || "N/A"}
                            </p>
                            <p className="truncate">
                              <strong>Description:</strong>{" "}
                              {job.description || "No description"}
                            </p>
                            <p>
                              <strong>Cost:</strong>{" "}
                              {(job.total_labor_cost ?? 0) + (job.total_parts_cost ?? 0) > 0
                                ? `R ${((job.total_labor_cost ?? 0) + (job.total_parts_cost ?? 0)).toFixed(2)}`
                                : "Pending"}
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Client Name:</strong>{" "}
                              {job.client_name || "N/A"}
                            </p>
                            <p>
                              <strong>Client Phone:</strong>{" "}
                              {job.client_phone || "N/A"}
                            </p>
                            <p className="truncate">
                              <strong>Location:</strong>{" "}
                              {job.location || "Unknown"}
                            </p>
                            <p className="truncate">
                              <strong>Notes:</strong> {job.notes || "-"}
                            </p>
                          </div>

                          <div>
                            <p>
                              <strong>Created At:</strong>{" "}
                              {new Date(job.created_at).toLocaleDateString()}
                            </p>
                            <p>
                              <span className="text-sm text-gray-600">
                                Due Date:{" "}
                              </span>
                              <span className="font-medium">
                                {job.due_date
                                  ? new Date(job.due_date).toLocaleDateString()
                                  : "NOT SET"}
                              </span>
                            </p>

                            {job.completed_at ? (
                              <div>
                                <p className="text-sm text-gray-600 mt-2">
                                  Completed
                                </p>

                                <p className="font-medium">
                                  {new Date(
                                    job.completed_at
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          {!job.technician && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-red-500 animate-pulse" />
                              <p className="text-sm font-medium text-red-700">
                                Technician needs to be assigned to this job
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Requested Parts Section */}
                        <RequestedParts jobId={job.id} />
                      </CardContent>
                      <CardFooter className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJobForWorkflow(job);
                            setIsWorkflowOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {job.status?.includes("Awaiting")
                            ? "Approve/Reject"
                            : "View Workflow"}
                        </Button>
                        <Link href={`/jobWorkShop/${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="kanban" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                "Awaiting Approval",
                "Part Ordered",
                "Part Assigned",
                "Approved",
                "Completed",
                "Rejected",
                "assigned",
                "Approved - Ready For Parts Assignment",
              ].map((status) => (
                <Card key={status}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      {status}
                      <Badge className="ml-2" variant="secondary">
                        {
                          workshopJob.filter((job) => job.status === status)
                            .length
                        }
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {workshopJob
                      .filter((job) => job.status === status)
                      .map((job) => (
                        <Card
                          key={job.id}
                          className="p-3 hover:shadow-sm transition-shadow cursor-pointer"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                {job.jobId_workshop}
                              </p>
                              <Badge className={getStatusColor(job.status)}>
                                {job.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {job.registration_no}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {job.description}
                            </p>
                            {/* <div className="flex items-center justify-between text-xs text-gray-500">
                              {job.estimated_cost && (
                                <span>R {job.estimated_cost}</span>
                              )}
                            </div> */}
                          </div>
                        </Card>
                      ))}
                  </CardContent>
                </Card>
              ))}
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
                  <div className="text-2xl font-bold">{workshopJob.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Workshop jobs created
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
                    {
                      workshopJob.filter((job) => job.status === "assigned")
                        .length
                    }
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
                    {
                      workshopJob.filter((job) => job.status === "Completed")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Successfully completed jobs
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Rejected
                  </CardTitle>
                  <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      workshopJob.filter((job) => job.status === "Rejected")
                        .length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Rejected Jobs</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>
                  Overview of workshop job statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "Awaiting Approval",
                    "Part Ordered",
                    "Approved",
                    "Completed",
                    "Rejected",
                    "Part Assigned",
                    "assigned",
                    "Approved - Ready For Parts Assignment",
                  ].map((status) => {
                    const count = workshopJob.filter(
                      (job) => job.status === status
                    ).length;
                    const percentage =
                      workshopJob.length > 0
                        ? (count / workshopJob.length) * 100
                        : 0;
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

        {/* Job Card Workflow Modal */}
        <JobCardWorkflow
          isOpen={isWorkflowOpen}
          onClose={() => setIsWorkflowOpen(false)}
          jobCard={selectedJobForWorkflow}
          onStatusUpdate={() => {
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
          }}
        />
      </div>
    </>
  );
}
