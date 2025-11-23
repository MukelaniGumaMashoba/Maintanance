"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  ArrowLeft,
  User2,
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
import { toast } from "sonner";
import { AnyARecord } from "dns";

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

  // labour fields (optional)
  labour_hours?: number;
  labour_rate?: number;
  labour_total?: number;
}

interface Technician {
  id: number;
  name: string;
  surname: string;
  phone: string;
  location: string;
  rating: string;
  specialties: string[];
}

export default function WorkshopJobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<WorkshopJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

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
    if (parts.length === 0) {
      fetchParts();
    }
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
  }, [technicians, supabase]);

  // get the assigned technician from the workshop_assignments table and technician table
  const getAssignedTechnician = async () => {
    if (!selectedJobForTech) return;

    const { data, error } = await supabase
      .from("workshop_assignments")
      .select("*")
      .eq("job_id", selectedJobForTech.id)
      .single();

    console.log(data);

    if (!data) {
      setError("No technician assigned yet");
      return;
    }

    if (error) {
      setError("Error fetching assigned technician:" + error);
      return;
    }
    const techId = data.tech_id;
    console.log("technicaion: " + techId);

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
    console.log("Assigned Technician:", techData);
  };

  // Assume selectedJobForTech is set when you open the assign dialog

  const filteredTechnicians = technicians.filter((tech) => {
    if (!selectedJobForTech?.job_type || !tech.specialties) return false;

    // Split job type and tech specialties into lowercase keyword arrays
    const jobTypeTerms = selectedJobForTech.job_type
      .toLowerCase()
      .split(/[\s,]+/);
    const techSpecialtyTerms = tech.specialties
      .join(" ")
      .toLowerCase()
      .split(/[\s,]+/);

    // Check if any job type term appears in the tech specialty terms
    return jobTypeTerms.some((term) => techSpecialtyTerms.includes(term));
  });

  useEffect(() => {
    if (!params.id) return;
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from("workshop_job")
        .select("*")
        .eq("id", Number(params.id))
        .single();

      if (error) {
        console.error("Error fetching workshop job:", error);
        setIsLoading(false);
        return;
      }
      const jobData = data as any;
      setJob(jobData);

      setSelectedJobForTech(data as any); // Set selected job here for assigned tech fetching
      // Fetch assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from("workshop_assignments")
        .select("*")
        .eq("job_id", data.id)
        .single();
      if (assignment && assignment.tech_id) {
        setAssignedTechId(assignment.tech_id);
        setIsAssigned(true);
      } else {
        setAssignedTechId(null);
        setIsAssigned(false);
      }
      setIsLoading(false);
    };

    fetchJob();
  }, [params.id, supabase]);

  // Trigger fetching assigned technician when selectedJobForTech is set
  useEffect(() => {
    if (selectedJobForTech) {
      getAssignedTechnician();
    }
  }, [selectedJobForTech]);

  // Also refetch assigned technician when assignedTechId changes, if needed
  useEffect(() => {
    if (assignedTechId) {
      // Fetch technician by ID if not yet loaded
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

  if (isLoading) return <div>Loading...</div>;
  if (!job) return <div>Workshop job not found</div>;

  const changeTechnician = async (
    technicianId: number,
    technicianName: string
  ) => {
    if (!selectedJobForTech) return;
    try {
      const { error: updateError } = await supabase
        .from("workshop_job")
        .update({
          // tech_id: technicianId,
          updated_at: new Date().toISOString(),
          // status: "assigned",
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

      // Update local state to reflect assignment
      setAssignedTechId(technicianId);
      setIsAssigned(true);
      toast("Technician changed to " + technicianName + " assigned.");
      setIsTechDialogOpen(false);
    } catch (err) {
      console.error(
        "Assign error:",
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || ""
          : ""
      );
      toast("Failed to assign technician.");
    }
  };

  // Assign the selected technician to the job
  const assignTechnicianToJob = async (
    technicianId: number,
    technicianName: string
  ) => {
    if (!selectedJobForTech) return;
    try {
      const { error: updateError } = await supabase
        .from("workshop_job")
        .update({
          // tech_id: technicianId,
          updated_at: new Date().toISOString(),
          status: "assigned",
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

      // Update local state to reflect assignment
      setAssignedTechId(technicianId);
      setIsAssigned(true);
      toast("Technician " + technicianName + " assigned.");
      setIsTechDialogOpen(false);
    } catch (err) {
      console.error(
        "Assign error:",
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || ""
          : ""
      );
      toast("Failed to assign technician.");
    }
  };

  return (
    <>
      <Link href="/jobs">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Workshop Jobs
        </Button>
      </Link>
      <Card className="p-8 bg-white/70 backdrop-blur-sm border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl">
        {/* Header */}
        <CardHeader className="flex justify-between items-center pb-5 border-b border-gray-200">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-800 tracking-tight">
              {job.jobId_workshop || "Untitled Job"}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Job created on{" "}
              <span className="font-medium text-gray-700">
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full shadow-sm">
            {job.status?.toUpperCase() || "PENDING"}
          </span>
        </CardHeader>

        {/* Content */}
        <CardContent className="space-y-5 mt-6 text-gray-700 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p>
                <span className="font-medium text-gray-900">Description:</span>{" "}
                {job.description || (
                  <span className="text-gray-400 italic">
                    No description provided
                  </span>
                )}
              </p>
              <p>
                <span className="font-medium text-gray-900">Vehicle Reg:</span>{" "}
                {job.registration_no || "N/A"}
              </p>
              <p>
                <span className="font-medium text-gray-900">Job Type:</span>{" "}
                {job?.job_type || "Unknown"}
              </p>
              <p>
                <span className="font-medium text-gray-900">Location:</span>{" "}
                {job.location || "Unknown"}
              </p>
            </div>

            <div className="space-y-3">
              <p>
                <span className="font-medium text-gray-900">Client Name:</span>{" "}
                {job.client_name || "N/A"}
              </p>
              <p>
                <span className="font-medium text-gray-900">Client Phone:</span>{" "}
                {job.client_phone || "N/A"}
              </p>
              <p>
                <span className="font-medium text-gray-900">
                  Estimated Cost:
                </span>{" "}
                {job.estimated_cost ? (
                  <span className="text-green-600 font-semibold">
                    R {job.estimated_cost.toFixed(2)}
                  </span>
                ) : (
                  "N/A"
                )}
              </p>
              <p>
                <span className="font-medium text-gray-900">Actual Cost:</span>{" "}
                {job.actual_cost ? (
                  <span className="text-blue-600 font-semibold">
                    R {job.actual_cost.toFixed(2)}
                  </span>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
              <p className="text-sm text-gray-800">
                <span className="font-semibold text-gray-900">Notes:</span>{" "}
                {job.notes}
              </p>
            </div>
          )}

         
          {/* Parts Section */}
          {parts && parts.length > 0 ? (
            (() => {
              // Filter out any parts entries where job_parts is null, undefined, or empty object/array/string
              const validParts = parts.filter((part) => {
                const jp = part.job_parts;
                if (jp == null) return false; // null or undefined
                if (typeof jp === "string") return jp.trim() !== "";
                if (Array.isArray(jp)) return jp.length > 0;
                if (typeof jp === "object") return Object.keys(jp).length > 0;
                return false;
              });

              if (validParts.length === 0) {
                return (
                  <p className="text-sm text-gray-500 italic">
                    No part requested
                  </p>
                );
              }

              return (
                <div>
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
                          <span className="text-xs text-gray-500 italic">{`Part #${
                            index + 1
                          }`}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-gray-500 italic">No part requested</p>
          )}

          {/* <div>
            {error && (
              <p className="text-sm text-red-500 italic">{error}</p>
            )}
          </div> */}
          {/* Technician Info */}
          <div className="flex items-center gap-2 mt-6 border-t pt-4 border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100">
              <User2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-gray-800 font-medium">
                Technician:{" "}
                <span className="font-semibold text-indigo-700">
                  {selectedTechnician?.name || "Unassigned"}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {selectedTechnician?.name != null
                  ? "Technician assigned"
                  : "Awaiting assignment"}
              </p>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-end gap-3 pt-5 border-t border-gray-100">
          {isAssigned && job.status === "Approved" ? (
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
              >
                Change Technician
              </Button>
            </div>
          ) : job.status.toLocaleLowerCase() !== "awaiting approval" ? (
            <Button
              size="sm"
              onClick={() => {
                setIsTechDialogOpen(true);
                setSelectedJobForTech(job);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition rounded-md shadow-sm"
            >
              <User2 className="h-4 w-4" />
              Assign Technician
            </Button>
          ) : (
            <div>
              <p className="text-sm text-orange-300">
                Awaiting Approval Before Assign Technician
              </p>
            </div>
          )}
        </CardFooter>
      </Card>

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
                    .map((s) => s.toLowerCase())
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
                      <strong>Rating:</strong> {tech.rating}
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

            {/* {filteredTechnicians.filter((tech) =>
                searchTechnicianLocation === ''
                  ? true
                  : tech.location.toLowerCase().includes(searchTechnicianLocation.toLowerCase())
              ).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No technicians found{searchTechnicianLocation ? ` in "${searchTechnicianLocation}"` : ''}
                  </p>
                )} */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
