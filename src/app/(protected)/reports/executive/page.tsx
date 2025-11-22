"use client"

import { useState, useEffect } from "react"
import { Download, TrendingUp, DollarSign, Car, Wrench, AlertTriangle, CheckCircle, Clock, Users, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { 
  getVehicleReports, 
  getWorkshopJobReports, 
  getQuotationReports,
  getTechnicianReports,
  exportToCSV, 
  exportToPDF 
} from "@/lib/reports-db"

export default function ExecutiveDashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("overview")

  useEffect(() => {
    async function loadData() {
      try {
        const [vehicles, jobs, quotations, technicians] = await Promise.all([
          getVehicleReports(),
          getWorkshopJobReports(),
          getQuotationReports(),
          getTechnicianReports()
        ])

        const data = {
          vehicles,
          jobs,
          quotations,
          technicians,
          financials: {
            totalRevenue: quotations.reduce((sum, q) => sum + parseFloat(q.totalcost || '0'), 0),
            pendingPayments: quotations.filter(q => !q.paid).reduce((sum, q) => sum + parseFloat(q.totalcost || '0'), 0),
            completedJobs: jobs.filter(j => j.status === 'completed').length,
            activeRepairs: jobs.filter(j => j.status === 'in_progress').length,
          }
        }
        setDashboardData(data)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Link href="/reports" className="text-blue-600 hover:underline">Reports</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Executive Dashboard</span>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Car className="h-4 w-4 mr-2" />Fleet Size
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dashboardData.vehicles?.length || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />Revenue
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R{dashboardData.financials?.totalRevenue?.toLocaleString() || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wrench className="h-4 w-4 mr-2" />Active Repairs
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dashboardData.financials?.activeRepairs || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />Technicians
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dashboardData.technicians?.length || 0}</div></CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.jobs?.slice(0, 5).map((job: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{job.registration_no}</div>
                    <div className="text-sm text-gray-600">{job.job_type}</div>
                  </div>
                  <Badge className={job.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                  'bg-yellow-100 text-yellow-800'}>
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.quotations?.filter((q: any) => !q.paid).slice(0, 5).map((quote: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{quote.vehiclereg}</div>
                    <div className="text-sm text-gray-600">{quote.drivername}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">R{parseFloat(quote.totalcost || '0').toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Unpaid</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderFinancials = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R{dashboardData.financials?.totalRevenue?.toLocaleString() || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">R{dashboardData.financials?.pendingPayments?.toLocaleString() || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{dashboardData.financials?.completedJobs || 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Client</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.quotations?.slice(0, 10).map((quote: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">{quote.vehiclereg}</td>
                    <td className="p-3">{quote.drivername}</td>
                    <td className="p-3 font-bold">R{parseFloat(quote.totalcost || '0').toLocaleString()}</td>
                    <td className="p-3">
                      <Badge className={quote.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {quote.paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </td>
                    <td className="p-3">{quote.created_at ? new Date(quote.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderRepairs = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2" />Active Repairs
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dashboardData.financials?.activeRepairs || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />Completed
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dashboardData.financials?.completedJobs || 0}</div></CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />Pending
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{dashboardData.jobs?.filter((j: any) => j.status === 'pending').length || 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Repairs Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Vehicle</th>
                  <th className="text-left p-3 font-semibold">Job Type</th>
                  <th className="text-left p-3 font-semibold">Technician</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.jobs?.filter((j: any) => j.status !== 'completed').slice(0, 10).map((job: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="p-3 font-medium">{job.registration_no}</td>
                    <td className="p-3">{job.job_type}</td>
                    <td className="p-3">{job.technician_name || '-'}</td>
                    <td className="p-3">
                      <Badge className={job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}>
                        {job.status}
                      </Badge>
                    </td>
                    <td className="p-3 font-bold">R{parseFloat(job.estimated_cost || '0').toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <Link href="/reports" className="text-blue-600 hover:underline font-medium">Reports</Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-gray-900">Executive Dashboard</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="financials">Financials</SelectItem>
              <SelectItem value="repairs">Active Repairs</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(dashboardData, 'executive_dashboard')}>
            <Download className="h-4 w-4 mr-2" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportToPDF(dashboardData, 'Executive Dashboard')}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6">
        {selectedCategory === "overview" && renderOverview()}
        {selectedCategory === "financials" && renderFinancials()}
        {selectedCategory === "repairs" && renderRepairs()}
      </div>
    </div>
  )
}