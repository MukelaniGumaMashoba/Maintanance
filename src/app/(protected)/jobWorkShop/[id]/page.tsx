"use client"

import { useState, useEffect } from "react"
import { redirect, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { FileText, Eye, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface WorkshopJob {
    id: number
    jobId_workshop: string
    description?: string
    status: string
    estimated_cost?: number
    actual_cost?: number
    client_name?: string
    client_phone?: string
    registration_no?: string
    location?: string
    notes?: string
    attachments?: string[]
    created_at: string
}

export default function WorkshopJobDetailPage() {
    const params = useParams()
    const [job, setJob] = useState<WorkshopJob | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchJob = async () => {
            const { data, error } = await supabase
                .from("workshop_job")
                .select("*")
                .eq("id", Number(params.id))
                .single()

            if (error) {
                console.error("Error fetching workshop job:", error)
                setIsLoading(false)
                return
            }
            setJob(data as any)
            setIsLoading(false)
        }
        if (params.id) fetchJob()
    }, [params.id, supabase])


    const updateWorkshopJobStatus = async (jobId: number, status: string) => {
        const { data, error } = await supabase
            .from('workshop_job')
            .update({ status: status })
            .eq('id', jobId);

        if (error) {
            console.error('Error updating status:', error);
            return { success: false, error };
        } else {
            console.log('Status updated:', data);
            return { success: true, data };
        }
    };


    if (isLoading) return <div>Loading...</div>
    if (!job) return <div>Workshop job not found</div>

    return (
        <>
            <Link href="/jobWorkShop">
                <Button variant="ghost" size="sm" className="mb-4 flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Workshop Jobs
                </Button>
            </Link>
            <Card className="p-6">
                <CardHeader className="flex justify-between items-center pb-4 border-b">
                    <CardTitle className="text-2xl font-semibold">{job.jobId_workshop || "Untitled Job"} : {job.status}</CardTitle>
                    <span className="text-sm text-gray-500">{new Date(job.created_at).toLocaleDateString()}</span>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-700">
                    <p><strong>Description:</strong> {job.description || "No description provided"}</p>
                    <p><strong>Vehicle Reg:</strong> {job.registration_no || "N/A"}</p>
                    <p><strong>Client Name:</strong> {job.client_name || "N/A"}</p>
                    <p><strong>Client Phone:</strong> {job.client_phone || "N/A"}</p>
                    <p><strong>Location:</strong> {job.location || "Unknown"}</p>
                    <p><strong>Estimated Cost:</strong> {job.estimated_cost ? `R ${job.estimated_cost.toFixed(2)}` : "N/A"}</p>
                    <p><strong>Actual Cost:</strong> {job.actual_cost ? `R ${job.actual_cost.toFixed(2)}` : "N/A"}</p>
                    {job.notes && <p><strong>Notes:</strong> {job.notes}</p>}
                 
                </CardContent>
                <CardFooter className="flex justify-end gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => {
                        updateWorkshopJobStatus(job.id, 'approved');
                    }}>Accept</Button>
                    <Button variant="destructive" onClick={() => {
                        updateWorkshopJobStatus(job.id, 'declined');
                    }}>Reject</Button>
                    <Button variant="secondary" onClick={() => {
                        redirect('/jobWorkShop')
                    }}>Close</Button>
                </CardFooter>
            </Card>
        </>
    )
}
