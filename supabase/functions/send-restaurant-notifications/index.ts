import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
  special_instructions?: string;
}

interface OrderData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  order_type: 'pickup' | 'delivery';
  delivery_address?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  tip: number;
  total: number;
  created_at: string;
  restaurant_name: string;
  restaurant_id: string;
  estimated_ready_time?: string;
  payment_status?: string;
}

interface EmailRequest {
  order: OrderData;
  email_type: 'new_order' | 'payment_success' | 'order_cancelled' | 'kitchen_alert';
}

// Generate professional restaurant manager notification email
function generateRestaurantManagerEmail(order: OrderData, emailType: string): string {
  const orderTime = new Date(order.created_at).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const statusColor = emailType === 'payment_success' ? '#10b981' : 
                     emailType === 'new_order' ? '#3b82f6' :
                     emailType === 'order_cancelled' ? '#ef4444' : '#f59e0b';

  const statusText = emailType === 'payment_success' ? '✅ Payment Confirmed' : 
                    emailType === 'new_order' ? '🆕 New Order Received' :
                    emailType === 'order_cancelled' ? '❌ Order Cancelled' : '🔔 Kitchen Alert';

  const itemsHtml = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0;">
        <div style="font-weight: 600; color: #1f2937; font-size: 16px;">${item.name}</div>
        ${item.modifiers && item.modifiers.length > 0 ? 
          `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
            <strong>Modifiers:</strong> ${item.modifiers.join(', ')}
          </div>` : ''}
        ${item.special_instructions ? 
          `<div style="font-size: 14px; color: #dc2626; margin-top: 4px; font-style: italic; font-weight: 600;">
            <strong>Special Instructions:</strong> ${item.special_instructions}
          </div>` : ''}
      </td>
      <td style="text-align: center; padding: 12px 8px; font-weight: 600; color: #1f2937;">
        ${item.quantity}
      </td>
      <td style="text-align: right; padding: 12px 0; font-weight: 600; color: #1f2937;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusText} - Order #${order.id.slice(-8)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8fafc;">

  <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background: ${statusColor}; padding: 30px 24px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🍣 ${statusText}</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
        Order #${order.id.slice(-8)} • ${order.restaurant_name}
      </p>
    </div>

    <!-- Order Details -->
    <div style="padding: 32px 24px;">
      
      <!-- Order Info Cards -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
        
        <!-- Customer Info -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor};">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Customer Information</h3>
          <p style="margin: 4px 0; font-size: 14px;"><strong>${order.customer_name}</strong></p>
          <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${order.customer_phone}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #6b7280;">${order.customer_email}</p>
        </div>

        <!-- Order Details -->
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${statusColor};">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1f2937;">Order Details</h3>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Type:</strong> ${order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Time:</strong> ${orderTime}</p>
          ${order.estimated_ready_time ? 
            `<p style="margin: 4px 0; font-size: 14px;"><strong>Est. Ready:</strong> ${order.estimated_ready_time}</p>` : ''}
          ${order.payment_status ? 
            `<p style="margin: 4px 0; font-size: 14px;"><strong>Payment:</strong> <span style="color: #10b981; font-weight: 600;">${order.payment_status.toUpperCase()}</span></p>` : ''}
        </div>
      </div>

      ${order.delivery_address ? `
      <!-- Delivery Address -->
      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #92400e;">🚗 Delivery Address</h3>
        <p style="margin: 0; font-size: 15px; color: #92400e; font-weight: 500;">${order.delivery_address}</p>
      </div>` : ''}

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse; background: #f8fafc; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: ${statusColor}; color: white;">
              <th style="text-align: left; padding: 16px; font-weight: 600;">Item</th>
              <th style="text-align: center; padding: 16px; font-weight: 600;">Qty</th>
              <th style="text-align: right; padding: 16px; font-weight: 600;">Price</th>
            </tr>
          </thead>
          <tbody style="background: white;">
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <!-- Order Summary -->
      <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Order Summary</h3>
        <div style="space-y: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 15px;">
            <span>Subtotal:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 15px;">
            <span>Tax:</span>
            <span>$${order.tax.toFixed(2)}</span>
          </div>
          ${order.delivery_fee > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 15px;">
            <span>Delivery Fee:</span>
            <span>$${order.delivery_fee.toFixed(2)}</span>
          </div>` : ''}
          ${order.tip > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 15px;">
            <span>Tip:</span>
            <span>$${order.tip.toFixed(2)}</span>
          </div>` : ''}
          <hr style="margin: 12px 0; border: none; border-top: 2px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 18px; font-weight: 700; color: ${statusColor};">
            <span>Total:</span>
            <span>$${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://orders.bluefinwc.com" 
           style="display: inline-block; background: ${statusColor}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 12px;">
          View Kitchen Display
        </a>
        <a href="https://admin.bluefinwc.com" 
           style="display: inline-block; background: #6b7280; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Analytics Dashboard
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
        This notification was sent to restaurant management for order processing.
      </p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        Powered by <strong>Bluefin Restaurant Management System</strong>
      </p>
    </div>

  </div>

</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const { order, email_type }: EmailRequest = await req.json();

    console.log(`Processing ${email_type} notification for order ${order.id}`);

    // Get restaurant notification recipients from database
    const { data: recipients, error: recipientsError } = await supabase
      .from('restaurant_notification_recipients')
      .select('email, name, role, notification_types')
      .eq('restaurant_id', order.restaurant_id)
      .eq('is_active', true);

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      throw new Error('Failed to fetch notification recipients');
    }

    if (!recipients || recipients.length === 0) {
      console.log('No active recipients found for restaurant');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'No active notification recipients found' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filter recipients based on notification type
    const validRecipients = recipients.filter(recipient => {
      const notificationTypes = recipient.notification_types || [];
      return notificationTypes.includes(email_type);
    });

    if (validRecipients.length === 0) {
      console.log(`No recipients configured for ${email_type} notifications`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `No recipients configured for ${email_type} notifications` 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Sending ${email_type} emails to ${validRecipients.length} recipients`);

    // Generate email content
    const subject = `${email_type === 'payment_success' ? '✅ Payment Confirmed' : 
                      email_type === 'new_order' ? '🆕 New Order Received' :
                      email_type === 'order_cancelled' ? '❌ Order Cancelled' : 
                      '🔔 Kitchen Alert'} - Order #${order.id.slice(-8)} - $${order.total.toFixed(2)}`;
    
    const emailHtml = generateRestaurantManagerEmail(order, email_type);

    // Send emails to all valid recipients
    const emailPromises = validRecipients.map(async (recipient) => {
      try {
        const emailResult = await resend.emails.send({
          from: 'Bluefin Restaurant <orders@bluefinwc.com>',
          to: recipient.email,
          subject,
          html: emailHtml,
        });

        // Log successful email
        await supabase
          .from('email_notification_logs')
          .insert({
            restaurant_id: order.restaurant_id,
            order_id: order.id,
            email_type,
            recipient_email: recipient.email,
            subject,
            status: 'sent',
            metadata: {
              recipient_name: recipient.name,
              recipient_role: recipient.role,
              email_service: 'resend',
              email_id: emailResult.data?.id
            }
          });

        console.log(`Email sent successfully to ${recipient.email} (${recipient.name})`);
        return { success: true, email: recipient.email, id: emailResult.data?.id };

      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        
        // Log failed email
        await supabase
          .from('email_notification_logs')
          .insert({
            restaurant_id: order.restaurant_id,
            order_id: order.id,
            email_type,
            recipient_email: recipient.email,
            subject,
            status: 'failed',
            error_message: error.message,
            metadata: {
              recipient_name: recipient.name,
              recipient_role: recipient.role,
              email_service: 'resend'
            }
          });

        return { success: false, email: recipient.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successfulEmails = results.filter(r => r.success);
    const failedEmails = results.filter(r => !r.success);

    console.log(`Email sending complete: ${successfulEmails.length} successful, ${failedEmails.length} failed`);

    return new Response(JSON.stringify({
      success: true,
      sent_count: successfulEmails.length,
      failed_count: failedEmails.length,
      results: results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Restaurant notification error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});