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
    const normalizePart = (p: any): Part => {
      if (!p || typeof p !== "object") return { part_name: String(p) } as Part;
      return {
        part_name: p.part_name ?? p.description ?? p.item_code ?? undefined,
        quantity: p.quantity ?? p.qty ?? undefined,
        price: p.price ?? p.unit_price ?? undefined,
        total_cost: p.total_cost ?? p.total ?? undefined,
        description: p.description ?? undefined,
        item_code: p.item_code ?? undefined,
      } as Part;
    };

    const fetchParts = async () => {
      setLoading(true);
      setParts([]);

      if (!jobId) {
        setLoading(false);
        return;
      }

      try {
        const { data: rows, error } = await supabase
          .from("workshop_jobpart")
          .select(
            // "id, job_parts, given_parts" // to show both requested and assigned
            "id, job_parts"
          )
          .eq("job_id", jobId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching workshop_jobpart:", error);
          setParts([]);
          setLoading(false);
          return;
        }

        const allParts: Part[] = (rows || []).flatMap((r: any) => {
          const jp = r.job_parts ?? r.given_parts;
          if (jp) {
            if (Array.isArray(jp)) {
              return jp.map((p) => normalizePart(p));
            }
            if (typeof jp === "object") {
              return [normalizePart(jp)];
            }
            if (typeof jp === "string" && jp.trim()) {
              return [{ part_name: jp } as Part];
            }
          }

          // fallback to individual fields on the row
          if (
            r.part_name ||
            r.quantity ||
            r.price ||
            r.total_cost ||
            r.description ||
            r.item_code
          ) {
            return [
              normalizePart({
                part_name: r.part_name,
                quantity: r.quantity,
                price: r.price,
                total_cost: r.total_cost,
                description: r.description,
                item_code: r.item_code,
              }),
            ];
          }

          return [];
        });

        const validParts = allParts.filter(
          (p) => p && (p.part_name || p.description || p.item_code)
        );
        setParts(validParts);
      } catch (e) {
        console.error("Failed to fetch parts:", e);
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [jobId, supabase]);

  if (loading)
    return <div className="text-sm text-gray-500">Loading parts...</div>;

  if (parts.length === 0) {
    return (
      <div className="border-t pt-3">
        <p className="text-sm font-medium text-gray-600 mb-2">
          Requested Parts:
        </p>
        <p className="text-sm text-gray-500">No parts requested yet</p>
      </div>
    );
  }

  return (
    <div className="border-t pt-3">
      <p className="text-sm font-medium text-gray-600 mb-2">
        Requested Parts ({parts.length}):
      </p>
      <div className="flex flex-wrap gap-2">
        {parts.map((part, index) => {
          const partName =
            part.part_name ||
            part.description ||
            part.item_code ||
            "Unknown Part";
          const quantity = part.quantity ?? 1;
          const price = part.price ?? part.total_cost;

          return (
            <Badge key={index} variant="outline" className="text-xs">
              {partName} (x{quantity}){price !== undefined && ` • R${price}`}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
