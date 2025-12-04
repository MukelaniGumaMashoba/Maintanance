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
    const lowStock = searchParams.get('low_stock') === 'true'

    let query = supabase
      .from('parts')
      .select('*')
      .order('description')

    if (lowStock) {
      // This would need to be implemented with a custom query or view
      // For now, we'll fetch all and filter client-side
    }

    const { data: parts, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 })
    }

    let filteredParts = parts || []

    if (lowStock) {
      filteredParts = parts?.filter(
        part =>
          (typeof part?.quantity === 'number' && typeof part?.stock_threshold === 'number')
            ? part.quantity <= part.stock_threshold
            : false
      ) || [];
      return NextResponse.json({ parts: filteredParts });
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
      item_code, 
      description, 
      price, 
      quantity, 
      stock_threshold, 
      is_stock_item, 
      supplier, 
      location 
    } = body

    const { data: part, error } = await supabase
      .from('parts')
      .insert({
        item_code,
        description,
        price,
        quantity,
        stock_threshold: stock_threshold || 10,
        is_stock_item: is_stock_item ?? true,
        supplier,
        location
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create part' }, { status: 500 })
    }

    return NextResponse.json({ part, message: 'Part created successfully' })

  } catch (error) {
    console.error('Create part error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      item_code, 
      description, 
      price, 
      quantity, 
      stock_threshold, 
      is_stock_item, 
      supplier, 
      location 
    } = body

    const { data: part, error } = await supabase
      .from('parts')
      .update({
        item_code,
        description,
        price,
        quantity,
        stock_threshold,
        is_stock_item,
        supplier,
        location
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update part' }, { status: 500 })
    }

    return NextResponse.json({ part, message: 'Part updated successfully' })

  } catch (error) {
    console.error('Update part error:', error)
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

    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', parseInt(partId as string))

    if (error) {
      return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Part deleted successfully' })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' })
  }
}