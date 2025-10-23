"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChartBar,
  Briefcase,
  Car,
  Building2,
  Settings,
  PlusSquare,
  Wrench,
  User2,
  SettingsIcon,
} from "lucide-react";
import { getDashboardStats } from "@/lib/stats/dashboard";
import { createClient } from "@/lib/supabase/client";
import JobAssignmentsDashboard from "@/components/jobs/jobsStat";
import RecentActivityList from "@/components/dashboard/recentActivities";
import { SlidingNumber } from "@/components/ui/sliding-number";
import Link from "next/link";

interface DashboardStats {
  totalVehicles: number;
  monthlyRevenue: number;
  completedJobs: number;
  tows: number;
  activeBreakdowns: number;
  pendingApprovals: number;
  availableTechnicians: number;
  driverStats: number;
  technicianStats: number;
  workshopStats: number;
}
interface RecentActivity {
  id: string;
  type: "breakdown" | "approval" | "completion" | "quotation";
  title: string;
  description: string;
  timestamp: string;
  status: string;
}

// Utility to read cookie by name
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    monthlyRevenue: 0,
    completedJobs: 0,
    tows: 0,
    activeBreakdowns: 0,
    pendingApprovals: 0,
    availableTechnicians: 0,
    driverStats: 0,
    technicianStats: 0,
    workshopStats: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get user role on mount, redirect if missing
  useEffect(() => {
    const roleCookie = getCookie("role");
    if (roleCookie) {
      setUserRole(decodeURIComponent(roleCookie));
    } else {
      router.push("/login");
    }
  }, [router]);

  // Role-based navigation links (used in layout/navigation)
  const roleNavigation = {
    "fleet manager": [
      { name: "Dashboard", href: "/dashboard", Icon: <ChartBar /> },
      { name: "Jobs", href: "/jobsFleet", Icon: <Briefcase /> },
      { name: "Drivers", href: "/drivers", Icon: <Users /> },
      { name: "Vehicles", href: "/vehicles", Icon: <Car /> },
      { name: "Quote Management", href: "/quotation", Icon: <Building2 /> },
      { name: "System Settings", href: "/settings", Icon: <Settings /> },
      {
        name: "User Management",
        href: "/userManagement",
        Icon: <PlusSquare />,
      },
    ],
    "call centre": [
      { name: "Dashboard", href: "/dashboard", Icon: <ChartBar /> },
      { name: "Jobs", href: "/jobs", Icon: <Briefcase /> },
      { name: "Call Center", href: "/callcenter", Icon: <Phone /> },
      {
        name: "Technicians Assignment",
        href: "/callcenter/technician",
        Icon: <Wrench />,
      },
      {
        name: "Technician Vehicles",
        href: "/callcenter/breakdowns",
        Icon: <Truck />,
      },
      { name: "Workshops", href: "/callcenter/clients", Icon: <Users /> },
      { name: "Quote Management", href: "/ccenter", Icon: <Building2 /> },
      { name: "System Settings", href: "/settings", Icon: <Settings /> },
    ],
    customer: [
      { name: "Dashboard", href: "/dashboard", Icon: <ChartBar /> },
      {
        name: "Technicians Assignment",
        href: "/extechnicians",
        Icon: <Users />,
      },
      { name: "Workshop Vehicles", href: "/exvehicles", Icon: <Car /> },
      { name: "Quote Management", href: "/workshopQuote", Icon: <Building2 /> },
      { name: "System Settings", href: "/settings", Icon: <Settings /> },
    ],
    "cost centre": [
      { name: "Dashboard", href: "/dashboard", Icon: <ChartBar /> },
      { name: "Cost", href: "/ccenter", Icon: <Building2 /> },
      {
        name: "Quote Management",
        href: "/ccenter/create-quotation",
        Icon: <DollarSign />,
      },
      { name: "System Settings", href: "/settings", Icon: <Settings /> },
    ],
  };
  // Fetch stats and setup realtime activity subscription on userRole known
  useEffect(() => {
    if (!userRole) return;

    let isMounted = true;

    async function fetchStats() {
      setLoading(true);
      try {
        const data = await getDashboardStats();
        if (isMounted) setStats(data as any);
      } catch {
        if (isMounted) setError("Failed to load dashboard stats");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStats();

    // TODO: Add supabase real-time subscriptions if desired

    return () => {
      isMounted = false;
    };
  }, [userRole]);

  // Quick actions filtered by role
  function getQuickActions() {
    const baseActions = [
      {
        title: "Job Card",
        description: "See active and pending job cards",
        icon: AlertTriangle,
        action: "/jobs",
        color: "bg-red-50 text-red-600 hover:bg-red-100",
      },
      {
        title: "Vehicles",
        description: "Manage vehicles",
        icon: Truck,
        action: "/vehicles",
        color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      },
      {
        title: "Repair Management",
        description: "Manage repairs and approvals",
        icon: DollarSign,
        action: "/qoutation",
        color: "bg-blue-50 text-yellow-600 hover:bg-yellow-100",
      },
      {
        title: "Drivers",
        description: "Manage drivers",
        icon: User2,
        action: "/drivers",
        color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      },
      {
        title: "Technicians",
        description: "View and manage all the technicians",
        icon: User2,
        action: "/callcenter/technician",
        color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      },
      {
        title: "System Settings",
        description: "Configure system and user settings",
        icon: SettingsIcon,
        action: "/settings",
        color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
      },
      {
        title: "User Management",
        description: "Making user management more efficient and accessible",
        icon: User,
        action: "/userManagement",
        color: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
      },
    ];

    // Normalize role string for consistency e.g. "fleet manager" => "fleetmanager"
    const normalizedRole = userRole.toLowerCase().replace(/\s+/g, "");

    switch (normalizedRole) {
      case "callcentre":
        return baseActions.filter(
          (a) =>
            a.action.toLowerCase().includes("jobs") ||
            a.action.toLowerCase().includes("settings") ||
            a.action.toLowerCase().includes("technician") ||
            a.action.toLowerCase().includes("qoutation")
        );

      case "fleetmanager":
        return baseActions.filter(
          (a) =>
            a.action.toLowerCase().includes("fleetmanager") ||
            a.action.toLowerCase().includes("settings") ||
            a.action.toLowerCase().includes("vehicles") ||
            a.action.toLowerCase().includes("drivers") ||
            a.action.toLowerCase().includes("ccenter") ||
            a.action.toLowerCase().includes("usermanagement")
        );

      case "costcentre":
        return baseActions.filter(
          (a) =>
            a.action.toLowerCase().includes("ccenter") ||
            a.action.toLowerCase().includes("settings")
        );

      case "customer":
        return [
          {
            title: "Workshop Breakdown Vehicles",
            description: "View all vehicle breakdown",
            icon: Phone,
            action: "/exvehicles",
            color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
          },
          {
            title: "Quote Management",
            description: "Edit the quotation your technician has",
            icon: FileText,
            action: "/workshopQoute",
            color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
          },
          {
            title: "Technicians",
            description: "View and manage all the technicians",
            icon: User2,
            action: "/extechnicians",
            color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
          },
        ];

      default:
        return baseActions;
    }
  }

  useEffect(() => {
    const supabase = createClient();
    let channel: any;
    let isMounted = true;

    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardStats();
        if (isMounted) setStats(data as any);
      } catch (err: any) {
        if (isMounted) setError("Failed to load dashboard stats");
      } finally {
        if (isMounted) setLoading(false);
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
        description =
          event.new?.issue_description ||
          event.old?.issue_description ||
          "Breakdown event";
        status = event.new?.status || event.old?.status || "";
      } else if (table === "approvals") {
        type = "approval";
        title = `Approval ${event.new?.id || event.old?.id}`;
        description =
          event.new?.reason || event.old?.reason || "Approval event";
        status = event.new?.status || event.old?.status || "";
      } else if (table === "job_assignments") {
        type = "completion";
        title = `Job ${event.new?.id || event.old?.id}`;
        description =
          event.new?.description ||
          event.old?.description ||
          "Job assignment event";
        status = event.new?.status || event.old?.status || "";
      }
      setRecentActivity((prev) =>
        [
          {
            id: `${table}-${event.new?.id || event.old?.id}-${
              event.eventType
            }-${now.getTime()}`,
            type,
            title,
            description,
            timestamp: now.toLocaleString(),
            status,
          },
          ...prev,
        ].slice(0, 10)
      ); // Keep only the 10 most recent
    }

    // Subscribe to changes in all relevant tables and update recentActivity
    channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "breakdowns" },
        (payload) => {
          fetchStats();
          addActivity(payload, "breakdowns");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approvals" },
        (payload) => {
          fetchStats();
          addActivity(payload, "approvals");
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "technicians" },
        fetchStats
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehiclesc" },
        fetchStats
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "job_assignments" },
        (payload) => {
          fetchStats();
          addActivity(payload, "job_assignments");
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "breakdown":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "approval":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completion":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "quotation":
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "call center":
        return "Call Center Operator";
      case "fleet manager":
        return "Fleet Manager";
      case "cost center":
        return "Cost Center Manager";
      case "customer":
        return "Customer";
      case "admin":
        return "Administrator";
      default:
        return "User";
    }
  };

  const normalizedRole = userRole.toLowerCase().replace(/\s+/g, "");

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Dashboard Overview
          </h2>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        {loading && <div>Loading stats...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Active Drivers */}
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Active Jobs
              </CardTitle>
              <div className="rounded-full bg-white/20 p-2">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <SlidingNumber
                from={0}
                to={stats.workshopStats}
                duration={1}
                className="text-3xl font-extrabold tracking-tight"
                digitHeight={42}
              />
              <p className="mt-1 text-xs text-white/80">
                Total Number Of Card Logged
              </p>
            </CardContent>
          </Card>

          {/* Technicians Available */}
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Drivers Available
              </CardTitle>
              <div className="rounded-full bg-white/20 p-2">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <SlidingNumber
                from={0}
                to={stats.driverStats}
                duration={1}
                className="text-3xl font-extrabold tracking-tight"
                digitHeight={42}
              />
              <p className="mt-1 text-xs text-white/80">All Drivers</p>
            </CardContent>
          </Card>

          {/* Fleet Vehicles */}
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Fleet Vehicles
              </CardTitle>
              <div className="rounded-full bg-white/20 p-2">
                <Truck className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <SlidingNumber
                from={0}
                to={stats.totalVehicles}
                duration={1}
                className="text-3xl font-extrabold tracking-tight"
                digitHeight={42}
              />
              <p className="mt-1 text-xs text-white/80">
                Vehicles for the company
              </p>
            </CardContent>
          </Card>

          {/* Total Vehicles */}
          <Card className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Total Technicians
              </CardTitle>
              <div className="rounded-full bg-white/20 p-2">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <SlidingNumber
                from={0}
                to={stats.technicianStats}
                duration={1}
                className="text-3xl font-extrabold tracking-tight"
                digitHeight={42}
              />
              <p className="mt-1 text-xs text-white/80">
                Total Towing Operations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Quick Actions */}
          <Card className="col-span-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">
                Quick Actions
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Common tasks for your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {getQuickActions().map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => router.push(action.action)}
                    className={`h-auto p-5 justify-start text-left transition-all duration-200 ease-in-out rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${action.color}`}
                  >
                    <div className="flex items-start gap-4 w-full">
                      {/* Icon Bubble */}
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30 dark:bg-white/10">
                        <action.icon className="h-5 w-5" />
                      </div>

                      {/* Texts */}
                      <div className="flex flex-col">
                        <div className="font-medium text-base text-wrap">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground leading-snug mt-1 text-wrap">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* <div>
          <CardDemo />
        </div> */}

        {/* Role-specific content */}
        <Tabs defaultValue="pending" className="space-y-6">
          {/* Tabs Navigation */}
          <TabsList className="flex w-fit rounded-xl bg-muted/40 p-1 shadow-sm">
            {/* <TabsTrigger
              value="overview"
              className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger> */}
            <TabsTrigger
              value="pending"
              className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Pending Tasks
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="px-4 py-2 text-sm font-medium rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Quick Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Clock className="h-5 w-5 text-primary" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: "Avg Breakdown Time", value: "18 minutes" },
                      { label: "Avg Repair Time", value: "20 minutes" },
                      { label: "Number of Tows", value: stats.tows },
                      { label: "Jobs This Month", value: stats.completedJobs },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center border-b last:border-0 pb-2"
                      >
                        <span className="text-sm text-gray-600">
                          {item.label}
                        </span>
                        <span className="text-sm font-semibold">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pending Tab */}
          {/* // Normalize role once at the top of your component or before rendering */}

          <TabsContent value="pending" className="space-y-4">
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Tasks Requiring Attention
                </CardTitle>
                <CardDescription>
                  Items that need your immediate action
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {normalizedRole === "fleetmanager" && (
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition">
                      <div>
                        <p className="font-medium">Awaiting Approval</p>
                        <p className="text-sm text-gray-600">
                          Total jobs: {stats.workshopStats}
                        </p>
                      </div>
                      <Link href="/ccenter">
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  )}
                  {normalizedRole === "callcentre" && (
                    <div>
                      <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition">
                        <div>
                          <p className="font-medium">
                            Job Card Reported Breakdowns
                          </p>
                          <p className="text-sm text-gray-600">
                            Waiting for technician dispatch
                          </p>
                        </div>
                        <Link
                          href={{
                            pathname: "/jobs",
                            query: { statusFilter: "All Status" },
                          }}
                        >
                          <Button size="sm">Assign</Button>
                        </Link>
                      </div>
                      <div className="flex mt-5 items-center justify-between p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition">
                        <div>
                          <p className="font-medium">
                            Job Completed Awaiting Repair
                          </p>
                          <p className="text-sm text-gray-600">
                            Waiting for repair update
                          </p>
                        </div>
                        <Link
                          href={{
                            pathname: "/ccenter",
                            query: { statusFilter: "pending" },
                          }}
                        >
                          <Button size="sm">Qoute</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                  {/* {normalizedRole === "costcentre" && (
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition">
                      <div>
                        <p className="font-medium">2 Technician Reports Pending</p>
                        <p className="text-sm text-gray-600">Awaiting repair creation</p>
                      </div>
                      <Button size="sm">Create Repair</Button>
                    </div>
                  )} */}
                  {normalizedRole === "customer" && (
                    <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 hover:bg-muted/30 transition">
                      <div>
                        <p className="font-medium">Manage Workshop Repairs</p>
                        <p className="text-sm text-gray-600">
                          Repairs management
                        </p>
                      </div>
                      <Link href="/workshopQoute">
                        <Button size="sm">Manage</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Breakdowns Logged
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {stats.activeBreakdowns}
                  </div>
                  <p className="text-sm text-gray-600">
                    Total Breakdowns Reported
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Weekly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">TBC</div>
                  <p className="text-sm text-gray-600">
                    Improvement over last week
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
