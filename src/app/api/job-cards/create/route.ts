import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const sb: any = supabase as any;

    const body = await request.json();
    const {
      workshop_id,
      client_id,
      vehicle_id,
      breakdown_id,
      created_by,
      notes,
      parts = [],
    } = body;

    if (!workshop_id || !client_id || !created_by) {
      return NextResponse.json({ error: 'workshop_id, client_id and created_by are required' }, { status: 400 });
    }

    const jobNumber = `JC-${Date.now().toString().slice(-6)}`;

    const { data: jobCard, error } = await sb
      .from('job_cards')
      .insert([
        {
          job_number: jobNumber,
          workshop_id,
          client_id,
          vehicle_id: vehicle_id || null,
          breakdown_id: breakdown_id || null,
          status: 'open',
          notes: notes || null,
          created_by,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed creating job card:', error);
      return NextResponse.json({ error: 'Failed creating job card', details: error.message }, { status: 500 });
    }

    // Insert parts as job_card_items if any
    if (parts && parts.length > 0) {
      const items = parts.map((p: any) => ({
        job_card_id: jobCard.id,
        part_id: p.part_id,
        qty_requested: p.qty || 1,
        qty_allocated: 0,
        unit_price: p.unit_price || 0,
      }));

      const { data: itemsData, error: itemsError } = await sb
        .from('job_card_items')
        .insert(items)
        .select();

      if (itemsError) {
        console.error('Failed adding job card items:', itemsError);
        // non-blocking: return job card but notify of items error
        return NextResponse.json({ success: true, jobCard, itemsError: itemsError.message });
      }

      return NextResponse.json({ success: true, jobCard, items: itemsData });
    }

    return NextResponse.json({ success: true, jobCard });
  } catch (error) {
    console.error('Error in job-cards.create:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'unknown' }, { status: 500 });
  }
}
