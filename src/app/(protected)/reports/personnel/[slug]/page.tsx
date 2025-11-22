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
  Phone,
  Mail,
  User,
  Settings,
  Star,
  MapPin,
  Car,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  getTechnicianReports, 
  getDriverReports,
  getTechnicianAssignments,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function PersonnelReportDetailPage() {
  const params = useParams()
  const [technicians, setTechnicians] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [techAssignments, setTechAssignments] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("technicians")
  const itemsPerPage = 15

  useEffect(() => {
    async function loadData() {
      try {
        const [technicianData, driverData, assignmentData] = await Promise.all([
          getTechnicianReports(),
          getDriverReports(),
          getTechnicianAssignments()
        ])
        
        setTechnicians(technicianData)
        setDrivers(driverData)
        setTechAssignments(assignmentData)
        setFilteredData(technicianData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === "technicians" ? technicians : 
                  activeTab === "drivers" ? drivers : techAssignments
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cell_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      if (activeTab === "technicians") {
        filtered = filtered.filter(item => 
          statusFilter === "active" ? item.isActive : !item.isActive
        )
      }
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, technicians, drivers, techAssignments, activeTab])

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    exportToCSV(filteredData, `personnel_${activeTab}_report`)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredData, `Personnel ${activeTab.toUpperCase()} Report`)
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability?.toLowerCase()) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'off-duty': return 'bg-gray-100 text-gray-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const stats = {
    totalTechnicians: technicians.length,
    activeTechnicians: technicians.filter(t => t.isActive).length,
    availableTechnicians: technicians.filter(t => t.availability === 'available').length,
    totalDrivers: drivers.length,
    totalAssignments: techAssignments.length,
    averageRating: technicians.length > 0 ? 
      (technicians.reduce((sum, t) => sum + (t.rating || 0), 0) / technicians.length).toFixed(1) : 0,
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Personnel Management</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
          <span className="font-semibold text-gray-900">Personnel Management</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Settings className="h-3 w-3 mr-1" />Technicians
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalTechnicians}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <User className="h-3 w-3 mr-1" />Active
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.activeTechnicians}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <User className="h-3 w-3 mr-1" />Available
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.availableTechnicians}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Car className="h-3 w-3 mr-1" />Drivers
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalDrivers}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Star className="h-3 w-3 mr-1" />Rating
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.averageRating}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Settings className="h-3 w-3 mr-1" />Assigns
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalAssignments}</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { id: "technicians", label: "Technicians", icon: Settings },
                { id: "drivers", label: "Drivers", icon: Car },
                { id: "assignments", label: "Tech Assignments", icon: User },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id 
                        ? "bg-white text-purple-600 shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-4 w-4 inline mr-2" />
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Showing {startItem}-{endItem} of {filteredData.length} records</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded">
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
                  {activeTab === "technicians" && (
                    <>
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Contact</th>
                      <th className="text-left p-3 font-semibold">Location</th>
                      <th className="text-left p-3 font-semibold">Availability</th>
                      <th className="text-left p-3 font-semibold">Rating</th>
                      <th className="text-left p-3 font-semibold">Equipment</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                    </>
                  )}
                  {activeTab === "drivers" && (
                    <>
                      <th className="text-left p-3 font-semibold">Name</th>
                      <th className="text-left p-3 font-semibold">Contact</th>
                      <th className="text-left p-3 font-semibold">ID/Passport</th>
                      <th className="text-left p-3 font-semibold">License</th>
                      <th className="text-left p-3 font-semibold">License Code</th>
                      <th className="text-left p-3 font-semibold">Expiry</th>
                      <th className="text-left p-3 font-semibold">PDP</th>
                    </>
                  )}
                  {activeTab === "assignments" && (
                    <>
                      <th className="text-left p-3 font-semibold">Assignment ID</th>
                      <th className="text-left p-3 font-semibold">Technician</th>
                      <th className="text-left p-3 font-semibold">Vehicle</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-purple-50">
                    {activeTab === "technicians" && (
                      <>
                        <td className="p-3 font-medium text-purple-600">{item.name || '-'}</td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {item.phone || '-'}
                            </div>
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {item.email || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm">{item.location || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getAvailabilityColor(item.availability)}>
                            {item.availability || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-400" />
                            <span className="font-medium">{item.rating || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{item.equipment_level || '-'}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.isActive)}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </>
                    )}
                    {activeTab === "drivers" && (
                      <>
                        <td className="p-3 font-medium text-purple-600">
                          {`${item.first_name || ''} ${item.surname || ''}`.trim() || '-'}
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {item.cell_number || '-'}
                            </div>
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              {item.email_address || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm font-mono">{item.id_or_passport_number || '-'}</td>
                        <td className="p-3 text-sm font-mono">{item.license_number || '-'}</td>
                        <td className="p-3">
                          <Badge variant="outline">{item.license_code || '-'}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.license_expiry_date ? new Date(item.license_expiry_date).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.professional_driving_permit)}>
                            {item.professional_driving_permit ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                      </>
                    )}
                    {activeTab === "assignments" && (
                      <>
                        <td className="p-3 font-medium text-purple-600">#{item.id}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{item.technicians_klaver?.name || '-'}</div>
                            <div className="text-sm text-gray-500">{item.technicians_klaver?.phone || '-'}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{item.vehiclesc_workshop?.registration_number || '-'}</div>
                            <div className="text-sm text-gray-500">
                              {`${item.vehiclesc_workshop?.make || ''} ${item.vehiclesc_workshop?.model || ''}`.trim() || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
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
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}