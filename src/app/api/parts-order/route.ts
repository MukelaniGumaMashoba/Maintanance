import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

const resend = new Resend('re_ZsKAK1px_92CQsX1Qew2yuWhzbEfPgqmB');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supplier_id, parts, notes } = await request.json();

    // Get supplier details
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplier_id)
      .single();

    console.log('Sending email to:', supplier.email);

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('parts_orders')
      .insert({
        supplier_id,
        parts_data: parts,
        notes,
        status: 'pending',
        created_by: user.id
      })
      .select()
      .single();

    if (orderError) {
      console.log(orderError.message)
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Send email to supplier
    const partsTable = parts.map((part: any) =>
      `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${part.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${part.quantity}</td>
      </tr>`
    ).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;"> Klaver Planthire : Parts Order Request</h2>
        <p>Dear ${supplier.contact_person || supplier.name},</p>
        <p>We would like to place an order for the following parts:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Part Description</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${partsTable}
          </tbody>
        </table>
        
        ${notes ? `<p><strong>Additional Notes:</strong><br>${notes}</p>` : ''}
        
        <p>Please confirm availability and provide a quote for these items.</p>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
          <p><strong>Contact Information:</strong></p>
          <p>Name: Lwazi Mhlongo</p>
          <p>Kalver Planthire<br>
          Email: stores@klaverplant.co.za<br>
          Phone: +27 71 442 7811</p>
        </div>
        
        <p>Thank you for your service.</p>
        <p>Best regards,<br>Maintenance Team</p>
      </div>
    `;

    if (supplier.email) {
      console.log('Sending email to:', supplier.email);
      await resend.emails.send({
        from: 'Klaver Plant Hire Workshop <admin@skyfleet.online>',
        to: [supplier.email,"mukelani@solflo.co.za", "stores@klaverplant.co.za"],
        subject: `Klaver Plant Hire : Parts Order Request - Order #${order.id}`,
        html: emailHtml,
      });
    }

    console.log('Email sent successfully for order ID:', order.id, 'supplier email:', supplier.email);

    return NextResponse.json({
      message: 'Order sent successfully',
      order_id: order.id
    });
  } catch (error) {
    console.error('Parts order error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}