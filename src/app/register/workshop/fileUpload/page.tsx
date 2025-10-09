"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Wrench,
  Car,
  ChevronLeft,
  ChevronRight,
  Camera,
  Smartphone,
  Monitor,
  FileText,
} from "lucide-react"

import { createClient } from "@/lib/supabase/client"

// Arrays for selections
const workshopTypes = [
  "breakdown",
  "car wash",
  "driver line repairs",
  "electrical",
  "fitment centre (Batteries)",
  "fitment centre (Glass)",
  "fitment centre (Tyres)",
  "fitment centre (Exhaust)",
  "fitment centre (Retro Fitments)",
  "mechanical",
  "towing",
  "vehicle testing station",
  "engineering shop",
  "check overall",
  "due for service",
]

const engineeringCapabilities = [
  "crank grinding",
  "head pressure test",
  "engine block resurfacing",
  "block pressure test",
  "valve grinding",
  "block boring",
]

// Reusable Boolean + Optional File Input component
interface BooleanFileInputProps {
  label: string
  boolField: keyof CapabilitiesFormData
  fileField?: keyof CapabilitiesFormData
  formData: CapabilitiesFormData
  setFormData: React.Dispatch<React.SetStateAction<CapabilitiesFormData>>
  accept?: string
  multipleFile?: boolean
  isMobile?: boolean
}

function BooleanFileInput({
  label,
  boolField,
  fileField,
  formData,
  setFormData,
  accept = ".pdf,.jpg,.jpeg,.png",
  multipleFile = false,
  isMobile = false,
}: BooleanFileInputProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id={boolField}
          checked={formData[boolField] as boolean}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              [boolField]: checked,
              ...(checked === false && fileField ? { [fileField]: multipleFile ? [] : "" } : {}),
            }))
          }
        />
        <Label htmlFor={boolField}>{label}</Label>
      </div>

      {fileField && formData[boolField] && (
        <div className="mt-2">
          <Label htmlFor={fileField}>Upload {label} Document/Image</Label>
          {isMobile ? (
            <div className="mt-2">
              <Input
                id={String(fileField)}
                type="file"
                accept="image/*"
                capture="environment"
                multiple={multipleFile}
                onChange={(e) => {
                  const files = e.target.files
                  if (files && fileField) {
                    if (multipleFile) {
                      const fileNames = Array.from(files).map((file) => file.name)
                      setFormData((prev) => ({
                        ...prev,
                        [fileField]: fileNames,
                      }))
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        [fileField]: files[0]?.name || "",
                      }))
                    }
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                📱 Using camera for mobile upload
              </p>
            </div>
          ) : (
            <Input
              id={String(fileField)}
              type="file"
              accept={accept}
              multiple={multipleFile}
              onChange={(e) => {
                const files = e.target.files
                if (files && fileField) {
                  if (multipleFile) {
                    const fileNames = Array.from(files).map((file) => file.name)
                    setFormData((prev) => ({
                      ...prev,
                      [fileField]: fileNames,
                    }))
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      [fileField]: files[0]?.name || "",
                    }))
                  }
                }
              }}
            />
          )}
          {/* Show uploaded file(s) */}
          {multipleFile ? (
            Array.isArray(formData[fileField]) &&
            formData[fileField].length > 0 && (
              <ul className="text-sm mt-1 text-gray-700 list-disc ml-4">
                {(formData[fileField] as string[]).map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
              </ul>
            )
          ) : (
            formData[fileField] && (
              <p className="text-sm mt-1 text-gray-700">Uploaded: {formData[fileField]}</p>
            )
          )}
        </div>
      )}
    </div>
  )
}

// Define the capabilities and tools interface
interface CapabilitiesFormData {
  // Workshop Types
  type_of_workshop: string[]

  // Workshop Associations
  dekra: boolean
  apmma: boolean
  cra: boolean
  era: boolean
  mibco: boolean
  miwa: boolean
  raaf: boolean
  rmi: boolean
  saarsa: boolean
  sambra: boolean
  saqa: boolean
  sata: boolean

  dekra_doc: string
  apmma_doc: string
  cra_doc: string
  era_doc: string
  mibco_doc: string
  miwa_doc: string
  raaf_doc: string
  rmi_doc: string
  saarsa_doc: string
  sambra_doc: string
  saqa_doc: string
  sata_doc: string

  // Engineering Shop Capability
  engineering_shop_capability: string[]
  block_boring: boolean
  crank_grinding: boolean
  valve_grinding: boolean
  block_pressure_test: boolean
  engine_block_resurfacing: boolean

  // Engineering Shop Tools
  micrometer: boolean
  vernier_caliper: boolean
  aluminum_welding: boolean
  straight_Edge: boolean
  depth_gauge: boolean
  lathe_guage: boolean
  lathe_machine: boolean
  honing_tool: boolean

  micrometer_picture: string
  vernier_caliper_picture: string
  aluminum_welding_picture: string
  straight_Edge_picture: string
  depth_gauge_picture: string
  lathe_guage_picture: string
  lathe_machine_picture: string
  honing_tool_picture: string

  // Car Wash Capability
  standard_wash: boolean
  valet: boolean
  vehicles_detailing: boolean

  // Car Wash Tools
  high_pressure_wash: boolean
  polisher_machine: boolean
  vacuum_cleaner: boolean

