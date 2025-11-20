"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// NOTE: This file is self-contained for convenience. It uploads files to
// the Supabase storage *bucket* named `files` and places them under:
// - images/drivers/  (for front/rear license images)
// - files/driver/    (for work permit docs)
// Make sure your Supabase project has a bucket called `files` and the
// appropriate RLS/policies or public access for getPublicUrl to work.

type Driver = {
  id?: number;
  first_name: string;
  surname: string;
  id_or_passport_number: string;
  id_or_passport_document?: string | null;
  email_address?: string | null;
  cell_number?: string | null;
  sa_issued?: boolean;
  work_permit_upload?: string | null;
  license_number?: string | null;
  license_expiry_date?: string | null;
  license_code?: string | null;
  driver_restriction_code?: string | null;
  vehicle_restriction_code?: string | null;
  front_of_driver_pic?: string | null;
  rear_of_driver_pic?: string | null;
  professional_driving_permit?: boolean;
  pdp_expiry_date?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  user_id?: string | null;
};

export default function Drivers() {
  const supabase = createClient();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [licenseFilter, setLicenseFilter] = useState<"all" | "sa" | "foreign">(
    "all"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingDriverId, setEditingDriverId] = useState<number | null>(null);

  const emptyForm: Driver = {
    first_name: "",
    surname: "",
    id_or_passport_number: "",
    id_or_passport_document: null,
    email_address: null,
    cell_number: null,
    sa_issued: false,
    work_permit_upload: null,
    license_number: null,
    license_expiry_date: null,
    license_code: null,
    driver_restriction_code: null,
    vehicle_restriction_code: null,
    front_of_driver_pic: null,
    rear_of_driver_pic: null,
    professional_driving_permit: false,
    pdp_expiry_date: null,
    created_by: null,
  };

  const [formData, setFormData] = useState<Driver>(emptyForm);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("drivers_klaver")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDrivers((data ?? []) as Driver[]);
    } catch (err) {
      console.error("fetchDrivers error", err);
      toast.error("Failed to fetch drivers");
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Small utility: uploads a File to the `files` bucket and returns the public URL
  const uploadToStorage = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadingField(folder);

      const bucket = "files"; // <-- your bucket name
      const ext = file.name.split(".").pop() ?? "bin";
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("upload error", uploadError);
        toast.error("Failed to upload file");
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      const publicUrl = publicUrlData?.publicUrl ?? null;
      if (!publicUrl) {
        toast.error("Failed to get public url");
        return null;
      }
      toast.success("Uploaded successfully");
      return publicUrl;
    } catch (err) {
      console.error("Unexpected upload error", err);
      toast.error("Unexpected upload error");
      return null;
    } finally {
      setIsUploading(false);
      setUploadingField(null);
    }
  };

  const handleInputChange = (field: keyof Driver, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // file change helper: uploads immediately and stores public url in form
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Driver,
    folder: string
  ) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Basic validation
    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large (max ${maxSizeMB}MB)`);
      return;
    }

    const url = await uploadToStorage(file, folder);
    if (url) handleInputChange(field, url);
  };

  const handleDeleteDriver = async (driverId: number) => {
    if (!confirm("Delete driver? This cannot be undone.")) return;
    try {
      const { error } = await supabase
        .from("drivers_klaver")
        .delete()
        .eq("id", driverId);
      if (error) throw error;
      toast.success("Driver deleted");
      fetchDrivers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete driver");
    }
  };

  const startEditDriver = (driver: Driver) => {
    setIsEditing(true);
    setEditingDriverId(driver.id ?? null);
    // Ensure date strings are in yyyy-mm-dd to play nice with <input type="date" />
    const normalizeDate = (d?: string | null) => (d ? d.split("T")[0] : null);
    setFormData({
      ...driver,
      license_expiry_date: normalizeDate(driver.license_expiry_date),
      pdp_expiry_date: normalizeDate(driver.pdp_expiry_date),
    });
    setIsAddDialogOpen(true);
  };

  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsSheetOpen(true);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setIsEditing(false);
    setEditingDriverId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) {
      toast.error("Please wait for file uploads to finish");
      return;
    }
    setIsSubmitting(true);

    try {
      // attach current user as created_by if available
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser.user?.id ?? null;

      const payload: Partial<Driver> = {
        ...formData,
        created_by: formData.created_by ?? userId,
      };

      if (isEditing && editingDriverId) {
        const { error } = await supabase
          .from("drivers_klaver")
          .update(payload)
          .eq("id", editingDriverId);

        if (error) throw error;
        toast.success("Driver updated");
      } else {
        const { error } = await supabase.from("drivers").insert(payload as any);

        if (error) throw error;
        toast.success("Driver added");
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchDrivers();
    } catch (err) {
      console.error("submit error", err);
      toast.error("Failed to save driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (err) {
      return dateString;
    }
  };

  const getStatusBadge = (saIssued?: boolean) => {
    return saIssued ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        SA Issued
      </Badge>
    ) : (
      <Badge variant="secondary">Foreign</Badge>
    );
  };

  const getPDPStatusBadge = (hasPDP?: boolean) => {
    return hasPDP ? (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        Has PDP
      </Badge>
    ) : (
      <Badge variant="secondary">No PDP</Badge>
    );
  };

  const filteredDrivers = drivers.filter((driver) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (driver.first_name ?? "").toLowerCase().includes(term) ||
      (driver.surname ?? "").toLowerCase().includes(term) ||
      (driver.id_or_passport_number ?? "").toLowerCase().includes(term) ||
      (driver.email_address ?? "").toLowerCase().includes(term) ||
      (driver.cell_number ?? "").toLowerCase().includes(term);

    const matchesFilter =
      licenseFilter === "all" ||
      (licenseFilter === "sa" && driver.sa_issued) ||
      (licenseFilter === "foreign" && !driver.sa_issued);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">
            Manage your driver database and licenses
          </p>
        </div>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>

          <DialogContent className="w-11/12 md:w-2/4 max-h-[90vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Driver" : "Add New Driver"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="surname">Surname *</Label>
                    <Input
                      id="surname"
                      value={formData.surname}
                      onChange={(e) =>
                        handleInputChange("surname", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="id_or_passport_number">
                      ID/Passport Number *
                    </Label>
                    <Input
                      id="id_or_passport_number"
                      value={formData.id_or_passport_number}
                      onChange={(e) =>
                        handleInputChange(
                          "id_or_passport_number",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="id_or_passport_document">
                      ID/Passport Document
                    </Label>
                    <Input
                      id="id_or_passport_document"
                      value={formData.id_or_passport_document ?? ""}
                      onChange={(e) =>
                        handleInputChange(
                          "id_or_passport_document",
                          e.target.value
                        )
                      }
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email_address">Email Address</Label>
                    <Input
                      id="email_address"
                      type="email"
                      value={formData.email_address ?? ""}
                      onChange={(e) =>
                        handleInputChange("email_address", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="cell_number">Cell Number</Label>
                    <Input
                      id="cell_number"
                      value={formData.cell_number ?? ""}
                      onChange={(e) =>
                        handleInputChange("cell_number", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  License Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sa_issued"
                      checked={!!formData.sa_issued}
                      onCheckedChange={(checked) =>
                        handleInputChange("sa_issued", checked)
                      }
                    />
                    <Label htmlFor="sa_issued">SA Issued License</Label>
                  </div>

                  <div>
                    <Label htmlFor="work_permit_upload">
                      Work Permit (PDF / DOC / Image)
                    </Label>
                    <Input
                      id="work_permit_upload"
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          "work_permit_upload",
                          "files/driver"
                        )
                      }
                    />
                    {formData.work_permit_upload ? (
                      <div className="mt-2">
                        <a
                          href={formData.work_permit_upload}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          📄 View uploaded work permit
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      value={formData.license_number ?? ""}
                      onChange={(e) =>
                        handleInputChange("license_number", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_expiry_date">
                      License Expiry Date
                    </Label>
                    <Input
                      id="license_expiry_date"
                      type="date"
                      value={formData.license_expiry_date ?? ""}
                      onChange={(e) =>
                        handleInputChange("license_expiry_date", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_code">License Code</Label>
                    <Select
                      onValueChange={(v) =>
                        handleInputChange("license_code", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            formData.license_code ?? "Select license code"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 - Motorcycle</SelectItem>
                        <SelectItem value="A">A - Motorcycle</SelectItem>
                        <SelectItem value="B">
                          B - Light Motor Vehicle
                        </SelectItem>
                        <SelectItem value="C1">
                          C1 - Light Commercial Vehicle
                        </SelectItem>
                        <SelectItem value="C">
                          C - Heavy Commercial Vehicle
                        </SelectItem>
                        <SelectItem value="EB">
                          EB - Heavy Commercial Vehicle with Trailer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="driver_restriction_code">
                      Driver Restriction Code
                    </Label>
                    <Input
                      id="driver_restriction_code"
                      value={formData.driver_restriction_code ?? ""}
                      onChange={(e) =>
                        handleInputChange(
                          "driver_restriction_code",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="vehicle_restriction_code">
                      Vehicle Restriction Code
                    </Label>
                    <Input
                      id="vehicle_restriction_code"
                      value={formData.vehicle_restriction_code ?? ""}
                      onChange={(e) =>
                        handleInputChange(
                          "vehicle_restriction_code",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="front_of_driver_pic">
                      Front of Driver License (image)
                    </Label>
                    <Input
                      id="front_of_driver_pic"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          "front_of_driver_pic",
                          "images/drivers"
                        )
                      }
                    />
                    {formData.front_of_driver_pic ? (
                      <img
                        src={formData.front_of_driver_pic}
                        alt="front"
                        className="mt-2 w-40 rounded-lg border"
                      />
                    ) : null}
                  </div>

                  <div>
                    <Label htmlFor="rear_of_driver_pic">
                      Rear of Driver License (image)
                    </Label>
                    <Input
                      id="rear_of_driver_pic"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(
                          e,
                          "rear_of_driver_pic",
                          "images/drivers"
                        )
                      }
                    />
                    {formData.rear_of_driver_pic ? (
                      <img
                        src={formData.rear_of_driver_pic}
                        alt="rear"
                        className="mt-2 w-40 rounded-lg border"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Professional Driving Permit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Professional Driving Permit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="professional_driving_permit"
                      checked={!!formData.professional_driving_permit}
                      onCheckedChange={(checked) =>
                        handleInputChange(
                          "professional_driving_permit",
                          checked
                        )
                      }
                    />
                    <Label htmlFor="professional_driving_permit">
                      Has Professional Driving Permit
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="pdp_expiry_date">PDP Expiry Date</Label>
                    <Input
                      id="pdp_expiry_date"
                      type="date"
                      value={formData.pdp_expiry_date ?? ""}
                      onChange={(e) =>
                        handleInputChange("pdp_expiry_date", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                    ? "Update Driver"
                    : "Add Driver"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Drivers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">SA Licensed</p>
                <p className="text-2xl font-bold text-green-600">
                  {drivers.filter((d) => d.sa_issued).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm font-semibold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active PDP</p>
                <p className="text-2xl font-bold text-purple-600">
                  {
                    drivers.filter(
                      (d) => d.professional_driving_permit
                      // &&
                      //   d.pdp_expiry_date &&
                      //   new Date(d.pdp_expiry_date) > new Date()
                    ).length
                  }
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-sm font-semibold">
                  🎫
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {
                    drivers.filter((d) => {
                      if (!d.license_expiry_date) return false;
                      const expiryDate = new Date(d.license_expiry_date);
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(
                        thirtyDaysFromNow.getDate() + 30
                      );
                      return (
                        expiryDate <= thirtyDaysFromNow &&
                        expiryDate > new Date()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-sm font-semibold">⚠</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={licenseFilter === "all" ? "default" : "outline"}
                onClick={() => setLicenseFilter("all")}
              >
                All
              </Button>
              <Button
                variant={licenseFilter === "sa" ? "default" : "outline"}
                onClick={() => setLicenseFilter("sa")}
              >
                SA Issued
              </Button>
              <Button
                variant={licenseFilter === "foreign" ? "default" : "outline"}
                onClick={() => setLicenseFilter("foreign")}
              >
                Foreign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Driver Name</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">
                    License Status
                  </TableHead>
                  <TableHead className="font-semibold">
                    License Details
                  </TableHead>
                  <TableHead className="font-semibold">PDP Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading drivers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : drivers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-gray-500"
                    >
                      No drivers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {driver.first_name} {driver.surname}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {driver.id_or_passport_number}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-gray-900">
                            {driver.email_address || "No email"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {driver.cell_number || "No phone"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(driver.sa_issued)}
                          <p className="text-sm text-gray-600">
                            {driver.license_number || "No license"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900">
                            Code: {driver.license_code || "Not set"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires: {formatDate(driver.license_expiry_date)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getPDPStatusBadge(
                            driver.professional_driving_permit
                          )}
                          <p className="text-sm text-gray-600">
                            Expires: {formatDate(driver.pdp_expiry_date)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDriver(driver)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditDriver(driver)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              driver.id && handleDeleteDriver(driver.id)
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Driver Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="p-4 w-11/12 md:w-2/4 h-screen overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Driver Details</SheetTitle>
          </SheetHeader>

          {selectedDriver && (
            <div className="space-y-4 mt-6 pb-20">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      First Name
                    </p>
                    <p className="text-gray-900">{selectedDriver.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Surname</p>
                    <p className="text-gray-900">{selectedDriver.surname}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      ID Number
                    </p>
                    <p className="text-gray-900">
                      {selectedDriver.id_or_passport_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-gray-900">
                      {selectedDriver.email_address || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Cell Number
                    </p>
                    <p className="text-gray-900">
                      {selectedDriver.cell_number || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  License Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      License Number
                    </p>
                    <p className="text-gray-900">
                      {selectedDriver.license_number || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      License Code
                    </p>
                    <p className="text-gray-900">
                      {selectedDriver.license_code || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      License Expiry
                    </p>
                    <p className="text-gray-900">
                      {formatDate(selectedDriver.license_expiry_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      SA Issued
                    </p>
                    <div className="mt-1">
                      {getStatusBadge(selectedDriver.sa_issued)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Driving Permit */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Professional Driving Permit
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Has PDP</p>
                    <div className="mt-1">
                      {getPDPStatusBadge(
                        selectedDriver.professional_driving_permit
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      PDP Expiry
                    </p>
                    <p className="text-gray-900">
                      {formatDate(selectedDriver.pdp_expiry_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Restriction Codes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Restriction Codes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Driver Restriction
                    </p>
                    <p className="text-gray-900">
                      {selectedDriver.driver_restriction_code || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Vehicle Restriction
                    </p>
                    <p className="text-gray-900">
                      {selectedDriver.vehicle_restriction_code || "Not set"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Documents
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Work Permit
                    </p>
                    {selectedDriver.work_permit_upload ? (
                      <a
                        href={selectedDriver.work_permit_upload}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        📄 View Work Permit
                      </a>
                    ) : (
                      <p className="text-gray-500">Not uploaded</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Front of License
                    </p>
                    {selectedDriver.front_of_driver_pic ? (
                      <img
                        src={selectedDriver.front_of_driver_pic}
                        alt="Front of License"
                        className="w-40 rounded-lg border shadow-sm"
                      />
                    ) : (
                      <p className="text-gray-500">Not uploaded</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Rear of License
                    </p>
                    {selectedDriver.rear_of_driver_pic ? (
                      <img
                        src={selectedDriver.rear_of_driver_pic}
                        alt="Rear of License"
                        className="w-40 rounded-lg border shadow-sm"
                      />
                    ) : (
                      <p className="text-gray-500">Not uploaded</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      startEditDriver(selectedDriver);
                      setIsSheetOpen(false);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      selectedDriver.id && handleDeleteDriver(selectedDriver.id)
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
