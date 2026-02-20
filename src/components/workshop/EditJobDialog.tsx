"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, FileEdit, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EditJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
  currentJob: any;
  onSuccess?: () => void;
}

export default function EditJobDialog({
  isOpen,
  onClose,
  jobId,
  currentJob,
  onSuccess,
}: EditJobDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [changeReason, setChangeReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (currentJob) {
      setFormData({
        description: currentJob.description || "",
        job_type: currentJob.job_type || "",
        client_name: currentJob.client_name || "",
        client_phone: currentJob.client_phone || "",
        location: currentJob.location || "",
        estimated_cost: currentJob.estimated_cost || 0,
        priority: currentJob.priority || "medium",
        due_date: currentJob.due_date
          ? new Date(currentJob.due_date).toISOString().split("T")[0]
          : "",
        notes: currentJob.notes || "",
      });
    }
  }, [currentJob]);

  const wasApproved = currentJob?.status?.toLowerCase() === "approved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wasApproved && !changeReason.trim()) {
      toast.error("Please provide a reason for editing an approved job");
      return;
    }

    setLoading(true);

    try {
      // Call the update API
      const response = await fetch("/api/job-updates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          updates: formData,
          changeReason: changeReason || "Job details updated",
          notes: additionalNotes || formData.notes,
          requiresReapproval: wasApproved, // Only require re-approval if job was previously approved
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update job");
      }

      if (result.requiresReapproval) {
        toast.success(
          "Job updated successfully! The job has been sent back for re-approval.",
          {
            duration: 5000,
          }
        );
      } else {
        toast.success("Job updated successfully!");
      }

      // Reset form
      setChangeReason("");
      setAdditionalNotes("");

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileEdit className="h-5 w-5" />
            Edit Job Card
          </DialogTitle>
          <DialogDescription>
            Update job card details. {wasApproved && "This job was previously approved and will require re-approval after changes."}
          </DialogDescription>
        </DialogHeader>

        {wasApproved && (
          <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Re-approval Required</AlertTitle>
            <AlertDescription className="text-yellow-700">
              This job was previously approved. Any changes will send it back to the fleet manager for re-approval.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Type */}
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Input
                id="job_type"
                value={formData.job_type || ""}
                onChange={(e) =>
                  setFormData({ ...formData, job_type: e.target.value })
                }
                placeholder="e.g., Oil Change, Brake Repair"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority || "medium"}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={formData.client_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, client_name: e.target.value })
                }
              />
            </div>

            {/* Client Phone */}
            <div className="space-y-2">
              <Label htmlFor="client_phone">Client Phone</Label>
              <Input
                id="client_phone"
                value={formData.client_phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, client_phone: e.target.value })
                }
              />
            </div>

            {/* Estimated Cost */}
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost (R)</Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                value={formData.estimated_cost || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estimated_cost: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date || ""}
                onChange={(e) =>
                  setFormData({ ...formData, due_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Describe the job requirements..."
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Job Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          {/* Change Reason (required for approved jobs) */}
          {wasApproved && (
            <div className="space-y-2">
              <Label htmlFor="changeReason" className="text-red-600">
                Reason for Changes *
              </Label>
              <Textarea
                id="changeReason"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={2}
                placeholder="Explain why this approved job needs to be modified..."
                required
                className="border-yellow-300 focus:border-yellow-500"
              />
              <p className="text-xs text-gray-500">
                This will be logged in the job history and sent to the fleet manager
              </p>
            </div>
          )}

          {/* Additional Notes for Update */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Update Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes about this update..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FileEdit className="mr-2 h-4 w-4" />
                  {wasApproved ? "Update & Request Re-approval" : "Update Job"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
