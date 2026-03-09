import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sublet_id, job_card_id, notes } = await request.json();

    // Get sublet workshop details with supplier info
    const { data: sublet, error: subletError } = await supabase
      .from('sublets')
      .select('*')
      .eq('id', sublet_id)
      .single();

    const { data: jobCard, error: jobError } = await supabase
      .from('workshop_job')
      .select('*')
      .eq('id', job_card_id)
      .single();

    if (subletError || !sublet) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }

    // Get job card details

    if (jobError || !jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
    }

    // Create job allocation record
    const { data: allocation, error: allocationError } = await supabase
      .from('job_allocations')
      .insert({
        sublet_id,
        job_card_id,
        notes,
        status: 'allocated',
        allocated_by: user.id,
        allocated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (allocationError) {
      console.error('Allocation error:', allocationError);
      return NextResponse.json({ error: allocationError.message }, { status: 500 });
    }

    // Update job card status
    await supabase
      .from('workshop_job')
      .update({ sublet: 1 })
      .eq('id', job_card_id);

    // Send email to sublet workshop
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🔧 Klaver New Job Allocation</h1>
        </div>
        
        <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151;">
            Dear ${sublet.name},
          </p>
          
          <p>A new job has been allocated to your workshop. Please find the details below:</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937;">Job Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Job Number:</td>
                <td style="padding: 8px 0; color: #6b7280;">${jobCard.jobId_workshop}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Customer:</td>
                <td style="padding: 8px 0; color: #6b7280;">${jobCard.client_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Vehicle:</td>
                <td style="padding: 8px 0; color: #6b7280;">${jobCard.registration_no || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Description:</td>
                <td style="padding: 8px 0; color: #6b7280;">${jobCard.description || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #374151;">Due Date:</td>
                <td style="padding: 8px 0; color: #6b7280;">${jobCard.due_date ? new Date(jobCard.due_date).toLocaleDateString() : 'Not specified'}</td>
              </tr>
            </table>
          </div>
          
          ${notes ? `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #92400e;">Special Instructions:</h4>
            <p style="margin: 0; color: #92400e;">${notes}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #065f46;">Next Steps:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #065f46;">
              <li>Review the job requirements carefully</li>
              <li>Contact the customer if needed: ${jobCard.customer_phone || 'Contact main office'}</li>
              <li>Provide updates on job progress</li>
              <li>Submit completion report when finished</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Contact Information:</strong><br>
              Maintenance Workshop<br>
              Name: Lwazi
              Email: stores@klaverplant.co.za<br>
              Phone: +27 11 123 4567
            </p>
          </div>
          
          <p>Thank you for your partnership.</p>
          <p>Best regards,<br>Maintenance Team</p>
        </div>
      </div>
    `;

    if (sublet.email) {
      await resend.emails.send({
        from: 'Maintenance Workshop <stores@klaverplant.co.za>',
        to: [sublet.email, "mukelani@solflo.co.za", "stores@klaverplant.co.za"],
        subject: `New Job Allocation - ${jobCard.job_number}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      message: 'Job allocated successfully and email sent',
      allocation_id: allocation.id
    });
  } catch (error) {
    console.error('Job allocation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
