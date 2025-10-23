'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export default function ApprovalWorkflow({ isOpen, onClose, jobCard, userRole }) {
  const supabase = createClient();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && jobCard) {
      fetchApprovals();
    }
  }, [isOpen, jobCard]);

  const fetchApprovals = async () => {
    const { data, error } = await supabase
      .from('job_card_approvals')
      .select(`
        *,
        profiles(full_name)
      `)
      .eq('job_card_id', jobCard.id)
      .order('created_at');

    if (error) {
      toast.error('Failed to fetch approvals');
      return;
    }
    setApprovals(data || []);
  };

  const handleApproval = async (status) => {
    if (!canApprove()) return;

    setLoading(true);
    try {
      const approverType = getApproverType();
      
      const { error } = await supabase
        .from('job_card_approvals')
        .insert({
          job_card_id: jobCard.id,
          approver_type: approverType,
          status,
          notes: notes.trim() || null
        });

      if (error) throw error;

      // Update job card status
      const newStatus = getNextStatus(status, approverType);
      await supabase
        .from('job_cards')
        .update({ approval_status: newStatus })
        .eq('id', jobCard.id);

      toast.success(`Job card ${status}`);
      fetchApprovals();
      setNotes('');
    } catch (error) {
      toast.error('Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const getApproverType = () => {
    if (userRole === 'Administrator & Parts') return 'administrator';
    if (userRole === 'Fleet Manager') return 'luwazi';
    return 'wynand';
  };

  const canApprove = () => {
    const currentStatus = jobCard.approval_status || 'draft';
    const approverType = getApproverType();
    
    if (approverType === 'administrator' && currentStatus === 'draft') return true;
    if (approverType === 'luwazi' && currentStatus === 'pending_admin') return true;
    if (approverType === 'wynand' && currentStatus === 'pending_luwazi') return true;
    
    return false;
  };

  const getNextStatus = (status, approverType) => {
    if (status === 'rejected') return 'rejected';
    
    if (approverType === 'administrator') return 'pending_luwazi';
    if (approverType === 'luwazi') return 'pending_wynand';
    if (approverType === 'wynand') return 'approved';
    
    return 'draft';
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-600' },
      approved: { variant: 'default', icon: CheckCircle, color: 'text-green-600' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-600' }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const approvalSteps = [
    { type: 'administrator', label: 'Administrator', role: 'Administrator & Parts' },
    { type: 'luwazi', label: 'Luwazi', role: 'Fleet Manager' },
    { type: 'wynand', label: 'Wynand', role: 'Final Approver' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Approval Workflow - {jobCard?.job_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Card Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Job Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{jobCard?.approval_status || 'Draft'}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Cost:</span>
                <span className="ml-2 font-medium">R{(jobCard?.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Approval Steps */}
          <div className="space-y-4">
            <h4 className="font-medium">Approval Progress</h4>
            {approvalSteps.map((step, index) => {
              const approval = approvals.find(a => a.approver_type === step.type);
              const isActive = canApprove() && getApproverType() === step.type;
              
              return (
                <div key={step.type} className={`flex items-center gap-4 p-3 rounded-lg border ${isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{step.label}</div>
                      <div className="text-sm text-gray-600">{step.role}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {approval ? (
                      <div className="space-y-1">
                        {getStatusBadge(approval.status)}
                        <div className="text-xs text-gray-600">
                          {new Date(approval.created_at).toLocaleDateString()}
                        </div>
                        {approval.notes && (
                          <div className="text-xs text-gray-600 max-w-48 truncate">
                            "{approval.notes}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </div>
              );
            })}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}