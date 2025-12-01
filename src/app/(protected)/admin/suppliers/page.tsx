"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Plus, Edit3, Trash2 } from "lucide-react";

export default function SubletsAndSuppliersPage() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sublets, setSublets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog state
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSubletDialogOpen, setIsSubletDialogOpen] = useState(false);
  const [isEditSupplierDialogOpen, setIsEditSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  });

  const [subletForm, setSubletForm] = useState({
    supplier_id: "",
    job_card_id: "",
    description: "",
    cost: "",
    status: "pending",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: suppliersData } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    const { data: subletsData } = await supabase
      .from("sublets")
      .select(`*, suppliers(name)`)
      .order("created_at", { ascending: false });

    setSuppliers(suppliersData || []);
    setSublets(subletsData || []);
    setLoading(false);
  };

  const handleAddSupplier = async () => {
    const { error } = await supabase.from("suppliers").insert([supplierForm]);
    if (error) return console.error("Error adding supplier:", error);
    setSupplierForm({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
    });
    setIsSupplierDialogOpen(false);
    fetchData();
  };

  const handleEditSupplier = (supplier:any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setIsEditSupplierDialogOpen(true);
  };

  const handleUpdateSupplier = async () => {
    const { error } = await supabase
      .from("suppliers")
      .update(supplierForm)
      .eq("id", editingSupplier?.id);
    
    if (error) {
      console.error("Error updating supplier:", error);
      return;
    }

    setIsEditSupplierDialogOpen(false);
    setEditingSupplier(null);
    fetchData();
  };

  const handleDeleteSupplier = async (supplierId:any) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplierId);
    
    if (error) {
      console.error("Error deleting supplier:", error);
      return;
    }

    fetchData();
  };

  //   const handleAddSublet = async () => {
  //     const { error } = await supabase.from("sublets").insert([subletForm])
  //     if (error) return console.error("Error adding sublet:", error)
  //     setSubletForm({ supplier_id: "", job_card_id: "", description: "", cost: "", status: "pending" })
  //     setIsSubletDialogOpen(false)
  //     fetchData()
  //   }

  const handleAddSublet = async () => {
    const payload: any = { ...subletForm };

    // Remove job_card_id if empty (avoids sending "")
    if (!payload.job_card_id) delete payload.job_card_id;

    const { error } = await supabase.from("sublets").insert([payload]);
    if (error) return console.error("Error adding sublet:", error);

    setSubletForm({
      supplier_id: "",
      job_card_id: "",
      description: "",
      cost: "",
      status: "pending",
    });
    setIsSubletDialogOpen(false);
    fetchData();
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSublets = sublets.filter((s) =>
    s.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading data...
      </div>
    );

  return (
    <div className="space-y-10 p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Sublets & Suppliers
        </h1>
        <Input
          placeholder="Search suppliers or sublets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 rounded-xl border-gray-300 shadow-sm focus:border-[#F57C00] focus:ring-[#F57C00]"
        />
      </div>

      {/* SUPPLIERS SECTION */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#F57C00] rounded-sm" />
            Suppliers
          </h2>
          <Dialog
            open={isSupplierDialogOpen}
            onOpenChange={setIsSupplierDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-[#F57C00] hover:bg-[#e36f00] text-white rounded-lg shadow-md"
              >
                <Plus className="mr-1 h-4 w-4" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-800">
                  Add Supplier
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                {["name", "contact_person", "email", "phone", "address"].map(
                  (field) => (
                    <div key={field} className="space-y-1">
                      <Label className="capitalize text-gray-700">
                        {field.replace("_", " ")}
                      </Label>
                      <Input
                        value={(supplierForm as any)[field]}
                        onChange={(e) =>
                          setSupplierForm({
                            ...supplierForm,
                            [field]: e.target.value,
                          })
                        }
                        placeholder={`Enter ${field.replace("_", " ")}`}
                        className="rounded-lg border-gray-300 focus:border-[#F57C00] focus:ring-[#F57C00]"
                      />
                    </div>
                  )
                )}
                <Button
                  className="w-full mt-2 bg-[#F57C00] hover:bg-[#e36f00] text-white rounded-lg"
                  onClick={handleAddSupplier}
                >
                  Save Supplier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {filteredSuppliers.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No suppliers found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSuppliers.map((s) => (
              <Card
                key={s.id}
                className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <CardHeader className="pb-2 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-[#F57C00] truncate">
                    {s.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-3 pt-3">
                  <div className="space-y-1">
                    <p>
                      <strong>Contact:</strong> {s.contact_person || "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong> {s.email || "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {s.phone || "N/A"}
                    </p>
                    <p>
                      <strong>Address:</strong> {s.address || "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSupplier(s)}
                      className="flex-1"
                    >
                      <Edit3 className="mr-1 w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSupplier(s.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SUBLETS SECTION */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          {/* <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-[#F57C00] rounded-sm" />
            Sublets
          </h2> */}
          <Dialog
            open={isSubletDialogOpen}
            onOpenChange={setIsSubletDialogOpen}
          >
            <DialogTrigger asChild>
              {/* <Button
                size="sm"
                className="bg-[#F57C00] hover:bg-[#e36f00] text-white rounded-lg shadow-md"
              >
                <Plus className="mr-1 h-4 w-4" /> Add Sublet
              </Button> */}
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-800">
                  Add Sublet
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-gray-700">Supplier</Label>
                  <Select
                    value={subletForm.supplier_id}
                    onValueChange={(v) =>
                      setSubletForm({ ...subletForm, supplier_id: v })
                    }
                  >
                    <SelectTrigger className="rounded-lg border-gray-300 focus:border-[#F57C00] focus:ring-[#F57C00]">
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
                  <Label className="text-gray-700">Description</Label>
                  <Textarea
                    value={subletForm.description}
                    onChange={(e) =>
                      setSubletForm({
                        ...subletForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter description"
                    className="rounded-lg border-gray-300 focus:border-[#F57C00] focus:ring-[#F57C00]"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Cost</Label>
                  <Input
                    type="number"
                    value={subletForm.cost}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, cost: e.target.value })
                    }
                    placeholder="e.g. 2500.00"
                    className="rounded-lg border-gray-300 focus:border-[#F57C00] focus:ring-[#F57C00]"
                  />
                </div>

                <div>
                  <Label className="text-gray-700">Status</Label>
                  <Select
                    value={subletForm.status}
                    onValueChange={(v) =>
                      setSubletForm({ ...subletForm, status: v })
                    }
                  >
                    <SelectTrigger className="rounded-lg border-gray-300 focus:border-[#F57C00] focus:ring-[#F57C00]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full mt-2 bg-[#F57C00] hover:bg-[#e36f00] text-white rounded-lg"
                  onClick={handleAddSublet}
                >
                  Save Sublet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* {filteredSublets.length === 0 ? (
          <p className="text-gray-500 text-center py-6">No sublets found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSublets.map((s) => (
              <Card
                key={s.id}
                className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <CardHeader className="pb-2 border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-[#F57C00] truncate">
                    {s.description}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700 space-y-2 pt-3">
                  <p>
                    <strong>Supplier:</strong> {s.suppliers?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Cost:</strong> R{s.cost?.toFixed(2) || "0.00"}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                  <Badge
                    className={`capitalize ${
                      s.status === "completed"
                        ? "bg-green-600 text-white"
                        : s.status === "approved"
                        ? "bg-blue-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {s.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )} */}
      </section>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditSupplierDialogOpen} onOpenChange={setIsEditSupplierDialogOpen}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              Edit Supplier
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {["name", "contact_person", "email", "phone", "address"].map(
              (field) => (
                <div key={field} className="space-y-1">
                  <Label className="capitalize text-gray-700">
                    {field.replace("_", " ")}
                  </Label>
                  <Input
                    value={(supplierForm as any)[field]}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        [field]: e.target.value,
                      })
                    }
                    placeholder={`Enter ${field.replace("_", " ")}`}
                    className="rounded-lg border-gray-300 focus:border-[#F57C00] focus:ring-[#F57C00]"
                  />
                </div>
              )
            )}
            <Button
              className="w-full mt-2 bg-[#F57C00] hover:bg-[#e36f00] text-white rounded-lg"
              onClick={handleUpdateSupplier}
            >
              Update Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // return (
  //   <div className="space-y-10 p-6">
  //     {/* Header */}
  //     <div className="flex justify-between items-center">
  //       <h1 className="text-3xl font-bold">Sublets & Suppliers</h1>
  //       <Input
  //         placeholder="Search suppliers or sublets..."
  //         value={searchTerm}
  //         onChange={(e) => setSearchTerm(e.target.value)}
  //         className="w-1/3"
  //       />
  //     </div>

  //     {/* SUPPLIERS SECTION */}
  //     <section>
  //       <div className="flex justify-between items-center mb-4">
  //         <h2 className="text-xl font-semibold">Suppliers</h2>
  //         <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
  //           <DialogTrigger asChild>
  //             <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Supplier</Button>
  //           </DialogTrigger>
  //           <DialogContent>
  //             <DialogHeader>
  //               <DialogTitle>Add Supplier</DialogTitle>
  //             </DialogHeader>
  //             <div className="space-y-3 mt-2">
  //               {["name", "contact_person", "email", "phone", "address"].map((field) => (
  //                 <div key={field} className="space-y-1">
  //                   <Label className="capitalize">{field.replace("_", " ")}</Label>
  //                   <Input
  //                     value={(supplierForm as any)[field]}
  //                     onChange={(e) => setSupplierForm({ ...supplierForm, [field]: e.target.value })}
  //                     placeholder={`Enter ${field.replace("_", " ")}`}
  //                   />
  //                 </div>
  //               ))}
  //               <Button className="w-full mt-2" onClick={handleAddSupplier}>Save</Button>
  //             </div>
  //           </DialogContent>
  //         </Dialog>
  //       </div>

  //       {filteredSuppliers.length === 0 ? (
  //         <p className="text-gray-500">No suppliers found.</p>
  //       ) : (
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  //           {filteredSuppliers.map((s) => (
  //             <Card key={s.id}>
  //               <CardHeader>
  //                 <CardTitle>{s.name}</CardTitle>
  //               </CardHeader>
  //               <CardContent className="text-sm text-gray-700 space-y-1">
  //                 <p><strong>Contact:</strong> {s.contact_person || "N/A"}</p>
  //                 <p><strong>Email:</strong> {s.email || "N/A"}</p>
  //                 <p><strong>Phone:</strong> {s.phone || "N/A"}</p>
  //                 <p><strong>Address:</strong> {s.address || "N/A"}</p>
  //               </CardContent>
  //             </Card>
  //           ))}
  //         </div>
  //       )}
  //     </section>

  //     {/* SUBLETS SECTION */}
  //     <section>
  //       <div className="flex justify-between items-center mb-4">
  //         <h2 className="text-xl font-semibold">Sublets</h2>
  //         <Dialog open={isSubletDialogOpen} onOpenChange={setIsSubletDialogOpen}>
  //           <DialogTrigger asChild>
  //             <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Sublet</Button>
  //           </DialogTrigger>
  //           <DialogContent>
  //             <DialogHeader>
  //               <DialogTitle>Add Sublet</DialogTitle>
  //             </DialogHeader>
  //             <div className="space-y-3 mt-2">
  //               <div>
  //                 <Label>Supplier</Label>
  //                 <Select
  //                   value={subletForm.supplier_id}
  //                   onValueChange={(v) => setSubletForm({ ...subletForm, supplier_id: v })}
  //                 >
  //                   <SelectTrigger>
  //                     <SelectValue placeholder="Select supplier" />
  //                   </SelectTrigger>
  //                   <SelectContent>
  //                     {suppliers.map((s) => (
  //                       <SelectItem key={s.id} value={String(s.id)}>
  //                         {s.name}
  //                       </SelectItem>
  //                     ))}
  //                   </SelectContent>
  //                 </Select>
  //               </div>

  //               <div>
  //                 <Label>Description</Label>
  //                 <Textarea
  //                   value={subletForm.description}
  //                   onChange={(e) => setSubletForm({ ...subletForm, description: e.target.value })}
  //                   placeholder="Enter description"
  //                 />
  //               </div>

  //               <div>
  //                 <Label>Cost</Label>
  //                 <Input
  //                   type="number"
  //                   value={subletForm.cost}
  //                   onChange={(e) => setSubletForm({ ...subletForm, cost: e.target.value })}
  //                   placeholder="e.g. 2500.00"
  //                 />
  //               </div>

  //               <div>
  //                 <Label>Status</Label>
  //                 <Select
  //                   value={subletForm.status}
  //                   onValueChange={(v) => setSubletForm({ ...subletForm, status: v })}
  //                 >
  //                   <SelectTrigger>
  //                     <SelectValue placeholder="Select status" />
  //                   </SelectTrigger>
  //                   <SelectContent>
  //                     <SelectItem value="pending">Pending</SelectItem>
  //                     <SelectItem value="approved">Approved</SelectItem>
  //                     <SelectItem value="completed">Completed</SelectItem>
  //                   </SelectContent>
  //                 </Select>
  //               </div>

  //               <Button className="w-full mt-2" onClick={handleAddSublet}>Save</Button>
  //             </div>
  //           </DialogContent>
  //         </Dialog>
  //       </div>

  //       {filteredSublets.length === 0 ? (
  //         <p className="text-gray-500">No sublets found.</p>
  //       ) : (
  //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  //           {filteredSublets.map((s) => (
  //             <Card key={s.id}>
  //               <CardHeader>
  //                 <CardTitle>{s.description}</CardTitle>
  //               </CardHeader>
  //               <CardContent className="text-sm text-gray-700 space-y-1">
  //                 <p><strong>Supplier:</strong> {s.suppliers?.name || "N/A"}</p>
  //                 <p><strong>Cost:</strong> R{s.cost?.toFixed(2) || "0.00"}</p>
  //                 <p><strong>Date:</strong> {new Date(s.created_at).toLocaleDateString()}</p>
  //                 <Badge variant={s.status === "completed" ? "default" : "secondary"}>
  //                   {s.status}
  //                 </Badge>
  //               </CardContent>
  //             </Card>
  //           ))}
  //         </div>
  //       )}
  //     </section>
  //   </div>
  // )
}
