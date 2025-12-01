"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Resend } from "resend";

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
import {
  Loader2,
  Plus,
  ExternalLink,
  Mail,
  Send,
  Building2,
  Edit3,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function SubletsPage() {
  const supabase = createClient();
  const [sublets, setSublets] = useState<any[]>([]);
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);

  const [subletForm, setSubletForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    description: "",
    status: "active",
  });

  const [editingSublet, setEditingSublet] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [allocateForm, setAllocateForm] = useState({
    sublet_id: "",
    job_card_id: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [subletsRes, jobCardsRes] = await Promise.all([
      supabase
        .from("sublets")
        .select(`*`)
        .order("created_at", { ascending: false }),
      supabase
        .from("workshop_job")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    setSublets(subletsRes.data || []);
    setJobCards(jobCardsRes.data || []);
    setLoading(false);
  };

  const handleAddSublet = async () => {
    const { error } = await supabase.from("sublets").insert([subletForm]);
    if (error) {
      toast.error("Error adding sublet", { description: error.message });
      return;
    }

    toast.success("Sublet added successfully");
    setSubletForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      status: "active",
    });
    setIsDialogOpen(false);
    fetchData();
  };

  const handleEditSublet = (sublet:any) => {
    setEditingSublet(sublet);
    setSubletForm({
      name: sublet.name || "",
      email: sublet.email || "",
      phone: sublet.phone || "",
      address: sublet.address || "",
      description: sublet.description || "",
      status: sublet.status || "active",
    });
    setIsEditDialogOpen(true);
  };


  const handleUpdateSublet = async () => {
    const { error } = await supabase
      .from("sublets")
      .update(subletForm)
      .eq("id", editingSublet?.id);
    
    if (error) {
      toast.error("Error updating sublet", { description: error.message });
      return;
    }

    toast.success("Sublet updated successfully");
    setIsEditDialogOpen(false);
    setEditingSublet(null);
    fetchData();
  };

  const handleDeleteSublet = async (subletId:any) => {
    if (!confirm("Are you sure you want to delete this sublet?")) return;
    
    const { error } = await supabase
      .from("sublets")
      .delete()
      .eq("id", subletId);
    
    if (error) {
      toast.error("Error deleting sublet", { description: error.message });
      return;
    }

    toast.success("Sublet deleted successfully");
    fetchData();
  };

  const handleAllocateJob = async () => {
    try {
      const response = await fetch("/api/allocate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allocateForm),
      });

      if (response.ok) {
        toast.success("Job allocated and email sent to sublet!");
        setIsAllocateDialogOpen(false);
        setAllocateForm({ sublet_id: "", job_card_id: "", notes: "" });
        fetchData();
      } else {
        toast.error("Failed to allocate job");
      }
    } catch (error) {
      toast.error("Failed to allocate job");
    }
  };

  // const resend = new Resend("re_ZsKAK1px_92CQsX1Qew2yuWhzbEfPgqmB");

  // resend.emails.send({
  //   from: "onboarding@resend.dev",
  //   to: "mukelanilastborn@gmail.com",
  //   subject: "Hello World",
  //   html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  // });

  const updateSubletStatus = async (subletId: number, newStatus: string) => {
    const { error } = await supabase
      .from("sublets")
      .update({ status: newStatus })
      .eq("id", subletId);

    if (error) {
      console.error("Error updating sublet status:", error.message);
      return;
    }

    fetchData();
  };

  const filteredSublets = sublets.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Loading workshops...
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sublet Workshops</h1>
          <p className="text-gray-600">
            Manage external workshop partners and job allocations
          </p>
        </div>
        <Input
          placeholder="Search workshops..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3"
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Badge variant="outline">Total: {sublets.length}</Badge>
          <Badge className="bg-green-100 text-green-800">
            Active: {sublets.filter((s) => s.status === "active").length}
          </Badge>
          <Badge className="bg-red-100 text-red-800">
            Inactive: {sublets.filter((s) => s.status === "inactive").length}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isAllocateDialogOpen}
            onOpenChange={setIsAllocateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" /> Allocate Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Job to Sublet Workshop</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* <div>
                  <Label>Workshop *</Label>
                  <Select
                    value={allocateForm.sublet_id}
                    onValueChange={(v) =>
                      setAllocateForm({ ...allocateForm, sublet_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workshop" />
                    </SelectTrigger>
                    <SelectContent>
                      {sublets
                        .filter((s) => s.status === "active")
                        .map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div> */}

                <div>
                  <Label>Job Card *</Label>
                  <Select
                    value={allocateForm.job_card_id}
                    onValueChange={(v) =>
                      setAllocateForm({ ...allocateForm, job_card_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job card" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobCards.map((j) => (
                        <SelectItem key={j.id} value={String(j.id)}>
                          {j.jobid_workshop} - {j.client_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={allocateForm.notes}
                    onChange={(e) =>
                      setAllocateForm({
                        ...allocateForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional instructions for the workshop..."
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleAllocateJob}
                  disabled={
                    !allocateForm.sublet_id || !allocateForm.job_card_id
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Allocate & Send Email
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Workshop
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sublet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Workshop Name *</Label>
                  <Input
                    value={subletForm.name}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, name: e.target.value })
                    }
                    placeholder="Workshop name"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={subletForm.email}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, email: e.target.value })
                    }
                    placeholder="workshop@example.com"
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={subletForm.phone}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, phone: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={subletForm.address}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, address: e.target.value })
                    }
                    placeholder="Workshop address"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={subletForm.description}
                    onChange={(e) =>
                      setSubletForm({
                        ...subletForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Workshop specialties and capabilities"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleAddSublet}
                  disabled={!subletForm.name || !subletForm.email}
                >
                  Add Workshop
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Sublet Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Sublet Workshop</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Workshop Name *</Label>
                  <Input
                    value={subletForm.name}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, name: e.target.value })
                    }
                    placeholder="Workshop name"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={subletForm.email}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, email: e.target.value })
                    }
                    placeholder="workshop@example.com"
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={subletForm.phone}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, phone: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={subletForm.address}
                    onChange={(e) =>
                      setSubletForm({ ...subletForm, address: e.target.value })
                    }
                    placeholder="Workshop address"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={subletForm.description}
                    onChange={(e) =>
                      setSubletForm({
                        ...subletForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Workshop specialties and capabilities"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleUpdateSublet}
                  disabled={!subletForm.name || !subletForm.email}
                >
                  Update Workshop
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filteredSublets.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No workshops found
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "No workshops match your search."
              : "Add your first sublet workshop to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSublets.map((sublet) => (
            <Card key={sublet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{sublet.name}</CardTitle>
                  <Badge className={getStatusColor(sublet.status)}>
                    {sublet.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div>
                    <span className="font-medium">Email:</span>
                    <p className="text-gray-600">{sublet.email}</p>
                  </div>

                  {sublet.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>
                      <p className="text-gray-600">{sublet.phone}</p>
                    </div>
                  )}

                  {sublet.address && (
                    <div>
                      <span className="font-medium">Address:</span>
                      <p className="text-gray-600">{sublet.address}</p>
                    </div>
                  )}

                  {sublet.description && (
                    <div>
                      <span className="font-medium">Specialties:</span>
                      <p className="text-gray-600">{sublet.description}</p>
                    </div>
                  )}

                  <div>
                    <span className="font-medium">Added:</span>
                    <p className="text-gray-600">
                      {new Date(sublet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setAllocateForm({
                          ...allocateForm,
                          sublet_id: sublet.id.toString(),
                        });
                        setIsAllocateDialogOpen(true);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="mr-1 w-3 h-3" />
                      Allocate Job
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSublet(sublet)}
                      className="flex-1"
                    >
                      <Edit3 className="mr-1 w-3 h-3" />
                      Edit
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateSubletStatus(
                          sublet.id,
                          sublet.status === "active" ? "inactive" : "active"
                        )
                      }
                      className="flex-1"
                    >
                      {sublet.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSublet(sublet.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-1 w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
