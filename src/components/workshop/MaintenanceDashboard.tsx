"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  FileText, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  BarChart3,
  Users,
  Car
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Import our new components
import UpdatedJobCardForm from "./UpdatedJobCardForm"
import JobCardWorkflow from "./JobCardWorkflow"
import RejectedJobs from "./RejectedJobs"
import PartsManagement from "./PartsManagement"
import CompletedJobsReport from "./CompletedJobsReport"

interface DashboardStats {
  totalJobs: number
  pendingApproval: number
  approved: number
  completed: number
  rejected: number
  lowStockParts: number
  totalRevenue: number
}

export default function MaintenanceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    pendingApproval: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    lowStockParts: 0,
    totalRevenue: 0
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [userRole, setUserRole] = useState<string>("")
  const [userPermissions, setUserPermissions] = useState({
    can_approve_jobs: false,
    can_reject_jobs: false,
    can_close_jobs: false
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchDashboardStats()
  }, [])

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      console.log(profile)
      if (profile) {
        setUserRole(profile.role || "")
        setUserPermissions({
          can_approve_jobs: profile.can_approve_jobs || false,
          can_reject_jobs: profile.can_reject_jobs || false,
          can_close_jobs: profile.can_close_jobs || false
        })
      }
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Fetch job statistics
      const { data: jobs } = await supabase
        .from('workshop_job')
        .select('status, grand_total')

      // Fetch parts with low stock
      const { data: parts } = await supabase
        .from('parts')
        .select('quantity, stock_threshold')

      // Fetch rejected jobs count
      const { data: rejectedJobs } = await supabase
        .from('rejected_jobs')
        .select('id')

      if (jobs) {
        const totalJobs = jobs.length
        const pendingApproval = jobs.filter(j => j.status === 'awaiting approval').length
        const approved = jobs.filter(j => j.status === 'approved').length
        const completed = jobs.filter(j => j.status === 'completed').length
        const totalRevenue = jobs
          .filter(j => j.status === 'completed' || j.status === 'Completed')
          .reduce((sum, j) => sum + (j.grand_total || 0), 0)

        const lowStockParts = parts?.filter(p => p?.quantity && p?.stock_threshold && p.quantity <= p.stock_threshold).length || 0

        setStats({
          totalJobs,
          pendingApproval,
          approved,
          completed,
          rejected: rejectedJobs?.length || 0,
          lowStockParts,
          totalRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount)
  }

  const getStatCardColor = (type: string) => {
    switch (type) {
      case 'pending': return 'border-yellow-200 bg-yellow-50'
      case 'approved': return 'border-green-200 bg-green-50'
      case 'completed': return 'border-blue-200 bg-blue-50'
      case 'rejected': return 'border-red-200 bg-red-50'
      case 'lowstock': return 'border-orange-200 bg-orange-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'pending': return <Clock className="h-8 w-8 text-yellow-600" />
      case 'approved': return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'completed': return <CheckCircle className="h-8 w-8 text-blue-600" />
      case 'rejected': return <XCircle className="h-8 w-8 text-red-600" />
      case 'lowstock': return <AlertTriangle className="h-8 w-8 text-orange-600" />
      case 'revenue': return <BarChart3 className="h-8 w-8 text-purple-600" />
      default: return <FileText className="h-8 w-8 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance Management</h1>
          <p className="text-gray-600">Manage job cards, parts, and maintenance workflows</p>
        </div>
        <Button onClick={() => setShowCreateJob(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Job Card
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className={getStatCardColor('default')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-gray-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getStatCardColor('pending')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {getStatIcon('pending')}
              <div>
                <p className="text-2xl font-bold">{stats.pendingApproval}</p>
                <p className="text-sm text-gray-600">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getStatCardColor('approved')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {getStatIcon('approved')}
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getStatCardColor('completed')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {getStatIcon('completed')}
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={getStatCardColor('lowstock')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {getStatIcon('lowstock')}
              <div>
                <p className="text-2xl font-bold">{stats.lowStockParts}</p>
                <p className="text-sm text-gray-600">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              {getStatIcon('revenue')}
              <div>
                <p className="text-lg font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Jobs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setShowCreateJob(true)} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Job Card
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("workflow")} 
                  className="w-full justify-start"
                  variant="outline"
                  disabled={!userPermissions.can_approve_jobs}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve/Reject Jobs
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("parts")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Parts
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("reports")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Jobs Pending Approval</span>
                  <Badge variant={stats.pendingApproval > 0 ? "destructive" : "secondary"}>
                    {stats.pendingApproval}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Low Stock Parts</span>
                  <Badge variant={stats.lowStockParts > 0 ? "destructive" : "secondary"}>
                    {stats.lowStockParts}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rejected Jobs</span>
                  <Badge variant={stats.rejected > 0 ? "destructive" : "secondary"}>
                    {stats.rejected}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">User Role</span>
                  <Badge variant="outline">
                    {userRole}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflow Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <h4 className="font-semibold mb-2">Updated Workflow Process:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li><strong>Admin:</strong> Create job card, assign parts, and assign technician or external sublet</li>
                    <li><strong>Manager:</strong> Approve or reject the job</li>
                    <li><strong>Admin:</strong> Print job card (includes notes and technician signature section)</li>
                    <li><strong>Admin:</strong> Update parts if needed, add labour costs, complete and close job card</li>
                  </ol>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Key Changes:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Client section removed from job cards</li>
                    <li>• Driver field added (optional, pulls from driver list)</li>
                    <li>• Manager role cannot close jobs (admin only)</li>
                    <li>• Rejected jobs stored separately with reopen capability</li>
                    <li>• Stock thresholds set per part with low stock alerts</li>
                    <li>• Non-stock items supported for external workshops</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow">
          <JobCardWorkflow />
        </TabsContent>

        <TabsContent value="parts">
          <PartsManagement />
        </TabsContent>

        <TabsContent value="rejected">
          <RejectedJobs />
        </TabsContent>

        <TabsContent value="reports">
          <CompletedJobsReport />
        </TabsContent>
      </Tabs>

      {/* Create Job Modal */}
      {showCreateJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <UpdatedJobCardForm
              onSuccess={() => {
                setShowCreateJob(false)
                fetchDashboardStats()
              }}
              onCancel={() => setShowCreateJob(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}