"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Truck,
  Phone,
  DollarSign,
  User,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Users,
  MapPin,
  FileText,
} from "lucide-react"
import { Router } from "next/router"
import { getDashboardStats } from "@/lib/stats/dashboard";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  activeBreakdowns: number
  pendingApprovals: number
  availableTechnicians: number
  totalVehicles: number
  monthlyRevenue: number
  completedJobs: number
}

interface RecentActivity {
  id: string
  type: "breakdown" | "approval" | "completion" | "quotation"
  title: string
  description: string
  timestamp: string
  status: string
}

interface QuickAction {
  title: string
  description: string
  icon: any
  action: string
  color: string
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [stats, setStats] = useState<DashboardStats>({
    activeBreakdowns: 0,
    pendingApprovals: 0,
    availableTechnicians: 0,
    totalVehicles: 0,
    monthlyRevenue: 0,
    completedJobs: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient();
    let channel: any;
    let isMounted = true;

    async function fetchStats() {
      setLoading(true)
      setError(null)
      try {
        const data = await getDashboardStats();
        if (isMounted) setStats(data)
      } catch (err: any) {
        if (isMounted) setError("Failed to load dashboard stats")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStats();

    // Helper to add a new activity event
    function addActivity(event: any, table: string) {
      const now = new Date();
      let type: RecentActivity["type"] = "completion";
      let title = "";
      let description = "";
      let status = "";
      if (table === "breakdowns") {
        type = "breakdown";
        title = `Breakdown ${event.new?.id || event.old?.id}`;
        description = event.new?.issue_description || event.old?.issue_description || "Breakdown event";
        status = event.new?.status || event.old?.status || "";
      } else if (table === "approvals") {
        type = "approval";
        title = `Approval ${event.new?.id || event.old?.id}`;
        description = event.new?.reason || event.old?.reason || "Approval event";
        status = event.new?.status || event.old?.status || "";
      } else if (table === "job_assignments") {
        type = "completion";
        title = `Job ${event.new?.id || event.old?.id}`;
        description = event.new?.description || event.old?.description || "Job assignment event";
        status = event.new?.status || event.old?.status || "";
      }
      setRecentActivity(prev => [
        {
          id: `${table}-${event.new?.id || event.old?.id}-${event.eventType}-${now.getTime()}`,
          type,
          title,
          description,
          timestamp: now.toLocaleString(),
          status,
        },
        ...prev
      ].slice(0, 10)); // Keep only the 10 most recent
    }

    // Subscribe to changes in all relevant tables and update recentActivity
    channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'breakdowns' }, (payload) => {
        fetchStats();
        addActivity(payload, 'breakdowns');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, (payload) => {
        fetchStats();
        addActivity(payload, 'approvals');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehiclesc_workshop' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_assignments' }, (payload) => {
        fetchStats();
        addActivity(payload, 'job_assignments');
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    }
  }, [router])

  const getQuickActions = (): QuickAction[] => {
    const baseActions = [
      {
        title: "View All Breakdowns",
        description: "See active and pending breakdown requests",
        icon: AlertTriangle,
        action: "/callcenter",
        color: "bg-red-50 text-red-600 hover:bg-red-100",
      },
      {
        title: "Fleet Management",
        description: "Manage vehicles and drivers",
        icon: Truck,
        action: "/fleetManager",
        color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      },
      {
        title: "Create Quotation",
        description: "Generate cost estimates for repairs",
        icon: DollarSign,
        action: "/ccenter/create-quotation",
        color: "bg-green-50 text-green-600 hover:bg-green-100",
      },
      {
        title: "System Settings",
        description: "Configure system and user settings",
        icon: User,
        action: "/settings",
        color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      },
    ]

    // Filter actions based on user role
    switch (userRole) {
      case "call center":
        return baseActions.filter(
          (action) => action.action.includes("call center") || action.action.includes("settings"),
        )
      case "fleet manager":
        return baseActions.filter(
          (action) =>
            action.action.includes("fleet manager") ||
            action.action.includes("call center") ||
            action.action.includes("settings"),
        )
      case "cost center":
        return baseActions.filter(
          (action) => action.action.includes("cost center") || action.action.includes("settings"),
        )
      case "customer":
        return [
          {
            title: "Request Breakdown Service",
            description: "Report a vehicle breakdown",
            icon: Phone,
            action: "/customer",
            color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
          },
          {
            title: "My Requests",
            description: "View your Repair history",
            icon: FileText,
            action: "/customer",
            color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
          },
        ]
      default:
        return baseActions
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Repair":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "approval":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "completion":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "quotation":
        return <DollarSign className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "call center":
        return "Call Center Operator"
      case "fleet manager":
        return "Fleet Manager"
      case "cost center":
        return "Cost Center Manager"
      case "customer":
        return "Customer"
      case "admin":
        return "Administrator"
      default:
        return "User"
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        </div>
        {loading && <div>Loading stats...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.activeBreakdowns}</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Number of Repairs</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.availableTechnicians}</div>
              <p className="text-xs text-muted-foreground">Out of 12 total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">42 active, 3 maintenance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repair</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">+12% for the month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Quick Actions */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-auto p-4 justify-start ${action.color}`}
                    onClick={() => router.push(action.action)}
                  >
                    <div className="flex items-start gap-3">
                      <action.icon className="h-5 w-5 mt-0.5" />
                      <div className="text-left">
                        <div className="font-semibold">{action.title}</div>
                        <div className="text-xs opacity-70 text-wrap hover:text-balance">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system updates and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 && <div className="text-gray-400 text-sm">No recent activity yet.</div>}
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending Jobs</TabsTrigger>
            <TabsTrigger value="reports">Quick Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Job Types</span>
                      <span className="text-sm font-semibold">
                        <ul>
                          <li>Technical</li>
                          <li>Tow</li>
                        </ul>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Costing</span>
                      <span className="text-sm font-semibold">R220</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Number of jobs</span>
                      <span className="text-sm font-semibold">15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Jobs This Month</span>
                      <span className="text-sm font-semibold">{stats.completedJobs}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tasks Requiring Attention</CardTitle>
                <CardDescription>Items that need your immediate action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userRole === "fleet manager" && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Awaiting Towing</p>
                        <p className="text-sm text-gray-600">Total value: R12,500</p>
                      </div>
                      <div>
                        <p className="font-medium">Awaiting Towing</p>
                        <p className="text-sm text-gray-600">Total value: R12,500</p>
                      </div>
                      <Button size="sm">
                        Review
                      </Button>
                    </div>
                  )}
                  {userRole === "call center" && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">3 Unassigned Breakdowns</p>
                        <p className="text-sm text-gray-600">Waiting for technician dispatch</p>
                      </div>
                      <Button size="sm">
                        Assign
                      </Button>
                    </div>
                  )}
                  {userRole === "cost center" && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">2 Technician Reports Pending</p>
                        <p className="text-sm text-gray-600">Awaiting quotation creation</p>
                      </div>
                      <Button size="sm">
                        Create Quote
                      </Button>
                    </div>
                  )}
                  {userRole === "customer" && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">1 Quotation Awaiting Approval</p>
                        <p className="text-sm text-gray-600">Repair estimate: R2,500</p>
                      </div>
                      <Button size="sm">
                        Review
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Number of
                    <br /> Breakdowns Logged</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-sm text-gray-600">Total activities today</p>
                </CardContent>
              </Card>
              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weekly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">+15%</div>
                  <p className="text-sm text-gray-600">Improvement over last week</p>
                </CardContent>
              </Card> */}
              {/* <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">R1,250</div>
                  <p className="text-sm text-gray-600">Average cost per job</p>
                </CardContent>
              </Card> */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
