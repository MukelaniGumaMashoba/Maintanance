"use client";

import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ContactLocationStep() {
    const { register, setValue, formState: { errors } } = useFormContext();

    // Auto-retrieve location using browser Geolocation API
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                );
                const data = await response.json();

                if (data.address) {
                    setValue("province", data.address.state || "");
                    setValue("city", data.address.city || data.address.town || "");
                    setValue("town", data.address.town || data.address.village || "");
                    setValue("street", data.address.road || "");
                    setValue("postal_code", data.address.postcode ? Number(data.address.postcode) : undefined);
                }
            } catch (error) {
                console.error("Error fetching address:", error);
            }
        });
    }, [setValue]);

    return (
        <Card className="w-full shadow-xl rounded-2xl border border-gray-200">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                    Contact & Location Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* After Hours Contact */}
                <div className="space-y-2">
                    <Label htmlFor="after_hours_number">After Hours Contact Number</Label>
                    <Input
                        id="after_hours_number"
                        placeholder="Enter after hours contact"
                        {...register("after_hours_number")}
                    />
                    {typeof errors.after_hours_number?.message === "string" && (
                        <p className="text-red-500 text-sm">{errors.after_hours_number.message}</p>
                    )}
                </div>

                {/* Province */}
                <div className="space-y-2">
                    <Label htmlFor="province">Province / State</Label>
                    <Input id="province" placeholder="Enter province" {...register("province")} />
                    {typeof errors.province?.message === "string" && (
                        <p className="text-red-500 text-sm">{errors.province.message}</p>
                    )}
                </div>

                {/* Street */}
                <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Input id="street" placeholder="Enter street address" {...register("street")} />
                </div>

                {/* City */}
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Enter city" {...register("city")} />
                </div>

                {/* Town */}
                <div className="space-y-2">
                    <Label htmlFor="town">Town</Label>
                    <Input id="town" placeholder="Enter town" {...register("town")} />
                </div>

                {/* Postal Code */}
                <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                        id="postal_code"
                        type="number"
                        placeholder="Enter postal code"
                        {...register("postal_code", { valueAsNumber: true })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
