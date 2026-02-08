"use client";

import { useState, useEffect } from "react";
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
  CheckCircle,
  Search,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { stat } from "fs";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipContent } from "@radix-ui/react-tooltip";
import RejectedJobs from "@/components/workshop/RejectedJobs";
import CompletedJobsReport from "@/components/workshop/CompletedJobsReport";
import JobCardPrinter from "@/components/ui-personal/job-card-printer";

interface Job {
  id: number;
  jobId_workshop: string;
  registration_no: string;
  job_type: string;
  description: string;
  status: string;
  created_at: string;
  client_name: string;
  client_phone: string;
  location: string;
  notes: string;
  estimated_cost: number;
  actual_cost: number;
  vehicle_id: number;
  technician: boolean;
  due_date?: string;
  priority: "low" | "medium" | "high" | "emergency";
  completed_at?: string;
  total_labor_cost?: number;
  total_parts_cost?: number;
}

interface CreateJobForm {
  registration_number: string;
  job_type: string;
  description: string;
  estimated_cost?: number;
  client_name?: string;
  client_phone?: string;
  location?: string;
  notes?: string;
  due_date?: string;
  priority: "low" | "medium" | "high" | "emergency";
  odo_reading?: string | number;
  hours?: string | number;
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams?.get("status")?.toLowerCase() || "all",
  );
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateJobDialogOpen, setIsCreateJobDialogOpen] = useState(false);
  const [createJobForm, setCreateJobForm] = useState<CreateJobForm>({
    registration_number: "",
    job_type: "",
    description: "",
    estimated_cost: undefined,
    client_name: "",
    client_phone: "",
    location: "",
    notes: "",
    due_date: "",
    priority: "medium",
    odo_reading: "",
    hours: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [partName, setPartName] = useState("");
  const [parts, setParts] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedJobForPrint, setSelectedJobForPrint] = useState<Job | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from("workshop_job")
      .select("*")
      .order("status", { ascending: true }); // Sort by status to put completed last
    // .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching jobs:", error);
    } else {
      // move completed jobs to the end while preserving the relative order
      const isCompleted = (j: any) =>
        String(j.status || "").toLowerCase() === "completed";
      const notCompleted = (data || []).filter((j: any) => !isCompleted(j));
      const completed = (data || []).filter((j: any) => isCompleted(j));
      setJobs([...notCompleted, ...completed] as unknown as Job[]);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Filter out completed and rejected jobs from "all jobs" tab
    filtered = filtered.filter(
      (job) =>
        (job.status || "").toLowerCase() !== "completed" &&
        (job.status || "").toLowerCase() !== "rejected",
    );

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
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

    // Apply status filter (special cases first)
    if (statusFilter === "requires-technician") {
      // treat any job where technician !== true as "needs technician"
      filtered = filtered.filter((job) => job.technician !== true);
    } else if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(
        (job) =>
          (job.status || "").toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Apply priority filter
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter(
        (job) => job.priority?.toLowerCase() === priorityFilter.toLowerCase(),
      );
    }

    // Sort by created date (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setFilteredJobs(filtered);
  };
  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, priorityFilter]);

  const checkVehicleExists = async (registrationNumber: string) => {
    if (!registrationNumber) {
      setVehicleExists(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("vehiclesc_workshop")
        .select("*")
        .eq("registration_number", registrationNumber.toUpperCase())
        .single();

      setVehicleExists(!!data && !error);
      return data;
    } catch (error) {
      setVehicleExists(false);
      return null;
    }
  };

  const createJob = async () => {
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
      const vehicleData = await checkVehicleExists(
        createJobForm.registration_number,
      );

      if (!vehicleData) {
        toast.error(
          "Vehicle not found in database. Please enter a valid registration number.",
        );
        return;
      }

      const year = new Date().getFullYear();
      const job_id =
        "JC-" +
        year +
        "-" +
        Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");

      const { data: newJob, error: jobError } = await supabase
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
          estimated_cost: createJobForm.estimated_cost || 0,
          priority: createJobForm.priority || "medium",
          due_date: createJobForm.due_date || "",
          odo_reading: createJobForm.odo_reading || "" || 0,
          hours: createJobForm.hours || "" || 0,
        })
        .select()
        .single();

      if (jobError) {
        console.error("Job creation failed:", jobError);
        toast.error("Failed to create job card");
        return;
      }

      toast.success(
        `Job card ${job_id} created successfully for vehicle ${createJobForm.registration_number}`,
      );
      setIsCreateJobDialogOpen(false);

      setCreateJobForm({
        registration_number: "",
        job_type: "",
        description: "",
        client_name: "",
        client_phone: "",
        location: "",
        notes: "",
        due_date: "",
        priority: "medium",
      });

      fetchJobs();
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("An error occurred while creating the job card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addParts = async () => {
    if (parts.length === 0 || !selectedJobId) {
      toast.error("Please add at least one part.");
      return;
    }

    const { error } = await supabase.from("workshop_jobpart").insert({
      job_parts: parts,
      job_id: selectedJobId,
    });

    // Determine the new status based on the current job status
    const job = jobs.find((j) => j.id === selectedJobId);
    const newStatus =
      job?.status?.toLowerCase() === "awaiting approval"
        ? "Awaiting Approval"
        : "Part Ordered";

    const approvedStatus =
      job?.status.toLocaleLowerCase() === "awaiting approval" ? false : true;

    const { data, error: partError } = await supabase
      .from("workshop_job")
      .update({
        status: newStatus,
        approved: approvedStatus,
      })
      .eq("id", selectedJobId);

    if (error) {
      console.error(error);
      toast.error("Failed to save parts.");
      return;
    }

    if (partError) {
      console.error(partError);
      toast.error("Failed to update job status after adding parts.");
      return;
    }

    toast.success("Parts saved successfully.");
    setParts([]);
    setIsEditOpen(false);
  };

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

  const formatStatusDisplay = (status: string) => {
    return (
      status
        ?.split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ") || "Unknown"
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "emergency":
        return "bg-orange-500 text-white";
      case "high":
        return "bg-red-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Job Cards</h2>
        {activeTab === "all" && (
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
                <SelectItem value="requires-technician">
                  Requires Technicians
                </SelectItem>
                <SelectItem value="Awaiting Approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="Part Assigned">Part Assigned</SelectItem>
                <SelectItem value="Part Ordered">In Progress</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Job Completed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed Jobs</TabsTrigger>
        </TabsList>

        <div className="flex justify-end">
          <Dialog
            open={isCreateJobDialogOpen}
            onOpenChange={setIsCreateJobDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Job Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Card: Testing</DialogTitle>
                <DialogDescription>
                  Create a new job card. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createJob();
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
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        setCreateJobForm({
                          ...createJobForm,
                          registration_number: value,
                        });
                        checkVehicleExists(value);
                      }}
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

                  {/* km */}
                  <div>
                    <Label htmlFor="odo_reading">Kilometers Reading</Label>
                    <Input
                      id="odo_reading"
                      placeholder="Enter odo reading"
                      value={createJobForm.odo_reading}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          odo_reading: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Hours (hr)</Label>
                    <Input
                      id="hours"
                      placeholder="Enter hours"
                      value={createJobForm.hours}
                      onChange={(e) =>
                        setCreateJobForm({
                          ...createJobForm,
                          hours: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="job_type">Type of Work *</Label>
                    <Select
                      value={createJobForm.job_type}
                      onValueChange={(value) =>
                        setCreateJobForm({ ...createJobForm, job_type: value })
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
                        <SelectItem value="accident">
                          Accident Repair
                        </SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="mechanical">Mechanical</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="panel-beating">
                          Panel Beating
                        </SelectItem>
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
                    <Label htmlFor="client_name">Driver Name</Label>
                    <Input
                      id="client_name"
                      placeholder="Driver name"
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
                    <Label htmlFor="client_phone">Driver Phone</Label>
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
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    type="date"
                    id="due_date"
                    value={createJobForm.due_date}
                    onChange={(e) =>
                      setCreateJobForm({
                        ...createJobForm,
                        due_date: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    // id="priority"
                    value={createJobForm.priority}
                    onValueChange={(value) =>
                      setCreateJobForm({
                        ...createJobForm,
                        priority: value as
                          | "low"
                          | "medium"
                          | "high"
                          | "emergency",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Job Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
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

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No job cards found
                  </h3>
                  <p className="text-gray-500">
                    Create your first job card to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                                <CheckCircle className="h-4 w-4 text-green-500 animate-ping" />
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
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="flex-1 sm:flex-none"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedJobForPrint(job);
                            setIsPrintOpen(true);
                          }}
                          className="flex-1 sm:flex-none"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                        <TooltipProvider>
                          <Tooltip delayDuration={200}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJobId(job.id);
                                  setIsEditOpen(true);
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                once-off parts
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Allow to add once-off parts for this job if for
                                external work to be closed!
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Vehicle</p>
                        <p className="font-medium">{job.registration_no}</p>
                        <p className="text-sm text-gray-600 mt-2">Work Type</p>
                        <p className="font-medium">{job.job_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver</p>
                        <p className="font-medium">
                          {job.client_name || "N/A"}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">Location</p>
                        <p className="font-medium">{job.location || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Cost</p>
                        <p className="font-medium">
                          R
                          {(
                            (job.total_labor_cost ?? 0) +
                            (job.total_parts_cost ?? 0)
                          ).toLocaleString() || "0"}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">Created</p>
                        <p className="font-medium">
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
                              Job Completed
                            </p>

                            <p className="font-medium">
                              {new Date(job.completed_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-sm">{job.description}</p>
                    </div>

                    {!job.technician && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <p className="text-sm font-medium text-red-700">
                          Technician needs to be assigned to this job
                        </p>
                      </div>
                    )}
                    <div></div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="w-full max-w-md sm:max-w-lg md:max-w-xl mx-4 max-h-[90vh] overflow-hidden">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Assign Parts to Job
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Add parts required for this repair job. Enter each part name and
                click the + button to add it to the list.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Add Part Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="part-input"
                  className="text-sm font-medium text-gray-700"
                >
                  Part Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="part-input"
                    placeholder="Enter part name (e.g., Brake Pads, Oil Filter)"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && partName.trim()) {
                        setParts((prev) => [...prev, partName.trim()]);
                        setPartName("");
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (partName.trim()) {
                        setParts((prev) => [...prev, partName.trim()]);
                        setPartName("");
                      }
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Parts List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Added Parts ({parts.length})
                </Label>
                {parts.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-3">
                    <div className="space-y-2">
                      {parts.map((part, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <span className="text-sm font-medium text-gray-800 flex-1">
                            {part}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setParts((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-sm">No parts added yet</div>
                    <div className="text-xs mt-1">
                      Add parts using the input field above
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={addParts}
                disabled={parts.length === 0}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add {parts.length} Part{parts.length !== 1 ? "s" : ""} to Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="rejected" className="space-y-4">
          <RejectedJobs />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <CompletedJobsReport />
        </TabsContent>
      </Tabs>

      {/* Print Dialog */}
      {selectedJobForPrint && (
        <JobCardPrinter
          isOpenCard={isPrintOpen}
          onCloseCard={() => {
            setIsPrintOpen(false);
            setSelectedJobForPrint(null);
          }}
          jobId={selectedJobForPrint.id}
          jobCard={selectedJobForPrint}
        />
      )}
    </div>
  );
}
