"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  Clock,
  Building2,
  FileText,
  Phone,
  Mail
} from "lucide-react"

export default function WorkshopSuccessPage() {
  const router = useRouter()
  const [workshopData, setWorkshopData] = useState<any>(null)
  const supabase = createClient()
  const handleContinue = () => {
    router.push("/dashboard")
  }

  useEffect(() => {
    const fetchWorkshopData = async () => {
      const { data, error } = await supabase
        .from("workshop")
        .select("*, capabilities(*)")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error("Error fetching workshop data:", error)
        return
      }

      setWorkshopData({
        ...data,
        type_of_vehicle: data.vehicles_type || [],
        type_of_workshop: data.workshop_type || [],
        engineering_shop_capability: extractCapabilities(data.capabilities),
      })
    }

    fetchWorkshopData()
  }, [])

  const extractCapabilities = (capabilities: any) => {
    if (!capabilities) return []
    return Object.entries(capabilities)
      .filter(([key, value]) => typeof value === "boolean" && value)
      .map(([key]) => key.replace(/_/g, " "))
  }

  if (!workshopData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p>Loading registration details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-green-900 mb-2">Workshop Registration</h1>
        <p className="text-green-700">
          Welcome to the Breakdown App workshop network. Your application is being reviewed. But need to upload files for the tools.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Workshop Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold">{workshopData.work_name}</p>
              {workshopData.trading_name && (
                <p className="text-sm text-gray-600">Trading as: {workshopData.trading_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{workshopData.number_of_working_days} working days per week</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Labour Rate</p>
                <p className="font-semibold">R{workshopData.labour_rate}/hour</p>
              </div>
              <div>
                <p className="text-gray-600">Fleet Rate</p>
                <p className="font-semibold">R{workshopData.fleet_rate}/hour</p>
              </div>
            </div>
            {workshopData.franchise && (
              <div>
                <p className="text-gray-600">Franchise</p>
                <p className="font-semibold">{workshopData.franchise}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">VAT Registration</span>
              <Badge variant="secondary">VAT {workshopData.vat_number}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">BBBEE Level</span>
              <Badge variant="secondary">{workshopData.bbbee_level}</Badge>
            </div>
            {workshopData.hdi_perc && (
              <div className="flex items-center justify-between">
                <span className="text-sm">HDI Percentage</span>
                <Badge variant="secondary">{workshopData.hdi_perc}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Insurance</span>
              <Badge variant="secondary">{workshopData.insurance_company_name}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Workshop Capabilities</CardTitle>
          <CardDescription>Services and vehicle types you can handle</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Vehicle Types ({workshopData.type_of_vehicle.length})</h4>
            <div className="flex flex-wrap gap-2">
              {workshopData.type_of_vehicle.map((type: string, index: number) => (
                <Badge key={index} variant="outline" className="capitalize">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Workshop Services ({workshopData.type_of_workshop.length})</h4>
            <div className="flex flex-wrap gap-2">
              {workshopData.type_of_workshop.map((service: string, index: number) => (
                <Badge key={index} variant="outline" className="capitalize">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {workshopData.engineering_shop_capability.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                Engineering Capabilities ({workshopData.engineering_shop_capability.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {workshopData.engineering_shop_capability.map((capability: string, index: number) => (
                  <Badge key={index} variant="outline" className="capitalize">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[`Application Review`, `Workshop Inspection`, `Account Activation`, `Start Receiving Jobs`].map(
              (step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{step}</h4>
                    <p className="text-sm text-gray-600">
                      {[
                        `Our team will review your application and verify all submitted documents within 2–3 business days.`,
                        `A quality assurance representative will schedule a visit to verify your workshop capabilities.`,
                        `Once approved, you'll receive login credentials and access to the workshop portal.`,
                        `Begin receiving breakdown and maintenance jobs from our fleet management clients.`
                      ][idx]}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold">Phone Support</p>
                <p className="text-sm text-gray-600">+27 11 123 4567</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold">Email Support</p>
                <p className="text-sm text-gray-600">workshops@fleetpro.co.za</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700">
          Continue to Dashboard
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print Registration Summary
        </Button>
      </div>

      <div className="text-center mt-8 text-gray-500">
        <p className="text-sm">
          Registration ID: WS-{Date.now().toString().slice(-6)} | Submitted: {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
