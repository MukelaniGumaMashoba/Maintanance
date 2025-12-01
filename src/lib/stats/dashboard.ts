"use server"

import { createClient } from "@/lib/supabase/server"

// Returns the number of active breakdowns (status = 'available')
export async function getActiveBreakdowns() {
    const supabase = createClient();
    const { count, error } = await (await supabase).from('workshop_job')
        .select('*', { count: 'exact', head: true })
        // .eq('status', 'Awaiting approval');
    if (error) throw error;
    return count || 0;
}

// Returns the number of pending approvals (status = 'pending')
export async function getPendingApprovals() {
    const supabase = createClient();
    const { count, error } = await (await supabase)
        .from('workshop_job')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Awaiting Approval');
    if (error) throw error;
    return count || 0;
}

// Returns the number of available technicians (status = true or availability = 'available')
export async function getAvailableTechnicians() {
    const supabase = createClient();
    const { count, error } = await (await supabase)
        .from('technicians_klaver')
        .select('*', { count: 'exact', head: true })
        .eq('status', true); // or .eq('availability', 'available') if that's the correct field
    if (error) throw error;
    return count || 0;
}

// Returns the total number of vehicles
export async function getTotalVehicles() {
    const supabase = createClient();
    const { count, error } = await (await supabase)
        .from('vehiclesc_workshop')
        .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
}

// Returns the total revenue for the current month (sum of actual_cost in job_assignments completed this month)
export async function getMonthlyRevenue() {
    const supabase = createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    const { data, error } = await (await supabase)
        .from('job_assignments')
        .select('actual_cost, completed_at')
        .gte('completed_at', startOfMonth)
        .lte('completed_at', endOfMonth);
    if (error) throw error;
    interface JobAssignmentCost {
        actual_cost: number | null;
        completed_at: string | null;
    }
    const total = ((data as JobAssignmentCost[] | null) || []).reduce<number>(
        (sum: number, job: JobAssignmentCost) => sum + (job.actual_cost || 0),
        0
    );
    return total;
}

// Returns the number of jobs completed this month
export async function getCompletedJobs() {
    const supabase = createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    const { count, error } = await (await supabase)
        .from('job_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth)
        .lte('completed_at', endOfMonth);
    if (error) throw error;
    return count || 0;
}


export async function getTechnicianStats() {
    const supabase = createClient();
    const { count, error } = await (await supabase)
        .from('technicians_klaver')
        .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
}

export async function getDriverStats() {
    const supabase = createClient();
    const { count, error } = await (await supabase)
        .from("drivers_klaver")
        .select('*', { count: 'exact', head: true });
    if (error) throw error; 
    return count || 0;
}


export async function getWorkshopStats() {
    const supabase = createClient();
    const {count, error} = await (await supabase)
    .from('workshop_job')
    .select('*', {count: 'exact', head: true})
    // .eq('status', 'available');
    if (error) throw error;
    return count || 0;
}

// Returns all dashboard stats in one call
export async function getDashboardStats() {
    const [activeBreakdowns, pendingApprovals, availableTechnicians, totalVehicles, monthlyRevenue, completedJobs, driverStats, technicianStats, workshopStats] = await Promise.all([
        getActiveBreakdowns(),
        getPendingApprovals(),
        getAvailableTechnicians(),
        getTotalVehicles(),
        getMonthlyRevenue(),
        getCompletedJobs(),
        getDriverStats(),
        getTechnicianStats(),
        getWorkshopStats(),
    ]);
    return {
        activeJobCards: activeBreakdowns, // Using activeBreakdowns as activeJobCards for now
        pendingApprovals,
        availableTechnicians,
        totalVehicles,
        monthlyRevenue,
        completedJobs,
        tows: activeBreakdowns, // Using activeBreakdowns as tows for now
        driverStats,
        technicianStats,
        workshopStats
    };
}


