"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Building2, MapPin, Users, Truck } from "lucide-react"
import { registerCompanyWithAdmin } from "@/lib/action/company"

export default function CompanySetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Basic Info
    companyName: "",
    contactName: "",
    email: "",
    phone: "",

    // Company Details
    industry: "",
    companySize: "",
    website: "",
    taxId: "",

    // Address
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",

    // Fleet Information
    fleetSize: "",
    vehicleTypes: "",
    operatingRegions: "",
    currentSystem: "",

    // Admin User
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
    adminRole: "",
  })

  useEffect(() => {
    // Load initial registration data
    const savedData = localStorage.getItem("registrationData")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setFormData((prev) => ({
        ...prev,
        companyName: parsed.companyName || "",
        contactName: parsed.contactName || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        fleetSize: parsed.fleetSize || "",
      }))
    }
  }, [])

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1)
    } else {
      const result = await registerCompanyWithAdmin({
        company_name: formData.companyName,
        company_contact: formData.contactName,
        company_email: formData.email,
        company_phone: formData.phone,
        company_contactname: formData.contactName,
        company_size: parseInt(formData.companySize) || 0,
        company_infor: "",
        company_industry: formData.industry,
        company_website: formData.website,
        company_tax_id: formData.taxId,
        company_no_vehicles: parseInt(formData.fleetSize) || 0,
        company_v_type: formData.vehicleTypes,
        company_regions: formData.operatingRegions,
        company_fms: formData.currentSystem,
      }, {
        firstName: formData.adminFirstName,
        lastName: formData.adminLastName,
        email: formData.adminEmail,
        phone: formData.adminPhone,
        role: formData.adminRole || "fleet manager",
      })
      if (result.error) {
        alert("Failed to register company: " + result.error)
        return
      }
      if (result.admin) {
        alert(`Admin user created!\nEmail: ${result.admin.email}\nTemporary password: ${result.admin.tempPassword}`)
      } else {
        alert("Company registered, but admin credentials could not be retrieved.")
      }
      // Store company and admin data for onboarding
      localStorage.setItem("companySetupData", JSON.stringify({
        ...formData,
        adminCredentials: result.admin,
        companyId: (result.data as any)?.[0]?.id,
      }))
      router.push("/register/onboarding")
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.push("/register")
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Company Information</h2>
              <p className="text-gray-600">Tell us about your company</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logistics">Logistics & Transportation</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="delivery">Delivery Services</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companySize">Company Size *</Label>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-1000">201-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="taxId">Tax ID / Business Registration Number</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Company Address</h2>
              <p className="text-gray-600">Where is your company located?</p>
            </div>

            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="state"
                  required
                  placeholder="South Africa"
                  value={"South Africa"}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  readOnly
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                <Input
                  id="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Durban">Durban</SelectItem>
                    <SelectItem value="ca">Cape Town</SelectItem>
                    <SelectItem value="lmp">Limpopo</SelectItem>
                    <SelectItem value="au">Eastern Cape</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Truck className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Fleet Information</h2>
              <p className="text-gray-600">Tell us about your fleet</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fleetSize">Fleet Size *</Label>
                <Input
                  id="fleetSize"
                  required
                  type="number"
                  value={formData.fleetSize}
                  onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                  placeholder="Number of vehicles"
                />
              </div>
              <div>
                <Label htmlFor="vehicleTypes">Vehicle Types *</Label>
                <Select
                  value={formData.vehicleTypes}
                  onValueChange={(value) => setFormData({ ...formData, vehicleTypes: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Primary vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trucks">Trucks</SelectItem>
                    <SelectItem value="vans">Vans</SelectItem>
                    <SelectItem value="cars">Cars</SelectItem>
                    <SelectItem value="heavy-equipment">Heavy Equipment</SelectItem>
                    <SelectItem value="mixed">Mixed Fleet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="operatingRegions">Operating Regions</Label>
              <Textarea
                id="operatingRegions"
                value={formData.operatingRegions}
                onChange={(e) => setFormData({ ...formData, operatingRegions: e.target.value })}
                placeholder="Describe the regions where your fleet operates..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="currentSystem">Current Fleet Management System</Label>
              <Select
                value={formData.currentSystem}
                onValueChange={(value) => setFormData({ ...formData, currentSystem: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="What system do you currently use?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No current system</SelectItem>
                  <SelectItem value="spreadsheets">Spreadsheets</SelectItem>
                  <SelectItem value="other-software">Other fleet software</SelectItem>
                  <SelectItem value="custom">Custom solution</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Admin User Setup</h2>
              <p className="text-gray-600">Create the primary administrator account</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminFirstName">First Name *</Label>
                <Input
                  id="adminFirstName"
                  required
                  value={formData.adminFirstName}
                  onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="adminLastName">Last Name *</Label>
                <Input
                  id="adminLastName"
                  required
                  value={formData.adminLastName}
                  onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="adminEmail">Email Address *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="adminPhone">Phone Number</Label>
                <Input
                  id="adminPhone"
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="adminRole">Role/Title</Label>
              <Input
                id="adminRole"
                placeholder="Fleet Manager"
                value={"fleet manager"}
                onChange={(e) => setFormData({ ...formData, adminRole: e.target.value })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Company Setup</CardTitle>
              <CardDescription>Step {step} of 4</CardDescription>
            </div>
            <div className="text-sm text-gray-500">{Math.round((step / 4) * 100)}% Complete</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
              {step === 4 ? "Complete Setup" : "Next Step"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
