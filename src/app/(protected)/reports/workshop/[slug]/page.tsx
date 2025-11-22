"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Download,
  PrinterIcon as Print,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  MapPin,
  User,
  Wrench,
  TrendingUp,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  getWorkshopReports, 
  getWorkshopJobReports, 
  getWorkshopAssignments,
  getWorkshopBreakdowns,
  getJobAllocations,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function WorkshopReportDetailPage() {
  const params = useParams()
  const [workshops, setWorkshops] = useState<any[]>([])
  const [workshopJobs, setWorkshopJobs] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [breakdowns, setBreakdowns] = useState<any[]>([])
  const [allocations, setAllocations] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("workshops")
  const itemsPerPage = 15

  useEffect(() => {
    async function loadData() {
      try {
        const [workshopData, jobData, assignmentData, breakdownData, allocationData] = await Promise.all([
          getWorkshopReports(),
          getWorkshopJobReports(),
          getWorkshopAssignments(),
          getWorkshopBreakdowns(),
          getJobAllocations()
        ])
        
        setWorkshops(workshopData)
        setWorkshopJobs(jobData)
        setAssignments(assignmentData)
        setBreakdowns(breakdownData)
        setAllocations(allocationData)
        setFilteredData(workshopData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === "workshops" ? workshops : 
                  activeTab === "jobs" ? workshopJobs : 
                  activeTab === "assignments" ? assignments :
                  activeTab === "breakdowns" ? breakdowns : allocations
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.work_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.trading_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, workshops, workshopJobs, assignments, breakdowns, allocations, activeTab])

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    exportToCSV(filteredData, `workshop_${activeTab}_report`)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredData, `Workshop ${activeTab.toUpperCase()} Report`)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'active': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalWorkshops: workshops.length,
    activeWorkshops: workshops.filter(w => w.validated === 'approved').length,
    totalJobs: workshopJobs.length,
    completedJobs: workshopJobs.filter(j => j.status === 'completed').length,
    pendingJobs: workshopJobs.filter(j => j.status === 'pending').length,
    totalAssignments: assignments.length,
    totalBreakdowns: breakdowns.length,
    totalRevenue: workshopJobs.reduce((sum, job) => sum + (parseFloat(job.actual_cost || '0')), 0),
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Workshop Operations</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <Link href="/reports" className="text-blue-600 hover:underline font-medium">Reports</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-gray-900">Workshop Operations</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Print className="h-4 w-4 mr-2" />Print PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Settings className="h-3 w-3 mr-1" />Workshops
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalWorkshops}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />Active
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.activeWorkshops}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Wrench className="h-3 w-3 mr-1" />Jobs
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalJobs}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />Done
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.completedJobs}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Clock className="h-3 w-3 mr-1" />Pending
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.pendingJobs}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <User className="h-3 w-3 mr-1" />Assigns
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalAssignments}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />Breaks
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalBreakdowns}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />Revenue
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-lg font-bold">R{(stats.totalRevenue/1000).toFixed(0)}k</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {[
                { id: "workshops", label: "Workshops", icon: Settings },
                { id: "jobs", label: "Workshop Jobs", icon: Wrench },
                { id: "assignments", label: "Assignments", icon: User },
                { id: "breakdowns", label: "Breakdowns", icon: AlertTriangle },
                { id: "allocations", label: "Allocations", icon: BarChart3 },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id 
                        ? "bg-white text-orange-600 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-1" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Showing {startItem}-{endItem} of {filteredData.length} records</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded">
                  {currentPage} / {Math.ceil(filteredData.length / itemsPerPage)}
                </span>
                <Button variant="outline" size="sm" disabled={endItem >= filteredData.length} onClick={() => setCurrentPage(currentPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === "workshops" && (
                    <>
                      <th className="text-left p-3 font-semibold">Workshop Name</th>
                      <th className="text-left p-3 font-semibold">Trading Name</th>
                      <th className="text-left p-3 font-semibold">Location</th>
                      <th className="text-left p-3 font-semibold">Labour Rate</th>
                      <th className="text-left p-3 font-semibold">Fleet Rate</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                    </>
                  )}
                  {activeTab === "jobs" && (
                    <>
                      <th className="text-left p-3 font-semibold">Job ID</th>
                      <th className="text-left p-3 font-semibold">Registration</th>
                      <th className="text-left p-3 font-semibold">Client</th>
                      <th className="text-left p-3 font-semibold">Job Type</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Cost</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                  {activeTab === "assignments" && (
                    <>
                      <th className="text-left p-3 font-semibold">Assignment ID</th>
                      <th className="text-left p-3 font-semibold">Job ID</th>
                      <th className="text-left p-3 font-semibold">Tech ID</th>
                      <th className="text-left p-3 font-semibold">Vehicle ID</th>
                      <th className="text-left p-3 font-semibold">Driver ID</th>
                      <th className="text-left p-3 font-semibold">Assigned Date</th>
                    </>
                  )}
                  {activeTab === "breakdowns" && (
                    <>
                      <th className="text-left p-3 font-semibold">Breakdown ID</th>
                      <th className="text-left p-3 font-semibold">Vehicle ID</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Reported By</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                  {activeTab === "allocations" && (
                    <>
                      <th className="text-left p-3 font-semibold">Allocation ID</th>
                      <th className="text-left p-3 font-semibold">Job Card ID</th>
                      <th className="text-left p-3 font-semibold">Sublet ID</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Allocated By</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-orange-50">
                    {activeTab === "workshops" && (
                      <>
                        <td className="p-3 font-medium text-orange-600">{item.work_name || '-'}</td>
                        <td className="p-3">{item.trading_name || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm">{`${item.city || ''}, ${item.province || ''}`.trim().replace(/^,|,$/, '') || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {item.labour_rate ? `R${parseFloat(item.labour_rate).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {item.fleet_rate ? `R${parseFloat(item.fleet_rate).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.validated)}>
                            {item.validated || 'Pending'}
                          </Badge>
                        </td>
                      </>
                    )}
                    {activeTab === "jobs" && (
                      <>
                        <td className="p-3 font-medium text-orange-600">#{item.id}</td>
                        <td className="p-3">{item.registration_no || '-'}</td>
                        <td className="p-3">{item.client_name || '-'}</td>
                        <td className="p-3"><Badge variant="outline">{item.job_type || '-'}</Badge></td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.status)}>{item.status || 'Unknown'}</Badge>
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {item.actual_cost ? `R${parseFloat(item.actual_cost).toLocaleString()}` : 
                           item.estimated_cost ? `R${parseFloat(item.estimated_cost).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === "assignments" && (
                      <>
                        <td className="p-3 font-medium text-orange-600">#{item.id}</td>
                        <td className="p-3">{item.job_id || '-'}</td>
                        <td className="p-3">{item.tech_id || '-'}</td>
                        <td className="p-3">{item.vehicle_id || '-'}</td>
                        <td className="p-3">{item.driver_id || '-'}</td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === "breakdowns" && (
                      <>
                        <td className="p-3 font-medium text-orange-600">#{item.id}</td>
                        <td className="p-3">{item.vehicle_id || '-'}</td>
                        <td className="p-3 max-w-xs truncate">{item.description || '-'}</td>
                        <td className="p-3">{item.reported_by || '-'}</td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.status)}>{item.status || 'Unknown'}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === "allocations" && (
                      <>
                        <td className="p-3 font-medium text-orange-600">#{item.id}</td>
                        <td className="p-3">{item.job_card_id || '-'}</td>
                        <td className="p-3">{item.sublet_id || '-'}</td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.status)}>{item.status || 'Unknown'}</Badge>
                        </td>
                        <td className="p-3">{item.allocated_by || '-'}</td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.allocated_at ? new Date(item.allocated_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {filteredData.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}