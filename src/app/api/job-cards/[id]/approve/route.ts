import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: Request,
  context: any
) {
  const { params } = context || {}; 
  try {
  const supabase = await createClient();
  // supabase types in generated Database may not include all runtime tables or may be out of sync.
  // Cast to any to avoid TypeScript errors while updating records.
  const sb: any = supabase as any;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    // Update the job card with the new status
    const { data, error } = await sb
      .from('job_cards')
      .update({ 
        status: status,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        error: 'Failed to update job card',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job card updated successfully',
      data: {
        id: data?.id ?? params.id,
        status: data?.status ?? status,
        updated_at: data?.updated_at ?? new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error updating job card:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
