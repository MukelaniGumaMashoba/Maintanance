"use client";

import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Quotation {
    id: string;
    drivername?: string;
    vehiclereg?: string;
    job_type?: string;
    issue?: string;
    parts_needed?: string[];
    laborcost?: number;
    partscost?: number;
    totalcost?: number;
    priority?: string;
    status: "pending" | "approved" | "rejected" | "pending-inspection" | "paid";
    created_at: string;
    description?: string;
}

export default function QuotationDetailPage() {
    const { id } = useParams();
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const supabase = createClient();

    const fetchQuotation = async () => {
        const { data, error } = await supabase
            .from("quotations")
            .select("*")
            .eq("id", String(id))
            .single();

        if (error) {
            toast.error("Failed to load quotation");
            console.error(error);
        } else {
            setQuotation(data as Quotation);
        }
        setLoading(false);
    };

    const updateStatus = async (newStatus: "approved" | "rejected" | "pending-inspection" | "paid") => {
        if (!quotation) return;
        setUpdating(true);

        const { error } = await supabase
            .from("quotations")
            .update({ status: newStatus })
            .eq("id", quotation.id);

        if (error) {
            toast.error("Failed to update status");
            console.error(error);
        } else {
            toast.success(`Quotation ${newStatus}`);
            setQuotation({ ...quotation, status: newStatus });
        }
        setUpdating(false);
    };

    useEffect(() => {
        if (id) fetchQuotation();
    }, [id]);

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (!quotation) return <div className="text-center mt-10">Quotation not found</div>;

    return (
        <div className="mx-auto mt-10 p-4">
            <div>
                <Button onClick={() => {
                    redirect("/ccenter")
                }}>
                    back
                </Button>
            </div>
            <div>
                <h1 className="text-xl font-semibold text-gray-800">Repair {quotation.id}</h1>
            </div>

            <Card className="shadow-lg border border-gray-200">
                <CardHeader className="bg-gray-50 rounded-t-md">
                    <CardTitle className="text-xl font-semibold text-gray-800">Quotation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-700 w-150">
                    <div className="flex justify-between items-center">
                        <span><strong>Status:</strong></span>
                        <Badge variant={
                            quotation.status === "approved" ? "default"
                                : quotation.status === "rejected" ? "destructive"
                                    : quotation.status === "paid" ? "default"
                                        : quotation.status === "pending-inspection" ? "destructive"
                                            : "secondary"
                        }>
                            {quotation.status}
                        </Badge>
                    </div>
                    <div><strong>Driver:</strong> {quotation.drivername}</div>
                    <div><strong>Vehicle:</strong> {quotation.vehiclereg}</div>
                    <div><strong>Job Type:</strong> {quotation.job_type}</div>
                    <div><strong>Priority:</strong> {quotation.priority}</div>
                    <div><strong>Issue:</strong> {quotation.issue}</div>
                    <div><strong>Description:</strong> {quotation.description}</div>
                    <div><strong>Parts Needed:</strong> {quotation.parts_needed?.join(", ")}</div>
                    <div><strong>Labor Cost:</strong> R {quotation.laborcost?.toFixed(2)}</div>
                    <div><strong>Parts Cost:</strong> R {quotation.partscost?.toFixed(2)}</div>
                    <div><strong>Total Cost:</strong> R {quotation.totalcost?.toFixed(2)}</div>
                    <div><strong>Created At:</strong> {new Date(quotation.created_at).toLocaleString()}</div>

                    {quotation.status === "pending" && (
                        <div className="flex gap-4 mt-6">
                            <Button
                                variant="default"
                                disabled={updating}
                                onClick={() => updateStatus("approved")}
                            >
                                Approve
                            </Button>
                            <Button
                                variant="outline"
                                disabled={updating}
                                onClick={() => updateStatus("paid")}
                            >
                                Paid
                            </Button>
                            <Button
                                variant="outline"
                                disabled={updating}
                                onClick={() => updateStatus("pending-inspection")}
                            >
                                Inspection Request
                            </Button>
                            <Button
                                variant="destructive"
                                disabled={updating}
                                onClick={() => updateStatus("rejected")}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
