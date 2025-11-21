"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Download,
} from "lucide-react";

export default function StockLevelsPage() {
  const supabase = createClient();
  const [parts, setParts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [partsRes, categoriesRes] = await Promise.all([
      supabase.from("parts").select(`*, categories(name)`).order("description"),
      supabase.from("categories").select("*").order("name"),
    ]);

    setParts(partsRes.data || []);
    setCategories(categoriesRes.data || []);
    setLoading(false);
  };

  // Add new state and function for stock entry dialog
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    item_code: "",
    quantity: "",
    supplier: "",
    invoice_number: "",
  });

  // Add function to handle stock entry
  const handleStockEntry = async () => {
    try {
      // Validate input
      if (!newStock.item_code || !newStock.quantity || !newStock.supplier) {
        alert("Please fill in all required fields");
        return;
      }

      // Find existing part
      const part = parts.find((p) => p.item_code === newStock.item_code);
      if (!part) {
        alert("Item code not found");
        return;
      }

      // Update stock quantity
      const { error } = await supabase
        .from("parts")
        .update({
          quantity:
            parseInt(part.quantity || "0") + parseInt(newStock.quantity),
        })
        .eq("item_code", newStock.item_code);

      if (error) throw error;

      // Log stock entry
      await supabase.from("stock_entries").insert({
        part_id: part.id,
        quantity: parseInt(newStock.quantity),
        supplier: newStock.supplier,
        invoice_number: newStock.invoice_number,
        entry_date: new Date().toISOString(),
      });

      // Reset form and refresh data
      setNewStock({
        item_code: "",
        quantity: "",
        supplier: "",
        invoice_number: "",
      });
      setIsStockEntryOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error entering stock:", error);
      alert("Error entering stock");
    }
  };

  // Add stock entry dialog component
  const StockEntryDialog = () => (
    <Dialog open={isStockEntryOpen} onOpenChange={setIsStockEntryOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Enter Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter New Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="item_code">Item Code</Label>
            <Input
              id="item_code"
              value={newStock.item_code}
              onChange={(e) =>
                setNewStock({ ...newStock, item_code: e.target.value })
              }
              placeholder="Enter item code"
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={newStock.quantity}
              onChange={(e) =>
                setNewStock({ ...newStock, quantity: e.target.value })
              }
              placeholder="Enter quantity"
            />
          </div>
          <div>
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={newStock.supplier}
              onChange={(e) =>
                setNewStock({ ...newStock, supplier: e.target.value })
              }
              placeholder="Enter supplier name"
            />
          </div>
          <div>
            <Label htmlFor="invoice">Invoice Number</Label>
            <Input
              id="invoice"
              value={newStock.invoice_number}
              onChange={(e) =>
                setNewStock({ ...newStock, invoice_number: e.target.value })
              }
              placeholder="Enter invoice number"
            />
          </div>
          <Button onClick={handleStockEntry} className="w-full">
            Submit Stock Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.item_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      part.category_id?.toString() === selectedCategory;

    const quantity = parseInt(part.quantity || "0");
    let matchesStock = true;

    switch (stockFilter) {
      case "low":
        matchesStock = quantity <= 5;
        break;
      case "out":
        matchesStock = quantity === 0;
        break;
      case "normal":
        matchesStock = quantity > 5;
        break;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const getStockStatus = (quantity: number) => {
    if (quantity === 0)
      return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (quantity <= 5)
      return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const totalValue = filteredParts.reduce(
    (sum, part) => sum + parseInt(part.quantity || "0") * (part.price || 0),
    0
  );

  const lowStockCount = parts.filter(
    (p) => parseInt(p.quantity || "0") <= 5
  ).length;
  const outOfStockCount = parts.filter(
    (p) => parseInt(p.quantity || "0") === 0
  ).length;

  const exportToCSV = () => {
    const headers = [
      "Item Code",
      "Description",
      "Category",
      "Quantity",
      "Price",
      "Total Value",
      "Status",
    ];
    const csvData = filteredParts.map((part) => [
      part.item_code || "",
      part.description || "",
      part.categories?.name || "",
      part.quantity || "0",
      part.price || "0",
      (parseInt(part.quantity || "0") * (part.price || 0)).toFixed(2),
      getStockStatus(parseInt(part.quantity || "0")).label,
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-levels-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <Package className="animate-pulse mr-2 h-6 w-6" /> Loading stock
        levels...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* // Add the dialog component next to the export button in the header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Levels</h1>
          <p className="text-gray-600">
            Monitor inventory levels and stock status
          </p>
        </div>
        <div className="space-x-2">
          {/* <StockEntryDialog /> */}
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{parts.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lowStockCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {outOfStockCount}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  R{totalValue.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by description or item code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="normal">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="mr-2 w-4 h-4" />
          Refresh
        </Button>
      </div>
      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Inventory ({filteredParts.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Item Code</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-center p-3 font-medium">Quantity</th>
                  <th className="text-right p-3 font-medium">Unit Price</th>
                  <th className="text-right p-3 font-medium">Total Value</th>
                  <th className="text-center p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part) => {
                  const quantity = parseInt(part.quantity || "0");
                  const status = getStockStatus(quantity);
                  const totalValue = quantity * (part.price || 0);

                  return (
                    <tr key={part.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-mono text-sm">
                        {part.item_code || "N/A"}
                      </td>
                      <td className="p-3">{part.description}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {part.categories?.name || "N/A"}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-medium ${
                            quantity <= 5 ? "text-red-600" : ""
                          }`}
                        >
                          {quantity}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        R{(part.price || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium">
                        R{totalValue.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredParts.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No items found
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "No items match your search criteria."
                  : "No inventory items available."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
