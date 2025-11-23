import { createClient } from '@/lib/supabase/client'

// Fallback data for when tables don't exist
const fallbackData = {
  vehicles: [],
  workshops: [],
  technicians: [],
  parts: [],
  quotations: []
}

// Vehicle Reports
export async function getVehicleReports() {
  const supabase = createClient()

  try {
    const { data: vehicles, error } = await supabase
      .from('vehiclesc_workshop')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Vehicle reports error:', error)
      return fallbackData.vehicles
    }
    return vehicles || fallbackData.vehicles
  } catch (error) {
    console.error('Vehicle reports error:', error)
    return []
  }
}

// Vehicle Maintenance History
export async function getMaintenanceHistoryReports() {
  const supabase = createClient()

  const { data: maintenance, error } = await supabase
    .from('workshop_job')
    .select(`
      *
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Maintenance history error:', error)
    return []
  }
  return maintenance || []
}

// Workshop Reports
export async function getWorkshopReports() {
  const supabase = createClient()

  try {
    const { data: workshops, error } = await supabase
      .from('workshop_klaver')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Workshop reports error:', error)
      return []
    }
    return workshops || []
  } catch (error) {
    console.error('Workshop reports error:', error)
    return []
  }
}

// Workshop Jobs
export async function getWorkshopJobReports() {
  const supabase = createClient()

  const { data: jobs, error } = await supabase
    .from('workshop_job')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Workshop job reports error:', error)
    return []
  }
  return jobs || []
}

// Workshop Job Parts with full job card info
export async function getWorkshopJobParts() {
  const supabase = createClient()

  const { data: jobParts, error } = await supabase
    .from('workshop_jobpart')
    .select(`
      *,
      workshop_job!workshop_jobpart_job_id_fkey(
        id, registration_no, client_name, job_type, status, 
        estimated_cost, actual_cost, created_at, technician_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Workshop job parts error:', error)
    return []
  }
  return jobParts || []
}

// Workshop Assignments
export async function getWorkshopAssignments() {
  const supabase = createClient()

  try {
    const { data: assignments, error } = await supabase
      .from('workshop_assignments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Workshop assignments error:', error)
      return []
    }
    return assignments || []
  } catch (error) {
    console.error('Workshop assignments error:', error)
    return []
  }
}

// Workshop Breakdowns
export async function getWorkshopBreakdowns() {
  const supabase = createClient()

  try {
    const { data: breakdowns, error } = await supabase
      .from('workshop_breakdown')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Workshop breakdowns error:', error)
      return []
    }
    return breakdowns || []
  } catch (error) {
    console.error('Workshop breakdowns error:', error)
    return []
  }
}

// Technicians
export async function getTechnicianReports() {
  const supabase = createClient()

  const { data: technicians, error } = await supabase
    .from('technicians_klaver')
    .select('*')
    .order('join_date', { ascending: false })

  if (error) {
    console.error('Technician reports error:', error)
    return []
  }
  return technicians || []
}

