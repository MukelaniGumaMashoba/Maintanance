"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function FleetManagerStep() {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    return (
        <Card className="w-full shadow-xl rounded-2xl border border-gray-200">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">
                    Fleet Manager Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Name & Surname */}
                <div className="space-y-2">
                    <Label htmlFor="full_name">Name & Surname</Label>
                    <Input
                        id="full_name"
                        placeholder="Enter full name"
                        {...register("full_name")}
                    />
                    {typeof errors.full_name?.message === "string" && (
                        <p className="text-red-500 text-sm">{errors.full_name.message}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="Enter email"
                        {...register("email")}
                    />
                    {typeof errors.email?.message === "string" && (
                        <p className="text-red-500 text-sm">{errors.email.message}</p>
                    )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone</Label>
                    <Input
                        id="phone_number"
                        type="tel"
                        placeholder="Enter phone number"
                        {...register("phone_number")}
                    />
                    {typeof errors.phone_number?.message === "string" && (
                        <p className="text-red-500 text-sm">{errors.phone_number.message}</p>
                    )}
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                        id="role"
                        // value="fleet manager"
                        value="call centre"
                        readOnly
                        className="bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
