"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Truck, Car, FileText, TruckElectricIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogHeader, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogDescription } from '@/components/ui/dialog'
import Link from 'next/link'


const vehicleFormSchema = z.object({
  id: z.number().int().min(1, 'Registration number is required'),
  registration_number: z.string().min(1, 'Registration number is required'),
  engine_number: z.string().min(1, 'Engine number is required'),
  vin_number: z.string().min(1, 'VIN number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  sub_model: z.string().optional(),
  manufactured_year: z.string().min(1, 'Manufactured year is required'),
  vehicle_type: z.enum(['vehicle', 'trailer', 'commercial', 'tanker', 'truck', 'specialized'], { required_error: 'Vehicle type is required' }),
  registration_date: z.string().min(1, 'Registration date is required'),
  license_expiry_date: z.string().min(1, 'License expiry date is required'),
  purchase_price: z.string().min(1, 'Purchase price is required'),
  retail_price: z.string().min(1, 'Retail price is required'),
  vehicle_priority: z.enum(['high', 'medium', 'low'], { required_error: 'Vehicle priority is required' }),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'lpg'], { required_error: 'Fuel type is required' }),
  transmission_type: z.enum(['manual', 'automatic', 'cvt'], { required_error: 'Transmission type is required' }),
  tank_capacity: z.string().optional(),
  register_number: z.string().optional(),
  take_on_kilometers: z.string().min(1, 'Take on kilometers is required'),
  service_intervals: z.string().min(1, 'Service intervals is required'),
  boarding_km_hours: z.string().optional(),
  expected_boarding_date: z.string().optional(),
  cost_centres: z.string().optional(),
  colour: z.string().min(1, 'Colour is required'),
  created_by: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  tech_id: z.number().int().optional(),
  driver_id: z.number().int().optional(),
})

type VehicleFormValues = z.infer<typeof vehicleFormSchema>


interface Technician {
  id: number
  name: string,
  phone: string,
  email: string
}

interface Driver {
  id: number
  first_name: string
  surname: string
  cell_number: string
  email_address?: string | null
}


