import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const supplier = searchParams.get('supplier');
    const stockType = searchParams.get('item_code');

    // Build the query
    let query = supabase
      .from('parts')
      .select('*')
      .order('description', { ascending: true });

    // fkey category to item to get category name
    query = query.select('*, categories:category_id(name)');

    // Apply filters
    if (search) {
      query = query.or(`description.ilike.%${search}%,code.ilike.%${search}%,supplier.ilike.%${search}%`);
    }

    if (supplier) {
      query = query.eq('supplier', supplier);
    }

    if (stockType) {
      query = query.eq('item_code', stockType);
    }

    const { data: stock, error } = await query;

    if (error) {
      console.error('Error fetching stock:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert quantity to number for display (since it's stored as text)
    const processedStock = stock?.map((item: any) => ({
      ...item,
      quantity: item.quantity || '0'
    })) || [];

    return NextResponse.json({ stock: processedStock });
  } catch (error) {
    console.error('Error in stock GET:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 