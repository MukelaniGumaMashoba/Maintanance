"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface JobCardFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface CreateJobForm {
  registration_no: string
  job_type: string
  description: string
  type_of_work: string
  client_name: string
  client_phone: string
  location: string
  notes: string
  estimated_cost: number
  priority: string
  due_date: string
  estimated_duration_hours: number
  work_notes: string
  selected_workshop_id: string
}

export default function JobCardForm({ onSuccess, onCancel }: JobCardFormProps) {
  const [formData, setFormData] = useState<CreateJobForm>({
    registration_no: "",
    job_type: "",
    description: "",
    type_of_work: "",
    client_name: "",
    client_phone: "",
    location: "",
    notes: "",
    estimated_cost: 0,
    priority: "medium",
    due_date: "",
    estimated_duration_hours: 0,
    work_notes: "",
    selected_workshop_id: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null)
  const [workshops, setWorkshops] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    const { data, error } = await supabase
      .from('workshop')
      .select('*')
      .order('work_name')
    
    if (!error && data) {
      setWorkshops(data)
    }
  }

  const checkVehicleExists = async (registrationNumber: string) => {
    if (!registrationNumber) {
      setVehicleExists(null)
      return null
    }

    try {
      const { data, error } = await supabase
        .from('vehiclesc')
        .select('*')
        .eq('registration_number', registrationNumber.toUpperCase())
        .single()

      setVehicleExists(!!data && !error)
      return data
    } catch (error) {
      setVehicleExists(false)
      return null
    }
  }

  const generateJobId = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    return `WS-${year}-${randomNum}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.registration_no || !formData.job_type || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!formData.selected_workshop_id) {
      toast.error("Please select a workshop")
      return
    }

    setIsSubmitting(true)

    try {
      const vehicleData = await checkVehicleExists(formData.registration_no)
      
      if (!vehicleData) {
        toast.error("Vehicle not found. Please enter a valid registration number.")
        setIsSubmitting(false)
        return
      }

      const jobId = generateJobId()
      
      const { data: newJob, error: jobError } = await supabase
        .from('workshop_job')
        .insert({
          registration_no: formData.registration_no.toUpperCase(),
          job_type: formData.job_type,
          description: formData.description,
          type_of_work: formData.type_of_work,
          vehicle_id: vehicleData.id,
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          location: formData.location,
          notes: formData.notes,
          jobId_workshop: jobId,
          status: 'Awaiting Approval',
          estimated_cost: formData.estimated_cost || 0,
          priority: formData.priority,
          due_date: formData.due_date || null,
          estimated_duration_hours: formData.estimated_duration_hours || null,
          work_notes: formData.work_notes,
          approval_status: 'draft'
        })
        .select()
        .single()

      if (jobError) {
        console.error('Job creation failed:', jobError)
        toast.error("Failed to create job card")
        return
      }

      // Assign to workshop
      const { error: assignError } = await supabase
        .from('workshop_assign')
        .insert({
          job_id: newJob.id,
          workshop_id: formData.selected_workshop_id
        })

      if (assignError) {
        console.error('Workshop assignment failed:', assignError)
        toast.error("Job created but failed to assign to workshop")
        return
      }

      const selectedWorkshop = workshops.find(w => w.id === formData.selected_workshop_id)
      toast.success(`Job card ${jobId} created and assigned to ${selectedWorkshop?.work_name || 'workshop'}`)
      
      onSuccess?.()
      
      // Reset form
      setFormData({
        registration_no: "",
        job_type: "",
        description: "",
        type_of_work: "",
        client_name: "",
        client_phone: "",
        location: "",
        notes: "",
        estimated_cost: 0,
        priority: "medium",
        due_date: "",
        estimated_duration_hours: 0,
        work_notes: "",
        selected_workshop_id: ""
      })
      setVehicleExists(null)

    } catch (error) {
      console.error('Error creating job:', error)
      toast.error("An error occurred while creating the job card")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Job Card</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registration_no">Vehicle Registration *</Label>
              <Input
                id="registration_no"
                placeholder="DD80MKGP"
                value={formData.registration_no}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase()
                  setFormData({ ...formData, registration_no: value })
                  checkVehicleExists(value)
                }}
                className={vehicleExists === false ? "border-red-500" : vehicleExists === true ? "border-green-500" : ""}
              />
              {vehicleExists === false && (
                <p className="text-sm text-red-500 mt-1 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  Vehicle not found
                </p>
              )}
              {vehicleExists === true && (
                <p className="text-sm text-green-500 mt-1 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Vehicle found
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="job_type">Job Type *</Label>
              <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
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

          {/* Work Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type_of_work">Type of Work *</Label>
              <Select value={formData.type_of_work} onValueChange={(value) => setFormData({ ...formData, type_of_work: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="bodywork">Body Work</SelectItem>
                  <SelectItem value="towing">Towing</SelectItem>
                  <SelectItem value="panel-beating">Panel Beating</SelectItem>
                  <SelectItem value="fitment">Fitment Centre</SelectItem>
                  <SelectItem value="carwash">Car Wash</SelectItem>
                  <SelectItem value="driveline">Drive Line Repairs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
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

          {/* Description */}
          <div>
            <Label htmlFor="description">Problem Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the problem or work required..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                placeholder="Client name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="client_phone">Client Phone</Label>
              <Input
                id="client_phone"
                placeholder="Phone number"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Job Location</Label>
            <Input
              id="location"
              placeholder="Enter job location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Cost and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="estimated_cost">Estimated Cost (R)</Label>
              <Input
                id="estimated_cost"
                type="number"
                placeholder="0.00"
                value={formData.estimated_cost || ""}
                onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="estimated_duration_hours">Estimated Duration (Hours)</Label>
              <Input
                id="estimated_duration_hours"
                type="number"
                placeholder="0"
                value={formData.estimated_duration_hours || ""}
                onChange={(e) => setFormData({ ...formData, estimated_duration_hours: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Job Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="work_notes">Work Instructions</Label>
              <Textarea
                id="work_notes"
                placeholder="Specific work instructions..."
                value={formData.work_notes}
                onChange={(e) => setFormData({ ...formData, work_notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* Workshop Selection */}
          <div>
            <Label htmlFor="workshop">Assign to Workshop *</Label>
            <Select value={formData.selected_workshop_id} onValueChange={(value) => setFormData({ ...formData, selected_workshop_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select workshop" />
              </SelectTrigger>
              <SelectContent>
                {workshops.map((workshop) => (
                  <SelectItem key={workshop.id} value={workshop.id}>
                    <div className="flex flex-col">
                      <span>{workshop.work_name}</span>
                      <span className="text-sm text-gray-500">
                        {workshop.city || workshop.town} • Rate: R{workshop.labour_rate || 0}/hr
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.registration_no || !formData.job_type || !formData.description || !formData.selected_workshop_id}
            >
              {isSubmitting ? "Creating..." : "Create Job Card"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}