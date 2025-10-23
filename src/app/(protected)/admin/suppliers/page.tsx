"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"

export default function SubletsAndSuppliersPage() {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [sublets, setSublets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog state
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [isSubletDialogOpen, setIsSubletDialogOpen] = useState(false)

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  })

  const [subletForm, setSubletForm] = useState({
    supplier_id: "",
    job_card_id: "",
    description: "",
    cost: "",
    status: "pending",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: suppliersData } = await supabase
      .from("suppliers")
      .select("*")
      .order("name")

    const { data: subletsData } = await supabase
      .from("sublets")
      .select(`*, suppliers(name)`)
      .order("created_at", { ascending: false })

    setSuppliers(suppliersData || [])
    setSublets(subletsData || [])
    setLoading(false)
  }

  const handleAddSupplier = async () => {
    const { error } = await supabase.from("suppliers").insert([supplierForm])
    if (error) return console.error("Error adding supplier:", error)
    setSupplierForm({ name: "", contact_person: "", email: "", phone: "", address: "" })
    setIsSupplierDialogOpen(false)
    fetchData()
  }

//   const handleAddSublet = async () => {
//     const { error } = await supabase.from("sublets").insert([subletForm])
//     if (error) return console.error("Error adding sublet:", error)
//     setSubletForm({ supplier_id: "", job_card_id: "", description: "", cost: "", status: "pending" })
//     setIsSubletDialogOpen(false)
//     fetchData()
//   }

  const handleAddSublet = async () => {
  const payload: any = { ...subletForm }
  
  // Remove job_card_id if empty (avoids sending "")
  if (!payload.job_card_id) delete payload.job_card_id

  const { error } = await supabase.from("sublets").insert([payload])
  if (error) return console.error("Error adding sublet:", error)

  setSubletForm({
    supplier_id: "",
    job_card_id: "",
    description: "",
    cost: "",
    status: "pending",
  })
  setIsSubletDialogOpen(false)
  fetchData()
}


  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSublets = sublets.filter((s) =>
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading data...
      </div>
    )

  return (
    <div className="space-y-10 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sublets & Suppliers</h1>
        <Input
          placeholder="Search suppliers or sublets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3"
        />
      </div>

      {/* SUPPLIERS SECTION */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Suppliers</h2>
          <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {["name", "contact_person", "email", "phone", "address"].map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="capitalize">{field.replace("_", " ")}</Label>
                    <Input
                      value={(supplierForm as any)[field]}
                      onChange={(e) => setSupplierForm({ ...supplierForm, [field]: e.target.value })}
                      placeholder={`Enter ${field.replace("_", " ")}`}
                    />
                  </div>
                ))}
                <Button className="w-full mt-2" onClick={handleAddSupplier}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filteredSuppliers.length === 0 ? (
          <p className="text-gray-500">No suppliers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle>{s.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-1">
                  <p><strong>Contact:</strong> {s.contact_person || "N/A"}</p>
                  <p><strong>Email:</strong> {s.email || "N/A"}</p>
                  <p><strong>Phone:</strong> {s.phone || "N/A"}</p>
                  <p><strong>Address:</strong> {s.address || "N/A"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SUBLETS SECTION */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sublets</h2>
          <Dialog open={isSubletDialogOpen} onOpenChange={setIsSubletDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Sublet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Sublet</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label>Supplier</Label>
                  <Select
                    value={subletForm.supplier_id}
                    onValueChange={(v) => setSubletForm({ ...subletForm, supplier_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={subletForm.description}
                    onChange={(e) => setSubletForm({ ...subletForm, description: e.target.value })}
                    placeholder="Enter description"
                  />
                </div>

                <div>
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    value={subletForm.cost}
                    onChange={(e) => setSubletForm({ ...subletForm, cost: e.target.value })}
                    placeholder="e.g. 2500.00"
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={subletForm.status}
                    onValueChange={(v) => setSubletForm({ ...subletForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full mt-2" onClick={handleAddSublet}>Save</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filteredSublets.length === 0 ? (
          <p className="text-gray-500">No sublets found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSublets.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle>{s.description}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-1">
                  <p><strong>Supplier:</strong> {s.suppliers?.name || "N/A"}</p>
                  <p><strong>Cost:</strong> R{s.cost?.toFixed(2) || "0.00"}</p>
                  <p><strong>Date:</strong> {new Date(s.created_at).toLocaleDateString()}</p>
                  <Badge variant={s.status === "completed" ? "default" : "secondary"}>
                    {s.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
