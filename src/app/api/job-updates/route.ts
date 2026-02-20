import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint for updating workshop jobs with history tracking
 * Handles edits after approval and triggers re-approval workflow
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Get user profile to track who made the change
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, first_name, surname")
      .eq("id", user.id)
      .single();

    const userName = profile
      ? `${profile.first_name || ""} ${profile.surname || ""}`.trim()
      : user.email || "Unknown User";
    const userRole = profile?.role || "unknown";

    // Parse request body
    const body = await request.json();
    const {
      jobId,
      updates,
      changeReason,
      notes,
      requiresReapproval = true,
    } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Fetch current job data
    const { data: currentJob, error: fetchError } = await supabase
      .from("workshop_job")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError || !currentJob) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const wasApproved = currentJob.status?.toLowerCase() === "approved";
    const currentEditCount = currentJob.edit_count || 0;

    // Prepare update data
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_edited_by: user.id,
      last_edited_by_name: userName,
      last_edited_date: new Date().toISOString(),
    };

    // If job was previously approved and is being edited
    if (wasApproved) {
      updateData.edited_after_approval = true;
      updateData.edit_count = currentEditCount + 1;

      // Store original approval date if not already stored
      if (!currentJob.original_approval_date) {
        updateData.original_approval_date = currentJob.updated_at;
      }

      // Determine if re-approval is required
      if (requiresReapproval) {
        updateData.requires_reapproval = true;
        updateData.status = "Awaiting Approval";
        updateData.approved = false;

        // Update approval history
        const approvalHistory = currentJob.approval_history || [];
        approvalHistory.push({
          action: "edited_after_approval",
          date: new Date().toISOString(),
          edited_by: user.id,
          edited_by_name: userName,
          reason: changeReason || "Job card edited after approval",
          previous_status: currentJob.status,
        });
        updateData.approval_history = approvalHistory;
      }
    }

    // Update the job
    const { data: updatedJob, error: updateError } = await supabase
      .from("workshop_job")
      .update(updateData)
      .eq("id", jobId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating job:", updateError);
      return NextResponse.json(
        { error: "Failed to update job", details: updateError.message },
        { status: 500 }
      );
    }

    // Log status history if status changed
    if (updates.status && updates.status !== currentJob.status) {
      const metadata: any = {
        old_status: currentJob.status,
        new_status: updates.status,
        edited_after_approval: wasApproved,
        requires_reapproval: requiresReapproval && wasApproved,
      };

      // Check if parts were added/modified
      if (updates.parts_required) {
        metadata.parts_added = true;
      }

      // Check if costs changed
      if (
        updates.estimated_cost !== currentJob.estimated_cost ||
        updates.total_labor_cost !== currentJob.total_labor_cost ||
        updates.total_parts_cost !== currentJob.total_parts_cost
      ) {
        metadata.cost_changed = true;
      }

      await supabase.from("workshop_job_status_history").insert({
        job_id: jobId,
        from_status: currentJob.status,
        to_status: updates.status,
        changed_by: user.id,
        changed_by_name: userName,
        changed_by_role: userRole,
        change_reason:
          changeReason ||
          (wasApproved
            ? "Job edited after approval - requires re-approval"
            : "Job updated"),
        notes: notes || updates.notes,
        metadata,
      });
    }

    // If job was edited after approval, notify fleet manager
    if (wasApproved && requiresReapproval) {
      // TODO: Implement notification system
      // This could be email, in-app notification, or webhook
      console.log(
        `Notification: Job ${currentJob.jobId_workshop} edited after approval - requires re-approval`
      );
    }

    return NextResponse.json({
      success: true,
      message: wasApproved
        ? "Job updated successfully. Re-approval required."
        : "Job updated successfully",
      data: updatedJob,
      requiresReapproval: wasApproved && requiresReapproval,
    });
  } catch (error: any) {
    console.error("Error in job update API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch job update history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from("workshop_job")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Fetch status history
    const { data: history, error: historyError } = await supabase
      .from("workshop_job_status_history")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("Error fetching history:", historyError);
    }

    return NextResponse.json({
      success: true,
      data: {
        job,
        history: history || [],
        editInfo: {
          editedAfterApproval: job.edited_after_approval || false,
          requiresReapproval: job.requires_reapproval || false,
          editCount: job.edit_count || 0,
          lastEditedDate: job.last_edited_date,
          lastEditedBy: job.last_edited_by_name,
          originalApprovalDate: job.original_approval_date,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching job history:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
