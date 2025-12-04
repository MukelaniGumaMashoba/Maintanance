import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { job_card_id, action, notes } = body

    // Verify user permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('can_approve_jobs, can_reject_jobs, can_close_jobs')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get current job card
    const { data: jobCard, error: jobError } = await supabase
      .from('job_cards')
      .select('*')
      .eq('id', job_card_id)
      .single()

    if (jobError || !jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 })
    }

    let newStatus = jobCard.workflow_status
    let newJobStatus = jobCard.status

    // Process workflow action
    switch (action) {
      case 'approve':
        if (!profile.can_approve_jobs) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        newStatus = 'approved'
        newJobStatus = 'approved'
        break

      case 'reject':
        if (!profile.can_reject_jobs) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        newStatus = 'rejected'
        newJobStatus = 'rejected'
        
        // Store in rejected_jobs table
        await supabase
          .from('rejected_jobs')
          .insert({
            original_job_card_id: job_card_id,
            job_data: jobCard,
            rejection_reason: notes,
            rejected_by: user.id
          })
        break

      case 'complete':
        if (!profile.can_close_jobs) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }
        newStatus = 'completed'
        newJobStatus = 'completed'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update job card
    const { error: updateError } = await supabase
      .from('job_cards')
      .update({
        workflow_status: newStatus,
        status: newJobStatus,
        completion_date: action === 'complete' ? new Date().toISOString() : jobCard.completion_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_card_id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update job card' }, { status: 500 })
    }

    // Log workflow history
    await supabase
      .from('job_card_workflow_history')
      .insert({
        job_card_id,
        from_status: jobCard.workflow_status,
        to_status: newStatus,
        action_by: user.id,
        notes
      })

    return NextResponse.json({ 
      success: true, 
      message: `Job ${action}d successfully`,
      new_status: newStatus 
    })

  } catch (error) {
    console.error('Workflow action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}