"use client"

import { useParams } from "next/navigation"
import Link from "next/link"

export default function VehicleAssignmentReportDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const getReportTitle = () => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-2 flex-1">
          <Link href="/reports" className="text-blue-600 hover:underline">
            Reports
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/reports" className="text-blue-600 hover:underline">
            Vehicle Assignments
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{getReportTitle()} Report</span>
        </div>
      </header>

      {/* Coming Soon Content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">👥</div>
          <h2 className="text-2xl font-semibold">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            Vehicle assignment reports are currently under development. This feature will be available soon with detailed driver-vehicle assignment tracking.
          </p>
        </div>
      </div>
    </div>
  )
}