  high_pressure_wash_picture: string
  polisher_machine_picture: string
  vacuum_cleaner_picture: string

  // Mechanical Capability
  suspension: boolean
  service: boolean
  m_brakes: boolean
  minor_repairs: boolean
  major_repairs: boolean
  engine_overhuals: boolean
  drive_line: boolean
  clutch_overhuals: boolean

  // Mechanical Tools
  four_two: boolean
  engine_crane_mech: boolean
  jack_mech: boolean
  mechanical_tool: boolean
  trestles: boolean
  compression_tester: boolean
  compressor_mech: boolean
  pneumatic_tool: boolean

  four_two_picture: string
  engine_crane_mech_picture: string
  jack_mech_picture: string
  mechanical_tool_picture: string
  trestles_picture: string
  compression_tester_picture: string
  compressor_mech_picture: string
  pneumatic_tool_picture: string

  // Electrical Capability
  wiring_minor: boolean
  wiring_major: boolean
  starters: boolean
  light_retros: boolean
  radios_audio: boolean
  two_way_radio: boolean

  // Electrical Tools
  starter: boolean
  alternator: boolean
  multi_meter: boolean
  batter_charge_tool: boolean

  starter_picture: string
  alternator_picture: string
  multi_meter_picture: string
  batter_charge_tool_picture: string

  // Panel Beater Capability
  msr: boolean
  nsr: boolean
  hail_demage: boolean
  couch_builder: boolean
  body_modification: boolean
  ambulance: boolean
  cash_in_transit: boolean
  dent_vehicles: boolean

  // Panel Beater Tools
  spray_booth: boolean
  spray_gun: boolean
  jig: boolean
  mixing_booth: boolean
  compressor_tool: boolean
  straighning_tool: boolean
  tig_welder_tool: boolean
  mig_welder_tool: boolean

  spray_booth_picture: string
  spray_gun_picture: string
  jig_picture: string
  mixing_booth_picture: string
  compressor_tool_picture: string
  straighning_tool_picture: string
  tig_welder_tool_picture: string
  mig_welder_tool_picture: string

  // Fitment Center Tyre Tools
  wheel_alignment: boolean
  wheel_balancing: boolean

  wheel_alignment_machine_picture: string
  wheel_balancing_machine_picture: string

  // Fitment Center Exhaust Tools
  tig_welder: boolean
  mig_welder: boolean
  pipe_bender: boolean

  tig_welder_picture: string
  mig_welder_picture: string
  pipe_bender_picture: string

  // Fitment Center Battery Tools
  battery_charge: boolean
  battery_tester: boolean
  battery_charge_doc: string
  battery_tester_pictures: string[]

  // Driver Line Capability
  brakes: boolean
  driver_line_cv_joints: boolean
  clutch_over_huals: boolean
  gearbox_bench: boolean
  propshaft_bench: boolean

  // Driver Line Tools
  four_or_two_post_hoist: boolean
  engine_crane: boolean
  jack: boolean
  mechanical_tools: boolean
  trestle: boolean
  press: boolean
  compressor: boolean
  pneumatic_tools: boolean
  gearbox_test_bench: boolean
  propshaft_test_bench: boolean

  four_or_two_post_hoist_doc: string
  engine_crane_doc: string
  jack_doc: string
  mechanical_tools_doc: string
  trestle_doc: string
  press_doc: string
  compressor_doc: string
  pneumatic_tools_doc: string
  gearbox_test_bench_doc: string
  propshaft_test_bench_doc: string
}


// const engineeringCapabilities = [
//     "crank grinding",
//     "head pressure test",
//     "engine block resurfacing",
//     "block pressure test",
//     "valve grinding",
//     "block boring",
//   ]


// Extract capabilities data
// const capabilitiesData: Omit<CapabilitiesData, 'workshop_id'> = {
//   dekra: formData.dekra,
//   apmma: formData.apmma,
//   brakes: formData.brakes,
//   gearbox_bench: formData.gearbox_bench,
// }

// Extract tools data (you'll need to map your formData to tools array)
const toolsData: Omit<WorkshopToolData, 'workshop_id'>[] = []

// Extract documents data (you'll need to map your formData to documents array)
const documentsData: Omit<WorkshopDocumentData, 'workshop_id'>[] = []

// Reusable Boolean + Optional File Input component
// interface BooleanFileInputProps {
//   label: string
//   boolField: keyof CapabilitiesFormData
//   fileField?: keyof CapabilitiesFormData
//   formData: CapabilitiesFormData
//   setFormData: React.Dispatch<React.SetStateAction<CapabilitiesFormData>>
//   accept?: string
//   multipleFile?: boolean // for array file uploads only, default false
// }

// function BooleanFileInput({
//   label,
//   boolField,
//   fileField,
//   formData,
//   setFormData,
//   accept = ".pdf,.jpg,.jpeg,.png",
//   multipleFile = false,
// }: BooleanFileInputProps) {
//   return (
//     <div className="mb-4">
//       <div className="flex items-center space-x-2">
//         <Checkbox
//           id={boolField}
//           checked={formData[boolField] as boolean}
//           onCheckedChange={(checked) =>
//             setFormData((prev) => ({
//               ...prev,
//               [boolField]: checked,
//               ...(checked === false && fileField ? { [fileField]: multipleFile ? [] : "" } : {}),
//             }))
//           }
//         />
//         <Label htmlFor={boolField}>{label}</Label>
//       </div>

