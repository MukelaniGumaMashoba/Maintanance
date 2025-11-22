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
  Phone,
  Mail,
  Building,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  getSupplierReports,
  getSubletReports,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function ProcurementReportDetailPage() {
  const params = useParams()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [sublets, setSublets] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("suppliers")
  const itemsPerPage = 15

  useEffect(() => {
    async function loadData() {
      try {
        const [supplierData, subletData] = await Promise.all([
          getSupplierReports(),
          getSubletReports()
        ])
        setSuppliers(supplierData)
        setSublets(subletData)
        setFilteredData(supplierData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === "suppliers" ? suppliers : sublets
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, suppliers, sublets, activeTab])

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    exportToCSV(filteredData, `procurement_${activeTab}_report`)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredData, `Procurement ${activeTab.toUpperCase()} Report`)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalSuppliers: suppliers.length,
    suppliersWithEmail: suppliers.filter(s => s.email).length,
    suppliersWithPhone: suppliers.filter(s => s.phone).length,
    totalSublets: sublets.length,
    completedSublets: sublets.filter(s => s.status === 'completed').length,
    totalSubletCost: sublets.reduce((sum, s) => sum + (parseFloat(s.cost || '0')), 0),
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Procurement & Suppliers</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          <span className="font-semibold text-gray-900">Procurement & Suppliers</span>
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
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Building className="h-3 w-3 mr-1" />Suppliers
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalSuppliers}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Mail className="h-3 w-3 mr-1" />Email
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.suppliersWithEmail}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Phone className="h-3 w-3 mr-1" />Phone
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.suppliersWithPhone}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Package className="h-3 w-3 mr-1" />Sublets
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalSublets}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />Done
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.completedSublets}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />Cost
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-lg font-bold">R{(stats.totalSubletCost/1000).toFixed(0)}k</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("suppliers")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "suppliers" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Building className="h-4 w-4 inline mr-2" />Suppliers
              </button>
              <button
                onClick={() => setActiveTab("sublets")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "sublets" 
                    ? "bg-white text-indigo-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Package className="h-4 w-4 inline mr-2" />Sublet Operations
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
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Showing {startItem}-{endItem} of {filteredData.length} records</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded">
                  {currentPage} / {Math.ceil(filteredData.length / itemsPerPage)}
                </span>
                <Button variant="outline" size="sm" disabled={endItem >= filteredData.length} onClick={() => setCurrentPage(currentPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Display */}
        {activeTab === "suppliers" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedData.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-indigo-600 mb-1">
                        {supplier.name || 'Unnamed Supplier'}
                      </CardTitle>
                      {supplier.contact_person && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-3 w-3 mr-1" />
                          {supplier.contact_person}
                        </div>
                      )}
                    </div>
                    <Building className="h-6 w-6 text-indigo-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.created_at && (
                    <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                      <Calendar className="h-3 w-3 mr-1" />
                      Added {new Date(supplier.created_at).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Sublet ID</th>
                    <th className="text-left p-3 font-semibold">Description</th>
                    <th className="text-left p-3 font-semibold">Supplier</th>
                    <th className="text-left p-3 font-semibold">Cost</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Job Card</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((sublet) => (
                    <tr key={sublet.id} className="border-t hover:bg-indigo-50">
                      <td className="p-3 font-medium text-indigo-600">#{sublet.id}</td>
                      <td className="p-3 max-w-xs truncate">{sublet.description || '-'}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{sublet.suppliers?.name || '-'}</div>
                          <div className="text-sm text-gray-500">{sublet.suppliers?.contact_person || '-'}</div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-green-600">
                        {sublet.cost ? `R${parseFloat(sublet.cost).toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(sublet.status)}>
                          {sublet.status || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-3">{sublet.job_card || '-'}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {sublet.created_at ? new Date(sublet.created_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {filteredData.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}