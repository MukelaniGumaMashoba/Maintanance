"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface StockEntryModalProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    jobCardId?: number | null;
    mode?: "stock" | "non-stock" | "assign";
    existingPart?: {
        id?: number;
        item_code?: string;
        description?: string;
        price?: number;
        quantity?: number;
        category_id?: number;
        vehicle_brand_id?: number;
        supplier?: string;
        location?: string;
        once?: boolean;
        is_stock_item?: boolean;
    } | null;
    trigger?: React.ReactNode;
}

interface StockEntryForm {
    item_code: string;
    description: string;
    price: number | string;
    quantity: number | string;
    category_id: string;
    vehicle_brand_id: string;
    supplier: string;
    location: string;
    once: boolean;
    is_stock_item: boolean;
    is_external_workshop: boolean;
    stock_threshold: number | string;
    // For non-stock parts
    part_name?: string;
    part_number?: string;
    unit_cost?: number | string;
    job_card_id?: number | null;
}

export default function StockEntryModal({
    isOpen: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    onSuccess,
    jobCardId,
    mode = "stock",
    existingPart,
    trigger,
}: StockEntryModalProps) {
    const supabase = createClient();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [vehicleBrands, setVehicleBrands] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;
    const setIsOpen = isControlled
        ? controlledOnOpenChange || (() => { })
        : setInternalOpen;

    const [form, setForm] = useState<StockEntryForm>({
        item_code: "",
        description: "",
        price: "",
        quantity: "",
        category_id: "",
        vehicle_brand_id: "",
        supplier: "",
        location: "",
        once: false,
        is_stock_item: mode === "stock",
        is_external_workshop: false,
        stock_threshold: 10,
        part_name: "",
        part_number: "",
        unit_cost: "",
        job_card_id: jobCardId || null,
    });

    useEffect(() => {
        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (existingPart) {
            setForm({
                item_code: existingPart.item_code || "",
                description: existingPart.description || "",
                price: existingPart.price || "",
                quantity: existingPart.quantity || "",
                category_id: existingPart.category_id?.toString() || "",
                vehicle_brand_id: existingPart.vehicle_brand_id?.toString() || "",
                supplier: "",
                location: "",
                once: existingPart.once || false,
                is_stock_item: existingPart.is_stock_item ?? true,
                is_external_workshop: false,
                stock_threshold: 10,
                part_name: existingPart.description || "",
                part_number: existingPart.item_code || "",
                unit_cost: existingPart.price || "",
                job_card_id: jobCardId || null,
            });
        }
    }, [existingPart, jobCardId]);

    const fetchDropdownData = async () => {
        try {
            const [categoriesRes, vehicleBrandsRes, suppliersRes] = await Promise.all([
                supabase.from("categories").select("*").order("name"),
                supabase.from("vehicle_brands").select("*").order("name"),
                supabase.from("suppliers").select("*").order("name").match(() => ({ data: [] })),
            ]);

            setCategories(categoriesRes.data || []);
            setVehicleBrands(vehicleBrandsRes.data || []);
            setSuppliers(suppliersRes.data || []);
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            // Validate required fields based on mode
            if (mode === "stock") {
                if (!form.item_code || !form.description || !form.price || !form.quantity) {
                    toast.error("Please fill in all required fields (Item Code, Description, Price, Quantity)");
                    setLoading(false);
                    return;
                }
            } else if (mode === "non-stock" || mode === "assign") {
                if (!form.part_name || !form.unit_cost || !form.quantity) {
                    toast.error("Please fill in all required fields (Part Name, Unit Cost, Quantity)");
                    setLoading(false);
                    return;
                }
            }

            const price = parseFloat(form.price.toString()) || 0;
            const quantity = parseInt(form.quantity.toString()) || 0;
            const unitCost = parseFloat(form.unit_cost?.toString() || form.price.toString()) || 0;
            const totalCost = quantity * unitCost;
            const stockThreshold = parseInt(form.stock_threshold.toString()) || 10;

      if (mode === "stock") {
        // Add or update in parts table
        const partData: any = {
          item_code: form.item_code,
          description: form.description,
          price: price,
          quantity: quantity,
          once: form.once,
          is_stock_item: form.is_stock_item,
          stock_threshold: stockThreshold,
          supplier: form.supplier || null,
          location: form.location || null,
        };

        if (form.category_id) {
          partData.category_id = parseInt(form.category_id);
        }
        if (form.vehicle_brand_id) {
          partData.vehicle_brand_id = parseInt(form.vehicle_brand_id);
        }

        if (existingPart?.id) {
          // Update existing part
          const { error } = await supabase
            .from("parts")
            .update(partData)
            .eq("id", existingPart.id);

          if (error) throw error;
          toast.success("Part updated successfully");
        } else {
          // Check if part with same item_code already exists
          if (form.item_code) {
            const { data: existingPartByCode, error: checkError } = await supabase
              .from("parts")
              .select("id")
              .eq("item_code", form.item_code)
              .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
              throw checkError;
            }

            if (existingPartByCode) {
              // Update existing part by item_code
              const { error } = await supabase
                .from("parts")
                .update(partData)
                .eq("item_code", form.item_code);

              if (error) throw error;
              toast.success("Part updated successfully (found existing part with same item code)");
            } else {
              // Insert new part - explicitly exclude id and any other auto-generated fields
              const insertData: any = {
                item_code: partData.item_code,
                description: partData.description,
                price: partData.price,
                quantity: partData.quantity,
                once: partData.once,
                is_stock_item: partData.is_stock_item,
                stock_threshold: partData.stock_threshold,
                supplier: partData.supplier,
                location: partData.location,
              };
              
              if (partData.category_id) insertData.category_id = partData.category_id;
              if (partData.vehicle_brand_id) insertData.vehicle_brand_id = partData.vehicle_brand_id;

              const { error } = await supabase.from("parts").insert([insertData]);

              if (error) throw error;
              toast.success("Part added to inventory successfully");
            }
          } else {
            // Insert new part - explicitly exclude id and any other auto-generated fields
            const insertData: any = {
              item_code: partData.item_code,
              description: partData.description,
              price: partData.price,
              quantity: partData.quantity,
              once: partData.once,
              is_stock_item: partData.is_stock_item,
              stock_threshold: partData.stock_threshold,
              supplier: partData.supplier,
              location: partData.location,
            };
            
            if (partData.category_id) insertData.category_id = partData.category_id;
            if (partData.vehicle_brand_id) insertData.vehicle_brand_id = partData.vehicle_brand_id;

            const { error } = await supabase.from("parts").insert([insertData]);

            if (error) throw error;
            toast.success("Part added to inventory successfully");
          }
        }
            } else if (mode === "non-stock" || mode === "assign") {
                // Add to once_off_parts table (for job-specific non-stock parts)
                if (!jobCardId && mode === "assign") {
                    toast.error("Job Card ID is required for assigning parts");
                    setLoading(false);
                    return;
                }

                const nonStockData: any = {
                    part_name: form.part_name || form.description,
                    part_number: form.part_number || form.item_code || null,
                    description: form.description || null,
                    quantity: quantity,
                    unit_cost: unitCost,
                    total_cost: totalCost,
                    supplier: form.supplier || null,
                    is_external_workshop: form.is_external_workshop,
                    job_card_id: jobCardId || form.job_card_id || null,
                };

                const { data: insertedPart, error: insertError } = await supabase
                    .from("once_off_parts")
                    .insert([nonStockData])
                    .select()
                    .single();

                if (insertError) throw insertError;

                // If job_card_id exists, update the workshop_job total_parts_cost
                if (jobCardId || form.job_card_id) {
                    const { data: currentJob } = await supabase
                        .from("workshop_job")
                        .select("total_parts_cost")
                        .eq("id", jobCardId || form.job_card_id || 0)
                        .single();

                    const newTotalPartsCost = (currentJob?.total_parts_cost || 0) + totalCost;

                    await supabase
                        .from("workshop_job")
                        .update({ total_parts_cost: newTotalPartsCost })
                        .eq("id", jobCardId || form.job_card_id || 0);
                }

                // Also add to once_offparts table if it's a general non-stock item
                if (!jobCardId && !form.job_card_id) {
                    const onceOffData: any = {
                        item_code: form.part_number || form.item_code || null,
                        description: form.part_name || form.description,
                        price: unitCost,
                        quantity: quantity,
                        supplier: form.supplier || null,
                        is_external_workshop: form.is_external_workshop,
                    };

                    if (form.category_id) {
                        onceOffData.category_id = parseInt(form.category_id);
                    }
                    if (form.vehicle_brand_id) {
                        onceOffData.vehicle_brand_id = parseInt(form.vehicle_brand_id);
                    }

                    await supabase.from("once_offparts").insert([onceOffData]);
                }

                toast.success("Non-stock part added successfully");
            }

            // Reset form
            setForm({
                item_code: "",
                description: "",
                price: "",
                quantity: "",
                category_id: "",
                vehicle_brand_id: "",
                supplier: "",
                location: "",
                once: false,
                is_stock_item: mode === "stock",
                is_external_workshop: false,
                stock_threshold: 10,
                part_name: "",
                part_number: "",
                unit_cost: "",
                job_card_id: jobCardId || null,
            });

            setIsOpen(false);
            onSuccess?.();
        } catch (error: any) {
            console.error("Error submitting stock entry:", error);
            toast.error(error.message || "Failed to save stock entry");
        } finally {
            setLoading(false);
        }
    };

    const dialogContent = (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                    {existingPart
                        ? "Edit Part"
                        : mode === "stock"
                            ? "Enter New Stock"
                            : mode === "assign"
                                ? "Assign Non-Stock Part"
                                : "Add Non-Stock Part"}
                </DialogTitle>
                <DialogDescription>
                    {mode === "stock"
                        ? "Add a new part to inventory or update existing stock"
                        : "Add a non-stock part for external workshops or one-off purchases"}
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {/* Part Name / Description */}
                {mode === "non-stock" || mode === "assign" ? (
                    <div>
                        <Label htmlFor="part_name">
                            Part Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="part_name"
                            value={form.part_name || ""}
                            onChange={(e) =>
                                setForm({ ...form, part_name: e.target.value, description: e.target.value })
                            }
                            placeholder="Enter part name"
                        />
                    </div>
                ) : null}

                {/* Item Code */}
                <div>
                    <Label htmlFor="item_code">
                        Item Code {mode === "stock" && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                        id="item_code"
                        value={form.item_code}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                item_code: e.target.value,
                                part_number: e.target.value,
                            })
                        }
                        placeholder="Enter item code"
                        disabled={!!existingPart}
                    />
                </div>

                {/* Description */}
                <div>
                    <Label htmlFor="description">
                        Description {mode === "stock" && <span className="text-red-500">*</span>}
                    </Label>
                    <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Enter part description"
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Quantity */}
                    <div>
                        <Label htmlFor="quantity">
                            Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            value={form.quantity}
                            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                            placeholder="Enter quantity"
                        />
                    </div>

                    {/* Price / Unit Cost */}
                    <div>
                        <Label htmlFor="price">
                            {mode === "stock" ? "Unit Price" : "Unit Cost"}{" "}
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={mode === "stock" ? form.price : form.unit_cost || form.price}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    price: e.target.value,
                                    unit_cost: e.target.value,
                                })
                            }
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={form.category_id}
                            onValueChange={(value) => setForm({ ...form, category_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString() || "none"}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vehicle Brand */}
                    <div>
                        <Label htmlFor="vehicle_brand">Vehicle Brand</Label>
                        <Select
                            value={form.vehicle_brand_id}
                            onValueChange={(value) => setForm({ ...form, vehicle_brand_id: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select vehicle brand" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {vehicleBrands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id.toString() || "none"}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Supplier */}
                <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                        id="supplier"
                        value={form.supplier}
                        onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                        placeholder="Enter supplier name"
                    />
                </div>

                {/* Location */}
                {mode === "stock" && (
                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                            id="location"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                            placeholder="Enter storage location"
                        />
                    </div>
                )}

                {/* Stock Threshold */}
                {mode === "stock" && (
                    <div>
                        <Label htmlFor="stock_threshold">Stock Threshold</Label>
                        <Input
                            id="stock_threshold"
                            type="number"
                            min="0"
                            value={form.stock_threshold}
                            onChange={(e) => setForm({ ...form, stock_threshold: e.target.value })}
                            placeholder="10"
                        />
                    </div>
                )}

                {/* Checkboxes */}
                <div className="space-y-3">
                    {mode === "stock" && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="once"
                                checked={form.once}
                                onCheckedChange={(checked) =>
                                    setForm({ ...form, once: checked === true })
                                }
                            />
                            <Label htmlFor="once" className="cursor-pointer">
                                Once-off Part (Not tracked in regular inventory)
                            </Label>
                        </div>
                    )}

                    {mode === "stock" && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_stock_item"
                                checked={form.is_stock_item}
                                onCheckedChange={(checked) =>
                                    setForm({ ...form, is_stock_item: checked === true })
                                }
                            />
                            <Label htmlFor="is_stock_item" className="cursor-pointer">
                                Stock Item (Tracked in inventory)
                            </Label>
                        </div>
                    )}

                    {(mode === "non-stock" || mode === "assign") && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is_external_workshop"
                                checked={form.is_external_workshop}
                                onCheckedChange={(checked) =>
                                    setForm({ ...form, is_external_workshop: checked === true })
                                }
                            />
                            <Label htmlFor="is_external_workshop" className="cursor-pointer">
                                External Workshop / Sublet Part
                            </Label>
                        </div>
                    )}
                </div>

                {/* Total Cost Display */}
                {mode !== "stock" && (
                    <div className="p-3 bg-gray-50 rounded-md">
                        <Label className="text-sm font-medium">Total Cost</Label>
                        <p className="text-lg font-bold">
                            R{" "}
                            {(
                                (parseFloat(form.unit_cost?.toString() || form.price.toString()) || 0) *
                                (parseInt(form.quantity.toString()) || 0)
                            ).toFixed(2)}
                        </p>
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Saving..." : existingPart ? "Update" : "Submit"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );

    if (trigger) {
        return (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                {dialogContent}
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {dialogContent}
        </Dialog>
    );
}

