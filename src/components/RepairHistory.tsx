"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RepairRecord {
  id: number;
  job_card_number: string;
  description: string;
  status: string;
  created_at: string;
  total_cost: number;
  technician_name: string;
  labor_cost?: number;
  total_parts_cost?: number;
  grand_total?: number; 
}

interface PendingRepairRecord {
  id: number;
  jobId_workshop: string;
  job_card_number: string;
  description: string;
  status: string;
  created_at: string;
  total_cost: number;
  technician_name: string;
}

export default function RepairHistory({ vehicleId }: { vehicleId: string }) {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [pendingRepairs, setPendingRepairs] = useState<PendingRepairRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        // get all from workshop_job where vehicle_id = vehicleId
        const { data: pendingJobs, error: pendingError } = await supabase
          .from("workshop_job")
          .select("*")
          .eq("registration_no", vehicleId)
          .order("created_at", { ascending: false });
        setPendingRepairs(pendingJobs as any);
        if (pendingError) throw pendingError;
        if (!pendingJobs || pendingJobs.length === 0) {
          setPendingRepairs([]);
          setLoading(false);
          return;
        }

        // 1️⃣ Get assignments for this vehicle
        const { data: assignments, error: assignError } = await supabase
          .from("workshop_assignments")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false });

        if (assignError) throw assignError;
        if (!assignments || assignments.length === 0) {
          setRepairs([]);
          setLoading(false);
          return;
        }

        // 2️⃣ Collect job IDs and tech IDs
        const jobIds = assignments
          .map((a) => a.job_id)
          .filter((id): id is number => id != null);
        const techIds = assignments
          .map((a) => a.tech_id)
          .filter((id): id is number => id != null);

        // 3️⃣ Fetch job details for those jobs
        const { data: jobs, error: jobError } = await supabase
          .from("workshop_job")
          .select("*")
          .in("id", jobIds);

        if (jobError) throw jobError;

        // 4️⃣ Fetch technicians for those assignments
        const { data: techs, error: techError } = await supabase
          .from("technicians_klaver")
          .select("*")
          .in("id", techIds);

        if (techError) throw techError;

        // 5️⃣ Format and join data manually
        const formatted = assignments.map((a) => {
          const job = jobs?.find((j) => j.id === a.job_id);
          const tech = techs?.find((t) => t.id === a.tech_id);

          const total =
            (job?.total_labor_cost ?? 0) +
            (job?.total_parts_cost ?? 0) +
            (job?.total_sublet_cost ?? 0);

          return {
            id: a.id,
            job_card_number: job?.jobId_workshop || `Job #${a.job_id}`,
            description: job?.description || "No description available",
            status: job?.status || "Pending",
            created_at: job?.created_at || a.created_at,
            total_cost: total || 0,
            technician_name: tech?.name || "Unassigned",
            labor_cost: job?.total_labor_cost || 0,
            total_parts_cost: job?.total_parts_cost || 0,
          };
        });

        setRepairs(formatted);
      } catch (err) {
        console.error("Error fetching repair history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepairs();
  }, [vehicleId, supabase]);

  // 6️⃣ Loading + Empty States
  if (loading) return <div>Loading repair history...</div>;

  if (repairs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No repair history found for this vehicle
        </CardContent>
      </Card>
    );
  }

  // 7️⃣ Render Table
  return (
    <Card>
      <CardHeader>
        <CardTitle>Repair History ({repairs.length} records)</CardTitle>
      </CardHeader>
      <CardContent>
        <CardTitle className="mb-4">Repairs In Progress</CardTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Card</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Labor Cost</TableHead>
              <TableHead>Parts Cost</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.map((repair) => (
              <TableRow key={repair.id}>
                <TableCell className="font-medium">
                  {repair.job_card_number}
                </TableCell>
                <TableCell>{repair.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      repair.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {repair.status}
                  </Badge>
                </TableCell>
                <TableCell>{repair.technician_name}</TableCell>
                <TableCell>
                  R {repair.total_cost?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  R {repair.labor_cost?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {new Date(repair.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CardTitle className="mt-8 mb-4">Repairs (Pending)</CardTitle>
        {pendingRepairs.length === 0 && (
          <CardContent className="p-6 text-center text-gray-500">
            No pending repairs found for this vehicle
          </CardContent>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Card</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead>Technician</TableHead> */}
              <TableHead>Cost</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingRepairs.map((repair) => (
              <TableRow key={repair.id}>
                <TableCell className="font-medium">
                  {repair.jobId_workshop}
                </TableCell>
                <TableCell>{repair.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      repair.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {repair.status}
                  </Badge>
                </TableCell>
                {/* <TableCell>{repair.technician_name}</TableCell> */}
                <TableCell>
                  R {repair.grand_total?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {new Date(repair.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
