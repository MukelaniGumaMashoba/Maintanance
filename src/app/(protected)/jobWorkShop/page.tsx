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

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
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
          status: "Awaiting Workshop Acceptance",
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

  // return (
  //   <>
  //     <div className="flex-1 space-y-6 p-6 bg-gray-50 min-h-screen">
  //       {/* Header Section */}
  //       <div className="flex items-center justify-between border-b pb-4">
  //         <h2 className="text-3xl font-bold tracking-tight text-gray-900">
  //           All Jobs
  //         </h2>
  //         <div className="flex items-center space-x-3">
  //           {/* Search */}
  //           <div className="relative">
  //             <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
  //             <Input
  //               placeholder="Search jobs..."
  //               value={searchTerm}
  //               onChange={(e) => setSearchTerm(e.target.value)}
  //               className="pl-8 w-64 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 transition"
  //             />
  //           </div>

  //           {/* Filters */}
  //           <Select value={statusFilter} onValueChange={setStatusFilter}>
  //             <SelectTrigger className="w-40 border border-gray-300 rounded-md">
  //               <SelectValue placeholder="Status" />
  //             </SelectTrigger>
  //             <SelectContent>
  //               <SelectItem value="all">All Status</SelectItem>
  //               <SelectItem value="pending">Pending</SelectItem>
  //               <SelectItem value="assigned">Assigned</SelectItem>
  //               <SelectItem value="inprogress">In Progress</SelectItem>
  //               <SelectItem value="awaiting-approval">Awaiting Approval</SelectItem>
  //               <SelectItem value="approved">Approved</SelectItem>
  //               <SelectItem value="completed">Completed</SelectItem>
  //               <SelectItem value="cancelled">Cancelled</SelectItem>
  //             </SelectContent>
  //           </Select>

  //           <Select value={priorityFilter} onValueChange={setPriorityFilter}>
  //             <SelectTrigger className="w-40 border border-gray-300 rounded-md">
  //               <SelectValue placeholder="Priority" />
  //             </SelectTrigger>
  //             <SelectContent>
  //               <SelectItem value="all">All Priority</SelectItem>
  //               <SelectItem value="emergency">Emergency</SelectItem>
  //               <SelectItem value="high">High</SelectItem>
  //               <SelectItem value="medium">Medium</SelectItem>
  //               <SelectItem value="low">Low</SelectItem>
  //             </SelectContent>
  //           </Select>
  //         </div>
  //       </div>

  //       {/* Tabs */}
  //       <Tabs defaultValue="workshopJobs" className="space-y-6">
  //         <TabsList className="bg-white shadow rounded-lg border flex">
  //           {["workshopJobs", "kanban", "analytics"].map((tab) => (
  //             <TabsTrigger
  //               key={tab}
  //               value={tab}
  //               className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-md text-sm px-4 py-2"
  //             >
  //               {tab === "workshopJobs"
  //                 ? "Workshop Jobs"
  //                 : tab === "kanban"
  //                 ? "Kanban Board"
  //                 : "Analytics"}
  //             </TabsTrigger>
  //           ))}
  //         </TabsList>

  //         {/* Workshop Jobs */}
  //         <TabsContent
  //           value="workshopJobs"
  //           className="space-y-6 bg-white rounded-xl p-6 shadow border"
  //         >
  //           <div className="flex items-center justify-between border-b border-gray-200 pb-3">
  //             <h2 className="text-2xl font-semibold text-gray-900">Workshop Jobs</h2>
  //             <FileText className="h-5 w-5 text-gray-500" />
  //           </div>

  //           {workshopJob.length === 0 ? (
  //             <p className="text-center text-gray-500 mt-8">No workshop jobs found.</p>
  //           ) : (
  //             <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
  //               {workshopJob.map((job) => (
  //                 <Card
  //                   key={job.id || job.jobId_workshop}
  //                   className="border border-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow duration-300"
  //                 >
  //                   <CardHeader className="flex justify-between items-center pb-3">
  //                     <h3 className="text-lg font-semibold text-orange-500 truncate">
  //                       {job.jobId_workshop || "Untitled Job"} — {job.status}
  //                     </h3>
  //                     <span className="text-sm text-gray-500">
  //                       {new Date(job.created_at).toLocaleDateString()}
  //                     </span>
  //                   </CardHeader>

  //                   <CardContent className="space-y-4 text-gray-700 text-sm">
  //                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //                       <div>
  //                         <p>
  //                           <strong>Vehicle Reg:</strong> {job.registration_no || "N/A"}
  //                         </p>
  //                         <p className="truncate">
  //                           <strong>Description:</strong> {job.description || "No description"}
  //                         </p>
  //                         <p>
  //                           <strong>Estimated Cost:</strong>{" "}
  //                           {job.estimated_cost ? `R ${job.estimated_cost.toFixed(2)}` : "N/A"}
  //                         </p>
  //                       </div>
  //                       <div>
  //                         <p>
  //                           <strong>Client Name:</strong> {job.client_name || "N/A"}
  //                         </p>
  //                         <p>
  //                           <strong>Client Phone:</strong> {job.client_phone || "N/A"}
  //                         </p>
  //                         <p>
  //                           <strong>Location:</strong> {job.location || "Unknown"}
  //                         </p>
  //                         <p>
  //                           <strong>Notes:</strong> {job.notes || "-"}
  //                         </p>
  //                       </div>
  //                     </div>

  //                     <RequestedParts jobId={job.id} />
  //                   </CardContent>

  //                   <CardFooter className="flex justify-end gap-3 pt-4 border-t border-gray-200">
  //                     <Button
  //                       variant="outline"
  //                       size="sm"
  //                       className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition"
  //                       onClick={() => {
  //                         setSelectedJobForWorkflow(job);
  //                         setIsWorkflowOpen(true);
  //                       }}
  //                     >
  //                       <CheckCircle className="h-4 w-4 mr-2" />
  //                       {job.status?.includes("Awaiting") ? "Approve/Reject" : "View Workflow"}
  //                     </Button>

  //                     <Link href={`/jobWorkShop/${job.id}`}>
  //                       <Button
  //                         variant="outline"
  //                         size="sm"
  //                         className="border-gray-300 hover:bg-gray-100 transition"
  //                       >
  //                         <Eye className="h-4 w-4 mr-2" />
  //                         View Details
  //                       </Button>
  //                     </Link>
  //                   </CardFooter>
  //                 </Card>
  //               ))}
  //             </div>
  //           )}
  //         </TabsContent>

  //         {/* Kanban */}
  //         <TabsContent
  //           value="kanban"
  //           className="p-6 bg-white rounded-xl shadow border"
  //         >
  //           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  //             {[
  //               "Awaiting Workshop Acceptance",
  //               "In Progress",
  //               "Awaiting Approval",
  //               "Approved",
  //               "Completed",
  //             ].map((status) => (
  //               <Card
  //                 key={status}
  //                 className="border border-gray-200 rounded-xl shadow-sm"
  //               >
  //                 <CardHeader className="pb-3 border-b">
  //                   <CardTitle className="flex items-center justify-between text-sm font-semibold text-gray-900">
  //                     {status}
  //                     <Badge
  //                       className="bg-orange-100 text-orange-600 border border-orange-200"
  //                       variant="secondary"
  //                     >
  //                       {workshopJob.filter((job) => job.status === status).length}
  //                     </Badge>
  //                   </CardTitle>
  //                 </CardHeader>
  //                 <CardContent className="space-y-3 p-3">
  //                   {workshopJob
  //                     .filter((job) => job.status === status)
  //                     .map((job) => (
  //                       <Card
  //                         key={job.id}
  //                         className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition"
  //                       >
  //                         <p className="text-sm font-medium text-gray-900">
  //                           {job.jobId_workshop}
  //                         </p>
  //                         <p className="text-xs text-gray-500">{job.registration_no}</p>
  //                         <p className="text-xs text-gray-700 line-clamp-2">
  //                           {job.description}
  //                         </p>
  //                       </Card>
  //                     ))}
  //                 </CardContent>
  //               </Card>
  //             ))}
  //           </div>
  //         </TabsContent>

  //         {/* Analytics */}
  //         <TabsContent
  //           value="analytics"
  //           className="p-6 bg-white rounded-xl shadow border"
  //         >
  //           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  //             <Card>
  //               <CardHeader className="flex justify-between items-center pb-2">
  //                 <CardTitle className="text-sm font-medium text-gray-900">
  //                   Total Jobs
  //                 </CardTitle>
  //                 <FileText className="h-4 w-4 text-gray-500" />
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="text-2xl font-bold text-orange-500">
  //                   {workshopJob.length}
  //                 </div>
  //                 <p className="text-xs text-gray-500">Workshop jobs created</p>
  //               </CardContent>
  //             </Card>

  //             <Card>
  //               <CardHeader className="flex justify-between items-center pb-2">
  //                 <CardTitle className="text-sm font-medium text-gray-900">
  //                   In Progress
  //                 </CardTitle>
  //                 <Clock className="h-4 w-4 text-gray-500" />
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="text-2xl font-bold text-orange-500">
  //                   {workshopJob.filter((job) => job.status === "In Progress").length}
  //                 </div>
  //                 <p className="text-xs text-gray-500">Active jobs being worked on</p>
  //               </CardContent>
  //             </Card>

  //             <Card>
  //               <CardHeader className="flex justify-between items-center pb-2">
  //                 <CardTitle className="text-sm font-medium text-gray-900">
  //                   Completed
  //                 </CardTitle>
  //                 <CheckCircle className="h-4 w-4 text-gray-500" />
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="text-2xl font-bold text-orange-500">
  //                   {workshopJob.filter((job) => job.status === "Completed").length}
  //                 </div>
  //                 <p className="text-xs text-gray-500">Successfully completed jobs</p>
  //               </CardContent>
  //             </Card>

  //             <Card>
  //               <CardHeader className="flex justify-between items-center pb-2">
  //                 <CardTitle className="text-sm font-medium text-gray-900">
  //                   Avg. Cost
  //                 </CardTitle>
  //                 <DollarSign className="h-4 w-4 text-gray-500" />
  //               </CardHeader>
  //               <CardContent>
  //                 <div className="text-2xl font-bold text-orange-500">
  //                   R{" "}
  //                   {workshopJob.length > 0
  //                     ? (
  //                         workshopJob.reduce(
  //                           (sum, job) => sum + (job.estimated_cost || 0),
  //                           0
  //                         ) / workshopJob.length
  //                       ).toFixed(0)
  //                     : "0"}
  //                 </div>
  //                 <p className="text-xs text-gray-500">Average job cost</p>
  //               </CardContent>
  //             </Card>
  //           </div>
  //         </TabsContent>
  //       </Tabs>
  //     </div>
  //   </>
  // );

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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {/* <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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
            </Select> */}
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
                            </Badge>
                            <Badge className={getPriorityColor(job.job_type)}>
                              {job.job_type}
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
                              <strong>Estimated Cost:</strong>{" "}
                              {job.estimated_cost
                                ? `R ${job.estimated_cost.toFixed(2)}`
                                : "N/A"}
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
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              {job.estimated_cost && (
                                <span>R {job.estimated_cost}</span>
                              )}
                            </div>
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
                      workshopJob.filter((job) => job.status === "In Progress")
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
                    Avg. Cost
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R{" "}
                    {workshopJob.length > 0
                      ? (
                          workshopJob.reduce(
                            (sum, job) => sum + (job.estimated_cost || 0),
                            0
                          ) / workshopJob.length
                        ).toFixed(0)
                      : "0"}
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
                <CardDescription>
                  Overview of workshop job statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "Awaiting Workshop Acceptance",
                    "Part Ordered",
                    "Awaiting Approval",
                    "Approved",
                    "Completed",
                    "Rejected",
                    "Part Assigned",
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

