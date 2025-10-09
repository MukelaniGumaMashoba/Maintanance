"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  FileText,
  DollarSign,
  Shield,
  Award,
  Wrench,
  Car,
  ChevronLeft,
  ChevronRight,
  Upload,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface WorkshopFormData {
  // 1. Workshop Details
  work_name: string
  trading_name: string
  number_of_working_days: number
  labour_rate: number
  fleet_rate: number
  company_registration_doc: string
  after_hours_number: string
  franchise: string

  // 2. VAT Information
  vat_number: number
  vat_certificate: string
  vat_cert_expiry_date: string

  // 3. BBBEE Information
  bbbee_level: string
  bbbee_doc: string
  hdi_perc: string
  bbbee_expire_date: string

  // 4. Insurance Information
  insurance_policy_number: number
  insurance_company_name: string
  insurance_policy_doc: string

  // 6. Type of Vehicles
  type_of_vehicle: string[]

  payment_method: string[]
  bank_name: string
  account_no: number
  bank_letter: string

  // 24. physical address
  province: string
  street: string
  city: string
  town: string
  postal_code: number
}

interface WorkshopData {
  work_name: string;
  trading_name?: string;
  number_of_working_days?: number;
  labour_rate?: number;
  fleet_rate?: number;
  company_registration_doc?: string | null;
  after_hours_number?: string;
  franchise?: string;
  vat_number?: number;
  vat_certificate?: string | null;
  vat_cert_expiry_date?: string | null;
  bbbee_level?: string;
  hdi_perc?: string;
  bbbee_expire_date?: string | null;
  insurance_policy_number?: number;
  insurance_company_name?: string;
  bank_name?: string;
  account_no?: number;
  bank_letter?: string;
  province?: string;
  street?: string;
  city?: string;
  town?: string;
  postal_code?: number;
}
// Arrays for selections:
const vehicleTypes = [
  "passenger",
  "sport utility vehicle (SUV)",
  "light delivery vehicles",
  "multi utility vehicles",
  "commercial",
  "passenger carrying",
  "yellow metals",
  "motorcycle",
  "special",
  "trailers",
  "boats",
]
const bbbeelevels = [
  "Level 1",
  "Level 2",
  "Level 3",
  "Level 4",
  "Level 5",
  "Level 6",
  "Level 7",
  "Level 8",
  "Non-Compliant",
]

const paymentMethods = ["EFT"]

