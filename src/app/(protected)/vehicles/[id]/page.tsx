"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit3, Save, X, Trash2, Car } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import RepairHistory from "@/components/RepairHistory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Vehicle {
  id: number;
  registration_number: string;
  engine_number: string | null;
  vin_number: string | null;
  make: string | null;
  model: string;
  sub_model: string | null;
  manufactured_year: string;
  vehicle_type: string;
  registration_date: string | null;
  license_expiry_date: string | null;
  purchase_price: number | null;
  retail_price: number | null;
  vehicle_priority: string | null;
  fuel_type: string | null;
  transmission_type: string | null;
  tank_capacity: number | null;
  register_number: string | null;
  take_on_kilometers: number;
  service_intervals: string;
  boarding_km_hours: number | null;
  expected_boarding_date: string | null;
  cost_centres: string | null;
  colour: string;
  created_at: string;
  updated_at: string;
  inspected: boolean | null;
  type: string | null;
  workshop_id: string | null;
  status: string | null;
  operator_name: string | null;
  site: string | null;
  chasis: string | null;
  asset_type: string | null;
}

export default function VehicleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Vehicle | null>(null);

  const fetchVehicle = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vehiclesc_workshop")
      .select("*")
      .eq("id", Number(params.id))
      .single();

    if (error) {
      console.error(error);
      toast.error("Error loading vehicle details");
    } else {
      setVehicle(data as Vehicle);
    }
    setLoading(false);
  }, [params.id, supabase]);

  useEffect(() => {
    if (params?.id) fetchVehicle();
  }, [params.id, fetchVehicle]);

  const handleDelete = async () => {
    if (!vehicle) return;
    setDeleting(true);

    const { error } = await supabase
      .from("vehiclesc_workshop")
      .delete()
      .eq("id", vehicle.id);

    setDeleting(false);

    if (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("Failed to delete vehicle");
    } else {
      toast.success("Vehicle archived successfully");
      router.push("/vehicles");
    }
  };

  const handleUpdate = async () => {
    if (!editData) return;
    const { error } = await supabase
      .from("vehiclesc_workshop")
      .update(editData)
      .eq("id", editData.id);
    if (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Failed to update vehicle details");
      return;
    }
    setVehicle(editData);
    toast.success("Vehicle details updated");
    setEditing(false);
    fetchVehicle();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!editData) return;
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const startEditing = () => {
    if (!vehicle) return;
    setEditData(JSON.parse(JSON.stringify(vehicle)));
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Car className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Vehicle Not Found</h2>
          <p className="text-slate-500 mb-6">This vehicle may have been removed or archived.</p>
          <Button onClick={() => router.push("/vehicles")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vehicles
          </Button>
        </div>
      </div>
    );
  }

  function EditableField({
    label,
    name,
    value,
    type = "text",
    options,
    disabled = false,
  }: {
    label: string;
    name: keyof Vehicle;
    value: any;
    type?: string;
    options?: string[];
    disabled?: boolean;
  }) {
    const displayValue = value === null || value === undefined || value === "" ? "—" : value;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-600">{label}</Label>
        {editing ? (
          options ? (
            <Select
              value={editData?.[name]?.toString() ?? ""}
              onValueChange={(val) => {
                if (!editData) return;
                setEditData({ ...editData, [name]: val });
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              name={name as string}
              type={type}
              value={editData?.[name]?.toString() ?? ""}
              onChange={handleInputChange}
              disabled={disabled}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="h-10"
            />
          )
        ) : (
          <div className="px-3 py-2 bg-white border border-slate-200 rounded-md text-slate-900 min-h-[40px] flex items-center">
            {displayValue}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-slate-500 text-sm">
                Registration: {vehicle.registration_number}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <Button 
                  onClick={handleUpdate} 
                  disabled={!editData}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                onClick={startEditing} 
                variant="outline"
                className="border-slate-300"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={deleting}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive Vehicle</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive the vehicle. It won't appear in active lists but will remain in the database for records.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? "Archiving..." : "Archive Vehicle"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableField
                  label="Registration Number"
                  name="registration_number"
                  value={vehicle.registration_number}
                />
                <EditableField
                  label="Make"
                  name="make"
                  value={vehicle.make}
                />
                <EditableField
                  label="Model"
                  name="model"
                  value={vehicle.model}
                />
                <EditableField
                  label="Sub Model"
                  name="sub_model"
                  value={vehicle.sub_model}
                />
                <EditableField
                  label="Year"
                  name="manufactured_year"
                  value={vehicle.manufactured_year}
                  type="number"
                />
                <EditableField
                  label="Color"
                  name="colour"
                  value={vehicle.colour}
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableField
                  label="VIN Number"
                  name="vin_number"
                  value={vehicle.vin_number}
                />
                <EditableField
                  label="Engine Number"
                  name="engine_number"
                  value={vehicle.engine_number}
                />
                <EditableField
                  label="Chassis Number"
                  name="chasis"
                  value={vehicle.chasis}
                />
                <EditableField
                  label="Vehicle Type"
                  name="vehicle_type"
                  value={vehicle.vehicle_type}
                  options={['vehicle', 'trailer', 'commercial', 'tanker', 'truck', 'specialized']}
                />
                <EditableField
                  label="Fuel Type"
                  name="fuel_type"
                  value={vehicle.fuel_type}
                  options={['petrol', 'diesel', 'electric', 'hybrid']}
                />
                <EditableField
                  label="Transmission"
                  name="transmission_type"
                  value={vehicle.transmission_type}
                  options={['manual', 'automatic', 'cvt']}
                />
                <EditableField
                  label="Tank Capacity (L)"
                  name="tank_capacity"
                  value={vehicle.tank_capacity}
                  type="number"
                />
                <EditableField
                  label="Service Intervals"
                  name="service_intervals"
                  value={vehicle.service_intervals}
                />
                <EditableField
                  label="Priority"
                  name="vehicle_priority"
                  value={vehicle.vehicle_priority}
                  options={['low', 'medium', 'high']}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial & Operational */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Financial & Operational
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableField
                  label="Purchase Price (R)"
                  name="purchase_price"
                  value={vehicle.purchase_price}
                  type="number"
                />
                <EditableField
                  label="Retail Price (R)"
                  name="retail_price"
                  value={vehicle.retail_price}
                  type="number"
                />
                <EditableField
                  label="Take On KM"
                  name="take_on_kilometers"
                  value={vehicle.take_on_kilometers}
                  type="number"
                />
                <EditableField
                  label="Boarding Hours"
                  name="boarding_km_hours"
                  value={vehicle.boarding_km_hours}
                  type="number"
                />
                <EditableField
                  label="Cost Centres"
                  name="cost_centres"
                  value={vehicle.cost_centres}
                />
                <EditableField
                  label="Status"
                  name="status"
                  value={vehicle.status}
                  options={['active', 'inactive', 'maintenance', 'retired']}
                />
                <EditableField
                  label="Site"
                  name="site"
                  value={vehicle.site}
                />
                <EditableField
                  label="Operator Name"
                  name="operator_name"
                  value={vehicle.operator_name}
                />
                <EditableField
                  label="Asset Type"
                  name="asset_type"
                  value={vehicle.asset_type}
                />
              </div>
            </CardContent>
          </Card>

          {/* Important Dates */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableField
                  label="Registration Date"
                  name="registration_date"
                  value={vehicle.registration_date}
                  type="date"
                />
                <EditableField
                  label="License Expiry Date"
                  name="license_expiry_date"
                  value={vehicle.license_expiry_date}
                  type="date"
                />
                <EditableField
                  label="Expected Boarding Date"
                  name="expected_boarding_date"
                  value={vehicle.expected_boarding_date}
                  type="date"
                />
              </div>
            </CardContent>
          </Card>

          {/* Repair History */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Repair History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RepairHistory vehicleId={vehicle.registration_number} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}