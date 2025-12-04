import { createClient } from '@/lib/supabase/client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobCardId = searchParams.get('job_card_id')

    let query = supabase
      .from('once_off_parts')
      .select(`
        *,
        job_cards(job_number, vehicle_registration)
      `)
      .order('created_at', { ascending: false })

    if (jobCardId) {
      query = query.eq('job_card_id', parseInt(jobCardId as string))
    }

    const { data: nonStockParts, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch non-stock parts' }, { status: 500 })
    }

    return NextResponse.json({ parts: nonStockParts })

  } catch (error) {
    console.error('Fetch non-stock parts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      job_card_id,
      part_name,
      part_number,
      description,
      quantity,
      unit_cost,
      supplier,
      is_external_workshop
    } = body

    // Validate job exists (workshop_job)
    const { data: jobCard, error: jobError } = await supabase
      .from('workshop_job')
      .select('id')
      .eq('id', job_card_id)
      .single()

    if (jobError || !jobCard) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Calculate total cost
    const totalCost = (quantity || 1) * (unit_cost || 0)

    // Insert into once_off_parts (matches migration table name)
    const { data: part, error } = await supabase
      .from('once_off_parts')
      .insert([{
        job_card_id: job_card_id?.toString() ?? undefined,
        part_name,
        part_number,
        description,
        quantity: quantity || 1,
        unit_cost: unit_cost || 0,
        total_cost: totalCost,
        supplier,
        is_external_workshop: is_external_workshop || false,
        created_by: user.id
      }])
      .select()
      .single()

    // Update workshop_job total_parts_cost to include this non-stock part
    if (!error && part) {
      const { data: currentJob } = await supabase
        .from('workshop_job')
        .select('total_parts_cost')
        .eq('id', job_card_id)
        .single()

      const newTotalPartsCost = (currentJob?.total_parts_cost || 0) + totalCost

      await supabase
        .from('workshop_job')
        .update({ total_parts_cost: newTotalPartsCost })
        .eq('id', job_card_id)
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to create non-stock part' }, { status: 500 })
    }

    return NextResponse.json({ part, message: 'Non-stock part created successfully' })

  } catch (error) {
    console.error('Create non-stock part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const partId = searchParams.get('id')

    if (!partId) {
      return NextResponse.json({ error: 'Part ID required' }, { status: 400 })
    }

    // Check if user can delete this part (created by them or admin)
    const { data: part, error: fetchError } = await supabase
      .from('once_off_parts')
      .select('created_by')
      .eq('id', parseInt(partId as string))
      .single()

    if (fetchError || !part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (part.created_by !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { error } = await supabase
      .from('once_off_parts')
      .delete()
      .eq('id', parseInt(partId as string))

    if (error) {
      return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Non-stock part deleted successfully' })

  } catch (error) {
    console.error('Delete non-stock part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}