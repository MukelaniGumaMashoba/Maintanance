"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Part {
  id?: number;
  part_name?: string;
  quantity?: number;
  description?: string;
  item_code?: string;
  price?: number;
  total_cost?: number;
}

export default function RequestedParts({ jobId }: { jobId: number }) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchParts = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch only job_parts field from table filtered by jobId

        const { data: jc, error: jcError } = await supabase
          .from("workshop_job")
          .select("id")
          .eq("id", jobId)
          .single();

        if (jcError || !jc) {
          console.error("Error fetching job:", jcError);
          setParts([]);
          setLoading(false);
          return;
        }

        // jc is validated above, so use the definite id (not undefined)
        const workshopJobId = jc.id;

        const { data, error } = await supabase
          .from("workshop_jobpart")
          .select("job_parts")
          .eq("job_id", workshopJobId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching parts:", error);
          setParts([]);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Flatten job_parts arrays or objects from each row into a single parts array
          const allParts: Part[] = data.flatMap((row) => {
            const jp = (row as any).job_parts;
            if (!jp) return [];
            if (Array.isArray(jp)) return jp;
            if (typeof jp === "object") return [jp];
            return [];
          });

          // Filter out invalid/null parts
          const validParts = allParts.filter(
            (p) =>
              p &&
              (typeof p === "object") &&
              (Object.keys(p).length > 0)
          );

          setParts(validParts);
        } else {
          setParts([]);
        }
      } catch (e) {
        console.error("Failed to fetch parts table:", e);
        setParts([]);
      }
      setLoading(false);
    };

    fetchParts();
  }, [jobId, supabase]);

  if (loading) return <div className="text-sm text-gray-500">Loading parts...</div>;

  if (parts.length === 0) {
    return (
      <div className="border-t pt-3">
        <p className="text-sm font-medium text-gray-600 mb-2">Requested Parts:</p>
        <p className="text-sm text-gray-500">No parts requested yet</p>
      </div>
    );
  }

  return (
    <div className="border-t pt-3">
      <p className="text-sm font-medium text-gray-600 mb-2">Requested Parts ({parts.length}):</p>
      <div className="flex flex-wrap gap-2">
        {parts.map((part, index) => {
          const partName = part.part_name || part.description || part.item_code || "Unknown Part";
          const quantity = part.quantity || 1;
          const price = part.price || part.total_cost;

          return (
            <Badge key={index} variant="outline" className="text-xs">
              {partName} (x{quantity})
              {price && ` - R${price}`}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