// <div className="flex justify-end">
//   <Dialog open={isCreateJobDialogOpen} onOpenChange={setIsCreateJobDialogOpen}>
//     <DialogTrigger asChild>
//       <Button>Create Job Card</Button>
//     </DialogTrigger>

//     <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
//       <DialogHeader>
//         <DialogTitle>Create New Workshop Job</DialogTitle>
//         <DialogDescription>
//           Create a new job and assign it to a workshop. All fields marked with * are required.
//         </DialogDescription>
//       </DialogHeader>

//       <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); createWorkshopJob(); }}>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="registration_number">Registration Number *</Label>
//             <Input
//               id="registration_number"
//               placeholder="DD80MKGP"
//               value={createJobForm.registration_number}
//               onChange={(e) => setCreateJobForm({
//                 ...createJobForm,
//                 registration_number: e.target.value.toUpperCase()
//               })}
//               className={vehicleExists === false ? "border-red-500" : vehicleExists === true ? "border-green-500" : ""}
//             />
//             {vehicleExists === false && (
//               <p className="text-sm text-red-500 mt-1">Vehicle not found in database</p>
//             )}
//             {vehicleExists === true && (
//               <p className="text-sm text-green-500 mt-1">Vehicle found ✓</p>
//             )}
//           </div>

//           <div>
//             <Label htmlFor="job_type">Type of Work *</Label>
//             <Select
//               value={createJobForm.job_type}
//               onValueChange={(value) => setCreateJobForm({
//                 ...createJobForm,
//                 job_type: value
//               })}
//             >
//               <SelectTrigger>
//                 <SelectValue placeholder="Select type of work" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="towing">Towing</SelectItem>
//                 <SelectItem value="mechanical">Mechanical</SelectItem>
//                 <SelectItem value="electrical">Electrical</SelectItem>
//                 <SelectItem value="breakdown">Breakdown</SelectItem>
//                 <SelectItem value="carwash">Car Wash</SelectItem>
//                 <SelectItem value="check">Check Overall</SelectItem>
//                 <SelectItem value="driveline">Drive Line Repairs</SelectItem>
//                 <SelectItem value="panel-beating">Panel Beating</SelectItem>
//                 <SelectItem value="fitmentcentre">Fitment Centre</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div>
//           <Label htmlFor="description">Problem Description *</Label>
//           <Textarea
//             id="description"
//             placeholder="Describe the problem..."
//             value={createJobForm.description}
//             onChange={(e) => setCreateJobForm({
//               ...createJobForm,
//               description: e.target.value
//             })}
//           />
//         </div>
//         <div>
//           <Label htmlFor="description">Problem Notes *</Label>
//           <Textarea
//             id="description"
//             placeholder="Job Notes the problem or work needed..."
//             value={createJobForm.notes}
//             onChange={(e) => setCreateJobForm({
//               ...createJobForm,
//               notes: e.target.value
//             })}
//             rows={3}
//           />
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div>
//             <Label htmlFor="client_name">Client Name</Label>
//             <Input
//               id="client_name"
//               placeholder="Client name"
//               value={createJobForm.client_name}
//               onChange={(e) => setCreateJobForm({
//                 ...createJobForm,
//                 client_name: e.target.value
//               })}
//             />
//           </div>
//           <div>
//             <Label htmlFor="client_phone">Client Phone</Label>
//             <Input
//               id="client_phone"
//               placeholder="Phone number"
//               value={createJobForm.client_phone}
//               onChange={(e) => setCreateJobForm({
//                 ...createJobForm,
//                 client_phone: e.target.value
//               })}
//             />
//           </div>
//           <div>
//             <Label htmlFor="location">Job Location *</Label>
//             {/*<Input
//               id="location"
//               placeholder="21 Zama Road, Johannesburg, 20232"
//               value={createJobForm.location}
//               onChange={(e) => {
//                 const newLocation = e.target.value
//                 setCreateJobForm({ ...createJobForm, location: newLocation })
//                 // autoSelectWorkshop(newLocation) // 🔹 auto-select on change
//               }}
//             /> */}
//             <Input
//               id="location"
//               placeholder="Enter job location"
//               value={createJobForm.location}
//               onChange={(e) => {
//                 const newLocation = e.target.value;
//                 setCreateJobForm({ ...createJobForm, location: newLocation });

