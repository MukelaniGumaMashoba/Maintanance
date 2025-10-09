"use client";

import WorkshopRegistrationForm from "@/components/workshop/WorkshopRegistrationForm";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ArrowLeft, ArrowRight } from "lucide-react";

const PAGE_SIZE = 10;

export default function InternalWorkshop() {
    const [showForm, setShowForm] = useState(false);
    const [workshops, setWorkshops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyId, setCompanyId] = useState<number | null>(null);
    const supabase = createClient();

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch user company ID
    const fetchCompany = useCallback(async () => {
        const user = await supabase.auth.getUser();
        if (!user.data.user) return null;
        const { data: profile } = await supabase
            .from("profiles")
            .select("company")
            .eq("id", user.data.user.id)
            .single();

        console.log(profile)
        return profile?.company ?? null;
    }, []);

    // Fetch workshop count for pagination with search
    const fetchWorkshopsCount = useCallback(async (companyId: number, search: string) => {
        const query = supabase
            .from("workshop")
            .select("id", { count: "exact", head: true })
            .eq("company_id", companyId)
            .eq("type", "internal");

        if (search) {
            query.ilike("work_name", `%${search}%`);
        }

        const { count } = await query;
        return count || 0;
    }, []);

    // Fetch paginated workshops
    const fetchWorkshops = useCallback(
        async (companyId: number, search: string, page: number) => {
            setLoading(true);
            let query = supabase
                .from("workshop")
                .select(
                    `
            *,
            profiles: fleet_manager (
              id,
              full_name,
              email,
              phone_number,
              role
            )
          `
                )
                .eq("company_id", companyId)
                .eq("type", "internal")
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
                .order("created_at", { ascending: false });

            if (search) {
                query = query.ilike("work_name", `%${search}%`);
            }

            const { data, error } = await query;

            if (!error && data) {
                setWorkshops(data);
            } else {
                console.error("Error fetching workshops:", error);
                setWorkshops([]);
            }
            setLoading(false);
        },
        []
    );

    // Setup realtime subscription for workshops of company
    const setupRealtimeSubscription = useCallback(
        (companyId: number) => {
            const subscription = supabase
                .channel("public:workshop")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "workshop",
                        filter: `company_id=eq.${companyId}`,
                    },
                    () => {
                        fetchWorkshops(companyId, searchQuery, page);
                        fetchWorkshopsCount(companyId, searchQuery).then(setTotalCount);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        },
        [fetchWorkshops, fetchWorkshopsCount, page, searchQuery]
    );

    // Initialize on mount and when dependencies change
    useEffect(() => {
        async function init() {
            const compId = await fetchCompany();
            setCompanyId(compId);
            if (compId) {
                const count = await fetchWorkshopsCount(compId, searchQuery);
                setTotalCount(count);
                await fetchWorkshops(compId, searchQuery, page);
                const unsubscribe = setupRealtimeSubscription(compId);
                return unsubscribe;
            }
        }
        const unsubPromise = init();
        return () => {
            unsubPromise.then((unsub) => unsub && unsub());
        };
    }, [fetchCompany, fetchWorkshops, fetchWorkshopsCount, page, searchQuery, setupRealtimeSubscription]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="px-4 py-6">
            {!showForm ? (
                <>
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <h1 className="text-3xl font-bold tracking-tight">Internal Workshops</h1>
                        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Workshop
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6 w-full sm:w-80">
                        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search workshops by name..."
                            value={searchQuery}
                            onChange={(e) => {
                                setPage(0);
                                setSearchQuery(e.target.value);
                            }}
                            className="pl-10"
                        />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <Card key={idx} className="p-4">
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2 mb-2" />
                                    <Skeleton className="h-4 w-1/3" />
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && workshops.length === 0 && (
                        <div className="flex flex-col items-center justify-center mt-10 text-center">
                            <p className="text-gray-500 text-lg font-medium mb-4">
                                No internal workshops found.
                            </p>
                            <Button onClick={() => setShowForm(true)} variant="outline">
                                Add Your First Workshop
                            </Button>
                        </div>
                    )}

                    {/* Workshop Cards */}
                    {!loading && workshops.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {workshops.map((workshop) => (
                                    <Card key={workshop.id} className="shadow hover:shadow-lg transition">
                                        <CardHeader>
                                            <CardTitle className="text-xl">{workshop.work_name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 mb-2">
                                                Location: {workshop.city}, {workshop.province}
                                            </p>
                                            {workshop.profiles ? (
                                                <div className="text-sm">
                                                    <p className="font-semibold mb-1">Fleet Manager:</p>
                                                    <p>{workshop.profiles.full_name}</p>
                                                    <p>{workshop.profiles.email}</p>
                                                    <p>{workshop.profiles.phone_number}</p>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500">No fleet manager assigned</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="flex justify-center items-center mt-8 gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                                    disabled={page === 0}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <span className="text-sm text-gray-600">
                                    Page {page + 1} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                                    disabled={page >= totalPages - 1}
                                >
                                    Next <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </>
                    )}
                </>
            ) : (
                <>
                    <Button variant="outline" className="mb-4 flex items-center gap-2" onClick={() => setShowForm(false)}>
                        <ArrowLeft className="w-4 h-4" /> Back to Workshops
                    </Button>
                    <WorkshopRegistrationForm />
                </>
            )}
        </div>
    );
}
