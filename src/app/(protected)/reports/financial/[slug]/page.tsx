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
  DollarSign,
  TrendingUp,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { 
  getQuotationReports, 
  getQuoteProductReports,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function FinancialReportDetailPage() {
  const params = useParams()
  const [quotations, setQuotations] = useState<any[]>([])
  const [quoteProducts, setQuoteProducts] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("quotations")
  const itemsPerPage = 15

  useEffect(() => {
    async function loadData() {
      try {
        const [quotationData, quoteProductData] = await Promise.all([
          getQuotationReports(),
          getQuoteProductReports()
        ])
        
        setQuotations(quotationData)
        setQuoteProducts(quoteProductData)
        setFilteredData(quotationData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === "quotations" ? quotations : quoteProducts
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.orderno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vehiclereg?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.drivername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, quotations, quoteProducts, activeTab])

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    exportToCSV(filteredData, `financial_${activeTab}_report`)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredData, `Financial ${activeTab.toUpperCase()} Report`)
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const stats = {
    totalQuotations: quotations.length,
    approvedQuotations: quotations.filter(q => q.status === 'approved').length,
    pendingQuotations: quotations.filter(q => q.status === 'pending').length,
    totalValue: quotations.reduce((sum, q) => sum + (parseFloat(q.totalcost || '0')), 0),
    totalQuoteProducts: quoteProducts.length,
    averageQuoteValue: quotations.length > 0 ? 
      (quotations.reduce((sum, q) => sum + (parseFloat(q.totalcost || '0')), 0) / quotations.length) : 0,
    paidQuotations: quotations.filter(q => q.paid).length,
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Financial Analysis</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
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
          <span className="font-semibold text-gray-900">Financial Analysis</span>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <FileText className="h-3 w-3 mr-1" />Quotes
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalQuotations}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />Approved
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.approvedQuotations}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Clock className="h-3 w-3 mr-1" />Pending
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.pendingQuotations}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />Value
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-lg font-bold">R{(stats.totalValue/1000).toFixed(0)}k</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <BarChart3 className="h-3 w-3 mr-1" />Products
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalQuoteProducts}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />Avg
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-lg font-bold">R{(stats.averageQuoteValue/1000).toFixed(0)}k</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />Paid
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.paidQuotations}</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("quotations")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "quotations" 
                    ? "bg-white text-emerald-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4 inline mr-2" />Quotations
              </button>
              <button
                onClick={() => setActiveTab("quote-products")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "quote-products" 
                    ? "bg-white text-emerald-600 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />Quote Products
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Showing {startItem}-{endItem} of {filteredData.length} records</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded">
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
                  {activeTab === "quotations" && (
                    <>
                      <th className="text-left p-3 font-semibold">Order No</th>
                      <th className="text-left p-3 font-semibold">Vehicle Reg</th>
                      <th className="text-left p-3 font-semibold">Driver</th>
                      <th className="text-left p-3 font-semibold">Job Type</th>
                      <th className="text-left p-3 font-semibold">Priority</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Total Cost</th>
                      <th className="text-left p-3 font-semibold">Paid</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                  {activeTab === "quote-products" && (
                    <>
                      <th className="text-left p-3 font-semibold">Product Name</th>
                      <th className="text-left p-3 font-semibold">Quantity</th>
                      <th className="text-left p-3 font-semibold">Cash Price</th>
                      <th className="text-left p-3 font-semibold">Rental Price</th>
                      <th className="text-left p-3 font-semibold">Installation</th>
                      <th className="text-left p-3 font-semibold">Subtotal</th>
                      <th className="text-left p-3 font-semibold">Technician</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-emerald-50">
                    {activeTab === "quotations" && (
                      <>
                        <td className="p-3 font-medium text-emerald-600">{item.orderno || '-'}</td>
                        <td className="p-3">{item.vehiclereg || '-'}</td>
                        <td className="p-3">{item.drivername || '-'}</td>
                        <td className="p-3"><Badge variant="outline">{item.job_type || '-'}</Badge></td>
                        <td className="p-3">
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority || 'Normal'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {item.totalcost ? `R${parseFloat(item.totalcost).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3">
                          <Badge className={item.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {item.paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                      </>
                    )}
                    {activeTab === "quote-products" && (
                      <>
                        <td className="p-3 font-medium text-emerald-600">{item.product_name || '-'}</td>
                        <td className="p-3 font-medium">{item.quantity || 0}</td>
                        <td className="p-3 font-medium text-green-600">
                          {item.cash_price ? `R${parseFloat(item.cash_price).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 font-medium text-blue-600">
                          {item.rental_price ? `R${parseFloat(item.rental_price).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 font-medium text-purple-600">
                          {item.installation_price ? `R${parseFloat(item.installation_price).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3 font-medium text-emerald-600">
                          {item.subtotal ? `R${parseFloat(item.subtotal).toFixed(2)}` : '-'}
                        </td>
                        <td className="p-3">{item.technician || '-'}</td>
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
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}