// Technician Vehicle Assignments
export async function getTechnicianAssignments() {
  const supabase = createClient()

  const { data: assignments, error } = await supabase
    .from('technician_vassign')
    .select(`
      *,
      technicians_klaver!technician_vassign_tech_id_fkey(name, phone),
      vehiclesc_workshop!technician_vassign_vehicle_id_fkey(registration_number, make, model)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Technician assignments error:', error)
    return []
  }
  return assignments || []
}

// Drivers
export async function getDriverReports() {
  const supabase = createClient()

  const { data: drivers, error } = await supabase
    .from('drivers_klaver')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Driver reports error:', error)
    return []
  }
  return drivers || []
}

// Parts with enhanced tracking
export async function getPartsReports() {
  const supabase = createClient()

  const { data: parts, error } = await supabase
    .from('parts')
    .select(`
      *,
      categories!parts_category_id_fkey(name),
      vehicle_brands!parts_vehicle_brand_id_fkey(name)
    `)
    .order('id', { ascending: false })

  if (error) {
    console.error('Parts reports error:', error)
    return []
  }
  return parts || []
}

// Enhanced Parts Usage with Job Card Details
export async function getPartsUsageWithJobCards() {
  const supabase = createClient()

  const { data: usage, error } = await supabase
    .from('inventory_logs')
    .select(`
      *,
      parts!inventory_logs_part_id_fkey(item_code, description, category_id, vehicle_brand_id)
    `)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Parts usage error:', error)
    return []
  }
  return usage || []
}

// Stock Reports
export async function getStockReports() {
  const supabase = createClient()

  const { data: stock, error } = await supabase
    .from('stock')
    .select('*')
    .order('id', { ascending: false })

  if (error) {
    console.error('Stock reports error:', error)
    return []
  }
  return stock || []
}

// Stock Orders
export async function getStockOrderReports() {
  const supabase = createClient()

  const { data: orders, error } = await supabase
    .from('stock_orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Stock order reports error:', error)
    return []
  }
  return orders || []
}

// Parts Orders
export async function getPartsOrderReports() {
  const supabase = createClient()

  try {
    const { data: orders, error } = await supabase
      .from('parts_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Parts order reports error:', error)
      return []
    }

    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .in("id", orders?.map(o => o.supplier_id))


    if (suppliersError) {
      console.error('Suppliers fetch error:', suppliersError)
      return orders || []
    }

    const combinedOrders = orders?.map(order => {
      const supplier = suppliers?.find(s => s.id === order.supplier_id)
      return {
        ...order,
        supplier_name: supplier ? supplier.name : 'Unknown Supplier',
        supplier_contact: supplier ? supplier.contact_person : 'N/A',
        supplier_phone: supplier ? supplier.phone : 'N/A'
      }
    })

    return combinedOrders || []
  } catch (error) {
    console.error('Parts order reports error:', error)
    return []
  }
}

// Quotations
export async function getQuotationReports() {
  const supabase = createClient()

  const { data: quotations, error } = await supabase
    .from('quotations_klaver')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Quotation reports error:', error)
    return []
  }
  return quotations || []
}

// Quote Products
export async function getQuoteProductReports() {
  const supabase = createClient()

  const { data: products, error } = await supabase
    .from('quote_products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Quote product reports error:', error)
    return []
  }
  return products || []
}

// Suppliers
export async function getSupplierReports() {
  const supabase = createClient()

  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supplier reports error:', error)
    return []
  }
  return suppliers || []
}

// Job Allocations
export async function getJobAllocations() {
  const supabase = createClient()

  const { data: allocations, error } = await supabase
    .from('job_allocations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Job allocations error:', error)
    return []
  }
  return allocations || []
}

// Sublets
export async function getSubletReports() {
  const supabase = createClient()

  const { data: sublets, error } = await supabase
    .from('sublets')
    .select(`
      *,
      suppliers!sublets_supplier_id_fkey(name, contact_person, phone)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Sublet reports error:', error)
    return []
  }
  return sublets || []
}

// Enhanced Part Assignment History with Job Card Details
export async function getPartAssignmentHistory(partId: number) {
  const supabase = createClient()

  // Get inventory logs for this part
  const { data: logs, error: logsError } = await supabase
    .from('inventory_logs')
    .select(`
      *,
      parts!inventory_logs_part_id_fkey(item_code, description)
    `)
    .eq('part_id', partId)
    .order('timestamp', { ascending: false })

  // Get workshop job parts that reference this part in job_parts JSON
    const { data: jobParts, error: jobPartsError } = await supabase
      .from('workshop_jobpart')
      .select('*')
      .order('created_at', { ascending: false })
  
    // Fetch corresponding jobs only if we have job IDs from jobParts
    let jobs: any[] = []
    let jobsError: any = null
  
    if (jobPartsError) {
      console.error('Workshop job parts error:', jobPartsError)
    } else if (jobParts && jobParts.length) {
      const jobIds = jobParts.map((jp: any) => jp.job_id).filter(Boolean)
  
      if (jobIds.length) {
        const jobsRes = await supabase
          .from('workshop_job')
          .select(`
            id, registration_no, client_name, job_type, status, 
            estimated_cost, actual_cost, created_at, technician_name
          `)
          .order('created_at', { ascending: false })
          .in('id', jobIds)
  
        jobs = jobsRes.data || []
        jobsError = jobsRes.error
  
        if (jobsError) {
          console.error('Jobs fetch error:', jobsError)
        }
      }
    }

  // Map job details into jobParts    

  if (logsError) {
    console.error('Part assignment history error:', logsError)
    return { logs: [], jobParts: [] }
  }

  return {
    logs: logs || [],
    jobParts: (jobParts || []).filter(jp => {
      // Filter job parts that contain this part ID in their JSON data
      const jobPartsData = jp.job_parts
      if (typeof jobPartsData === 'object' && jobPartsData !== null) {
        return JSON.stringify(jobPartsData).includes(partId.toString())
      }
      return false
    })
  }
}

// Export utilities
export function exportToCSV(data: any[], filename: string) {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}

export function exportToPDF(data: any[], title: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { text-align: center; margin-bottom: 30px; }
        .date { text-align: right; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row =>
    `<tr>${Object.values(row).map(value =>
      `<td>${value === null || value === undefined ? '-' :
        typeof value === 'object' ? JSON.stringify(value) : value}</td>`
    ).join('')}</tr>`
  ).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}