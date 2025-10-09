// components/PartsForm.tsx
import React from "react";
import { createClient } from "@/lib/supabase/client";

export default function PartsForm({ onSaved }: { onSaved?: () => void }) {
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [vehicleBrand, setVehicleBrand] = React.useState("");
  const [unitCost, setUnitCost] = React.useState("");
  const [qty, setQty] = React.useState("0");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    
    await supabase.from("quotations").insert([
      {
        sku,
        name,
        brand,
        vehicle_brand: vehicleBrand,
        unit_cost: parseFloat(unitCost || "0"),
        quantity: parseInt(qty || "0"),
      },
    ]);
    setName("");
    setSku("");
    setBrand("");
    setUnitBrand({ value: "" });
    setUnitCost("");
    setQty("0");
    onSaved?.();
  };

  // small helper to avoid typos
  function setUnitBrand({ value }: { value: string }) {
  return (
    <form onSubmit={save} className="card p-4 space-y-2">
      <h3 className="text-lg">Add Part</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Part name"
        className="input"
        required
      />
      <input
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        placeholder="SKU"
        className="input"
      />
      <input
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="Brand"
        className="input"
      />
      <input
        value={vehicleBrand}
        onChange={(e) => setVehicleBrand(e.target.value)}
        placeholder="Vehicle brand"
        className="input"
      />
      <input
        value={unitCost}
        onChange={(e) => setUnitCost(e.target.value)}
        placeholder="Unit cost"
        className="input"
      />
      <input
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="input"
      />
      <div>
        <button className="btn" type="submit">
          Save part
        </button>
      </div>
    </form>
  );
}
