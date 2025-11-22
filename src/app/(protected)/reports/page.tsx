"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { LucideIcon } from "lucide-react"
import {
    Grid3X3,
    List,
    Star,
    FileText,
    Users,
    Truck,
    AlertTriangle,
    Wrench,
    ClipboardList,
    UserCheck,
    Cog,
    Fuel,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const reportIcons: Record<string, LucideIcon> = {
    Vehicles: Truck,
    Workshop: Wrench,
    Personnel: Users,
    Inventory: Cog,
    Financial: FileText,
    Procurement: ClipboardList,
}

type Report = {
    name: string
    description: string
    type: string
    category: string
    slug: string
}

const allReports: Report[] = [
    // Vehicle Reports
    {
        name: "Vehicle Fleet Management",
        description: "Complete vehicle fleet with maintenance history and assignments.",
        type: "Vehicles",
        category: "vehicles",
        slug: "fleet-management",
    },
    
    // Workshop Reports
    {
        name: "Workshop Operations",
        description: "Workshop jobs, breakdowns, assignments and job parts tracking.",
        type: "Workshop",
        category: "workshop",
        slug: "operations",
    },
        {
        name: "Job Cards",
        description: "Job card management and completion tracking.",
        type: "Workshop",
        category: "workshop",
        slug: "job-cards",
    },
    // Personnel Reports
    {
        name: "Personnel Management",
        description: "Technicians, drivers and vehicle assignments.",
        type: "Personnel",
        category: "personnel",
        slug: "management",
    },
    
    // Inventory Reports
    {
        name: "Inventory & Parts Tracking",
        description: "Advanced parts tracking with job card details and usage history.",
        type: "Inventory",
        category: "inventory",
        slug: "parts-tracking",
    },
        {
        name: "Stock Management",
        description: "Stock orders, suppliers and inventory control.",
        type: "Inventory",
        category: "inventory",
        slug: "stock-management",
    },
    {
        name: "Stock Orders",
        description: "Stock order tracking and supplier management.",
        type: "Inventory",
        category: "inventory",
        slug: "stock-orders",
    },
    {
        name: "Parts Orders",
        description: "Parts order management and procurement tracking.",
        type: "Inventory",
        category: "inventory",
        slug: "parts-orders",
    },
    
    // Financial Reports
    {
        name: "Financial Analysis",
        description: "Quotations, quote products and financial tracking.",
        type: "Financial",
        category: "financial",
        slug: "analysis",
    },
    
    // Procurement Reports
    {
        name: "Procurement & Suppliers",
        description: "Supplier management and sublet operations.",
        type: "Procurement",
        category: "procurement",
        slug: "suppliers",
    },
]

const categoryReports = {
    vehicles: allReports.filter((r) => r.category === "vehicles"),
    workshop: allReports.filter((r) => r.category === "workshop"),
    personnel: allReports.filter((r) => r.category === "personnel"),
    inventory: allReports.filter((r) => r.category === "inventory"),
    financial: allReports.filter((r) => r.category === "financial"),
    procurement: allReports.filter((r) => r.category === "procurement"),
    parts: allReports.filter((r) => r.category === "parts"),
    fuel: allReports.filter((r) => r.category === "fuel"),
    expenditure: [{ name: "Expenditure Report", description: "Detailed cost analysis by vehicle", type: "Financial", category: "expenditure", slug: "expenditure" }],
    utilization: [{ name: "Utilization Report", description: "Vehicle utilization analysis", type: "Vehicles", category: "utilization", slug: "utilization" }],
    executive: [{ name: "Executive Dashboard", description: "High-level executive overview", type: "Financial", category: "executive", slug: "executive" }],
}

export default function ReportsPage() {
    const [reportType, setReportType] = useState<string>("all")

    const [userRole, setUserRole] = useState<"call-center" | "fleet-manager" | "cost-center" | "customer" | "admin">(
        "fleet-manager",
    )
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const searchParams = useSearchParams()
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const role = localStorage.getItem("userRole") as typeof userRole
        if (role) setUserRole(role)
    }, [])

    // compute reports to show based on category (query), type filter and search term
    const reportsToShow = useMemo(() => {
        const category = searchParams.get("category")
        let reports = allReports.slice()

        if (category && category in categoryReports) {
            reports = categoryReports[category as keyof typeof categoryReports]
        }

        if (reportType !== "all") {
            reports = reports.filter((r) => r.type === reportType)
        }

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase()
            reports = reports.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.description.toLowerCase().includes(q) ||
                    r.slug.toLowerCase().includes(q)
            )
        }

        return reports
    }, [searchParams, reportType, searchTerm])

    const getPageTitle = () => {
        const category = searchParams.get("category")
        if (category) {
            return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ") + " Reports"
        }
        return "Standard Reports"
    }

    // Simple navigation to report pages
    const handleReportClick = (report: Report) => {
        window.location.href = `/reports/${report.category}/${report.slug}`
    }

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">

                <Separator orientation="vertical" className="mr-2 h-4" />
                <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-5 w-5" />
                    <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mr-2"
                    />
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {[...new Set(allReports.map((r) => r.type))].map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>

                    </Select>
                    <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                    >
                        <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-6">
                <div className="space-y-4">
                    {/* Reports Display */}
                    {viewMode === "list" ? (
                        <div className="space-y-2">
                            {reportsToShow.map((report) => {
                                const Icon = reportIcons[report.type] || FileText
                                return (
                                    <Card key={report.slug} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleReportClick(report)}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Icon className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{report.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{report.description}</p>
                                                </div>
                                                <Badge variant="outline">{report.type}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reportsToShow.map((report) => {
                                const Icon = reportIcons[report.type] || FileText
                                return (
                                    <Card key={report.slug} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleReportClick(report)}>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <Icon className="h-5 w-5 text-green-600" />
                                                </div>
                                                <Badge variant="outline">{report.type}</Badge>
                                            </div>
                                            <CardTitle className="text-lg">{report.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription>{report.description}</CardDescription>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    {reportsToShow.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <div className="text-6xl mb-4">📊</div>
                                <h3 className="text-lg font-medium mb-2">No reports found</h3>
                                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