//       {fileField && formData[boolField] && (
//         <div className="mt-2">
//           <Label htmlFor={fileField}>Upload {label} Document/Image</Label>
//           <Input
//             id={String(fileField)}
//             type="file"
//             accept={accept}
//             multiple={multipleFile}
//             onChange={(e) => {
//               const files = e.target.files
//               if (files && fileField) {
//                 if (multipleFile) {
//                   // Read names of all files
//                   const fileNames = Array.from(files).map((file) => file.name)
//                   setFormData((prev) => ({
//                     ...prev,
//                     [fileField]: fileNames,
//                   }))
//                 } else {
//                   setFormData((prev) => ({
//                     ...prev,
//                     [fileField]: files[0]?.name || "",
//                   }))
//                 }
//               }
//             }}
//           />
//           {/* Show uploaded file(s) */}
//           {multipleFile ? (
//             Array.isArray(formData[fileField]) &&
//             formData[fileField].length > 0 && (
//               <ul className="text-sm mt-1 text-gray-700 list-disc ml-4">
//                 {(formData[fileField] as string[]).map((name, idx) => (
//                   <li key={idx}>{name}</li>
//                 ))}
//               </ul>
//             )
//           ) : (
//             formData[fileField] && (
//               <p className="text-sm mt-1 text-gray-700">Uploaded file: {formData[fileField]}</p>
//             )
//           )}
//         </div>
//       )}
//     </div>
//   )
// }

interface CapabilitiesData {
  workshop_id: string;
  dekra?: boolean;
  apmma?: boolean;
  brakes?: boolean;
  gearbox_bench?: boolean;
}

interface WorkshopToolData {
  workshop_id: string;
  category: string;
  tool_name: string;
  has_tool: boolean;
  document_url?: string | null;
  verified?: boolean;
  picture?: string | null,
}

interface WorkshopDocumentData {
  workshop_id: string;
  document_type: string;
  document_url?: string | null;
  verified?: boolean;
}

function FileUploadignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const searchParams = useSearchParams();
  const workshopId = searchParams.get("workshopId");
  useEffect(() => {
    if (workshopId) {
      console.log("Received UUID:", workshopId);
    }
  }, [workshopId]);


  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width <= 768)
      setIsTablet(width > 768 && width <= 1024)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])


  const steps = [
    { id: 1, title: "Workshop Types", description: "Select workshop types", icon: <Wrench className="h-2 w-2" /> },
    { id: 2, title: "Workshop Associations", description: "Associations and certificates", icon: <FileText className="h-2 w-2" /> },
    { id: 3, title: "Engineering Shop Tools", description: "Tools for engineering shop", icon: <Wrench className="h-2 w-2" /> },
    { id: 4, title: "Car Wash Tools", description: "Tools for car wash", icon: <Car className="h-2 w-2" /> },
    { id: 5, title: "Mechanical Tools", description: "Mechanical tools list", icon: <Wrench className="h-2 w-2" /> },
    { id: 6, title: "Electrical Tools", description: "Electrical tools list", icon: <Wrench className="h-2 w-2" /> },
    { id: 7, title: "Panel Beater Tools", description: "Tools for panel beating", icon: <Wrench className="h-2 w-2" /> },
  ]

  const [formData, setFormData] = useState<CapabilitiesFormData>({
    // Workshop Types
    type_of_workshop: [],

    // Workshop Associations
    dekra: false,
    apmma: false,
    cra: false,
    era: false,
    mibco: false,
    miwa: false,
    raaf: false,
    rmi: false,
    saarsa: false,
    sambra: false,
    saqa: false,
    sata: false,

    dekra_doc: "",
    apmma_doc: "",
    cra_doc: "",
    era_doc: "",
    mibco_doc: "",
    miwa_doc: "",
    raaf_doc: "",
    rmi_doc: "",
    saarsa_doc: "",
    sambra_doc: "",
    saqa_doc: "",
    sata_doc: "",

    // Engineering Shop Capability
    engineering_shop_capability: [],
    block_boring: false,
    crank_grinding: false,
    valve_grinding: false,
    block_pressure_test: false,
    engine_block_resurfacing: false,

    // Engineering Shop Tools
    micrometer: false,
    vernier_caliper: false,
    aluminum_welding: false,
    straight_Edge: false,
    depth_gauge: false,
    lathe_guage: false,
    lathe_machine: false,
    honing_tool: false,

    micrometer_picture: "",
    vernier_caliper_picture: "",
    aluminum_welding_picture: "",
    straight_Edge_picture: "",
    depth_gauge_picture: "",
    lathe_guage_picture: "",
    lathe_machine_picture: "",
    honing_tool_picture: "",

    // Car Wash Capability
    standard_wash: false,
    valet: false,
    vehicles_detailing: false,

    // Car Wash Tools
    high_pressure_wash: false,
    polisher_machine: false,
    vacuum_cleaner: false,

    high_pressure_wash_picture: "",
    polisher_machine_picture: "",
    vacuum_cleaner_picture: "",

    // Mechanical Capability
    suspension: false,
    service: false,
    m_brakes: false,
    minor_repairs: false,
    major_repairs: false,
    engine_overhuals: false,
    drive_line: false,
    clutch_overhuals: false,

    // Mechanical Tools
    four_two: false,
    engine_crane_mech: false,
    jack_mech: false,
    mechanical_tool: false,
    trestles: false,
    compression_tester: false,
    compressor_mech: false,
    pneumatic_tool: false,

    four_two_picture: "",
    engine_crane_mech_picture: "",
    jack_mech_picture: "",
    mechanical_tool_picture: "",
    trestles_picture: "",
    compression_tester_picture: "",
    compressor_mech_picture: "",
    pneumatic_tool_picture: "",

    // Electrical Capability
    wiring_minor: false,
    wiring_major: false,
    starters: false,
    light_retros: false,
    radios_audio: false,
    two_way_radio: false,

    // Electrical Tools
    starter: false,
    alternator: false,
    multi_meter: false,
    batter_charge_tool: false,

    starter_picture: "",
    alternator_picture: "",
    multi_meter_picture: "",
    batter_charge_tool_picture: "",

    // Panel Beater Capability
    msr: false,
    nsr: false,
    hail_demage: false,
    couch_builder: false,
    body_modification: false,
    ambulance: false,
    cash_in_transit: false,
    dent_vehicles: false,

    // Panel Beater Tools
    spray_booth: false,
    spray_gun: false,
    jig: false,
    mixing_booth: false,
    compressor_tool: false,
    straighning_tool: false,
    tig_welder_tool: false,
    mig_welder_tool: false,

    spray_booth_picture: "",
    spray_gun_picture: "",
    jig_picture: "",
    mixing_booth_picture: "",
    compressor_tool_picture: "",
    straighning_tool_picture: "",
    tig_welder_tool_picture: "",
    mig_welder_tool_picture: "",

    // Fitment Center Tyre Tools
    wheel_alignment: false,
    wheel_balancing: false,

    wheel_alignment_machine_picture: "",
    wheel_balancing_machine_picture: "",

    // Fitment Center Exhaust Tools
    tig_welder: false,
    mig_welder: false,
    pipe_bender: false,

    tig_welder_picture: "",
    mig_welder_picture: "",
    pipe_bender_picture: "",

    // Fitment Center Battery Tools
    battery_charge: false,
    battery_tester: false,
    battery_charge_doc: "",
    battery_tester_pictures: [],

    // Driver Line Capability
    brakes: false,
    driver_line_cv_joints: false,
    clutch_over_huals: false,
    gearbox_bench: false,
    propshaft_bench: false,

    // Driver Line Tools
    four_or_two_post_hoist: false,
    engine_crane: false,
    jack: false,
    mechanical_tools: false,
    trestle: false,
    press: false,
    compressor: false,
    pneumatic_tools: false,
    gearbox_test_bench: false,
    propshaft_test_bench: false,

    four_or_two_post_hoist_doc: "",
    engine_crane_doc: "",
    jack_doc: "",
    mechanical_tools_doc: "",
    trestle_doc: "",
    press_doc: "",
    compressor_doc: "",
    pneumatic_tools_doc: "",
    gearbox_test_bench_doc: "",
    propshaft_test_bench_doc: "",
  })

  // Helpers
  const handleArrayChange = (field: keyof CapabilitiesFormData, value: string, checked: boolean) => {
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

  const supabase = createClient();

  // Insert capabilities for given workshop_id
  // async function insertCapabilities(data: Omit<CapabilitiesData, 'workshop_id'>, workshop_id: string) {
  //   const { data: cap, error } = await supabase
  //     .from("capabilities")
  //     .insert([{ ...data, workshop_id }])
  //     .select()
  //     .single();

  //   if (error || !cap) throw error ?? new Error("Failed to insert capabilities");
  //   return cap;
  // }

  // Insert multiple tools for a workshop
  // async function insertWorkshopTools(tools: WorkshopToolData[]) {
  //   const { data, error } = await supabase
  //     .from("workshop_tools")
  //     .insert(tools);

  //   if (error) throw error;
  //   return data;
  // }
  // Insert multiple documents for a workshop
  async function insertWorkshopDocuments(docs: WorkshopDocumentData[]) {
    const { data, error } = await supabase
      .from("workshop_documents")
      .insert(docs as []);

    if (error) throw error;
    return data;
  }


  // Render Step Content
  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <>
            {/* Step 1: Workshop Types */}
            <h3 className="font-semibold mb-2">Select Workshop Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto border p-2 rounded">
              {workshopTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`workshop-${type}`}
                    checked={formData.type_of_workshop.includes(type)}
                    onCheckedChange={(checked) => handleArrayChange("type_of_workshop", type, checked as boolean)}
                  />
                  <Label htmlFor={`workshop-${type}`} className="capitalize text-sm">{type}</Label>
                </div>
              ))}
            </div>
          </>
        )
      case 2:
        return (
          <>
            {/* Step 2: Workshop Associations */}
            {[
              { bool: "dekra", doc: "dekra_doc", label: "DEKRA" },
              { bool: "apmma", doc: "apmma_doc", label: "APMMA" },
              { bool: "cra", doc: "cra_doc", label: "CRA" },
              { bool: "era", doc: "era_doc", label: "ERA" },
              { bool: "mibco", doc: "mibco_doc", label: "MIBCO" },
              { bool: "miwa", doc: "miwa_doc", label: "MIWA" },
              { bool: "raaf", doc: "raaf_doc", label: "RAAF" },
              { bool: "rmi", doc: "rmi_doc", label: "RMI" },
              { bool: "saarsa", doc: "saarsa_doc", label: "SAARSA" },
              { bool: "sambra", doc: "sambra_doc", label: "SAMBRA" },
              { bool: "saqa", doc: "saqa_doc", label: "SAQA" },
              { bool: "sata", doc: "sata_doc", label: "SATA" },
            ].map(({ bool, doc, label }) => (
              <BooleanFileInput
                key={bool}
                label={label}
                boolField={bool as keyof CapabilitiesFormData}
                fileField={doc as keyof CapabilitiesFormData}
                formData={formData}
                setFormData={setFormData}
                isMobile={isMobile}
              />
            ))}
          </>
        )
      case 3:
        return (
          <>
            {/* Step 3: Engineering Shop Capability */}
            <h3 className="font-semibold mb-2">Engineering Shop Capabilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-auto border p-2 rounded mb-4">
              {engineeringCapabilities.map((cap) => (
                <div key={cap} className="flex items-center space-x-2">
                  <Checkbox
                    id={`eng-${cap}`}
                    checked={formData.engineering_shop_capability.includes(cap)}
                    onCheckedChange={(checked) => handleArrayChange("engineering_shop_capability", cap, checked as boolean)}
                  />
                  <Label htmlFor={`eng-${cap}`} className="capitalize text-sm">{cap}</Label>
                </div>
              ))}
            </div>

            {/* Step 3: Engineering Shop Tools */}
            <h3 className="font-semibold mb-2">Engineering Shop Tools</h3>
            {[
              { bool: "micrometer", file: "micrometer_picture", label: "Micrometer" },
              { bool: "vernier_caliper", file: "vernier_caliper_picture", label: "Vernier Caliper" },
              { bool: "aluminum_welding", file: "aluminum_welding_picture", label: "Aluminum Welding" },
              { bool: "straight_Edge", file: "straight_Edge_picture", label: "Straight Edge" },
              { bool: "depth_gauge", file: "depth_gauge_picture", label: "Depth Gauge" },
              { bool: "lathe_guage", file: "lathe_guage_picture", label: "Lathe Gauge" },
              { bool: "lathe_machine", file: "lathe_machine_picture", label: "Lathe Machine" },
              { bool: "honing_tool", file: "honing_tool_picture", label: "Honing Tool" },
            ].map(({ bool, file, label }) => (
              <BooleanFileInput
                key={bool}
                label={label}
                boolField={bool as keyof CapabilitiesFormData}
                fileField={file as keyof CapabilitiesFormData}
                formData={formData}
                setFormData={setFormData}
                isMobile={isMobile}
              />
            ))}
          </>
        )
      case 4:
        return (
          <>
            {/* Step 4: Car Wash Capability */}
            <h3 className="font-semibold mb-2">Car Wash Capabilities</h3>
            {[
              { bool: "standard_wash", label: "Standard Wash" },
              { bool: "valet", label: "Valet" },
              { bool: "vehicles_detailing", label: "Vehicles Detailing" },
            ].map(({ bool, label }) => (
              <div key={bool} className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id={bool}
                  checked={formData[bool as keyof CapabilitiesFormData] as boolean}
                  onCheckedChange={(checked) =>
                    setFormData((f) => ({ ...f, [bool]: checked }))
                  }
                />
                <Label htmlFor={bool}>{label}</Label>
              </div>
            ))}

            {/* Step 4: Car Wash Tools */}
            <h3 className="font-semibold mb-2">Car Wash Tools</h3>
            {[
              { bool: "high_pressure_wash", file: "high_pressure_wash_picture", label: "High Pressure Wash" },
              { bool: "polisher_machine", file: "polisher_machine_picture", label: "Polisher Machine" },
              { bool: "vacuum_cleaner", file: "vacuum_cleaner_picture", label: "Vacuum Cleaner" },
            ].map(({ bool, file, label }) => (
              <BooleanFileInput
                key={bool}
                label={label}
                boolField={bool as keyof CapabilitiesFormData}
                fileField={file as keyof CapabilitiesFormData}
                formData={formData}
                setFormData={setFormData}
                isMobile={isMobile}
              />
            ))}
          </>
        )
      case 5:
        return (
          <>
            {/* Step 5: Mechanical Capability */}
            <h3 className="font-semibold mb-2">Mechanical Capabilities</h3>
            {[
              "suspension",
              "service",
              "m_brakes",
              "minor_repairs",
              "major_repairs",
              "engine_overhuals",
              "drive_line",
              "clutch_overhuals",
            ].map((key) => (
              <div key={key} className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={formData[key as keyof CapabilitiesFormData] as boolean}
                  onCheckedChange={(checked) =>
                    setFormData((f) => ({ ...f, [key]: checked }))
                  }
                />
                <Label htmlFor={key}>{key.replace(/_/g, " ")}</Label>
              </div>
            ))}

            {/* Step 5: Mechanical Tools */}
            <h3 className="font-semibold mb-2">Mechanical Tools</h3>
            {[
              { bool: "four_two", file: "four_two_picture", label: "Four Two" },
              { bool: "engine_crane_mech", file: "engine_crane_mech_picture", label: "Engine Crane" },
              { bool: "jack_mech", file: "jack_mech_picture", label: "Jack" },
              { bool: "mechanical_tool", file: "mechanical_tool_picture", label: "Mechanical Tool" },
              { bool: "trestles", file: "trestles_picture", label: "Trestles" },
              { bool: "compression_tester", file: "compression_tester_picture", label: "Compression Tester" },
              { bool: "compressor_mech", file: "compressor_mech_picture", label: "Compressor" },
              { bool: "pneumatic_tool", file: "pneumatic_tool_picture", label: "Pneumatic Tool" },
            ].map(({ bool, file, label }) => (
              <BooleanFileInput
                key={bool}
                label={label}
                boolField={bool as keyof CapabilitiesFormData}
                fileField={file as keyof CapabilitiesFormData}
                formData={formData}
                setFormData={setFormData}
                isMobile={isMobile}
              />
            ))}
          </>
        )
      case 6:
        return (
          <>
            {/* Step 6: Electrical Capability */}
            <h3 className="font-semibold mb-2">Electrical Capabilities</h3>
            {[
              "wiring_minor",
              "wiring_major",
              "starters",
              "light_retros",
              "radios_audio",
              "two_way_radio",
            ].map((key) => (
              <div key={key} className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={formData[key as keyof CapabilitiesFormData] as boolean}
                  onCheckedChange={(checked) => setFormData((f) => ({ ...f, [key]: checked }))}
                />
                <Label htmlFor={key}>{key.replace(/_/g, " ")}</Label>
              </div>
            ))}

            {/* Step 6: Electrical Tools */}
            <h3 className="font-semibold mb-2">Electrical Tools</h3>
            {[
              { bool: "starter", file: "starter_picture", label: "Starter" },
              { bool: "alternator", file: "alternator_picture", label: "Alternator" },
              { bool: "multi_meter", file: "multi_meter_picture", label: "Multi Meter" },
              { bool: "batter_charge_tool", file: "batter_charge_tool_picture", label: "Battery Charge Tool" },
            ].map(({ bool, file, label }) => (
              <BooleanFileInput
                key={bool}
                label={label}
                boolField={bool as keyof CapabilitiesFormData}
                fileField={file as keyof CapabilitiesFormData}
                formData={formData}
                setFormData={setFormData}
                isMobile={isMobile}
              />
            ))}
          </>
        )
      case 7:
        return (
          <>
            {/* Step 7: Panel Beater Capability */}
            <h3 className="font-semibold mb-2">Panel Beater Capabilities</h3>
            {[
              "msr",
              "nsr",
              "hail_demage",
              "couch_builder",
              "body_modification",
              "ambulance",
              "cash_in_transit",
              "dent_vehicles",
            ].map((key) => (
              <div key={key} className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={formData[key as keyof CapabilitiesFormData] as boolean}
                  onCheckedChange={(checked) => setFormData((f) => ({ ...f, [key]: checked }))}
                />
                <Label htmlFor={key}>{key.replace(/_/g, " ")}</Label>
              </div>
            ))}

            {/* Step 7: Panel Beater Tools */}
            <h3 className="font-semibold mb-2">Panel Beater Tools</h3>
            {[
              { bool: "spray_booth", file: "spray_booth_picture", label: "Spray Booth" },
              { bool: "spray_gun", file: "spray_gun_picture", label: "Spray Gun" },
              { bool: "jig", file: "jig_picture", label: "Jig" },
              { bool: "mixing_booth", file: "mixing_booth_picture", label: "Mixing Booth" },
              { bool: "compressor_tool", file: "compressor_tool_picture", label: "Compressor" },
              { bool: "straighning_tool", file: "straighning_tool_picture", label: "Straightening Tool" },
              { bool: "tig_welder_tool", file: "tig_welder_tool_picture", label: "TIG Welder" },
              { bool: "mig_welder_tool", file: "mig_welder_tool_picture", label: "MIG Welder" },
            ].map(({ bool, file, label }) => (
              <BooleanFileInput
                key={bool}
                label={label}
                boolField={bool as keyof CapabilitiesFormData}
                fileField={file as keyof CapabilitiesFormData}
                formData={formData}
                setFormData={setFormData}
                isMobile={isMobile}
              />
            ))}
          </>
        )
      default:
        return null
    }
  }

  async function updateWorkshop(workshopId: string, selectedTypes: string[]) {
    const { data, error } = await supabase
      .from("workshop")
      .update({
        workshop_type: formData.type_of_workshop
      })
      .eq('id', workshopId.toString())
      .single();

    if (error) {
      console.error("Failed to update workshop:", error);
    } else {
      console.log("Workshop updated:", data);
    }
  }

  async function insertCapabilities(workshopId: string, formData: CapabilitiesFormData) {
    const payload = {
      workshop_id: workshopId,
      // Workshop Associations
      dekra: formData.dekra,
      apmma: formData.apmma,
      cra: formData.cra,
      era: formData.era,
      mibco: formData.mibco,
      miwa: formData.miwa,
      raaf: formData.raaf,
      rmi: formData.rmi,
      saarsa: formData.saarsa,
      sambra: formData.sambra,
      saqa: formData.saqa,
      sata: formData.sata,

      // Engineering Shop Capabilities
      block_boring: formData.block_boring,
      crank_grinding: formData.crank_grinding,
      valve_grinding: formData.valve_grinding,
      block_pressure_test: formData.block_pressure_test,
      engine_block_resurfacing: formData.engine_block_resurfacing,

      // Car Wash Capabilities
      standard_wash: formData.standard_wash,
      valet: formData.valet,
      vehicles_detailing: formData.vehicles_detailing,

      // Mechanical Capabilities
      suspension: formData.suspension,
      service: formData.service,
      m_brakes: formData.m_brakes,
      minor_repairs: formData.minor_repairs,
      major_repairs: formData.major_repairs,
      engine_overhuals: formData.engine_overhuals,
      drive_line: formData.drive_line,
      clutch_overhuals: formData.clutch_overhuals,

      // Electrical Capabilities
      wiring_minor: formData.wiring_minor,
      wiring_major: formData.wiring_major,
      starters: formData.starters,
      light_retros: formData.light_retros,
      radios_audio: formData.radios_audio,
      two_way_radio: formData.two_way_radio,

      // Panel Beater Capabilities
      msr: formData.msr,
      nsr: formData.nsr,
      hail_demage: formData.hail_demage,
      couch_builder: formData.couch_builder,
      body_modification: formData.body_modification,
      ambulance: formData.ambulance,
      cash_in_transit: formData.cash_in_transit,
      dent_vehicles: formData.dent_vehicles,

      // Fitment Center Tyre Capabilities
      wheel_alignment: formData.wheel_alignment,
      wheel_balancing: formData.wheel_balancing,

      // Fitment Center Exhaust Capabilities
      tig_welder: formData.tig_welder,
      mig_welder: formData.mig_welder,
      pipe_bender: formData.pipe_bender,

      // Fitment Center Battery Capabilities
      battery_charge: formData.battery_charge,
      battery_tester: formData.battery_tester,

      // Driver Line Capabilities
      brakes: formData.brakes,
      driver_line_cv_joints: formData.driver_line_cv_joints,
      clutch_over_huals: formData.clutch_over_huals,
      gearbox_bench: formData.gearbox_bench,
      propshaft_bench: formData.propshaft_bench
    };

    const { data, error } = await supabase
      .from("capabilities")
      .upsert([payload]); // .upsert ensures it replaces if exists

    if (error) throw error;
    return data;
  }
  async function insertWorkshopTools(workshopId: string, formData: CapabilitiesFormData) {
    const toolPayload: WorkshopToolData[] = [];

    // Define all tool mappings: boolean field, file field, category
    const toolMap = [
      // 🔌 Electrical Tools
      { bool: "starter", file: "starter_picture", category: "Electrical" },
      { bool: "alternator", file: "alternator_picture", category: "Electrical" },
      { bool: "multi_meter", file: "multi_meter_picture", category: "Electrical" },
      { bool: "batter_charge_tool", file: "batter_charge_tool_picture", category: "Electrical" },

      // 🧰 Mechanical Tools
      { bool: "four_two", file: "four_two_picture", category: "Mechanical" },
      { bool: "engine_crane_mech", file: "engine_crane_mech_picture", category: "Mechanical" },
      { bool: "jack_mech", file: "jack_mech_picture", category: "Mechanical" },
      { bool: "mechanical_tool", file: "mechanical_tool_picture", category: "Mechanical" },
      { bool: "trestles", file: "trestles_picture", category: "Mechanical" },
      { bool: "compression_tester", file: "compression_tester_picture", category: "Mechanical" },
      { bool: "compressor_mech", file: "compressor_mech_picture", category: "Mechanical" },
      { bool: "pneumatic_tool", file: "pneumatic_tool_picture", category: "Mechanical" },

      // 🧼 Car Wash Tools
      { bool: "high_pressure_wash", file: "high_pressure_wash_picture", category: "Car Wash" },
      { bool: "polisher_machine", file: "polisher_machine_picture", category: "Car Wash" },
      { bool: "vacuum_cleaner", file: "vacuum_cleaner_picture", category: "Car Wash" },

      // ⚙️ Engineering Shop Tools
      { bool: "micrometer", file: "micrometer_picture", category: "Engineering" },
      { bool: "vernier_caliper", file: "vernier_caliper_picture", category: "Engineering" },
      { bool: "aluminum_welding", file: "aluminum_welding_picture", category: "Engineering" },
      { bool: "straight_Edge", file: "straight_Edge_picture", category: "Engineering" },
      { bool: "depth_gauge", file: "depth_gauge_picture", category: "Engineering" },
      { bool: "lathe_guage", file: "lathe_guage_picture", category: "Engineering" },
      { bool: "lathe_machine", file: "lathe_machine_picture", category: "Engineering" },
      { bool: "honing_tool", file: "honing_tool_picture", category: "Engineering" },

      // 🛠️ Panel Beater Tools
      { bool: "spray_booth", file: "spray_booth_picture", category: "Panel Beater" },
      { bool: "spray_gun", file: "spray_gun_picture", category: "Panel Beater" },
      { bool: "jig", file: "jig_picture", category: "Panel Beater" },
      { bool: "mixing_booth", file: "mixing_booth_picture", category: "Panel Beater" },
      { bool: "compressor_tool", file: "compressor_tool_picture", category: "Panel Beater" },
      { bool: "straighning_tool", file: "straighning_tool_picture", category: "Panel Beater" },
      { bool: "tig_welder_tool", file: "tig_welder_tool_picture", category: "Panel Beater" },
      { bool: "mig_welder_tool", file: "mig_welder_tool_picture", category: "Panel Beater" },

      // 🔧 Fitment Centre Tools
      { bool: "wheel_alignment", file: "wheel_alignment_machine_picture", category: "Fitment - Tyres" },
      { bool: "wheel_balancing", file: "wheel_balancing_machine_picture", category: "Fitment - Tyres" },
      { bool: "tig_welder", file: "tig_welder_picture", category: "Fitment - Exhaust" },
      { bool: "mig_welder", file: "mig_welder_picture", category: "Fitment - Exhaust" },
      { bool: "pipe_bender", file: "pipe_bender_picture", category: "Fitment - Exhaust" },
      { bool: "battery_charge", file: "battery_charge_doc", category: "Fitment - Battery" },
      { bool: "battery_tester", file: "battery_tester_pictures", category: "Fitment - Battery" },

      // 🧱 Driver Line Tools
      { bool: "four_or_two_post_hoist", file: "four_or_two_post_hoist_doc", category: "Driver Line" },
      { bool: "engine_crane", file: "engine_crane_doc", category: "Driver Line" },
      { bool: "jack", file: "jack_doc", category: "Driver Line" },
      { bool: "mechanical_tools", file: "mechanical_tools_doc", category: "Driver Line" },
      { bool: "trestle", file: "trestle_doc", category: "Driver Line" },
      { bool: "press", file: "press_doc", category: "Driver Line" },
      { bool: "compressor", file: "compressor_doc", category: "Driver Line" },
      { bool: "pneumatic_tools", file: "pneumatic_tools_doc", category: "Driver Line" },
      { bool: "gearbox_test_bench", file: "gearbox_test_bench_doc", category: "Driver Line" },
      { bool: "propshaft_test_bench", file: "propshaft_test_bench_doc", category: "Driver Line" }
    ];

    // Build payload
    for (const item of toolMap) {
      const hasTool = formData[item.bool as keyof CapabilitiesFormData];
      if (hasTool) {
        const document = formData[item.file as keyof CapabilitiesFormData];
        toolPayload.push({
          workshop_id: workshopId,
          category: item.category,
          tool_name: item.bool,
          has_tool: true,
          document_url: typeof document === "string" ? document : null,
          picture: typeof document === "string" ? document : null,
          verified: false
        });
      }
    }

    const { data, error } = await supabase
      .from("workshop_tools")
      .insert(toolPayload);

    if (error) throw error;
    return data;
  }



  const handleSubmit = async (e: React.FormEvent, workshopId: string) => {
    e.preventDefault();


    // Insert capabilities
    await insertCapabilities(workshopId, formData);
    await insertWorkshopTools(workshopId, formData);

    // Insert documents
    const documentKeys = Object.keys(formData).filter((key) => key.endsWith("_doc") || key.endsWith("_picture"));
    const documentPayload = documentKeys.map((key) => ({
      workshop_id: workshopId,
      document_type: key,
      document_url: (formData as any)[key],
      verified: false,
    }));
    await insertWorkshopDocuments(documentPayload as []);
    // Insert tools
    const toolPayload = [];
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === "boolean" && key.endsWith("_tool")) {
        const pictureKey = `${key}_picture`;
        toolPayload.push({
          workshop_id: workshopId,
          category: "derived from key", // optionally categorize based on prefix
          tool_name: key,
          has_tool: value,
          document_url: (formData as any)[pictureKey] ?? null,
          verified: false,
        });
      }
    }
    // Only insert tools if there are any in the payload
    try {
      const result = await insertWorkshopTools(workshopId, formData);
      console.log("Workshop tools successfully inserted:", result);
    } catch (error) {
      console.error("Error inserting tools:", error);
    }
    // Update workshop types
    await updateWorkshop(workshopId, formData.type_of_workshop);

    router.push("/register/workshop/success");
  };


  // Show device-specific message for desktop users
  if (!isMobile && !isTablet) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <Smartphone className="h-16 w-16 text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-800">Mobile Upload Required</h1>
          <p className="text-gray-600">
            Please use your mobile device to upload workshop capabilities and tools documentation.
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Monitor className="h-4 w-4" />
            <span>Desktop upload not available</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center space-x-2 mb-4">
        {isMobile ? <Smartphone className="h-5 w-5 text-blue-600" /> : <Camera className="h-5 w-5 text-blue-600" />}
        <h1 className="text-2xl font-bold">
          {isMobile ? "Mobile Upload" : "Tablet Upload"} - Workshop Capabilities
        </h1>
      </div>

      {/* Device Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {isMobile ? <Smartphone className="h-4 w-4 text-blue-600" /> : <Camera className="h-4 w-4 text-blue-600" />}
          <span className="text-sm font-medium">
            {isMobile ? "Mobile device detected" : "Tablet device detected"} - Camera upload enabled
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          📱 Location services will be used for document verification
        </p>
      </div>

      {/* Steps Progress Bar */}
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <p className="text-center mt-1 text-gray-600">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, workshopId!)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {steps[currentStep - 1].icon}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
          </CardContent>
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
              Complete Upload
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Summary badges */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Upload Progress</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Mobile Upload Ready</Badge>
          <Badge variant="secondary">Camera Enabled</Badge>
        </div>
      </div>
    </div>
  )
}

export default function FileUploadPage() {
  <Suspense fallback={<div>Loading file upload...</div>}>
    <FileUploadignPage />
  </Suspense>
} 