export default function WorkshopRegistrationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, title: "Workshop Details", description: "Basic workshop information", icon: <Building2 className="h-2 w-2" /> },
    { id: 2, title: "VAT Information", description: "VAT details and documents", icon: <DollarSign className="h-2 w-2" /> },
    { id: 3, title: "BBBEE Information", description: "BBBEE certification", icon: <Award className="h-2 w-2" /> },
    { id: 4, title: "Insurance Information", description: "Insurance policy details", icon: <Shield className="h-2 w-2" /> },
    { id: 5, title: "Vehicle Types", description: "Specify vehicle types handled", icon: <Car className="h-2 w-2" /> },
    { id: 6, title: "Banking Details", description: "Bank account information", icon: <Award className="h-2 w-2" /> },
    { id: 7, title: "Physical Address", description: "Workshop physical location", icon: <Building2 className="h-2 w-2" /> },
  ]

  const [formData, setFormData] = useState<WorkshopFormData>({
    work_name: "",
    trading_name: "",
    number_of_working_days: 5,
    labour_rate: 0,
    fleet_rate: 0,
    company_registration_doc: "",
    after_hours_number: "",
    franchise: "",
    vat_number: 0,
    vat_certificate: "",
    vat_cert_expiry_date: "",
    bbbee_level: "",
    bbbee_doc: "",
    hdi_perc: "",
    bbbee_expire_date: "",
    insurance_policy_number: 0,
    insurance_company_name: "",
    insurance_policy_doc: "",
    type_of_vehicle: [],
    payment_method: [],
    bank_name: "",
    account_no: 0,
    bank_letter: "",
    province: "",
    street: "",
    city: "",
    town: "",
    postal_code: 0,
  })

  // Helpers
  const handleArrayChange = (field: keyof WorkshopFormData, value: string, checked: boolean) => {
    setFormData((prev) => {
      const arr = prev[field] as string[]
      if (checked) {
        return { ...prev, [field]: [...arr, value] }
      } else {
        return { ...prev, [field]: arr.filter((v) => v !== value) }
      }
    })
  }

  // Navigation
  const nextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1)
  }
  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const progress = (currentStep / steps.length) * 100

  // Render Step Content

  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Step 1: Workshop Details */}
            <div className="mb-2">
              <Label htmlFor="work_name">Workshop Name *</Label>
              <Input
                id="work_name"
                required
                value={formData.work_name}
                onChange={(e) => setFormData((f) => ({ ...f, work_name: e.target.value }))}
                placeholder="Official workshop name"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="trading_name">Trading Name</Label>
              <Input
                id="trading_name"
                value={formData.trading_name}
                onChange={(e) => setFormData((f) => ({ ...f, trading_name: e.target.value }))}
                placeholder="Trading name"
              />
            </div>
            <div className="mb-2">
              <Label>Working Days per Week *</Label>
              <Select
                value={formData.number_of_working_days.toString()}
                onValueChange={(v) => setFormData((f) => ({ ...f, number_of_working_days: parseInt(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Days</SelectItem>
                  <SelectItem value="6">6 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-2">
              <Label htmlFor="labour_rate">Labour Rate (per hour) *</Label>
              <Input
                id="labour_rate"
                type="number"
                min={0}
                step={0.01}
                required
                value={formData.labour_rate || ""}
                onChange={(e) => setFormData((f) => ({ ...f, labour_rate: Number(e.target.value) }))}
                placeholder="e.g., 100.00"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="fleet_rate">Fleet Rate (per hour) *</Label>
              <Input
                id="fleet_rate"
                type="number"
                min={0}
                step={0.01}
                required
                value={formData.fleet_rate || ""}
                onChange={(e) => setFormData((f) => ({ ...f, fleet_rate: Number(e.target.value) }))}
                placeholder="e.g., 90.00"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="after_hours_number">After Hours Contact Number</Label>
              <Input
                id="after_hours_number"
                type="tel"
                value={formData.after_hours_number}
                onChange={(e) => setFormData((f) => ({ ...f, after_hours_number: e.target.value }))}
                placeholder="+27 XX XXX XXXX"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="franchise">Franchise/Brand Affiliation</Label>
              <Input
                id="franchise"
                value={formData.franchise}
                onChange={(e) => setFormData((f) => ({ ...f, franchise: e.target.value }))}
                placeholder="e.g., Bosch, AA"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="company_registration_doc">Company Registration Document</Label>
              <Input
                id="company_registration_doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file)
                    setFormData((f) => ({ ...f, company_registration_doc: file.name }))
                }}
              />
              {formData.company_registration_doc && (
                <p className="text-sm mt-1">Uploaded: {formData.company_registration_doc}</p>
              )}
            </div>
          </>
        )
      case 2:
        return (
          <>
            {/* Step 2: VAT Information */}
            <div className="mb-2">
              <Label htmlFor="vat_number">VAT Number *</Label>
              <Input
                id="vat_number"
                type="number"
                required
                value={formData.vat_number || ""}
                onChange={(e) => setFormData((f) => ({ ...f, vat_number: Number(e.target.value) }))}
                placeholder="VAT registration number"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="vat_cert_expiry_date">VAT Certificate Expiry Date *</Label>
              <Input
                id="vat_cert_expiry_date"
                type="date"
                required
                value={formData.vat_cert_expiry_date}
                onChange={(e) => setFormData((f) => ({ ...f, vat_cert_expiry_date: e.target.value }))}
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="vat_certificate">VAT Certificate</Label>
              <Input
                id="vat_certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file)
                    setFormData((f) => ({ ...f, vat_certificate: file.name }))
                }}
              />
              {formData.vat_certificate && <p className="text-sm mt-1">Uploaded: {formData.vat_certificate}</p>}
            </div>
          </>
        )
      case 3:
        return (
          <>
            {/* Step 3: BBBEE Information */}
            <div className="mb-2">
              <Label htmlFor="bbbee_level">BBBEE Level *</Label>
              <Select
                value={formData.bbbee_level}
                onValueChange={(v) => setFormData((f) => ({ ...f, bbbee_level: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select BBBEE Level" />
                </SelectTrigger>
                <SelectContent>
                  {bbbeelevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-2">
              <Label htmlFor="hdi_perc">HDI Percentage</Label>
              <Input
                id="hdi_perc"
                value={formData.hdi_perc}
                onChange={(e) => setFormData((f) => ({ ...f, hdi_perc: e.target.value }))}
                placeholder="e.g. 51%"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="bbbee_expire_date">BBBEE Certificate Expiry *</Label>
              <Input
                id="bbbee_expire_date"
                type="date"
                required
                value={formData.bbbee_expire_date}
                onChange={(e) => setFormData((f) => ({ ...f, bbbee_expire_date: e.target.value }))}
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="bbbee_doc">BBBEE Certificate</Label>
              <Input
                id="bbbee_doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData((f) => ({ ...f, bbbee_doc: file.name }))
                }}
              />
              {formData.bbbee_doc && <p className="text-sm mt-1">Uploaded: {formData.bbbee_doc}</p>}
            </div>
          </>
        )
      case 4:
        return (
          <>
            {/* Step 4: Insurance Information */}
            <div className="mb-2">
              <Label htmlFor="insurance_policy_number">Insurance Policy Number *</Label>
              <Input
                id="insurance_policy_number"
                type="number"
                required
                value={formData.insurance_policy_number || ""}
                onChange={(e) => setFormData((f) => ({ ...f, insurance_policy_number: Number(e.target.value) }))}
                placeholder="Policy number"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="insurance_company_name">Insurance Company Name *</Label>
              <Input
                id="insurance_company_name"
                required
                value={formData.insurance_company_name}
                onChange={(e) => setFormData((f) => ({ ...f, insurance_company_name: e.target.value }))}
                placeholder="Company name"
              />
            </div>
            <div className="mb-2">
              <Label htmlFor="insurance_policy_doc">Insurance Policy Document</Label>
              <Input
                id="insurance_policy_doc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData((f) => ({ ...f, insurance_policy_doc: file.name }))
                }}
              />
              {formData.insurance_policy_doc && (
                <p className="text-sm mt-1">Uploaded: {formData.insurance_policy_doc}</p>
              )}
            </div>
          </>
        )
      case 5:
        return (
          <>
            {/* Step 5: Type of Vehicles */}
            <h3 className="font-semibold mb-2">Vehicle Types Handled</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto border p-2 rounded">
              {vehicleTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`vehicle-${type}`}
                    checked={formData.type_of_vehicle.includes(type)}
                    onCheckedChange={(checked) => handleArrayChange("type_of_vehicle", type, checked as boolean)}
                  />
                  <Label htmlFor={`vehicle-${type}`} className="capitalize text-sm">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </>
        )
      case 6:
        return (
          <>
            {/* Step 7: banking details */}
            <div>
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method.join(",")}
                onValueChange={(v) =>
                  setFormData((f) => ({
                    ...f,
                    payment_method: v.includes(",") ? v.split(",") : [v],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData((f) => ({ ...f, bank_name: e.target.value }))}
                placeholder="Bank Name"
              />
            </div>
            <div>
              <Label htmlFor="account_no">Account Number *</Label>
              <Input
                id="account_no"
                type="number"
                required
                value={formData.account_no || ""}
                onChange={(e) => setFormData((f) => ({ ...f, account_no: Number(e.target.value) }))}
                placeholder="Account Number"
              />
            </div>
            <div>
              <Label htmlFor="bank_letter">Bank Letter</Label>
              <Input
                id="bank_letter"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setFormData((f) => ({ ...f, bank_letter: file.name }))
                }}
              />
              {formData.bank_letter && <p className="text-sm mt-1">Uploaded: {formData.bank_letter}</p>}
            </div>
          </>
        )
      case 7:
        return (
          <>
            {/* Step 8: physical address */}
            <div>
              <Label htmlFor="province">Province *</Label>
              <Input
                id="province"
                required
                value={formData.province}
                onChange={(e) => setFormData((f) => ({ ...f, province: e.target.value }))}
                placeholder="Province"
              />
            </div>
            <div>
              <Label htmlFor="street">Street *</Label>
              <Input
                id="street"
                required
                value={formData.street}
                onChange={(e) => setFormData((f) => ({ ...f, street: e.target.value }))}
                placeholder="Street Address"
              />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="town">Town</Label>
              <Input
                id="town"
                value={formData.town}
                onChange={(e) => setFormData((f) => ({ ...f, town: e.target.value }))}
                placeholder="Town"
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code *</Label>
              <Input
                id="postal_code"
                type="number"
                required
                value={formData.postal_code || ""}
                onChange={(e) => setFormData((f) => ({ ...f, postal_code: Number(e.target.value) }))}
                placeholder="Postal Code"
              />
            </div>
          </>
        )
      default:
        return null
    }
  }

  const supabase = createClient()
  // Insert workshop & return inserted workshop record (including id)
  async function insertWorkshop(data: WorkshopData) {
    const { data: workshop, error } = await supabase
      .from("workshop")
      .insert(data)
      .select()
      .single();

    if (error || !workshop) throw error ?? new Error("Failed to insert workshop");
    else {
      // router.push("/register/workshop/fileUpload")
      const newUUID = workshop.id;
      router.push(`/register/workshop/fileUpload?workshopId=${newUUID}`);
    }
    return workshop;
  }

  // On submit
  const handleSubmit = (e: React.FormEvent, workshopData: WorkshopData) => {
    e.preventDefault()
    insertWorkshop(workshopData)
    localStorage.setItem("workshopRegistrationData", JSON.stringify(formData))

  }

  // Form submit handler wrapper
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Extract workshop data from formData
    const workshopData: WorkshopData = {
      work_name: formData.work_name,
      trading_name: formData.trading_name,
      number_of_working_days: formData.number_of_working_days,
      labour_rate: formData.labour_rate,
      fleet_rate: formData.fleet_rate,
      company_registration_doc: formData.company_registration_doc,
      after_hours_number: formData.after_hours_number,
      franchise: formData.franchise,
      vat_number: formData.vat_number,
      vat_certificate: formData.vat_certificate,
      vat_cert_expiry_date: formData.vat_cert_expiry_date,
      bbbee_level: formData.bbbee_level,
      hdi_perc: formData.hdi_perc,
      bbbee_expire_date: formData.bbbee_expire_date,
      insurance_policy_number: formData.insurance_policy_number,
      insurance_company_name: formData.insurance_company_name,
      bank_name: formData.bank_name,
      account_no: formData.account_no,
      bank_letter: formData.bank_letter,
      province: formData.province,
      street: formData.street,
      city: formData.city,
      town: formData.town,
      postal_code: formData.postal_code,
    }
    handleSubmit(e, workshopData)
  }


  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Workshop Registration</h1>

      {/* Steps Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= step.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-400"
                  }`}
              >
                {step.icon}
              </div>
              {step.id < steps.length && (
                <div className={`flex-1 h-1 mx-2 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-center mt-1 text-gray-600">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
        </p>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[currentStep - 1].icon}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" disabled={currentStep === 1} variant="outline" onClick={prevStep}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              Complete Registration
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Summary badges */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Registration Progress</h3>
        <div className="flex flex-wrap gap-2">
          {formData.work_name && <Badge variant="secondary">Workshop Name Set</Badge>}
          {formData.labour_rate > 0 && <Badge variant="secondary">Rates Configured</Badge>}
          {formData.vat_number > 0 && <Badge variant="secondary">VAT Registered</Badge>}
          {formData.bbbee_level && <Badge variant="secondary">BBBEE Level Set</Badge>}
          {formData.type_of_vehicle.length > 0 && (
            <Badge variant="secondary">{formData.type_of_vehicle.length} Vehicle Types</Badge>
          )}
          {formData.bank_name && <Badge variant="secondary">Bank Info Provided</Badge>}
          {formData.province && <Badge variant="secondary">Physical Address Set</Badge>}
        </div>
      </div>
    </div>
  )
}
