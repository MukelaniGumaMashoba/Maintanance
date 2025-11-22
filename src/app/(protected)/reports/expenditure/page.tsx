"use client"

import { useState, useEffect } from "react"
import { Download, Printer, Search, Calendar, Car, DollarSign, Wrench, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { getWorkshopJobReports, exportToCSV, exportToPDF } from "@/lib/reports-db"

export default function ExpenditureReportPage() {
  const [expenditureData, setExpenditureData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getWorkshopJobReports()
        setExpenditureData(data)
        setFilteredData(data)
      } catch (error) {
        console.error('Error loading expenditure data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = expenditureData
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredData(filtered)
  }, [searchTerm, expenditureData])

  const stats = {
    totalCost: filteredData.reduce((sum, item) => sum + (parseFloat(item.actual_cost || item.estimated_cost || '0')), 0),
    partsCost: filteredData.reduce((sum, item) => sum + (parseFloat(item.total_parts_cost || '0')), 0),
    laborCost: filteredData.reduce((sum, item) => sum + (parseFloat(item.total_labor_cost || '0')), 0),
    vehicleCount: new Set(filteredData.map(item => item.registration_no)).size,
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Expenditure Report</span>
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
          <span className="font-semibold text-gray-900">Expenditure Report</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredData, 'expenditure_report')}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(filteredData, 'Expenditure Report')}>
            <Printer className="h-4 w-4 mr-2" />Print PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">R{stats.totalCost.toLocaleString()}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Wrench className="h-4 w-4 mr-2" />Parts Cost
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">R{stats.partsCost.toLocaleString()}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />Labor Cost
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">R{stats.laborCost.toLocaleString()}</div></CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Car className="h-4 w-4 mr-2" />Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.vehicleCount}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by vehicle or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Client</th>
                  <th className="text-left p-3 font-semibold">Job Type</th>
                  <th className="text-left p-3 font-semibold">Parts Cost</th>
                  <th className="text-left p-3 font-semibold">Labor Cost</th>
                  <th className="text-left p-3 font-semibold">Total Cost</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-blue-50">
                    <td className="p-3 font-medium text-blue-600">{item.registration_no || '-'}</td>
                    <td className="p-3">{item.client_name || '-'}</td>
                    <td className="p-3">
                      <Badge variant="outline">{item.job_type || '-'}</Badge>
                    </td>
                    <td className="p-3 font-medium text-green-600">
                      R{parseFloat(item.total_parts_cost || '0').toLocaleString()}
                    </td>
                    <td className="p-3 font-medium text-purple-600">
                      R{parseFloat(item.total_labor_cost || '0').toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-blue-600">
                      R{parseFloat(item.actual_cost || item.estimated_cost || '0').toLocaleString()}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                      </div>
                    </td>
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
              <h3 className="text-lg font-medium mb-2">No expenditure data found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}