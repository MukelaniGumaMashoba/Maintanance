"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"
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
  location: string
  notes: string
  estimated_cost: number
  priority: string
  due_date: string
  estimated_duration_hours: number
  work_notes: string
  selected_technician_id: string
  selected_external_sublet: string
  driver_id: string
}

interface Driver {
  id: number
  first_name: string
  surname: string
  cell_number: string
}

interface Technician {
  id: number
  name: string
  phone: string
  specialties: string[]
}

export default function UpdatedJobCardForm({ onSuccess, onCancel }: JobCardFormProps) {
  const [formData, setFormData] = useState<CreateJobForm>({
    registration_no: "",
    job_type: "",
    description: "",
    type_of_work: "",
    location: "",
    notes: "",
    estimated_cost: 0,
    priority: "medium",
    due_date: "",
    estimated_duration_hours: 0,
    work_notes: "",
    selected_technician_id: "",
    selected_external_sublet: "",
    driver_id: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [externalSublets, setExternalSublets] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchDrivers()
    fetchTechnicians()
    fetchExternalSublets()
  }, [])

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('id, first_name, surname, cell_number')
      .order('first_name')
    
    if (!error && data) {
      setDrivers(data)
    }
  }

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from('technicians')
      .select('id, name, phone, specialties')
      .eq('isActive', true)
      .order('name')
    
    if (!error && data) {
      setTechnicians(data)
    }
  }

  const fetchExternalSublets = async () => {
    const { data, error } = await supabase
      .from('company')
      .select('id, company_name, company_contact, company_phone')
      .order('company_name')
    
    if (!error && data) {
      setExternalSublets(data)
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
    return `JC-${year}-${randomNum}`
  }

  const logWorkflowHistory = async (jobCardId: string, toStatus: string, notes?: string) => {
    await supabase
      .from('job_card_workflow_history')
      .insert({
        job_card_id: jobCardId,
        from_status: 'draft',
        to_status: toStatus,
        notes: notes
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.registration_no || !formData.job_type || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!formData.selected_technician_id && !formData.selected_external_sublet) {
      toast.error("Please assign either a technician or external sublet")
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

      const jobNumber = generateJobId()
      
      const { data: newJob, error: jobError } = await supabase
        .from('job_cards')
        .insert({
          job_number: jobNumber,
          vehicle_registration: formData.registration_no.toUpperCase(),
          vehicle_id: vehicleData.id,
          job_type: formData.job_type,
          job_description: formData.description,
          job_location: formData.location,
          work_notes: formData.work_notes,
          notes: formData.notes,
          estimated_cost: formData.estimated_cost || 0,
          priority: formData.priority,
          due_date: formData.due_date || null,
          estimated_duration_hours: formData.estimated_duration_hours || null,
          assigned_technician_id: formData.selected_technician_id || null,
          workflow_status: 'pending_approval',
          driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
          status: 'pending'
        })
        .select()
        .single()

      if (jobError) {
        console.error('Job creation failed:', jobError)
        toast.error("Failed to create job card")
        return
      }

      // Log workflow history
      await logWorkflowHistory(newJob.id, 'pending_approval', 'Job card created and submitted for approval')

      // If external sublet is selected, create assignment
      if (formData.selected_external_sublet) {
        await supabase
          .from('job_assignments')
          .insert({
            description: formData.description,
            subcontractor_id: parseInt(formData.selected_external_sublet),
            vehicle_id: vehicleData.id,
            driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
            status: 'assigned_external'
          })
      }

      toast.success(`Job card ${jobNumber} created successfully and sent for manager approval`)
      
      onSuccess?.()
      
      // Reset form
      setFormData({
        registration_no: "",
        job_type: "",
        description: "",
        type_of_work: "",
        location: "",
        notes: "",
        estimated_cost: 0,
        priority: "medium",
        due_date: "",
        estimated_duration_hours: 0,
        work_notes: "",
        selected_technician_id: "",
        selected_external_sublet: "",
        driver_id: ""
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
              <Label htmlFor="driver_id">Driver (Optional)</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No driver assigned</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.first_name} {driver.surname} - {driver.cell_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Assignment Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="technician">Assign Technician</Label>
              <Select 
                value={formData.selected_technician_id} 
                onValueChange={(value) => {
                  setFormData({ ...formData, selected_technician_id: value, selected_external_sublet: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No technician</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      <div className="flex flex-col">
                        <span>{tech.name}</span>
                        <span className="text-sm text-gray-500">
                          {tech.phone} • {tech.specialties?.join(', ')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="external_sublet">OR Assign External Sublet</Label>
              <Select 
                value={formData.selected_external_sublet} 
                onValueChange={(value) => {
                  setFormData({ ...formData, selected_external_sublet: value, selected_technician_id: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select external sublet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No external sublet</SelectItem>
                  {externalSublets.map((sublet) => (
                    <SelectItem key={sublet.id} value={sublet.id.toString()}>
                      <div className="flex flex-col">
                        <span>{sublet.company_name}</span>
                        <span className="text-sm text-gray-500">
                          {sublet.company_contact} • {sublet.company_phone}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Cost */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">Job Location</Label>
              <Input
                id="location"
                placeholder="Enter job location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.registration_no || !formData.job_type || !formData.description}
            >
              {isSubmitting ? "Creating..." : "Create Job Card"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}