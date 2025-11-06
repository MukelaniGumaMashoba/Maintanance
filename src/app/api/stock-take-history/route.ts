import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: stockTakeHistory, error } = await supabase
      .from('inventory_logs')
      .select(`
        *,
        parts(description, item_code)
      `)
      .eq('change_type', 'adjust')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stockTakeHistory });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { adjustments } = body;

    // Process multiple stock adjustments
    const results = [];
    
    for (const adjustment of adjustments) {
      const { part_id, new_quantity, current_quantity } = adjustment;
      const difference = new_quantity - current_quantity;

      // Update part quantity
      const { error: updateError } = await supabase
        .from('parts')
        .update({ quantity: new_quantity })
        .eq('id', part_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Log the adjustment
      const { data: logEntry, error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          part_id,
          change_type: 'adjust',
          quantity_change: difference,
          created_by: user.id
        })
        .select()
        .single();

      if (logError) {
        return NextResponse.json({ error: logError.message }, { status: 500 });
      }

      results.push(logEntry);
    }

    return NextResponse.json({ 
      message: 'Stock take completed successfully',
      adjustments: results.length 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}