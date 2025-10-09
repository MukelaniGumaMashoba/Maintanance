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
import { Toast } from "@radix-ui/react-toast";

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

  const toast = Toast;

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignedTechId, setAssignedTechId] = useState<number | null>(null);
  const [isAssigned, setIsAssigned] = useState(false);
  const [searchTechnicianSpecialty, setSearchTechnicianSpecialty] =
    useState("");
  const [selectedJobForTech, setSelectedJobForTech] =
    useState<WorkshopJob | null>(null);
  const [isTechDialogOpen, setIsTechDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] =
    useState<Technician | null>(null);
  const [parts, setParts] = useState<string[]>([]);

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from("workshop_jobpart")
      .select("*")
      .eq("job_id", Number(params.id));
    if (error) {
      console.error("Error fetching parts:", error);
      return;
    }
    setParts(data as unknown as string[]);
  };

  useEffect(() => {
    if (parts.length === 0) {
      fetchParts();
    }
    const fetchTechnician = async () => {
      const { data, error } = await supabase.from("technicians").select("*");

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

    if (error) {
      console.error("Error fetching assigned technician:", error);
      return;
    }
    if (!data) return;
    const techId = data.tech_id;
    const { data: techData, error: techError } = await supabase
      .from("technicians")
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
      setJob(data as any);
      // Fetch existing assignment for this job (if any)
      try {
        const { data: assignment } = await supabase
          .from("workshop_assignments")
          .select("*")
          .eq("job_id", data.id)
          .maybeSingle();

        if (assignment && assignment.tech_id) {
          setAssignedTechId(assignment.tech_id as number);
          setIsAssigned(true);
        } else {
          setAssignedTechId(null);
          setIsAssigned(false);
        }
      } catch (err) {
        console.error("Error fetching assignment:", err);
      }
      setIsLoading(false);
    };
    if (params.id) fetchJob();
    getAssignedTechnician();
  }, [params.id, supabase]);

  if (isLoading) return <div>Loading...</div>;
  if (!job) return <div>Workshop job not found</div>;

  // Assign the selected technician to the job
  const assignTechnicianToJob = async (
    technicianId: number,
    technicianName: string
  ) => {
    if (!selectedJobForTech) return;
    try {
      const { error: updateError } = await supabase
        .from("workshop_job")
        .upsert({
          // tech_id: technicianId,
          updated_at: new Date().toISOString(),
          status: "assigned",
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
      toast({ title: `Technician ${technicianName} assigned.` });
      setIsTechDialogOpen(false);
    } catch (err) {
      console.error(
        "Assign error:",
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message?: string }).message || ""
          : ""
      );
      toast({ title: "Failed to assign technician." });
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
      <Card className="p-6">
        <CardHeader className="flex justify-between items-center pb-4 border-b">
          <CardTitle className="text-2xl font-semibold">
            {job.jobId_workshop || "Untitled Job"}
          </CardTitle>
          <span className="text-sm text-gray-500">
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-700">
          <p>
            <strong>Description:</strong>{" "}
            {job.description || "No description provided"}
          </p>
          <p>
            <strong>Vehicle Reg:</strong> {job.registration_no || "N/A"}
          </p>
          <p>
            <strong>Client Name:</strong> {job.client_name || "N/A"}
          </p>
          <p>
            <strong>Client Phone:</strong> {job.client_phone || "N/A"}
          </p>
          <p>
            <strong>Location:</strong> {job.location || "Unknown"}
          </p>
          <p>
            <strong>Estimated Cost:</strong>{" "}
            {job.estimated_cost ? `R ${job.estimated_cost.toFixed(2)}` : "N/A"}
          </p>
          <p>
            <strong>Job Type:</strong> {job?.job_type || "Unknown"}
          </p>
          <p>
            <strong>Actual Cost:</strong>{" "}
            {job?.actual_cost ? `R ${job?.actual_cost.toFixed(2)}` : "N/A"}
          </p>
          {job.notes && (
            <p>
              <strong>Notes:</strong> {job.notes}
            </p>
          )}

          {parts.length > 0 && (
            <div>
              <strong>Parts Required:</strong>
              <ul className="list-disc list-inside">
                {parts.map((part, index) => (
                  <li key={index}>{part}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Add attachments display if needed */}
          <div className="flex space-x-2">
            <User2 className="w-5 h-5 text-gray-500" />
            <span>
              <strong>Technician: {selectedTechnician?.name} </strong>{" "}
              {job.status === "assigned"}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4 pt-4 border-t">
          {isAssigned ? (
            <Button variant="ghost" size="sm" disabled>
              <User2 className="mr-2 h-4 w-4" />
              Assigned
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsTechDialogOpen(true);
                setSelectedJobForTech(job);
              }}
            >
              <User2 className="mr-2 h-4 w-4" />
              Assign Technician
            </Button>
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
              Search and select a technician based on Job Type.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-3">
            <Input
              placeholder="Filter by job type..."
              value={searchTechnicianSpecialty}
              onChange={(e) => setSearchTechnicianSpecialty(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {filteredTechnicians
              .filter((tech) => {
                const techSpecialtyTerms = tech.specialties;
                const searchTerms = searchTechnicianSpecialty
                  .toLowerCase()
                  .split(/[\s,]+/);
                // Return true if any job type keyword is included in tech specialty terms
                return searchTerms.some((term) =>
                  techSpecialtyTerms.includes(term)
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
                  <Button
                    size="sm"
                    onClick={() =>
                      assignTechnicianToJob(tech.id, `${tech.name}`)
                    }
                  >
                    Assign
                  </Button>
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
