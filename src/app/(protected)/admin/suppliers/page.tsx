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
import { Loader2, Plus, Edit3, Trash2, Printer, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SubletsAndSuppliersPage() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [sublets, setSublets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Dialog state
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSubletDialogOpen, setIsSubletDialogOpen] = useState(false);
  const [isEditSupplierDialogOpen, setIsEditSupplierDialogOpen] =
    useState(false);
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

  const handleEditSupplier = (supplier: any) => {
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

  const handleDeleteSupplier = async (supplierId: any) => {
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

  const fetchorder = async () => {
    const { data, error } = await supabase
      .from("parts_orders")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: supplierDetails, error: supplierError } = await supabase
      .from("suppliers")
      .select("*");

    if (error) {
      console.error("Error fetching orders:", error);
      return;
    }
    setOrders(data || []);
    setSuppliers(supplierDetails || []);
  };

  // add all information of supplier in the order information
  const supplierMap = suppliers.reduce(
    (acc, supplier) => {
      acc[supplier.id] = {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        contact_person: supplier.contact_person,
        address: supplier.address,
      };
      return acc;
    },
    {} as Record<number, any>,
  );

  useEffect(() => {
    fetchorder();
  }, []);

  // Helper function to escape HTML
  const escapeHtml = (text: string) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m as keyof typeof map]);
  };

  const handlePrint = async (order: any) => {
    setSelectedOrder(order);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print the order");
      return;
    }

    const parts = Array.isArray(order.parts_data) ? order.parts_data : [];
    const partsHtml = parts
      .map((p: any, i: number) => {
        const name = p.description || p.part_name || p.part || "Part";
        const qty = p.quantity ?? p.qty ?? 1;
        const price = p.price ?? p.unit_price ?? "";
        const total = Number(price) * qty;
        return `<tr>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:8px;border:1px solid #ddd">${escapeHtml(name)}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:center">${qty}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right">${price !== "" ? "R" + Number(price).toFixed(2) : "-"}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">R${total.toFixed(2)}</td>
        </tr>`;
      })
      .join("");

    const supplier = suppliers.find((s) => s.id === order.supplier_id);
    const supplierInfo = supplier
      ? `
      <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:20px;">
        <h3 style="margin:0 0 10px 0; color:#1e293b;">SUPPLIER ORDER</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
          <div>
            <strong>Supplier:</strong><br>${escapeHtml(supplier.name)}<br>
            <strong>Contact:</strong> ${escapeHtml(supplier.contact_person || "N/A")}<br>
            <strong>Email:</strong> ${escapeHtml(supplier.email || "N/A")}
          </div>
          <div>
            <strong>Phone:</strong> ${escapeHtml(supplier.phone || "N/A")}<br>
            <strong>Address:</strong><br>${escapeHtml(supplier.address || "N/A")}
          </div>
        </div>
      </div>
    `
      : "";

    const total = parts.reduce(
      (sum: number, part: any) =>
        sum + Number(part.price || 0) * Number(part.quantity || 0),
      0,
    );

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>Parts Order #${order.id} - ${supplier?.name || "Supplier"}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin:0; padding:30px; color:#1e293b; line-height:1.5; }
            .header { text-align:center; margin-bottom:30px; padding-bottom:20px; border-bottom:3px solid #f59e0b; }
            .header h1 { color:#1e293b; margin:0; font-size:28px; }
            .header p { color:#64748b; margin:5px 0 0 0; font-size:14px; }
            .section { margin-bottom:25px; }
            .section h3 { color:#1e293b; margin:0 0 15px 0; font-size:18px; border-left:4px solid #f59e0b; padding-left:12px; }
            table { width:100%; border-collapse: collapse; margin-top:10px; }
            th, td { padding:12px 8px; border:1px solid #e2e8f0; text-align:left; }
            th { background:#f8fafc; font-weight:600; color:#374151; }
            .total-row { background:#fef3c7 !important; font-weight:bold; font-size:16px; }
            .center { text-align:center }
            .right { text-align:right }
            .summary { background:#f1f5f9; padding:20px; border-radius:8px; margin-top:20px; }
            .contact-box { background:#ecfdf5; padding:20px; border-radius:8px; border:2px solid gray; margin-top:20px; }
            @media print { body { padding:20px; } }
            @page { margin: 1in; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PARTS ORDER</h1>
            <p>Order #${order.id} | ${new Date(order.created_at).toLocaleDateString()} | ${order.status?.toUpperCase()}</p>
          </div>

          ${supplierInfo}

          <div class="section">
            <h3>Klaver Plant Hire:  Parts Required</h3>
            <table>
              <thead>
                <tr>
                  <th style="width:50px">#</th>
                  <th>Description</th>
                  <th class="center" style="width:80px">Qty</th>
                  <th class="right" style="width:120px">Unit Price</th>
                  <th class="right" style="width:120px">Total</th>
                </tr>
              </thead>
              <tbody>
                ${partsHtml || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#64748b">No parts listed</td></tr>'}
                <tr class="total-row">
                  <td colspan="4" class="right" style="padding:12px 8px">TOTAL:</td>
                  <td class="right">R${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>Order Notes</h3>
            <div style="background:#f8fafc; padding:20px; border-radius:8px; border-left:4px solid #f59e0b; min-height:80px;">
              ${escapeHtml(order.notes || "No additional notes provided")}
            </div>
          </div>

          <div class="contact-box">
            <h3 style="margin:0 0 10px 0; color:#059669;">Workshop Contact</h3>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; font-size:14px;">
              <div>
                <strong>Klaver Plant Hire: Skyfleet Workshop</strong>
                Name: Lwazi<br>
                Email: stores@klaverplant.co.za
              </div>
              <div style="text-align:right">
                <strong>Phone:</strong> +27 71 442 7811<br>
                <strong>Date Ordered:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
                <strong>Status:</strong> ${order.status?.toUpperCase() || "PENDING"}
              </div>
            </div>
          </div>

          <div style="margin-top:40px; font-size:12px; color:#94a3b8; text-align:center; border-top:1px solid #e2e8f0; padding-top:15px;">
            Generated on ${new Date().toLocaleString()} by Skyfleet Workshop Management System
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleEmailSupplier = async (order: any) => {
    const supplier = suppliers.find((s) => s.id === order.supplier_id);
    console.log("Suppliers detail" + JSON.stringify(suppliers));

    if (!supplier?.email) {
      toast.error("Supplier email not available");
      return;
    }

    const parts = Array.isArray(order.parts_data) ? order.parts_data : [];
    const partsText = parts
      .map(
        (p: any) =>
          `• ${p.description || p.part_name || "Part"} | Qty: ${p.quantity || 1} | Unit: R${Number(p.price || 0).toFixed(2)} | Total: R${(Number(p.price || 0) * Number(p.quantity || 1)).toFixed(2)}`,
      )
      .join("\n");

    const total = parts.reduce(
      (sum: number, part: any) =>
        sum + Number(part.price || 0) * Number(part.quantity || 0),
      0,
    );

    const subject = encodeURIComponent(
      `Parts Order - ${supplierMap[order.supplier_id]?.name || "Supplier"}`,
    );
    const body = encodeURIComponent(
      `
URGENT PARTS ORDER

Supplier: ${supplierMap[order.supplier_id]?.name || "Unknown Supplier"}
Contact: ${supplierMap[order.supplier_id]?.contact_person || "N/A"}
Date: ${new Date(order.created_at).toLocaleDateString()}
Status: ${order.status?.toUpperCase() || "PENDING"}

PARTS REQUIRED:
${partsText}

TOTAL: R${total.toFixed(2)}

Notes: ${order.notes || "None"}

Please confirm receipt and estimated delivery time.
Required.

Workshop Contact:
Klaver Plant Hire - Lwazi Mhlongo
Email: stores@klaverplant.co.za
Phone: +27 71 442 7811

---
Generated by Skyfleet Workshop Management System
    `.trim(),
    );

    const mailtoLink = `mailto:${supplier.email}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    toast.success(`Email opened for ${supplierMap[order.supplier_id]?.name || "Unknown Supplier"}`);
  };

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
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSublets = sublets.filter((s) =>
    s.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Calculate grand total safely
  const grandTotal = orders.reduce((sum, order) => {
    const parts = Array.isArray(order.parts_data) ? order.parts_data : [];
    const orderTotal = parts.reduce(
      (partSum: number, part: any) =>
        partSum + (Number(part.price) || 0) * (Number(part.quantity) || 0),
      0,
    );
    return sum + orderTotal;
  }, 0);

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
          Suppliers
        </h1>
        <Input
          placeholder="Search suppliers or sublets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 rounded-xl border-gray-300 shadow-sm focus:border-[#F57C00] focus:ring-[#F57C00]"
        />
      </div>

      {/* SUPPLIERS SECTION */}
      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="border-b border-gray-200 mb-6">
          <TabsTrigger
            value="suppliers"
            className="data-[state=active]:border-[#F57C00] data-[state=active]:border-b-2 text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
          >
            Suppliers
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:border-[#F57C00] data-[state=active]:border-b-2 text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
          >
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
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
                    {[
                      "name",
                      "contact_person",
                      "email",
                      "phone",
                      "address",
                    ].map((field) => (
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
                    ))}
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
              <p className="text-gray-500 text-center py-6">
                No suppliers found.
              </p>
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
        </TabsContent>
        <TabsContent value="orders">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Parts Orders
              </h2>
              {/* <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="print:hidden"
                >
                  🖨️ Print
                </Button>
                <Button
                  onClick={handleEmailSupplier}
                  variant="outline"
                  size="sm"
                  className="print:hidden"
                >
                  📧 Email
                </Button>
              </div> */}
            </div>

            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-6">
                No orders available
              </p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg shadow print:shadow-none">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const parts = Array.isArray(order.parts_data)
                        ? order.parts_data
                        : [];
                      const total = parts.reduce(
                        (sum: number, part: any) =>
                          sum +
                          (Number(part.price) || 0) *
                            (Number(part.quantity) || 0),
                        0,
                      );

                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {(() => {
                              const supplier = suppliers.find(
                                (s) => s.id === order.supplier_id,
                              );
                              return supplier ? (
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {supplier.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {supplier.email}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {supplier.phone}
                                  </div>
                                </div>
                              ) : (
                                "Unknown Supplier"
                              );
                            })()}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <ul className="list-disc list-inside space-y-1">
                              {parts.map((part: any, idx: number) => (
                                <li key={idx} className="text-xs">
                                  {part.description} - Qty: {part.quantity} @ R
                                  {Number(part.price || 0)?.toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            R{total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              className={`capitalize ${
                                order.status === "completed"
                                  ? "bg-green-600"
                                  : order.status === "approved"
                                    ? "bg-blue-500"
                                    : "bg-yellow-500"
                              } text-white`}
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                            {order.notes || "-"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrint(order)}
                              className="h-8 w-8 p-0 bg-white hover:bg-gray-50 border-gray-200"
                              title="Print Order"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEmailSupplier(order)}
                              className="h-8 w-8 p-0 bg-white hover:bg-gray-50 border-gray-200"
                              title="Email Supplier"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-3 text-right text-sm font-medium text-gray-700"
                      >
                        Grand Total:
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-900">
                        R{grandTotal.toFixed(2)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* SUBLETS SECTION */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <Dialog
            open={isSubletDialogOpen}
            onOpenChange={setIsSubletDialogOpen}
          >
            <DialogTrigger asChild>
              {/* Add Sublet button can be uncommented if needed */}
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
      </section>

      {/* Edit Supplier Dialog */}
      <Dialog
        open={isEditSupplierDialogOpen}
        onOpenChange={setIsEditSupplierDialogOpen}
      >
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
              ),
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
}
