"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    workshopInfoSchema,
    insuranceBankingSchema,
    contactLocationSchema,
    fleetManagerSchema,
} from "@/lib/schema/workshopSchemas";

import WorkshopInfoStep from "@/components/workshop/WorkshopInfoStep";
import InsuranceBankingStep from "@/components/workshop/InsuranceBankingStep";
import ContactLocationStep from "@/components/workshop/ContactLocationStep";
import FleetManagerStep from "@/components/workshop/FleetManagerStep";

const combinedSchema = z.object({
    ...workshopInfoSchema.shape,
    ...fleetManagerSchema.shape,
    ...contactLocationSchema.shape,
    ...insuranceBankingSchema.shape,
});

type FormData = z.infer<typeof combinedSchema>;

const steps = [
    "Workshop Information",
    "Fleet Manager Registration",
    "Contact & Location",
    "Insurance & Banking",
];

export default function WorkshopRegistrationForm() {
    const methods = useForm<FormData>({
        resolver: zodResolver(combinedSchema) as any,
        mode: "onSubmit",
    });

    const { handleSubmit, reset, formState: { errors } } = methods;
    console.log(errors);
    const [currentStep, setCurrentStep] = useState(0);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const supabase = createClient();
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchUserProfile() {
            const user = await supabase.auth.getUser();
            if (!user?.data?.user) return;
            const { data, error } = await supabase
                .from("profiles")
                .select("company")
                .eq("id", user.data.user?.id ?? "")
                .single();
            if (error) {
                console.error("Profile fetch error", error);
                return;
            }
            setCompanyId(data?.company ?? null);
        }
        fetchUserProfile();
    }, []);

    const onSubmit = async (formData: FormData) => {
        setLoading(true);
        console.log("Submit is clicked")
        if (!companyId) {
            alert("Company not found for current user.");
            setLoading(false);
            return;
        }

        try {
            // 1️⃣ Upload bank letter file to Supabase Storage
            let bankLetterUrl: string | null = null;
            if (formData?.bank_letter && formData.bank_letter.length > 0) {
                const file = formData.bank_letter[0] as unknown as File;
                const fileName = `${Date.now()}_${file.name}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from("files")
                    .upload(`workshop/${fileName}`, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from("files")
                    .getPublicUrl(`workshop/${fileName}`);

                const publicUrl = publicUrlData?.publicUrl;

                bankLetterUrl = publicUrl;
            }

            // 2️⃣ Insert workshop
            const {
                work_name,
                trading_name,
                number_of_working_days,
                labour_rate,
                fleet_rate,
                vehicles_type,
                workshop_type,
                insurance_policy_number,
                insurance_company_name,
                bank_name,
                account_no,
                after_hours_number,
                province,
                street,
                city,
                town,
                postal_code,
            } = formData;

            const { data: workshopData, error: workshopError } = await supabase
                .from("workshop")
                .insert([
                    {
                        work_name,
                        trading_name,
                        number_of_working_days,
                        labour_rate,
                        fleet_rate,
                        vehicles_type,
                        workshop_type,
                        insurance_policy_number,
                        insurance_company_name,
                        bank_name,
                        account_no,
                        bank_letter: bankLetterUrl,
                        after_hours_number,
                        province,
                        street,
                        city,
                        town,
                        postal_code,
                        company_id: companyId,
                        type: "internal",
                    },
                ])
                .select("id")
                .single();

            if (workshopError || !workshopData) {
                throw workshopError || new Error("Failed to create workshop.");
            }

            const workshopId = workshopData.id;

            // 3️⃣ Create Fleet Manager in Supabase Auth
            const fleetManagerData = {
                full_name: formData.full_name,
                email: formData.email,
                phone_number: formData.phone_number,
                role: "call centre",
                company: companyId,
            };

            const { data: user, error: userError } = await supabase.auth.signUp({
                email: fleetManagerData.email,
                password: fleetManagerData.phone_number,
                options: {
                    data: {
                        name: fleetManagerData.full_name,
                        phone: fleetManagerData.phone_number,
                        role: fleetManagerData.role,
                    },
                },
            });

            if (userError || !user?.user?.id) {
                throw userError || new Error("Failed to create fleet manager in Auth.");
            }

            // 4️⃣ Insert Fleet Manager profile
            const { data: fleetManagerProfile, error: fleetManagerError } = await supabase
                .from("profiles")
                .insert([{ ...fleetManagerData, id: user.user.id }])
                .select("id")
                .single();

            if (fleetManagerError || !fleetManagerProfile) {
                throw fleetManagerError || new Error("Failed to create fleet manager profile.");
            }

            // 5️⃣ Update Workshop with Fleet Manager UUID
            const { error: updateError } = await supabase
                .from("workshop")
                .update({ fleet_manager: fleetManagerProfile.id })
                .eq("id", workshopId);

            if (updateError) throw updateError;

            alert("Workshop and Fleet Manager registered successfully!");
            console.log("Done")
            reset();
            setCurrentStep(0);

        } catch (error: any) {
            console.error(error);
            alert("Failed to register workshop and fleet manager: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="">
                <Card className="shadow-2xl rounded-2xl border border-gray-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            {steps[currentStep]}
                        </CardTitle>
                        <div className="flex justify-between mt-4">
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={`flex-1 h-2 mx-1 rounded-full transition-all ${index <= currentStep
                                        ? "bg-blue-600"
                                        : "bg-gray-300"
                                        }`}
                                />
                            ))}
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {currentStep === 0 && <WorkshopInfoStep />}
                                {currentStep === 1 && <FleetManagerStep />}
                                {currentStep === 2 && <ContactLocationStep />}
                                {currentStep === 3 && <InsuranceBankingStep />}
                            </motion.div>
                        </AnimatePresence>
                    </CardContent>

                    <div className="flex justify-between p-6 border-t border-gray-200">
                        {currentStep > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCurrentStep((s) => s - 1)}
                            >
                                Previous
                            </Button>
                        )}
                        {currentStep < steps.length - 1 ? (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep((s) => s + 1)}
                                className="ml-auto"
                            >
                                Next
                            </Button>
                        ) : (
                            <Button type="submit" className="ml-auto">
                                {isLoading ? "Submitting..." : "Submit"}
                            </Button>
                        )}
                    </div>
                </Card>
            </form>
        </FormProvider>
    );
}      