//                 const keywords = extractLocationKeywords(newLocation);

//                 const locationMatch = workshops.find(w => {
//                   const city = w.city?.toLowerCase() || "";
//                   const town = w.town?.toLowerCase() || "";
//                   const province = w.province?.toLowerCase() || "";

//                   return keywords.some(k => city.includes(k) || town.includes(k) || province.includes(k));
//                 });

//                 if (locationMatch) {
//                   setSearchWorkshop(locationMatch.city || locationMatch.town || locationMatch.province);
//                 } else {
//                   setSearchWorkshop("no-location");
//                 }
//               }}

//             />
//           </div>
//         </div>

//         <div>
//           <label className="text-center block mb-1 font-medium">Available Workshops</label>
//         </div>
//         {searchWorkshop && searchWorkshop !== "no-location" && (
//           <div className="mb-4">
//             <Label className="text-sm font-medium mb-2 block">
//               Workshops in {searchWorkshop}:
//             </Label>
//             <div className="space-y-2 max-h-40 overflow-y-auto">
//               {availableWorkshops.length > 0 ? (
//                 availableWorkshops.map(workshop => (
//                   <div
//                     key={workshop.id}
//                     className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
//                     onClick={() => setCreateJobForm({
//                       ...createJobForm,
//                       selected_workshop_id: workshop.id
//                     })}
//                   >
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <p className="font-medium">{workshop.work_name}</p>
//                         <p className="text-sm text-gray-600">
//                           {workshop.trading_name && `${workshop.trading_name} • `}
//                           {workshop.city || workshop.town || workshop.province}
//                         </p>
//                         {workshop.labour_rate && (
//                           <p className="text-xs text-gray-500">
//                             Labour Rate: R{workshop.labour_rate}/hr
//                           </p>
//                         )}
//                       </div>
//                       <div className="flex items-center">
//                         {createJobForm.selected_workshop_id === workshop.id && (
//                           <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
//                             <div className="w-2 h-2 bg-white rounded-full"></div>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-sm text-gray-500 text-center py-2">
//                   No workshops found in this location
//                 </p>
//               )}
//             </div>
//           </div>
//         )}

//         <div className="flex justify-end space-x-2 pt-4">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => setIsCreateJobDialogOpen(false)}
//           >
//             Cancel
//           </Button>
//           <Button
//             type="submit"
//             disabled={isSubmitting || !createJobForm.registration_number || !createJobForm.job_type || !createJobForm.description || !createJobForm.selected_workshop_id}
//           >
//             {isSubmitting ? "Creating..." : "Create Job"}
//           </Button>
//         </div>
//       </form>
//     </DialogContent>
//   </Dialog>
// </div>
