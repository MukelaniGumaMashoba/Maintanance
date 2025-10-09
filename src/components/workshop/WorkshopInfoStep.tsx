"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function WorkshopInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Card className="w-full shadow-xl rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Workshop Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workshop Name */}
        <div className="space-y-2">
          <Label htmlFor="work_name">Workshop Name</Label>
          <Input id="work_name" placeholder="Enter workshop name" {...register("work_name")} />
          {typeof errors.work_name?.message === "string" && (
            <p className="text-red-500 text-sm">{errors.work_name.message}</p>
          )}
        </div>

        {/* Trading Name */}
        <div className="space-y-2">
          <Label htmlFor="trading_name">Trading Name</Label>
          <Input id="trading_name" placeholder="Enter trading name" {...register("trading_name")} />
        </div>

        {/* Number of Working Days */}
        <div className="space-y-2">
          <Label htmlFor="number_of_working_days">Number of Working Days</Label>
          <Input
            type="number"
            id="number_of_working_days"
            placeholder="e.g. 5"
            {...register("number_of_working_days", { valueAsNumber: true })}
          />
        </div>

        {/* Rates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="labour_rate">Labour Rate</Label>
            <Input
              type="number"
              step="0.01"
              id="labour_rate"
              placeholder="e.g. 250.00"
              {...register("labour_rate", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fleet_rate">Fleet Rate</Label>
            <Input
              type="number"
              step="0.01"
              id="fleet_rate"
              placeholder="e.g. 200.00"
              {...register("fleet_rate", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Vehicle Types */}
        <div className="space-y-2">
          <Label htmlFor="vehicles_type">Vehicles Type</Label>
          <Input
            id="vehicles_type"
            placeholder="e.g. Sedan, Truck"
            {...register("vehicles_type", {
              setValueAs: (v) =>
                typeof v === "string" ? v.split(",").map((s) => s.trim()) : [],
            })}
          />
        </div>

        {/* Workshop Type */}
        <div className="space-y-2">
          <Label htmlFor="workshop_type">Workshop Type</Label>
          <Input
            id="workshop_type"
            placeholder="e.g. Service, Repair"
            {...register("workshop_type", {
              setValueAs: (v) =>
                typeof v === "string" ? v.split(",").map((s) => s.trim()) : [],
            })}
          />
        </div>

      </CardContent>
    </Card>
  );
}
