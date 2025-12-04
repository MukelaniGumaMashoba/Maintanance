'use client';

import { useState, useEffect, use } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Package, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function JobCardWorkflow({ isOpen, onClose, jobCard, onStatusUpdate }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState(null);

  const handleApproval = async (status) => {
    setLoading(true);
    try {
      // const newStatus = status === 'approved' ? 'Approved - Ready for Parts Assignment' : 'Rejected';
      const newStatus = status === 'approved' ? 'Approved' : 'Rejected';


      // Get current user for rejection tracking
      const { data: { user } } = await supabase.auth.getUser();

      if (status === 'rejected') {
        // Store in rejected_jobs table if it exists, otherwise just update status
        const { data: jobData } = await supabase
          .from('workshop_job')
          .select('*')
          .eq('id', jobCard.id)
          .single();

        // Try to insert into rejected_jobs (table might not exist, so we'll handle gracefully)
        try {
          await supabase
            .from('rejected_jobs')
            .insert({
              original_job_card_id: jobCard.id.toString(),
              job_data: jobData,
              rejection_reason: notes.trim() || 'No reason provided',
              rejected_by: user?.id,
              can_reopen: true
            });
        } catch (rejectError) {
          // If rejected_jobs table doesn't exist, just log and continue
          console.warn('Could not store in rejected_jobs table:', rejectError);
        }
      }

      const { error } = await supabase
        .from('workshop_job')
        .update({
          status: newStatus,
          notes: notes.trim() || null
        })
        .eq('id', jobCard.id);

      if (error) throw error;

      toast.success(`Job card ${status}`);
      onStatusUpdate();
      onClose();
      setNotes('');
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to update job status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status?.includes('Awaiting')) {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="w-3 h-3 text-yellow-600" />
        Awaiting Approval
      </Badge>;
    }
    if (status?.includes('Approved')) {
      return <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="w-3 h-3 text-green-600" />
        Approved
      </Badge>;
    }
    if (status?.includes('Rejected')) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3 text-red-600" />
        Rejected
      </Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const canApprove = () => {
    return jobCard?.status?.includes('Awaiting');
  };

  useEffect(() => {
    if (!jobCard?.id) return; // Exit early if jobCard or jobCard.id is null

    const getPartAssignments = async () => {
      const { data, error } = await supabase
        .from("workshop_jobpart")
        .select("given_parts")
        .eq("job_id", jobCard.id);
      if (error) {
        toast.error('Failed to fetch part assignments');
      } else {
        const hasAssignedParts = data.some(part =>
          part.given_parts && Array.isArray(part.given_parts) && part.given_parts.length > 0
        );
        setParts(hasAssignedParts);
      }
    };
    getPartAssignments();
  }, [jobCard?.id]); // Depend on jobCard.id so it updates when jobCard changes


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Job Card Workflow - {jobCard?.jobId_workshop}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Card Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Job Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Vehicle:</span>
                <span className="ml-2 font-medium">{jobCard?.registration_no}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2">{getStatusBadge(jobCard?.status)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Description:</span>
                <span className="ml-2 font-medium">{jobCard?.description}</span>
              </div>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <h4 className="font-medium">Workflow Progress</h4>

            <div className="space-y-3">
              {/* Step 1: Job Creation */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 flex-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="font-medium">Job Card Created</div>
                    <div className="text-sm text-gray-600">Initial job card with parts requirements</div>
                  </div>
                </div>
                <Badge variant="default">Completed</Badge>
              </div>

              {/* Step 2: Technician Assignment */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 flex-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Technician Assignment</div>
                    <div className="text-sm text-gray-600">Assign technician to complete work</div>
                  </div>
                </div>
                {/* if the technician is true */}
                {jobCard?.technician ? (
                  <Badge variant="default">Assigned</Badge>
                ) : (
                  <Badge variant="outline">Pending</Badge>
                )}
              </div>

              {/* Step 3: Parts Assignment */}
              <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 flex-1">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Parts Assignment</div>
                    <div className="text-sm text-gray-600">Assign required parts from inventory</div>
                  </div>
                </div>
                <Badge variant="outline">
                  {parts === true ? 'Assigned' : 'Pending'}
                </Badge>
              </div>



              {/* Step 4: Workshop Approval */}
              <div className={`flex items-center gap-4 p-3 rounded-lg border ${canApprove() ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 flex-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium">Workshop Approval</div>
                    <div className="text-sm text-gray-600">Review and approve/reject job card</div>
                  </div>
                </div>
                {getStatusBadge(jobCard?.status)}
              </div>
            </div>
          </div>

          {/* Approval Actions */}
          {canApprove() && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add approval notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleApproval('rejected')}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproval('approved')}
                  disabled={loading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}

          {/* Info for approved jobs */}
          {jobCard?.status?.includes('Approved') && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm">
                {/* ✓ Job approved! You can now assign parts from inventory and assign a technician. */}
                Job approved! Once completed, will be under the completed jobs tabs.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
