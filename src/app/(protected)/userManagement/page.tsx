"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, MapPin, Plus, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'

interface User {
    id: string
    full_name: string
    email: string
    role: string
    company_name: string
    phone_number: string
    department: string
    created_at: string
    status?: string
}

interface Role {
    id: string
    name: string
    description: string
    permissions: string[]
}

interface SystemSetting {
    id: string
    category: string
    name: string
    value: string
    description: string
    type: "text" | "number" | "boolean" | "select"
    options?: string[]
}

export default function SettingsPage() {
    const supabase = createClient()
    const [users, setUsers] = useState<User[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [settings, setSettings] = useState<SystemSetting[]>([])
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchKlavaUsers()
        initializeRoles()
        initializeSettings()
    }, [])

    const fetchKlavaUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/users')
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error)
            }
            
            setUsers(result.users || [])
        } catch (error) {
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const initializeRoles = () => {
        setRoles([
            {
                id: "1",
                name: "Administrator",
                description: "Full system access and configuration",
                permissions: ["all"],
            },
            {
                id: "2",
                name: "Fleet Manager",
                description: "Manage vehicles, drivers, and approve jobs",
                permissions: ["manage_vehicles", "manage_drivers", "approve_jobs", "view_reports"],
            },
            {
                id: "3",
                name: "Call Center",
                description: "Handle breakdown requests and dispatch technicians",
                permissions: ["view_breakdowns", "dispatch_technicians", "manage_technicians"],
            },
        ])
    }

    const initializeSettings = () => {
        setSettings([
            {
                id: "1",
                category: "General",
                name: "Company Name",
                value: "Fleet Management Solutions",
                description: "The name of your company",
                type: "text",
            },
            {
                id: "2",
                category: "General",
                name: "Default Location",
                value: "Johannesburg, South Africa",
                description: "Default location for new breakdowns",
                type: "text",
            },
            {
                id: "3",
                category: "Notifications",
                name: "Email Notifications",
                value: "true",
                description: "Enable email notifications for breakdowns",
                type: "boolean",
            },
            {
                id: "4",
                category: "Notifications",
                name: "SMS Notifications",
                value: "false",
                description: "Enable SMS notifications for urgent breakdowns",
                type: "boolean",
            },
            {
                id: "5",
                category: "System",
                name: "Auto-assign Technicians",
                value: "true",
                description: "Automatically assign nearest available technician",
                type: "boolean",
            },
            {
                id: "6",
                category: "System",
                name: "Breakdown Timeout",
                value: "30",
                description: "Minutes before escalating unassigned breakdowns",
                type: "number",
            },
        ])
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        
        const formData = new FormData(e.target as HTMLFormElement)
        
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    role: formData.get('role') as string,
                    phone_number: formData.get('phone') as string,
                    department: formData.get('department') as string
                })
            })
            
            const result = await response.json()
            
            if (!response.ok) {
                throw new Error(result.error)
            }
            
            toast.success('User created successfully')
            setIsAddUserOpen(false)
            fetchKlavaUsers()
        } catch (error: any) {
            toast.error(error.message || 'Failed to create user')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateSetting = (settingId: string, newValue: string) => {
        setSettings((prev) => prev.map((setting) => (setting.id === settingId ? { ...setting, value: newValue } : setting)))
        toast.success("Setting Updated")
    }

    const handleToggleUserStatus = (userId: string) => {
        setUsers((prev) =>
            prev.map((user) =>
                user.id === userId ? { ...user, status: user.status === "active" ? "inactive" : "active" } : user,
            ),
        )
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-800"
            case "fleet-manager":
                return "bg-blue-100 text-blue-800"
            case "call-center":
                return "bg-green-100 text-green-800"
            case "cost-center":
                return "bg-orange-100 text-orange-800"
            case "customer":
                return "bg-gray-100 text-gray-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const groupedSettings = settings.reduce(
        (acc, setting) => {
            if (!acc[setting.category]) {
                acc[setting.category] = []
            }
            acc[setting.category].push(setting)
            return acc
        },
        {} as Record<string, SystemSetting[]>,
    )

    return (
        <>
            <div className="flex-1 space-y-4 p-4 pt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Settings & Administration</h2>
                </div>

                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="users" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">User Management</h3>
                            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add User
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Add New User</DialogTitle>
                                        <DialogDescription>
                                            Create a new user account with appropriate role and permissions.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddUser} className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" name="name" required />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" name="email" type="email" required />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input id="phone" name="phone" />
                                        </div>
                                        <div>
                                            <Label htmlFor="department">Department</Label>
                                            <Input id="department" name="department" />
                                        </div>
                                        <div>
                                            <Label htmlFor="role">Role</Label>
                                            <Select name="role" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="fleet manager">Fleet Manager</SelectItem>
                                                    <SelectItem value="call centre">Administrator & Parts</SelectItem>
                                                    <SelectItem value="Technician">Technician</SelectItem>
                                                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-sm text-blue-800">Company: Klaver (Auto-assigned)</p>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? 'Creating...' : 'Create User'}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Created</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    Loading Klaver users...
                                                </TableCell>
                                            </TableRow>
                                        ) : users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    No Klaver users found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>{user.department || '-'}</TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-blue-100 text-blue-800">{user.company_name}</Badge>
                                                    </TableCell>
                                                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="roles" className="space-y-4">
                        <h3 className="text-lg font-semibold">Roles & Permissions</h3>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {roles.map((role) => (
                                <Card key={role.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{role.name}</CardTitle>
                                                <CardDescription>{role.description}</CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRole(role)
                                                    setIsEditRoleOpen(true)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">Permissions:</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.map((permission) => (
                                                    <Badge key={permission} variant="secondary" className="text-xs">
                                                        {permission.replace("_", " ")}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
}