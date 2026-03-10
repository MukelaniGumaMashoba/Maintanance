import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { parts } = await request.json();

    if (!parts || parts.length === 0) {
      return NextResponse.json({ message: 'No low stock items' });
    }

    const partsTable = parts.map((part: any) => 
      `<tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${part.item_code || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${part.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: ${part.quantity === 0 ? '#dc2626' : '#f59e0b'};">
          ${part.quantity}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          <span style="background-color: ${part.quantity === 0 ? '#fef2f2' : '#fef3c7'}; 
                       color: ${part.quantity === 0 ? '#dc2626' : '#f59e0b'}; 
                       padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${part.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
          </span>
        </td>
      </tr>`
    ).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Low Stock Alert</h1>
        </div>
        
        <div style="background-color: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151;">
            The following items are running low or out of stock and require immediate attention:
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left; font-weight: 600;">Item Code</th>
                <th style="padding: 12px; border: 1px solid #d1d5db; text-align: left; font-weight: 600;">Description</th>
                <th style="padding: 12px; border: 1px solid #d1d5db; text-align: center; font-weight: 600;">Current Stock</th>
                <th style="padding: 12px; border: 1px solid #d1d5db; text-align: center; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${partsTable}
            </tbody>
          </table>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0; color: #92400e;">Action Required:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li>Review stock levels and reorder quantities</li>
              <li>Contact suppliers for urgent restocking</li>
              <li>Check for any pending orders</li>
              <li>Consider alternative suppliers if needed</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This is an automated alert from your Maintenance Inventory System<br>
              Generated on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Maintenance System <admin@skyfleet.online>',
      to: ['mukelani@solflo.co.za', 'stores@klaverplant.co.za'],
      subject: `🚨 Low Stock Alert - ${parts.length} Items Need Attention`,
      html: emailHtml,
    });

    return NextResponse.json({ 
      message: 'Low stock alert sent successfully',
      items_count: parts.length 
    });
  } catch (error) {
    console.error('Low stock alert error:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}