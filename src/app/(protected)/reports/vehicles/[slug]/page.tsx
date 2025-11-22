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
  Car,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  getVehicleReports, 
  getMaintenanceHistoryReports,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function VehicleReportDetailPage() {
  const params = useParams()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("fleet")
  const itemsPerPage = 15

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicleData, maintenanceData] = await Promise.all([
          getVehicleReports(),
          getMaintenanceHistoryReports()
        ])
        setVehicles(vehicleData)
        setMaintenance(maintenanceData)
        setFilteredData(vehicleData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === "fleet" ? vehicles : maintenance
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vin_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.site?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, vehicles, maintenance, activeTab])

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    exportToCSV(filteredData, `vehicles_${activeTab}_report`)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredData, `Vehicle ${activeTab.toUpperCase()} Report`)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const safeParseFloat = (value: any): number => {
    const parsed = parseFloat(value || '0')
    return isNaN(parsed) ? 0 : parsed
  }

  const safeParseInt = (value: any): number => {
    const parsed = parseInt(value || '0')
    return isNaN(parsed) ? 0 : parsed
  }

  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    maintenanceRecords: maintenance.length,
    totalValue: vehicles.reduce((sum, v) => sum + safeParseFloat(v.purchase_price), 0),
    avgAge: vehicles.length > 0 ? 
      Math.round(vehicles.reduce((sum, v) => sum + (new Date().getFullYear() - safeParseInt(v.manufactured_year)), 0) / vehicles.length) : 0,
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Vehicle Fleet Management</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <span className="font-semibold text-gray-900">Vehicle Fleet Management</span>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Car className="h-4 w-4 mr-2" />Total Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalVehicles}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />Active
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.activeVehicles}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Wrench className="h-4 w-4 mr-2" />Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.maintenanceRecords}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Settings className="h-4 w-4 mr-2" />Fleet Value
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">R{(stats.totalValue/1000000).toFixed(1)}M</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2" />Avg Age
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.avgAge}y</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("fleet")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "fleet" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />Fleet Report
              </button>
              <button
                onClick={() => setActiveTab("maintenance")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "maintenance" 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Wrench className="h-4 w-4 inline mr-2" />Maintenance History
              </button>
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
                  placeholder="Search by registration, make, model, VIN, or site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Showing {startItem}-{endItem} of {filteredData.length} records</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
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
                  {activeTab === "fleet" ? (
                    <>
                      <th className="text-left p-3 font-semibold">Registration</th>
                      <th className="text-left p-3 font-semibold">Vehicle</th>
                      <th className="text-left p-3 font-semibold">Year</th>
                      <th className="text-left p-3 font-semibold">VIN</th>
                      <th className="text-left p-3 font-semibold">Site</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Purchase Price</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left p-3 font-semibold">Vehicle</th>
                      <th className="text-left p-3 font-semibold">Maintenance Type</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Cost</th>
                      <th className="text-left p-3 font-semibold">Completed Date</th>
                      <th className="text-left p-3 font-semibold">Job Card ID</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-blue-50">
                    {activeTab === "fleet" ? (
                      <>
                        <td className="p-3 font-medium text-blue-600">{item.registration_number || '-'}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{`${item.make || ''} ${item.model || ''}`.trim() || '-'}</div>
                            <div className="text-sm text-gray-500">{item.sub_model || ''}</div>
                          </div>
                        </td>
                        <td className="p-3">{item.manufactured_year || '-'}</td>
                        <td className="p-3 text-sm font-mono">{item.vin_number || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-sm">{item.site || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {item.purchase_price ? `R${parseFloat(item.purchase_price).toLocaleString()}` : '-'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{item.vehiclesc_workshop?.registration_number || '-'}</div>
                            <div className="text-sm text-gray-500">
                              {`${item.vehiclesc_workshop?.make || ''} ${item.vehiclesc_workshop?.model || ''}`.trim() || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{item.maintenance_type || '-'}</Badge>
                        </td>
                        <td className="p-3 max-w-xs truncate">{item.description || '-'}</td>
                        <td className="p-3 font-medium text-green-600">
                          {item.cost ? `R${parseFloat(item.cost).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.completed_date ? new Date(item.completed_date).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="p-3 text-sm">{item.job_card_id || '-'}</td>
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
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-lg font-medium mb-2">No data found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}