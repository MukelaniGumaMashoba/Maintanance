"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Download,
  Printer,
  Search,
  Calendar,
  Car,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getVehicleReports, exportToCSV, exportToPDF } from "@/lib/reports-db";

export default function UtilizationReportPage() {
  const [utilizationData, setUtilizationData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getVehicleReports();
        // Mock utilization data since it's manually captured
        const mockUtilization = data.map((vehicle) => ({
          ...vehicle,
          utilization_hours: Math.floor(Math.random() * 200) + 50,
          idle_hours: Math.floor(Math.random() * 50) + 10,
          efficiency: Math.floor(Math.random() * 30) + 70,
          distance_km: Math.floor(Math.random() * 5000) + 1000,
        }));
        setUtilizationData(mockUtilization);
        setFilteredData(mockUtilization);
      } catch (error) {
        console.error("Error loading utilization data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = utilizationData;
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.registration_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          item.make?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredData(filtered);
  }, [searchTerm, utilizationData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcelFile(file);
      // Here you would process the Excel file
      console.log("Excel file uploaded:", file.name);
    }
  };

  const stats = {
    totalVehicles: filteredData.length,
    avgUtilization:
      filteredData.length > 0
        ? Math.round(
            filteredData.reduce(
              (sum, item) => sum + item.utilization_hours,
              0
            ) / filteredData.length
          )
        : 0,
    avgEfficiency:
      filteredData.length > 0
        ? Math.round(
            filteredData.reduce((sum, item) => sum + item.efficiency, 0) /
              filteredData.length
          )
        : 0,
    totalDistance: filteredData.reduce(
      (sum, item) => sum + item.distance_km,
      0
    ),
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Link href="/reports" className="text-blue-600 hover:underline">
            Reports
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Utilization Report</span>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <Link
            href="/reports"
            className="text-blue-600 hover:underline font-medium"
          >
            Reports
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-gray-900">
            Utilization Report
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel
              </span>
            </Button>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(filteredData, "utilization_report")}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToPDF(filteredData, "Utilization Report")}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print PDF
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 space-y-6">
        {/* Excel Upload Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="font-medium text-orange-800">
                  Manual Excel Integration
                </h3>
                <p className="text-sm text-orange-700">
                  Upload your Excel utilization data for analysis. Future
                  integration with telematics API will automate this process.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Car className="h-4 w-4 mr-2" />
                Total Vehicles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Avg Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgUtilization}h</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Avg Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgEfficiency}%</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Total Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {stats.totalDistance.toLocaleString()}km
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by vehicle registration or make..."
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
                  <th className="text-left p-3 font-semibold">Make/Model</th>
                  <th className="text-left p-3 font-semibold">
                    Utilization Hours
                  </th>
                  <th className="text-left p-3 font-semibold">Idle Hours</th>
                  <th className="text-left p-3 font-semibold">Efficiency</th>
                  <th className="text-left p-3 font-semibold">Distance (km)</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index} className="border-t hover:bg-green-50">
                    <td className="p-3 font-medium text-green-600">
                      {item.registration_number || "-"}
                    </td>
                    <td className="p-3">
                      {`${item.make || ""} ${item.model || ""}`.trim() || "-"}
                    </td>
                    <td className="p-3 font-medium">
                      {item.utilization_hours}h
                    </td>
                    <td className="p-3 text-orange-600">{item.idle_hours}h</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${item.efficiency}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {item.efficiency}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">
                      {item.distance_km.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <Badge
                        className={
                          item.efficiency > 80
                            ? "bg-green-100 text-green-800"
                            : item.efficiency > 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {item.efficiency > 80
                          ? "Excellent"
                          : item.efficiency > 60
                          ? "Good"
                          : "Poor"}
                      </Badge>
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
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">
                No utilization data found
              </h3>
              <p className="text-muted-foreground">
                Upload Excel data or adjust search criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
