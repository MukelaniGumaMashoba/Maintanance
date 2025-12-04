"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Download,
  FileText,
  DollarSign,
  Clock,
  Printer,
  LucideCircleArrowOutDownRight
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import JobCardPrinter from "@/components/ui-personal/job-card-printer"

interface CompletedJob {
  id: number
  jobId_workshop?: string
  job_number?: string
  job_description?: string
  description?: string
  vehicle_registration?: string
  registration_no?: string
  vehicle_make?: string
  vehicle_model?: string
  technician_name?: string
  driver_name?: string
  completion_date: string
  created_at: string
  estimated_cost?: number
  actual_cost?: number
  labor_cost?: number
  total_labor_cost?: number
  total_parts_cost?: number
  total_sublet_cost?: number
  grand_total?: number
  priority?: string
  job_type?: string
  estimated_duration_hours?: number
  actual_duration_hours?: number

  technician_id?: number
}

interface Technician {
  id: number
  name: string
}

interface ReportFilters {
  start_date: string
  end_date: string
  job_type: string
  technician: string
  priority: string
}

export default function CompletedJobsReport() {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<CompletedJob[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPrintOpen, setIsPrintOpen] = useState(false)
  const [selectedJobForPrint, setSelectedJobForPrint] = useState<CompletedJob | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    job_type: "",
    technician: "",
    priority: ""
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTechnicians()
    fetchCompletedJobs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [completedJobs, filters])


  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from('technicians_klaver')
      .select('id, name')
      .order('name')

    if (!error && data) {
      setTechnicians(data as unknown as Technician[])
    }
  }

  const fetchCompletedJobs = async () => {
    setIsLoading(true)

    try {
      const { data: allJobs, error: fetchError } = await supabase
        .from('workshop_job')
        .select(`*`)
        .not('completion_date', 'is', null)
        .order('completion_date', { ascending: false })

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('workshop_assignments')
        .select('*')
        .in('job_id', (allJobs || []).map((job: any) => job.id))
      const assignments = (assignmentsData || []) as { job_id: number, tech_id: number }[]

      const { data: techniciansData, error: techniciansError } = await supabase
        .from('technicians_klaver')
        .select('id, name')
        .order('name')
        .in(
          'id',
          assignments.map(assignment => assignment.tech_id)
        )

      if (!techniciansError && techniciansData) {
        setTechnicians(techniciansData as unknown as Technician[])
      }

      // Filter for completed jobs (case-insensitive)
      const data = (allJobs || []).filter((job: any) =>
        (job.status || '').toLowerCase() === 'completed'
      )
      const error = fetchError

      if (error) throw error

      // Fetch driver names if driver_id exists
      const jobsWithDriverNames = await Promise.all(
        (data || []).map(async (job: any) => {
          let driverName = null
          if (job.driver_id) {
            try {
              const { data: driver } = await supabase
                .from('drivers')
                .select('first_name, surname')
                .eq('id', job.driver_id)
                .single()
              if (driver) {
                driverName = `${driver.first_name} ${driver.surname}`
              }
            } catch (err) {
              console.error('Error fetching driver:', err)
            }
          }
          return {
            ...job,
            job_number: job.jobId_workshop,
            job_description: job.description,
            vehicle_registration: job.registration_no,
            labor_cost: job.total_labor_cost || 0,
            driver_name: driverName
          }
        })
      )

      setCompletedJobs(jobsWithDriverNames as unknown as CompletedJob[])

    } catch (error) {
      console.error('Error fetching completed jobs:', error)
      toast.error("Failed to fetch completed jobs")
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...completedJobs]

    // Date range filter
    if (filters.start_date) {
      filtered = filtered.filter(job =>
        new Date(job.completion_date) >= new Date(filters.start_date)
      )
    }

    if (filters.end_date) {
      filtered = filtered.filter(job =>
        new Date(job.completion_date) <= new Date(filters.end_date + 'T23:59:59')
      )
    }

    // Job type filter
    if (filters.job_type) {
      filtered = filtered.filter(job => job.job_type === filters.job_type)
    }

    // Technician filter
    if (filters.technician) {
      filtered = filtered.filter(job => job.technician_name?.includes(filters.technician))
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(job => job.priority === filters.priority)
    }

    setFilteredJobs(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      'Job Number',
      'Vehicle Registration',
      'Vehicle Make/Model',
      'Job Type',
      'Description',
      'Technician',
      'Driver',
      'Priority',
      'Created Date',
      'Completion Date',
      'Duration (Days)',
      'Estimated Cost',
      'Actual Cost',
      'Labor Cost',
      'Parts Cost',
      'Sublet Cost',
      'Grand Total',
      'Estimated Hours',
      'Actual Hours'
    ]

    const csvData = filteredJobs.map(job => [
      job.job_number,
      job.vehicle_registration,
      `${job.vehicle_make || ''} ${job.vehicle_model || ''}`.trim(),
      job.job_type,
      job.job_description,
      job.technician_name || '',
      job.driver_name || '',
      job.priority,
      new Date(job.created_at).toLocaleDateString(),
      new Date(job.completion_date).toLocaleDateString(),
      Math.ceil((new Date(job.completion_date).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      job.estimated_cost || 0,
      job.actual_cost || 0,
      job.labor_cost || 0,
      job.total_parts_cost || 0,
      job.total_sublet_cost || 0,
      job.grand_total || 0,
      job.estimated_duration_hours || 0,
      job.actual_duration_hours || 0
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `completed_jobs_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Report exported successfully")
  }

  const calculateSummary = () => {
    const totalJobs = filteredJobs.length
    const totalRevenue = filteredJobs.reduce((sum, job) => sum + (job.grand_total || 0), 0)
    const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0
    const avgDuration = totalJobs > 0
      ? filteredJobs.reduce((sum, job) => {
        const duration = Math.ceil((new Date(job.completion_date).getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return sum + duration
      }, 0) / totalJobs
      : 0

    return { totalJobs, totalRevenue, avgJobValue, avgDuration }
  }

  const summary = calculateSummary()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{summary.totalJobs}</p>
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <LucideCircleArrowOutDownRight className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summary.avgJobValue)}</p>
                <p className="text-sm text-gray-600">Avg Job Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{summary.avgDuration.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Duration (Days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Completed Jobs Report</CardTitle>
            <Button onClick={exportToCSV} disabled={filteredJobs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="job_type">Job Type</Label>
              <select
                id="job_type"
                className="w-full p-2 border rounded-md"
                value={filters.job_type}
                onChange={(e) => setFilters({ ...filters, job_type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="breakdown">Breakdown</option>
                <option value="accident">Accident Repair</option>
                <option value="service">Service</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="w-full p-2 border rounded-md"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <Label htmlFor="technician">Technician</Label>
              <Input
                id="technician"
                placeholder="Search technician..."
                value={filters.technician}
                onChange={(e) => setFilters({ ...filters, technician: e.target.value })}
              />
            </div>
          </div>

          {/* Jobs Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead colSpan={9}>Job Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading completed jobs...
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No completed jobs found for the selected criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const duration = Math.ceil(
                      (new Date(job.completion_date).getTime() - new Date(job.created_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )
                    const totalCost = job.grand_total || (job.total_labor_cost || 0) + (job.total_parts_cost || 0) + (job.total_sublet_cost || 0)
                    const summary = `${job.job_number || job.jobId_workshop || 'N/A'} - ${job.vehicle_registration || job.registration_no || 'N/A'} 
                    - ${job.job_type || 'N/A'} - ${job.job_description || job.description || 'No description'} - Tech: ${technicians.find(tech => tech.id === job.technician_id)?.name || 'Unassigned'}
                     - Cost: R${totalCost.toFixed(2)} - Completed: ${formatDate(job.completion_date)}`

                    return (
                      <TableRow key={job.id}>
                        <TableCell colSpan={9} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{summary}</span>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(job.priority || 'medium')}>
                                {job.priority || 'medium'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedJobForPrint(job);
                                  setIsPrintOpen(true);
                                }}
                              >
                                <Printer className="h-4 w-4 mr-1" />
                                Print
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Print Dialog */}
      {selectedJobForPrint && (
        <JobCardPrinter
          isOpenCard={isPrintOpen}
          onCloseCard={() => {
            setIsPrintOpen(false);
            setSelectedJobForPrint(null);
          }}
          jobId={selectedJobForPrint.id}
          jobCard={selectedJobForPrint}
        />
      )}
    </div>
  )
}