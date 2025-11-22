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
  Package,
  DollarSign,
  TrendingDown,
  AlertCircle,
  Boxes,
  ShoppingCart,
  Eye,
  Wrench,
  Calendar,
  User,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Link from "next/link"
import { 
  getPartsReports, 
  getStockReports, 
  getPartsUsageWithJobCards,
  getWorkshopJobParts, 
  getStockOrderReports,
  getPartsOrderReports,
  getPartAssignmentHistory,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function InventoryReportDetailPage() {
  const params = useParams()
  const [parts, setParts] = useState<any[]>([])
  const [stock, setStock] = useState<any[]>([])
  const [partsUsage, setPartsUsage] = useState<any[]>([])
  const [jobParts, setJobParts] = useState<any[]>([])
  const [stockOrders, setStockOrders] = useState<any[]>([])
  const [partsOrders, setPartsOrders] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("parts")
  const [selectedPart, setSelectedPart] = useState<any>(null)
  const [partHistory, setPartHistory] = useState<any>({ logs: [], jobParts: [] })
  const itemsPerPage = 15

  useEffect(() => {
    async function loadData() {
      try {
        const [
          partsData, 
          stockData, 
          partsUsageData,
          jobPartsData, 
          stockOrdersData,
          partsOrdersData
        ] = await Promise.all([
          getPartsReports(),
          getStockReports(),
          getPartsUsageWithJobCards(),
          getWorkshopJobParts(),
          getStockOrderReports(),
          getPartsOrderReports()
        ])
        
        setParts(partsData)
        setStock(stockData)
        setPartsUsage(partsUsageData)
        setJobParts(jobPartsData)
        setStockOrders(stockOrdersData)
        setPartsOrders(partsOrdersData)
        setFilteredData(partsData)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = activeTab === "parts" ? parts : 
                  activeTab === "stock" ? stock : 
                  activeTab === "usage" ? partsUsage :
                  activeTab === "job-parts" ? jobParts :
                  activeTab === "parts-orders" ? partsOrders : stockOrders
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, parts, stock, partsUsage, jobParts, partsOrders, stockOrders, activeTab])

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, filteredData.length)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExportCSV = () => {
    exportToCSV(filteredData, `inventory_${activeTab}_report`)
  }

  const handleExportPDF = () => {
    exportToPDF(filteredData, `Inventory ${activeTab.toUpperCase()} Report`)
  }

  const handleViewPartHistory = async (part: any) => {
    setSelectedPart(part)
    try {
      const history = await getPartAssignmentHistory(part.id)
      setPartHistory(history)
    } catch (error) {
      console.error('Error loading part history:', error)
    }
  }

  const getStockStatus = (quantity: number) => {
    if (quantity > 10) return { label: 'In Stock', color: 'bg-green-100 text-green-800' }
    if (quantity > 0) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' }
  }

  const stats = {
    totalParts: parts.length,
    totalStock: stock.length,
    totalValue: parts.reduce((sum, part) => sum + (parseFloat(part.price || '0') * parseInt(part.quantity || '0')), 0),
    lowStock: parts.filter(p => {
      const q = parseInt(p.quantity || '0')
      return q > 0 && q <= 10
    }).length,
    outOfStock: parts.filter(p => parseInt(p.quantity || '0') === 0).length,
    totalOrders: partsOrders.length + stockOrders.length,
    totalUsageRecords: partsUsage.length,
    totalJobParts: jobParts.length,
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2 flex-1">
            <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">Inventory & Parts Tracking</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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
          <span className="font-semibold text-gray-900">Inventory & Parts Tracking</span>
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
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Package className="h-3 w-3 mr-1" />Parts
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalParts}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Boxes className="h-3 w-3 mr-1" />Stock
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalStock}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />Value
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-lg font-bold">R{(stats.totalValue/1000).toFixed(0)}k</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />Low
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.lowStock}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />Out
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.outOfStock}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <ShoppingCart className="h-3 w-3 mr-1" />Orders
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalOrders}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />Usage
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalUsageRecords}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center">
                <Wrench className="h-3 w-3 mr-1" />Jobs
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.totalJobParts}</div></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              {[
                { id: "parts", label: "Parts", icon: Package },
                { id: "usage", label: "Usage Tracking", icon: TrendingDown },
                { id: "job-parts", label: "Job Parts", icon: Wrench },
                { id: "stock", label: "Stock", icon: Boxes },
                { id: "parts-orders", label: "Parts Orders", icon: ShoppingCart },
                { id: "stock-orders", label: "Stock Orders", icon: FileText },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id 
                        ? "bg-white text-green-600 shadow-sm" 
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
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <span>Showing {startItem}-{endItem} of {filteredData.length} items</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded">
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
                  {activeTab === "parts" && (
                    <>
                      <th className="text-left p-3 font-semibold">Item Code</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Category</th>
                      <th className="text-left p-3 font-semibold">Quantity</th>
                      <th className="text-left p-3 font-semibold">Price</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Actions</th>
                    </>
                  )}
                  {activeTab === "usage" && (
                    <>
                      <th className="text-left p-3 font-semibold">Part</th>
                      <th className="text-left p-3 font-semibold">Change Type</th>
                      <th className="text-left p-3 font-semibold">Quantity</th>
                      <th className="text-left p-3 font-semibold">Job ID</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                  {activeTab === "job-parts" && (
                    <>
                      <th className="text-left p-3 font-semibold">Job Details</th>
                      <th className="text-left p-3 font-semibold">Vehicle</th>
                      <th className="text-left p-3 font-semibold">Client</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Cost</th>
                      <th className="text-left p-3 font-semibold">Parts Used</th>
                    </>
                  )}
                  {activeTab === "stock" && (
                    <>
                      <th className="text-left p-3 font-semibold">Code</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Quantity</th>
                      <th className="text-left p-3 font-semibold">Cost (ZAR)</th>
                      <th className="text-left p-3 font-semibold">Supplier</th>
                    </>
                  )}
                  {(activeTab === "parts-orders" || activeTab === "stock-orders") && (
                    <>
                      <th className="text-left p-3 font-semibold">Order Number</th>
                      <th className="text-left p-3 font-semibold">Supplier</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Total Amount</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => (
                  <tr key={item.id} className="border-t hover:bg-green-50">
                    {activeTab === "parts" && (
                      <>
                        <td className="p-3 font-medium text-green-600">{item.item_code || '-'}</td>
                        <td className="p-3 max-w-xs truncate">{item.description || '-'}</td>
                        <td className="p-3">
                          <Badge variant="outline">{item.categories?.name || '-'}</Badge>
                        </td>
                        <td className="p-3 font-medium">{item.quantity || 0}</td>
                        <td className="p-3">{item.price ? `R${parseFloat(item.price).toFixed(2)}` : '-'}</td>
                        <td className="p-3">
                          <Badge className={getStockStatus(parseInt(item.quantity || '0')).color}>
                            {getStockStatus(parseInt(item.quantity || '0')).label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleViewPartHistory(item)}>
                                <Eye className="h-4 w-4 mr-1" />View Usage
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Part Usage History: {selectedPart?.item_code}</DialogTitle>
                                <DialogDescription>Complete tracking of part usage across jobs and vehicles</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 max-h-96 overflow-y-auto">
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center">
                                    <Package className="h-4 w-4 mr-2" />Inventory Changes
                                  </h4>
                                  {partHistory.logs.length > 0 ? (
                                    <div className="space-y-2">
                                      {partHistory.logs.map((log: any) => (
                                        <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                          <div>
                                            <Badge className={log.change_type === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                              {log.change_type}
                                            </Badge>
                                            <span className="ml-2 font-medium">{log.quantity_change > 0 ? '+' : ''}{log.quantity_change}</span>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            Job: {log.job_id || 'N/A'} | {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-center py-4">No inventory changes recorded</p>
                                  )}
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2 flex items-center">
                                    <Wrench className="h-4 w-4 mr-2" />Job Card Assignments
                                  </h4>
                                  {partHistory.jobParts.length > 0 ? (
                                    <div className="space-y-2">
                                      {partHistory.jobParts.map((jobPart: any) => (
                                        <div key={jobPart.id} className="p-3 bg-blue-50 rounded">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="font-medium text-blue-600">
                                              Job #{jobPart.workshop_job?.id} - {jobPart.workshop_job?.registration_no}
                                            </div>
                                            <Badge variant="outline">{jobPart.workshop_job?.status}</Badge>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            <div>Client: {jobPart.workshop_job?.client_name}</div>
                                            <div>Type: {jobPart.workshop_job?.job_type}</div>
                                            <div>Technician: {jobPart.workshop_job?.technician_name}</div>
                                            <div>Cost: R{jobPart.workshop_job?.actual_cost || jobPart.workshop_job?.estimated_cost || 'TBD'}</div>
                                            <div>Date: {jobPart.workshop_job?.created_at ? new Date(jobPart.workshop_job.created_at).toLocaleDateString() : 'N/A'}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-center py-4">No job assignments found</p>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </>
                    )}
                    {activeTab === "usage" && (
                      <>
                        <td className="p-3">
                          <div className="font-medium">{item.parts?.item_code || '-'}</div>
                          <div className="text-sm text-gray-500">{item.parts?.description || '-'}</div>
                        </td>
                        <td className="p-3">
                          <Badge className={item.change_type === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {item.change_type || '-'}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">
                          <span className={item.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.quantity_change > 0 ? '+' : ''}{item.quantity_change || 0}
                          </span>
                        </td>
                        <td className="p-3">{item.job_id || '-'}</td>
                        <td className="p-3 text-sm">{item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '-'}</td>
                      </>
                    )}
                    {activeTab === "job-parts" && (
                      <>
                        <td className="p-3">
                          <div className="font-medium text-blue-600">Job #{item.workshop_job?.id}</div>
                          <div className="text-sm text-gray-500">{item.workshop_job?.job_type}</div>
                        </td>
                        <td className="p-3">{item.workshop_job?.registration_no || '-'}</td>
                        <td className="p-3">{item.workshop_job?.client_name || '-'}</td>
                        <td className="p-3">
                          <Badge variant="outline">{item.workshop_job?.status || '-'}</Badge>
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          R{item.workshop_job?.actual_cost || item.workshop_job?.estimated_cost || 'TBD'}
                        </td>
                        <td className="p-3 max-w-xs truncate">
                          {item.job_parts ? JSON.stringify(item.job_parts).substring(0, 50) + '...' : '-'}
                        </td>
                      </>
                    )}
                    {activeTab === "stock" && (
                      <>
                        <td className="p-3 font-medium text-green-600">{item.code || '-'}</td>
                        <td className="p-3 max-w-xs truncate">{item.description || '-'}</td>
                        <td className="p-3"><Badge variant="outline">{item.stock_type || '-'}</Badge></td>
                        <td className="p-3 font-medium">{item.quantity || '-'}</td>
                        <td className="p-3">{item.cost_excl_vat_zar || '-'}</td>
                        <td className="p-3">{item.supplier || '-'}</td>
                      </>
                    )}
                    {(activeTab === "parts-orders" || activeTab === "stock-orders") && (
                      <>
                        <td className="p-3 font-medium text-green-600">{item.order_number || '-'}</td>
                        <td className="p-3">{item.supplier || '-'}</td>
                        <td className="p-3">
                          <Badge variant="outline">{item.status || '-'}</Badge>
                        </td>
                        <td className="p-3 font-medium text-green-600">
                          {item.total_amount_ex_vat ? `R${parseFloat(item.total_amount_ex_vat).toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-sm">{item.order_date ? new Date(item.order_date).toLocaleDateString() : '-'}</td>
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
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium mb-2">No {activeTab} found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}