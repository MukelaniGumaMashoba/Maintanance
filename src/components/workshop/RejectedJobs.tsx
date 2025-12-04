"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  RotateCcw, 
  Eye, 
  Calendar,
  User,
  AlertTriangle,
  Edit,
  Printer
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import JobCardPrinter from "@/components/ui-personal/job-card-printer"

interface RejectedJob {
  id: string
  original_job_card_id: string
  job_data: any
  rejection_reason: string
  rejected_by: string
  rejected_at: string
  can_reopen: boolean
  reopened_at?: string
  reopened_by?: string
  new_job_card_id?: string
  rejected_by_profile?: { full_name: string }
  reopened_by_profile?: { full_name: string }
}

export default function RejectedJobs() {
  const [rejectedJobs, setRejectedJobs] = useState<RejectedJob[]>([])
  const [selectedJob, setSelectedJob] = useState<RejectedJob | null>(null)
  const [isReopening, setIsReopening] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [editForm, setEditForm] = useState({
    registration_no: '',
    job_type: '',
    description: '',
    estimated_cost: 0,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'emergency',
    due_date: '',
    notes: '',
    client_name: '',
    client_phone: '',
    location: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchRejectedJobs()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role || "")
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      // Fallback to localStorage if available
      const role = localStorage.getItem("userRole") || ""
      setUserRole(role)
    }
  }

  const fetchRejectedJobs = async () => {
    try {
      // First try to get from rejected_jobs table
      const { data: rejectedData, error: rejectedError } = await supabase
        .from('rejected_jobs' as any)
        .select('*')
        .order('rejected_at', { ascending: false })

      if (!rejectedError && rejectedData && rejectedData.length > 0) {
        // Fetch profile names for rejected_by and reopened_by
        const jobsWithProfiles = await Promise.all(
          rejectedData.map(async (job: any) => {
            let rejectedByName = 'Unknown'
            let reopenedByName = null

            if (job.rejected_by) {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', job.rejected_by)
                  .single()
                if (profile) rejectedByName = profile.full_name || 'Unknown'
              } catch (err) {
                console.error('Error fetching rejected_by profile:', err)
              }
            }

            if (job.reopened_by) {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', job.reopened_by)
                  .single()
                if (profile) reopenedByName = profile.full_name || 'Unknown'
                setProfile(profile)
              } catch (err) {
                console.error('Error fetching reopened_by profile:', err)
              }
            }

            return {
              ...job,
              rejected_by_profile: { full_name: rejectedByName },
              reopened_by_profile: reopenedByName ? { full_name: reopenedByName } : undefined
            }
          })
        )
        setRejectedJobs(jobsWithProfiles as any)
      } else {
        // Fallback: get rejected jobs from workshop_job table
        const { data: allWorkshopJobs, error: workshopError } = await supabase
          .from('workshop_job')
          .select('*')
          .order('created_at', { ascending: false })
        
        // Filter for rejected jobs (case-insensitive)
        const workshopJobs = (allWorkshopJobs || []).filter((job: any) => 
          (job.status || '').toLowerCase() === 'rejected'
        )

        if (!workshopError && workshopJobs) {
          const formattedJobs = workshopJobs.map((job: any) => ({
            id: `rejected_${job.id}`,
            original_job_card_id: job.id.toString(),
            job_data: job,
            rejection_reason: job.notes || 'No reason provided',
            rejected_by: null,
            rejected_at: job.updated_at || job.created_at,
            can_reopen: true,
            reopened_at: null,
            reopened_by: null,
            new_job_card_id: null,
            rejected_by_profile: { full_name: 'System' },
            reopened_by_profile: undefined
          }))
          setRejectedJobs(formattedJobs as any)
        }
      }
    } catch (err) {
      console.error('Error fetching rejected jobs:', err)
    }
  }

  const reopenJob = async (rejectedJob: RejectedJob, editedData?: any) => {
    if (!rejectedJob.can_reopen) {
      toast.error("This job cannot be reopened")
      return
    }

    setIsReopening(true)

    try {
      // Use edited data if provided, otherwise use original data
      const originalJobData = editedData || rejectedJob.job_data
      const year = new Date().getFullYear()
      const newJobNumber = `JC-${year}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`

      const { data: newJob, error: jobError } = await supabase
        .from('workshop_job')
        .insert({
          jobId_workshop: newJobNumber,
          registration_no: originalJobData.registration_no || originalJobData.vehicle_registration,
          job_type: originalJobData.job_type,
          description: originalJobData.description || originalJobData.job_description,
          notes: `Reopened from rejected job ${originalJobData.jobId_workshop || originalJobData.job_number}. Original rejection reason: ${rejectedJob.rejection_reason}`,
          estimated_cost: originalJobData.estimated_cost || 0,
          priority: originalJobData.priority || 'medium',
          due_date: originalJobData.due_date || '',
          status: 'Awaiting Approval',
          client_name: originalJobData.client_name || '',
          client_phone: originalJobData.client_phone || '',
          location: originalJobData.location || '',
          driver_id: originalJobData.driver_id
        })
        .select()
        .single()

      if (jobError) {
        throw jobError
      }

      // Update rejected job record
      const { error: updateError } = await supabase
        .from('rejected_jobs' as any)
        .update({
          reopened_at: new Date().toISOString(),
          reopened_by: (await supabase.auth.getUser()).data.user?.id,
          new_job_card_id: newJob.id,
          can_reopen: false
        } as any)
        .eq('id', rejectedJob.id)

      if (updateError) {
        throw updateError
      }

      toast.success(`Job reopened as ${newJobNumber}`)
      fetchRejectedJobs()
      setSelectedJob(null)
      setIsEditOpen(false)
      setEditingJob(null)

    } catch (error) {
      console.error('Failed to reopen job:', error)
      toast.error("Failed to reopen job")
    } finally {
      setIsReopening(false)
    }
  }

  const handleEdit = (rejectedJob: RejectedJob) => {
    const jobData = rejectedJob.job_data
    setEditForm({
      registration_no: jobData.registration_no || jobData.vehicle_registration || '',
      job_type: jobData.job_type || '',
      description: jobData.description || jobData.job_description || '',
      estimated_cost: jobData.estimated_cost || 0,
      priority: jobData.priority || 'medium',
      due_date: jobData.due_date || '',
      notes: jobData.notes || '',
      client_name: jobData.client_name || '',
      client_phone: jobData.client_phone || '',
      location: jobData.location || ''
    })
    setEditingJob(rejectedJob)
    setIsEditOpen(true)
  }

  const handleSaveAndReopen = () => {
    if (!editingJob) return
    reopenJob(editingJob, editForm)
  }

  const generateJobId = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    return `JC-${year}-${randomNum}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Rejected Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rejectedJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No rejected jobs found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rejectedJobs.map((rejectedJob) => (
                <Card key={rejectedJob.id} className="p-4 border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-lg">
                          {rejectedJob.job_data.jobId_workshop || rejectedJob.job_data.job_number || 'N/A'}
                        </h3>
                        <Badge variant="destructive">Rejected</Badge>
                        {rejectedJob.reopened_at && (
                          <Badge variant="secondary">Reopened</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Vehicle:</strong> {rejectedJob.job_data.registration_no || rejectedJob.job_data.vehicle_registration || 'N/A'}</p>
                          <p><strong>Description:</strong> {rejectedJob.job_data.description || rejectedJob.job_data.job_description || 'N/A'}</p>
                          <p><strong>Priority:</strong> {rejectedJob.job_data.priority || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <strong>Rejected:</strong> {formatDate(rejectedJob.rejected_at)}
                          </p>
                          <p className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <strong>By:</strong> {rejectedJob.rejected_by_profile?.full_name || 'Unknown'}
                          </p>
                          {rejectedJob.reopened_at && (
                            <p className="flex items-center text-green-600">
                              <RotateCcw className="h-4 w-4 mr-1" />
                              <strong>Reopened:</strong> {formatDate(rejectedJob.reopened_at)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-red-50 rounded-md">
                        <p className="text-sm">
                          <strong>Rejection Reason:</strong> {rejectedJob.rejection_reason}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJob(rejectedJob)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPrintOpen(true)}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      
                      {rejectedJob.can_reopen && !rejectedJob.reopened_at && userRole.toLowerCase() !== "fleet manager" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(rejectedJob)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => reopenJob(rejectedJob)}
                            disabled={isReopening}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            {isReopening ? "Reopening..." : "Reopen"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Job Details - {selectedJob.job_data.jobId_workshop || selectedJob.job_data.job_number || 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Vehicle Information</h4>
                  <p><strong>Registration:</strong> {selectedJob.job_data.registration_no || selectedJob.job_data.vehicle_registration || 'N/A'}</p>
                  <p><strong>Job Type:</strong> {selectedJob.job_data.job_type || 'N/A'}</p>
                  <p><strong>Priority:</strong> {selectedJob.job_data.priority || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Job Details</h4>
                  <p><strong>Estimated Cost:</strong> R{selectedJob.job_data.estimated_cost || 0}</p>
                  <p><strong>Due Date:</strong> {selectedJob.job_data.due_date || 'Not set'}</p>
                  <p><strong>Duration:</strong> {selectedJob.job_data.estimated_duration_hours || 0} hours</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="p-3 bg-gray-50 rounded-md">{selectedJob.job_data.description || selectedJob.job_data.job_description || 'N/A'}</p>
              </div>
              
              {selectedJob.job_data.work_notes && (
                <div>
                  <h4 className="font-semibold mb-2">Work Notes</h4>
                  <p className="p-3 bg-gray-50 rounded-md">{selectedJob.job_data.work_notes}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">Rejection Information</h4>
                <div className="p-3 bg-red-50 rounded-md">
                  <p><strong>Rejected by:</strong> {selectedJob.rejected_by_profile?.full_name || 'Unknown'}</p>
                  <p><strong>Rejected at:</strong> {formatDate(selectedJob.rejected_at)}</p>
                  <p><strong>Reason:</strong> {selectedJob.rejection_reason}</p>
                </div>
              </div>
              
              {selectedJob.reopened_at && (
                <div>
                  <h4 className="font-semibold mb-2">Reopening Information</h4>
                  <div className="p-3 bg-green-50 rounded-md">
                    <p><strong>Reopened by:</strong> {selectedJob.reopened_by_profile?.full_name || 'Unknown'}</p>
                    <p><strong>Reopened at:</strong> {formatDate(selectedJob.reopened_at)}</p>
                    {selectedJob.new_job_card_id && (
                      <p><strong>New Job Card ID:</strong> {selectedJob.new_job_card_id}</p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJob(null)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedJob(null)
                    setIsPrintOpen(true)
                  }}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>

                {selectedJob.can_reopen && !selectedJob.reopened_at && userRole.toLowerCase() !== "fleet manager" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(null)
                        handleEdit(selectedJob)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      onClick={() => reopenJob(selectedJob)}
                      disabled={isReopening}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {isReopening ? "Reopening..." : "Reopen Job"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Rejected Job</DialogTitle>
            <DialogDescription>
              Edit the job details before reopening. All changes will be applied to the new job card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Registration Number</Label>
                <Input
                  value={editForm.registration_no}
                  onChange={(e) => setEditForm({ ...editForm, registration_no: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <Label>Job Type</Label>
                <Select value={editForm.job_type} onValueChange={(value) => setEditForm({ ...editForm, job_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="breakdown">Breakdown</SelectItem>
                    <SelectItem value="accident">Accident Repair</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Estimated Cost</Label>
                <Input
                  type="number"
                  value={editForm.estimated_cost}
                  onChange={(e) => setEditForm({ ...editForm, estimated_cost: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value as any })}>
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
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editForm.due_date}
                onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* driver name and phone number */}
              <Label>Driver Name</Label>
              <Input
                value={editForm.client_name}
                onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
              />
              <Label>Driver Phone Number</Label>
              <Input
                value={editForm.client_phone}
                onChange={(e) => setEditForm({ ...editForm, client_phone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAndReopen} disabled={isReopening} className="bg-green-600 hover:bg-green-700">
              <RotateCcw className="h-4 w-4 mr-1" />
              {isReopening ? "Reopening..." : "Save & Reopen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      {selectedJob && (
        <JobCardPrinter
          isOpenCard={isPrintOpen}
          onCloseCard={() => {
            setIsPrintOpen(false)
            setSelectedJob(null)
          }}
          jobCard={selectedJob.job_data}
          jobId={selectedJob.job_data?.id || selectedJob.original_job_card_id}
        />
      )}
    </div>
  )
}