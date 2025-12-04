"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Printer,
  User,
  AlertTriangle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface JobCard {
  id: string
  job_number: string
  job_description: string
  vehicle_registration: string
  workflow_status: string
  status: string
  created_at: string
  assigned_technician_id?: string
  technician_name?: string
  driver_id?: number
  estimated_cost: number
  priority: string
}

interface WorkflowAction {
  action: 'approve' | 'reject' | 'print' | 'complete' | 'reopen'
  notes?: string
}

export default function JobCardWorkflow() {
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)
  const [actionNotes, setActionNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [userPermissions, setUserPermissions] = useState({
    can_approve_jobs: false,
    can_reject_jobs: false,
    can_close_jobs: false
  })
  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchJobs()
  }, [])

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, can_approve_jobs, can_reject_jobs, can_close_jobs')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserRole(profile.role)
        setUserPermissions({
          can_approve_jobs: profile.can_approve_jobs,
          can_reject_jobs: profile.can_reject_jobs,
          can_close_jobs: profile.can_close_jobs
        })
      }
    }
  }

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('job_cards')
      .select(`
        id,
        job_number,
        job_description,
        vehicle_registration,
        workflow_status,
        status,
        created_at,
        assigned_technician_id,
        technician_name,
        driver_id,
        estimated_cost,
        priority
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setJobs(data)
    }
  }

  const logWorkflowHistory = async (jobCardId: string, fromStatus: string, toStatus: string, notes?: string) => {
    await supabase
      .from('job_card_workflow_history')
      .insert({
        job_card_id: jobCardId,
        from_status: fromStatus,
        to_status: toStatus,
        notes: notes
      })
  }

  const handleWorkflowAction = async (job: JobCard, action: WorkflowAction) => {
    setIsProcessing(true)
    
    try {
      let newStatus = job.workflow_status
      let newJobStatus = job.status

      switch (action.action) {
        case 'approve':
          newStatus = 'approved'
          newJobStatus = 'approved'
          break
        case 'reject':
          newStatus = 'rejected'
          newJobStatus = 'rejected'
          // Store in rejected_jobs table
          await supabase
            .from('rejected_jobs')
            .insert({
              original_job_card_id: job.id,
              job_data: job,
              rejection_reason: action.notes
            })
          break
        case 'complete':
          newStatus = 'completed'
          newJobStatus = 'completed'
          break
        case 'reopen':
          newStatus = 'pending_approval'
          newJobStatus = 'pending'
          break
      }

      // Update job card status
      const { error: updateError } = await supabase
        .from('job_cards')
        .update({
          workflow_status: newStatus,
          status: newJobStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)

      if (updateError) {
        throw updateError
      }

      // Log workflow history
      await logWorkflowHistory(job.id, job.workflow_status, newStatus, action.notes)

      toast.success(`Job ${job.job_number} ${action.action}d successfully`)
      
      // Refresh jobs list
      fetchJobs()
      setSelectedJob(null)
      setActionNotes("")

    } catch (error) {
      console.error('Workflow action failed:', error)
      toast.error(`Failed to ${action.action} job`)
    } finally {
      setIsProcessing(false)
    }
  }

  const printJobCard = (job: JobCard) => {
    // Generate printable job card with notes and signature sections
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Job Card - ${job.job_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .section { margin: 20px 0; }
              .field { margin: 10px 0; }
              .signature-box { border: 1px solid #000; height: 60px; margin: 10px 0; }
              .notes-box { border: 1px solid #000; min-height: 100px; margin: 10px 0; padding: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>JOB CARD</h1>
              <h2>${job.job_number}</h2>
            </div>
            
            <div class="section">
              <h3>Vehicle Information</h3>
              <div class="field"><strong>Registration:</strong> ${job.vehicle_registration}</div>
              <div class="field"><strong>Job Type:</strong> ${job.job_description}</div>
              <div class="field"><strong>Priority:</strong> ${job.priority}</div>
            </div>

            <div class="section">
              <h3>Assignment</h3>
              <div class="field"><strong>Technician:</strong> ${job.technician_name || 'Not assigned'}</div>
              <div class="field"><strong>Estimated Cost:</strong> R${job.estimated_cost}</div>
            </div>

            <div class="section">
              <h3>Work Notes</h3>
              <div class="notes-box"></div>
            </div>

            <div class="section">
              <h3>Technician Signature</h3>
              <div class="signature-box"></div>
              <div class="field">Date: _______________</div>
            </div>

            <div class="section">
              <h3>Parts Used</h3>
              <div class="notes-box"></div>
            </div>

            <div class="section">
              <h3>Labour Hours</h3>
              <div class="field">Start Time: _______________</div>
              <div class="field">End Time: _______________</div>
              <div class="field">Total Hours: _______________</div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const canPerformAction = (action: string, job: JobCard) => {
    switch (action) {
      case 'approve':
        return userPermissions.can_approve_jobs && job.workflow_status === 'pending_approval'
      case 'reject':
        return userPermissions.can_reject_jobs && job.workflow_status === 'pending_approval'
      case 'complete':
        return userPermissions.can_close_jobs && job.workflow_status === 'approved'
      case 'print':
        return job.workflow_status === 'approved'
      default:
        return false
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Card Workflow Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold">{job.job_number}</h3>
                      <p className="text-sm text-gray-600">{job.vehicle_registration}</p>
                      <p className="text-sm text-gray-500">{job.job_description}</p>
                    </div>
                    <Badge className={`${getStatusColor(job.workflow_status)} flex items-center space-x-1`}>
                      {getStatusIcon(job.workflow_status)}
                      <span>{job.workflow_status.replace('_', ' ').toUpperCase()}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    {canPerformAction('approve', job) && (
                      <Button
                        size="sm"
                        onClick={() => handleWorkflowAction(job, { action: 'approve' })}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    
                    {canPerformAction('reject', job) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedJob(job)}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    
                    {canPerformAction('print', job) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printJobCard(job)}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    )}
                    
                    {canPerformAction('complete', job) && (
                      <Button
                        size="sm"
                        onClick={() => handleWorkflowAction(job, { action: 'complete' })}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rejection Modal */}
      {selectedJob && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reject Job Card</h3>
            <p className="text-sm text-gray-600 mb-4">
              Job: {selectedJob.job_number} - {selectedJob.vehicle_registration}
            </p>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection_reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection_reason"
                  placeholder="Please provide a reason for rejection..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedJob(null)
                    setActionNotes("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleWorkflowAction(selectedJob, { action: 'reject', notes: actionNotes })}
                  disabled={!actionNotes.trim() || isProcessing}
                >
                  {isProcessing ? "Rejecting..." : "Reject Job"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}