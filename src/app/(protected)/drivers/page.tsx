"use client"

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { addDriversToTable } from '@/lib/action/driver'

export default function Drivers() {
    const [drivers, setDrivers] = useState<Driver[]>([])
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()
    const [searchTerm, setSearchTerm] = useState('');
    const [licenseFilter, setLicenseFilter] = useState<'all' | 'sa' | 'foreign'>('all');



    const handleDeleteDriver = async (driverId: number) => {
        try {
            const { error } = await supabase
                .from('drivers')
                .delete()
                .eq('id', driverId)

            if (error) {
                console.error('Error deleting driver:', error)
                toast.error('Failed to delete driver')
            } else {
                toast.success('Driver deleted successfully')
                fetchDrivers()
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to delete driver')
        }
    }

    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        surname: '',
        id_or_passport_number: '',
        id_or_passport_document: '',
        email_address: '',
        cell_number: '',
        sa_issued: false,
        work_permit_upload: '',
        license_number: '',
        license_expiry_date: '',
        license_code: '',
        driver_restriction_code: '',
        vehicle_restriction_code: '',
        front_of_driver_pic: '',
        rear_of_driver_pic: '',
        professional_driving_permit: false,
        pdp_expiry_date: '',
        created_by: ''
    })

    useEffect(() => {
        fetchDrivers()
    }, [])

    const fetchDrivers = async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('drivers')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching drivers:', error)
                toast.error('Failed to fetch drivers')
                setDrivers([])
            } else {
                setDrivers(data as Driver[] ?? [])
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to fetch drivers')
            setDrivers([])
        } finally {
            setIsLoading(false)
        }
    }

    const filteredDrivers = drivers.filter((driver) => {
        // Match search term (case-insensitive)
        const matchesSearch = (
            driver.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.id_or_passport_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.cell_number?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Match filter
        const matchesFilter =
            licenseFilter === 'all' ||
            (licenseFilter === 'sa' && driver.sa_issued) ||
            (licenseFilter === 'foreign' && !driver.sa_issued);

        return matchesSearch && matchesFilter;
    });


    const handleViewDriver = (driver: Driver) => {
        setSelectedDriver(driver)
        setIsSheetOpen(true)
    }

    const handleAddDriver = () => {
        setIsAddDialogOpen(true)
    }

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const { data: user, error: userError } = await supabase.auth.getUser()
        const user_id = user.user?.id;

        try {
            const { data, error } = await addDriversToTable(formData as unknown as Driver)

            if (error) {
                console.error('Error adding driver:', error)
                toast.error('Failed to add driver')
            } else {
                toast.success('Driver added successfully')
                setIsAddDialogOpen(false)
                setFormData({
                    first_name: '',
                    surname: '',
                    id_or_passport_number: '',
                    id_or_passport_document: '',
                    email_address: '',
                    cell_number: '',
                    sa_issued: false,
                    work_permit_upload: '',
                    license_number: '',
                    license_expiry_date: '',
                    license_code: '',
                    driver_restriction_code: '',
                    vehicle_restriction_code: '',
                    front_of_driver_pic: '',
                    rear_of_driver_pic: '',
                    professional_driving_permit: false,
                    pdp_expiry_date: '',
                    created_by: user_id || ''
                })
                fetchDrivers()
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Failed to add driver')
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not set'
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusBadge = (saIssued: boolean) => {
        return saIssued ?
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">SA Issued</Badge> :
            <Badge variant="secondary">Foreign</Badge>
    }

    const getPDPStatusBadge = (hasPDP: boolean) => {
        return hasPDP ?
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Has PDP</Badge> :
            <Badge variant="secondary">No PDP</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
                    <p className="text-gray-600 mt-1">Manage your driver database and licenses</p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Driver
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-2/4 max-h-[90vh] overflow-y-auto p-10">
                        <DialogHeader>
                            <DialogTitle>Add New Driver</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="first_name">First Name *</Label>
                                        <Input
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="surname">Surname *</Label>
                                        <Input
                                            id="surname"
                                            value={formData.surname}
                                            onChange={(e) => handleInputChange('surname', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="id_or_passport_number">ID/Passport Number *</Label>
                                        <Input
                                            id="id_or_passport_number"
                                            value={formData.id_or_passport_number}
                                            onChange={(e) => handleInputChange('id_or_passport_number', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="id_or_passport_document">ID/Passport Document</Label>
                                        <Input
                                            id="id_or_passport_document"
                                            value={formData.id_or_passport_document}
                                            onChange={(e) => handleInputChange('id_or_passport_document', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email_address">Email Address</Label>
                                        <Input
                                            id="email_address"
                                            type="email"
                                            value={formData.email_address}
                                            onChange={(e) => handleInputChange('email_address', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="cell_number">Cell Number</Label>
                                        <Input
                                            id="cell_number"
                                            value={formData.cell_number}
                                            onChange={(e) => handleInputChange('cell_number', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* License Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="sa_issued"
                                            checked={formData.sa_issued}
                                            onCheckedChange={(checked) => handleInputChange('sa_issued', checked)}
                                        />
                                        <Label htmlFor="sa_issued">SA Issued License</Label>
                                    </div>
                                    <div>
                                        <Label htmlFor="work_permit_upload">Work Permit Upload</Label>
                                        <Input
                                            id="work_permit_upload"
                                            value={formData.work_permit_upload}
                                            onChange={(e) => handleInputChange('work_permit_upload', e.target.value)}
                                            placeholder="File name or URL"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="license_number">License Number</Label>
                                        <Input
                                            id="license_number"
                                            value={formData.license_number}
                                            onChange={(e) => handleInputChange('license_number', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="license_expiry_date">License Expiry Date</Label>
                                        <Input
                                            id="license_expiry_date"
                                            type="date"
                                            value={formData.license_expiry_date}
                                            onChange={(e) => handleInputChange('license_expiry_date', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="license_code">License Code</Label>
                                        <Select value={formData.license_code} onValueChange={(value) => handleInputChange('license_code', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select license code" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A1">A1 - Motorcycle</SelectItem>
                                                <SelectItem value="A">A - Motorcycle</SelectItem>
                                                <SelectItem value="B">B - Light Motor Vehicle</SelectItem>
                                                <SelectItem value="C1">C1 - Light Commercial Vehicle</SelectItem>
                                                <SelectItem value="C">C - Heavy Commercial Vehicle</SelectItem>
                                                <SelectItem value="EB">EB - Heavy Commercial Vehicle with Trailer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="driver_restriction_code">Driver Restriction Code</Label>
                                        <Input
                                            id="driver_restriction_code"
                                            value={formData.driver_restriction_code}
                                            onChange={(e) => handleInputChange('driver_restriction_code', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="vehicle_restriction_code">Vehicle Restriction Code</Label>
                                        <Input
                                            id="vehicle_restriction_code"
                                            value={formData.vehicle_restriction_code}
                                            onChange={(e) => handleInputChange('vehicle_restriction_code', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="front_of_driver_pic">Front of Driver License</Label>
                                        <Input
                                            id="front_of_driver_pic"
                                            type="file"
                                            value={formData.front_of_driver_pic}
                                            onChange={(e) => handleInputChange('front_of_driver_pic', e.target.value)}
                                            placeholder="File name or URL"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="rear_of_driver_pic">Rear of Driver License</Label>
                                        <Input
                                            id="rear_of_driver_pic"
                                            type="file"
                                            value={formData.rear_of_driver_pic}
                                            onChange={(e) => handleInputChange('rear_of_driver_pic', e.target.value)}
                                            placeholder="File name or URL"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional Driving Permit */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Professional Driving Permit</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="professional_driving_permit"
                                            checked={formData.professional_driving_permit}
                                            onCheckedChange={(checked) => handleInputChange('professional_driving_permit', checked)}
                                        />
                                        <Label htmlFor="professional_driving_permit">Has Professional Driving Permit</Label>
                                    </div>
                                    <div>
                                        <Label htmlFor="pdp_expiry_date">PDP Expiry Date</Label>
                                        <Input
                                            id="pdp_expiry_date"
                                            type="date"
                                            value={formData.pdp_expiry_date}
                                            onChange={(e) => handleInputChange('pdp_expiry_date', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsAddDialogOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Driver'}
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
                                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
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
                                    {drivers.filter(d => d.sa_issued).length}
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
                                    {drivers.filter(d => d.professional_driving_permit && d.pdp_expiry_date && new Date(d.pdp_expiry_date) > new Date()).length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 text-sm font-semibold">🎫</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {drivers.filter(d => {
                                        if (!d.license_expiry_date) return false
                                        const expiryDate = new Date(d.license_expiry_date)
                                        const thirtyDaysFromNow = new Date()
                                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                                        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date()
                                    }).length}
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
                                variant={licenseFilter === 'all' ? 'default' : 'outline'}
                                onClick={() => setLicenseFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={licenseFilter === 'sa' ? 'default' : 'outline'}
                                onClick={() => setLicenseFilter('sa')}
                            >
                                SA Issued
                            </Button>
                            <Button
                                variant={licenseFilter === 'foreign' ? 'default' : 'outline'}
                                onClick={() => setLicenseFilter('foreign')}
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
                                    <TableHead className="font-semibold">License Status</TableHead>
                                    <TableHead className="font-semibold">License Details</TableHead>
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
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No drivers found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDrivers.map((driver) => (
                                        <TableRow key={driver.id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {driver.first_name} {driver.surname}
                                                    </p>
                                                    <p className="text-sm text-gray-500">ID: {driver.id_or_passport_number}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="text-gray-900">{driver.email_address || 'No email'}</p>
                                                    <p className="text-sm text-gray-500">{driver.cell_number || 'No phone'}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {getStatusBadge(driver.sa_issued)}
                                                    <p className="text-sm text-gray-600">
                                                        {driver.license_number || 'No license'}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-900">
                                                        Code: {driver.license_code || 'Not set'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Expires: {formatDate(driver.license_expiry_date || '')}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {getPDPStatusBadge(driver.professional_driving_permit)}
                                                    <p className="text-sm text-gray-600">
                                                        Expires: {formatDate(driver.pdp_expiry_date || '')}
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
                                                    {/* <Button size="sm" variant="outline">Edit</Button> */}
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
                <SheetContent className="p-4 w-2/4 sm:w-2/4">
                    <SheetHeader>
                        <SheetTitle>Driver Details</SheetTitle>
                    </SheetHeader>
                    {selectedDriver && (
                        <div className="space-y-4 mt-6">
                            {/* Personal Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">First Name</p>
                                        <p className="text-gray-900">{selectedDriver.first_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Surname</p>
                                        <p className="text-gray-900">{selectedDriver.surname}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">ID Number</p>
                                        <p className="text-gray-900">{selectedDriver.id_or_passport_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Email</p>
                                        <p className="text-gray-900">{selectedDriver.email_address || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Cell Number</p>
                                        <p className="text-gray-900">{selectedDriver.cell_number || 'Not provided'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* License Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">License Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">License Number</p>
                                        <p className="text-gray-900">{selectedDriver.license_number || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">License Code</p>
                                        <p className="text-gray-900">{selectedDriver.license_code || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">License Expiry</p>
                                        <p className="text-gray-900">{formatDate(selectedDriver.license_expiry_date || '')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">SA Issued</p>
                                        <div className="mt-1">
                                            {getStatusBadge(selectedDriver.sa_issued)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Driving Permit */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Professional Driving Permit</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Has PDP</p>
                                        <div className="mt-1">
                                            {getPDPStatusBadge(selectedDriver.professional_driving_permit)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">PDP Expiry</p>
                                        <p className="text-gray-900">{formatDate(selectedDriver.pdp_expiry_date || '')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Restriction Codes */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Restriction Codes</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Driver Restriction</p>
                                        <p className="text-gray-900">{selectedDriver.driver_restriction_code || 'Not set'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Vehicle Restriction</p>
                                        <p className="text-gray-900">{selectedDriver.vehicle_restriction_code || 'Not set'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Work Permit</p>
                                        <p className="text-gray-900">{selectedDriver.work_permit_upload || 'Not uploaded'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Front of License</p>
                                        <p className="text-gray-900">{selectedDriver.front_of_driver_pic || 'Not uploaded'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Rear of License</p>
                                        <p className="text-gray-900">{selectedDriver.rear_of_driver_pic || 'Not uploaded'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}

type Driver = {
    id: number
    first_name: string
    surname: string
    id_or_passport_number: string
    id_or_passport_document: string
    email_address: string
    cell_number: string
    sa_issued: boolean
    work_permit_upload: string
    license_number: string
    license_expiry_date: string
    license_code: string
    driver_restriction_code: string
    vehicle_restriction_code: string
    front_of_driver_pic: string
    rear_of_driver_pic: string
    professional_driving_permit: boolean
    pdp_expiry_date: string
    created_at: string
    created_by: string
}
