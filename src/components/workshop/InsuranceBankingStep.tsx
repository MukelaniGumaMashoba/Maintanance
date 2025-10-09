"use client";

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function InsuranceBankingStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const [bankFile, setBankFile] = useState<File | null>(null);

  return (
    <Card className="w-full shadow-xl rounded-2xl border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">
          Insurance & Banking Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Insurance Policy Number */}
        <div className="space-y-2">
          <Label htmlFor="insurance_policy_number">Insurance Policy Number</Label>
          <Input
            id="insurance_policy_number"
            type="number"
            placeholder="Enter policy number"
            {...register("insurance_policy_number", { valueAsNumber: true })}
          />
          {typeof errors.insurance_policy_number?.message === "string" && (
            <p className="text-red-500 text-sm">{errors.insurance_policy_number.message}</p>
          )}
        </div>

        {/* Insurance Company Name */}
        <div className="space-y-2">
          <Label htmlFor="insurance_company_name">Insurance Company Name</Label>
          <Input
            id="insurance_company_name"
            placeholder="Enter insurance company"
            {...register("insurance_company_name")}
          />
          {typeof errors.insurance_company_name?.message === "string" && (
            <p className="text-red-500 text-sm">{errors.insurance_company_name.message}</p>
          )}
        </div>

        {/* Bank Name */}
        <div className="space-y-2">
          <Label htmlFor="bank_name">Bank Name</Label>
          <Input
            id="bank_name"
            placeholder="Enter bank name"
            {...register("bank_name")}
          />
          {typeof errors.bank_name?.message === "string" && (
            <p className="text-red-500 text-sm">{errors.bank_name.message}</p>
          )}
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="account_no">Account Number</Label>
          <Input
            id="account_no"
            type="number"
            placeholder="Enter account number"
            {...register("account_no", { valueAsNumber: true })}
          />
          {typeof errors.account_no?.message === "string" && (
            <p className="text-red-500 text-sm">{errors.account_no.message}</p>
          )}
        </div>

        {/* Bank Letter / Document */}
        <div className="space-y-2">
          <Label htmlFor="bank_letter">Bank Letter / Document</Label>
          <Input
            id="bank_letter"
            type="file"
            accept=".pdf,.jpg,.png"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setBankFile(e.target.files[0]);
              }
            }}
          />
          {bankFile && <p>Selected file: {bankFile.name}</p>}
          {typeof errors.bank_letter?.message === "string" && (
            <p className="text-red-500 text-sm">{errors.bank_letter.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