export default function Vehicles() {
  const [vehicles, setVehicles] = useState<VehicleFormValues[]>([])
  const [isAddingVehicle, setIsAddingVehicle] = useState(false)
  const [selectedVehicleReg, setSelectedVehicleReg] = useState("");
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const getDrivers = async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
      if (error) {
        console.error('Error fetching drivers:', error)
        setDrivers([])
        return
      }
      setDrivers(data as [])
    }
    getDrivers()
  }, [])

  useEffect(() => {
    const filtered = drivers.filter(driver =>
      `${driver.first_name} ${driver.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredDrivers(filtered)
  }, [searchTerm, drivers])

  const useWorkshopId = () => {
    const [workshopId, setWorkshopId] = useState<string | null>(null);
    useEffect(() => {
      const fetchWorkshopId = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('workshop_id')
          .eq('id', userId)
          .single();

        if (data && !error) {
          setWorkshopId(data.workshop_id);
        }
      };

      fetchWorkshopId();
    }, []);

    return workshopId;
  };
  const workshopId = useWorkshopId();
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [filteredTechs, setFilteredTechs] = useState<Technician[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const getTechnician = async () => {
      // Fetch technicians
      const { data: user, error: userError } = await supabase.auth.getUser()
      const currentUser = user.user?.id;

      if (!currentUser) {
        setTechnicians([])
        return;
      }
      const { data: techniciansData, error: techError } = await supabase
        .from('technicians')
        .select('*')
        .eq('type', 'internal')

      setTechnicians(techniciansData as [])

      if (techError) {
        console.error('Error fetching technicians:', techError)
        setTechnicians([])
        return
      }

    }
    getTechnician();
  }, []);

  useEffect(() => {
    const filtered = technicians.filter((tech) =>
      tech.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTechs(filtered as []);
  }, [searchTerm, technicians]);

  const handleUploadFile = () => {
    if (!selectedFile) return;
    // TODO: Implement upload logic here
    toast.info(`Uploading: ${selectedFile.name}`)
  }

  // Filter vehicles based on search
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchLower = search.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower) ||
      vehicle.registration_number.toLowerCase().includes(searchLower) ||
      vehicle.vehicle_type.toLowerCase().includes(searchLower)
    )
  })

  // Row background color by type
  const getRowBg = (type: string) => {
    switch (type) {
      case 'vehicle':
        return 'bg-blue-50';
      case 'trailer':
        return 'bg-purple-50';
      case 'truck':
        return 'bg-yellow-50';
      case 'commercial':
        return 'bg-green-50';
      case 'tanker':
        return 'bg-orange-50';
      case 'specialized':
        return 'bg-pink-50';
      default:
        return '';
    }
  }

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data: vehicles, error } = await supabase.from('vehiclesc').select('*').or('type.is.null,type.eq.internal');
      if (error) {
        console.error("the error is", error.name, error.message)
      } else {
        // @ts-expect-error
        setVehicles(vehicles || [])
      }
    }
    const vehiclesc = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehiclesc' },
        (payload) => {
          console.log('Change received!', payload)
        }
      )
      .subscribe()
    fetchVehicles()

    return () => {
      vehiclesc.unsubscribe;
    }
  }, [])


  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registration_number: '',
      engine_number: '',
      vin_number: '',
      make: '',
      model: '',
      sub_model: '',
      manufactured_year: '',
      vehicle_type: 'vehicle',
      registration_date: new Date().toISOString(),
      license_expiry_date: new Date().toISOString(),
      purchase_price: '',
      retail_price: '',
      vehicle_priority: 'medium',
      fuel_type: 'petrol',
      transmission_type: 'manual',
      tank_capacity: '',
      register_number: '',
      take_on_kilometers: '',
      service_intervals: '',
      boarding_km_hours: '',
      expected_boarding_date: new Date().toISOString(),
      cost_centres: '',
      colour: '',
      // created_by: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })

  const onSubmit = async (data: VehicleFormValues) => {
    await handleAddVehicle(data)
  }


  const handleAddVehicle = async (data: VehicleFormValues) => {
    const { data: vehicle, error } = await supabase
      .from('vehiclesc')
      // @ts-expect-error
      .insert(data)
    if (error) {
      console.error(error.message)
    } else {
      console.log(vehicle)
      toast.success('Vehicle added successfully')
      form.reset()
      setIsAddingVehicle(false)
      router.refresh()
    }
  }

  const getVehicleTypeIcon = (type: string) => {
    return type === 'vehicle' ? <Car className="w-4 h-4" /> : <Truck className="w-4 h-4" />
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>
  }

  async function handleAssignDriver(vehicleId: number, driverId: number) {
    const { data, error } = await supabase
      .from('vehiclesc')
      .update({ driver_id: driverId })
      .eq('id', vehicleId)
      .select()

    if (error) {
      console.error("Issue in assigning driver:", error.message)
      alert("Failed to assign driver: " + error.message)
      return
    }
    console.log("Driver assigned successfully:", data)
    // Optionally refresh or update state if needed
  }


  async function handleAssign(vehicleId: number, techId: number) {
    const { data: datav, error: errorv } = await supabase
      .from('vehiclesc')
      .update({ tech_id: techId })
      .eq('id', vehicleId)
      .select();

    if (errorv) {
      console.log("Issue in assigning: " + errorv.message);
      alert("Failed to assign technician: " + errorv.message);
      return;
    }
    console.log("Technician assigned successfully:", datav);
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-1">Manage your vehicle and trailer fleet</p>
        </div>
        <Button
          onClick={() => setIsAddingVehicle(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fleet</p>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">🚗</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vehicles</p>
                <p className="text-2xl font-bold text-green-600">
                  {vehicles.filter(v => v.vehicle_type === 'vehicle').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trailers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {vehicles.filter(v => v.vehicle_type === 'trailer').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {vehicles.filter(v => v.vehicle_priority === 'high').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm font-semibold">⚠</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Add Vehicle Form */}
      {isAddingVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 flex flex-col items-center bg-gray-50">
              <div className="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                <p className="text-lg font-semibold text-gray-700">Upload Vehicles</p>
                <p className="text-sm text-gray-500 mb-2">Upload new vehicles using a CSV or spreadsheet file</p>
              </div>
              <input
                id="vehicle-upload"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="border-2 p-2 rounded-4xl"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <span className="mt-2 text-sm text-gray-600">Selected: {selectedFile.name}</span>
              )}
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" type="button" disabled={!selectedFile} onClick={handleUploadFile}>
                Upload File
              </Button>
            </div>
          </CardContent>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Vehicle Type Selection */}
                  <FormField
                    control={form.control}
                    name="vehicle_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select vehicle type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vehicle">
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4" />
                                Vehicle
                              </div>
                            </SelectItem>
                            <SelectItem value="commercial">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Commercial
                              </div>
                            </SelectItem>
                            <SelectItem value="tanker">
                              <div className="flex items-center gap-2">
                                <TruckElectricIcon className="w-4 h-4" />
                                Truck
                              </div>
                            </SelectItem>
                            <SelectItem value="truck">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Tanker
                              </div>
                            </SelectItem>
                            <SelectItem value="specialized">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Specialized
                              </div>
                            </SelectItem>
                            <SelectItem value="trailer">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4" />
                                Trailer
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registration_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC 123 GP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make *</FormLabel>
                        <FormControl>
                          <Input placeholder="Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model *</FormLabel>
                        <FormControl>
                          <Input placeholder="Hilux" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sub_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Double Cab" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufactured_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufactured Year *</FormLabel>
                        <FormControl>
                          <Input placeholder="2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="petrol">Petrol</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                            <SelectItem value="lpg">LPG</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="transmission_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transmission" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="automatic">Automatic</SelectItem>
                            <SelectItem value="cvt">CVT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="boarding_km_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boarding KM/Hours</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expected_boarding_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Boarding Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cost_centres"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Centres</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Admin Dept" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="register_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Register Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ZN123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tank_capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tank Capacity (L)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="vehicle_priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="colour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colour *</FormLabel>
                        <FormControl>
                          <Input placeholder="White" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price *</FormLabel>
                        <FormControl>
                          <Input placeholder="R 500,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="retail_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retail Price *</FormLabel>
                        <FormControl>
                          <Input placeholder="R 550,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="take_on_kilometers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Take On Kilometers *</FormLabel>
                        <FormControl>
                          <Input placeholder="50,000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service_intervals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Intervals *</FormLabel>
                        <FormControl>
                          <Input placeholder="15,000 km" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAddVehicle(form.getValues())}
                    type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="w-4 h-4 mr-2" />
                    Save Vehicle
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingVehicle(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Vehicle List */}
      {vehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <div className="mt-2">
              <Input
                placeholder="Search by make, model, registration, or type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle, index) => (
                  <TableRow key={vehicle.id} className={getRowBg(vehicle?.vehicle_type)}>
                    <TableCell className="flex items-center gap-2">
                      {getVehicleTypeIcon(vehicle.vehicle_type)}
                      <span>{vehicle.make} {vehicle.model}</span>
                    </TableCell>
                    <TableCell>{vehicle.registration_number}</TableCell>
                    <TableCell>{vehicle.manufactured_year}</TableCell>
                    <TableCell>{vehicle.fuel_type}</TableCell>
                    <TableCell>{vehicle.colour}</TableCell>
                    <TableCell className="capitalize">{vehicle.vehicle_type}</TableCell>
                    <TableCell>{getPriorityBadge(vehicle.vehicle_priority)}</TableCell>
                    {/* <TableCell>
                      {technicians.find(tech => tech.id === vehicle.tech_id)?.name || " "}
                    </TableCell> */}
                    <TableCell className="flex items-center gap-2">
                      {drivers.find(driver => driver.id === vehicle.driver_id) ? (
                        <>
                          <span>
                            {drivers.find(driver => driver.id === vehicle.driver_id)?.first_name} {drivers.find(driver => driver.id === vehicle.driver_id)?.surname}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2"
                            onClick={async () => {
                              // Clear driver assignment
                              const { error } = await supabase
                                .from('vehiclesc')
                                .update({ driver_id: null })
                                .eq('id', vehicle.id);

                              if (error) {
                                alert('Failed to unassign driver: ' + error.message);
                                console.error(error);
                              } else {
                                toast.success('Driver unassigned successfully');
                                router.refresh(); // refresh list to show update
                              }
                            }}
                          >
                            Unassign
                          </Button>
                        </>
                      ) : (
                        <span>Not Assigned</span>
                      )}
                    </TableCell>



                    <TableCell>
                      <div className="flex flex-row gap-3">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="px-4 py-2"
                              onClick={() => {
                                setSelectedVehicleReg(vehicle.registration_number);
                                setSelectedVehicleId(vehicle.id); // NEW: store actual ID
                                setDialogOpen(true);
                              }}
                            >
                              Assign
                            </Button>

                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md w-full">
                            <DialogTitle>Assign Driver</DialogTitle>
                            <DialogDescription>
                              Assign driver for vehicle with registration: <strong>{selectedVehicleReg}</strong>
                            </DialogDescription>
                            {/* technician search & list */}
                            <Input
                              placeholder="Search driver by name"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="mb-4"
                            />
                            <div className="max-h-60 overflow-auto space-y-2">
                              {/* {filteredTechs.length > 0 ? (
                                filteredTechs.map((tech, index) => (
                                  <button
                                    key={tech.id}
                                    onClick={() => {
                                      if (selectedVehicleId) {
                                        handleAssign(selectedVehicleId, tech.id);
                                        setDialogOpen(false);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  >
                                    {tech.name}
                                  </button>
                                ))
                              ) : (
                                <p className="text-center text-sm text-gray-500 py-4">No technicians found</p>
                              )} */}
                              {filteredDrivers.length > 0 ? (
                                filteredDrivers.map((driver) => (
                                  <button
                                    key={driver.id}
                                    onClick={() => {
                                      if (selectedVehicleId) {
                                        handleAssignDriver(selectedVehicleId, driver.id);
                                        setDialogOpen(false);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                  >
                                    {driver.first_name} {driver.surname}
                                  </button>
                                ))
                              ) : (
                                <p className="text-center text-sm text-gray-500 py-4">No drivers found</p>
                              )}

                            </div>
                          </DialogContent>
                        </Dialog>

                        <Link href={`/vehicles/${vehicle.id}`}>
                          <Button variant="default">View</Button>
                        </Link>

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


    </div>
  )
}