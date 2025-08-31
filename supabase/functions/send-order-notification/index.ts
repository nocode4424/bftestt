import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Email recipients
const NOTIFICATION_EMAILS = [
  'jeffagordon@gmail.com',
  'jeff@platedagent.com', 
  'dangtri168@yahoo.com'
];

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
  estimated_ready_time?: string;
}

function generateOrderNotificationHTML(order: OrderData): string {
  const itemsHtml = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0;">
        <div style="font-weight: 600; color: #1f2937;">${item.name}</div>
        ${item.modifiers && item.modifiers.length > 0 ? 
          `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
            ${item.modifiers.join(', ')}
          </div>` : ''}
        ${item.special_instructions ? 
          `<div style="font-size: 14px; color: #dc2626; margin-top: 4px; font-style: italic;">
            Note: ${item.special_instructions}
          </div>` : ''}
      </td>
      <td style="padding: 12px 0; text-align: center; font-weight: 600;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🍣 New Order Alert</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Order #${order.id}</p>
          </div>

          <!-- Order Details -->
          <div style="padding: 24px;">
            
            <!-- Customer & Order Info -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
                <div style="flex: 1; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Customer Details</h3>
                  <p style="margin: 4px 0; color: #374151;"><strong>Name:</strong> ${order.customer_name}</p>
                  <p style="margin: 4px 0; color: #374151;"><strong>Phone:</strong> ${order.customer_phone}</p>
                  <p style="margin: 4px 0; color: #374151;"><strong>Email:</strong> ${order.customer_email}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Order Info</h3>
                  <p style="margin: 4px 0; color: #374151;"><strong>Type:</strong> ${order.order_type.toUpperCase()}</p>
                  <p style="margin: 4px 0; color: #374151;"><strong>Time:</strong> ${new Date(order.created_at).toLocaleString('en-US', { 
                    timeZone: 'America/New_York',
                    month: 'short',
                    day: 'numeric', 
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</p>
                  ${order.estimated_ready_time ? 
                    `<p style="margin: 4px 0; color: #374151;"><strong>Ready:</strong> ${order.estimated_ready_time}</p>` : ''}
                </div>
              </div>
              
              ${order.delivery_address ? 
                `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin: 0 0 8px 0; color: #1f2937;">Delivery Address:</h4>
                  <p style="margin: 0; color: #374151;">${order.delivery_address}</p>
                </div>` : ''}
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; border-bottom: 2px solid #dc2626; padding-bottom: 8px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 0; text-align: left; font-weight: 600; color: #374151;">Item</th>
                    <th style="padding: 12px 0; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                    <th style="padding: 12px 0; text-align: right; font-weight: 600; color: #374151;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Order Total -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Order Summary</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #374151;">Subtotal:</span>
                <span style="font-weight: 600;">$${order.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #374151;">Tax:</span>
                <span style="font-weight: 600;">$${order.tax.toFixed(2)}</span>
              </div>
              ${order.delivery_fee > 0 ? 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151;">Delivery Fee:</span>
                  <span style="font-weight: 600;">$${order.delivery_fee.toFixed(2)}</span>
                </div>` : ''}
              ${order.tip > 0 ? 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151;">Tip:</span>
                  <span style="font-weight: 600;">$${order.tip.toFixed(2)}</span>
                </div>` : ''}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #1f2937;">
                <span>Total:</span>
                <span style="color: #dc2626;">$${order.total.toFixed(2)}</span>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              This order was placed via ${order.restaurant_name} online ordering system
            </p>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
              Powered by Playtodai Restaurant Solutions
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
}

function generateCustomerReceiptHTML(order: OrderData): string {
  const itemsHtml = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0;">
        <div style="font-weight: 600; color: #1f2937;">${item.name}</div>
        ${item.modifiers && item.modifiers.length > 0 ? 
          `<div style="font-size: 14px; color: #6b7280; margin-top: 4px;">
            ${item.modifiers.join(', ')}
          </div>` : ''}
        ${item.special_instructions ? 
          `<div style="font-size: 14px; color: #dc2626; margin-top: 4px; font-style: italic;">
            Note: ${item.special_instructions}
          </div>` : ''}
      </td>
      <td style="padding: 12px 0; text-align: center; font-weight: 600;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600;">
        $${item.price.toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Playtodai Branding -->
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">🍽️ Playtodai</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Order Confirmed!</h1>
            <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your order</p>
          </div>

          <!-- Order Details -->
          <div style="padding: 24px;">
            
            <!-- Thank You Message -->
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; color: #047857; font-weight: 600;">
                🎉 Hi ${order.customer_name}, your order has been received and is being prepared!
              </p>
              <p style="margin: 8px 0 0 0; color: #065f46; font-size: 14px;">
                Order #${order.id} • ${order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}
                ${order.estimated_ready_time ? ` • Ready by ${order.estimated_ready_time}` : ''}
              </p>
            </div>

            <!-- Restaurant & Order Info -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
                <div style="flex: 1; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${order.restaurant_name}</h3>
                  <p style="margin: 4px 0; color: #374151;"><strong>Order Type:</strong> ${order.order_type.toUpperCase()}</p>
                  <p style="margin: 4px 0; color: #374151;"><strong>Order Time:</strong> ${new Date(order.created_at).toLocaleString('en-US', { 
                    timeZone: 'America/New_York',
                    month: 'short',
                    day: 'numeric', 
                    hour: 'numeric',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Contact Info</h3>
                  <p style="margin: 4px 0; color: #374151;"><strong>Phone:</strong> ${order.customer_phone}</p>
                  <p style="margin: 4px 0; color: #374151;"><strong>Email:</strong> ${order.customer_email}</p>
                </div>
              </div>
              
              ${order.delivery_address ? 
                `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <h4 style="margin: 0 0 8px 0; color: #1f2937;">Delivery Address:</h4>
                  <p style="margin: 0; color: #374151;">${order.delivery_address}</p>
                </div>` : ''}
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 8px;">Your Order</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 0; text-align: left; font-weight: 600; color: #374151;">Item</th>
                    <th style="padding: 12px 0; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                    <th style="padding: 12px 0; text-align: right; font-weight: 600; color: #374151;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </div>

            <!-- Order Total -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Payment Summary</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #374151;">Subtotal:</span>
                <span style="font-weight: 600;">$${order.subtotal.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #374151;">Tax:</span>
                <span style="font-weight: 600;">$${order.tax.toFixed(2)}</span>
              </div>
              ${order.delivery_fee > 0 ? 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151;">Delivery Fee:</span>
                  <span style="font-weight: 600;">$${order.delivery_fee.toFixed(2)}</span>
                </div>` : ''}
              ${order.tip > 0 ? 
                `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151;">Tip:</span>
                  <span style="font-weight: 600;">$${order.tip.toFixed(2)}</span>
                </div>` : ''}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;">
              <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; color: #1f2937;">
                <span>Total Paid:</span>
                <span style="color: #1e40af;">$${order.total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #92400e;">What's Next?</h4>
              <p style="margin: 0; color: #78350f; font-size: 14px;">
                ${order.order_type === 'pickup' ? 
                  `📍 Your order is being prepared. Please arrive at the restaurant for pickup${order.estimated_ready_time ? ` around ${order.estimated_ready_time}` : ''}.` :
                  `🚗 Your order is being prepared and will be delivered to your address${order.estimated_ready_time ? ` by ${order.estimated_ready_time}` : ''}.`
                }
              </p>
              <p style="margin: 8px 0 0 0; color: #78350f; font-size: 14px;">
                Questions? Contact the restaurant directly or reply to this email.
              </p>
            </div>

          </div>

          <!-- Footer with Playtodai Branding -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="margin-bottom: 12px;">
              <div style="font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 4px;">🍽️ Playtodai</div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Restaurant Technology Solutions
              </p>
            </div>
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              Thank you for choosing ${order.restaurant_name}
            </p>
          </div>

        </div>
      </body>
    </html>
  `;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  try {
    // Parse request body
    const { order, type = 'notification' } = await req.json() as { 
      order: OrderData; 
      type: 'notification' | 'receipt' 
    };

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order data is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const emails = [];

    // Send order notification to restaurant/admin emails
    if (type === 'notification' || type === 'both') {
      for (const email of NOTIFICATION_EMAILS) {
        try {
          const { data, error } = await resend.emails.send({
            from: 'Playtodai Orders <orders@playtodai.com>',
            to: [email],
            subject: `🍣 New Order #${order.id} - ${order.restaurant_name} ($${order.total.toFixed(2)})`,
            html: generateOrderNotificationHTML(order),
          });

          if (error) {
            console.error(`Failed to send notification to ${email}:`, error);
          } else {
            console.log(`Notification sent successfully to ${email}:`, data?.id);
            emails.push({ 
              email, 
              type: 'notification', 
              success: true, 
              id: data?.id 
            });
          }
        } catch (error) {
          console.error(`Error sending notification to ${email}:`, error);
          emails.push({ 
            email, 
            type: 'notification', 
            success: false, 
            error: error.message 
          });
        }
      }
    }

    // Send customer receipt
    if ((type === 'receipt' || type === 'both') && order.customer_email) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Playtodai <noreply@playtodai.com>',
          to: [order.customer_email],
          subject: `Order Confirmation #${order.id} - ${order.restaurant_name}`,
          html: generateCustomerReceiptHTML(order),
        });

        if (error) {
          console.error(`Failed to send receipt to ${order.customer_email}:`, error);
          emails.push({ 
            email: order.customer_email, 
            type: 'receipt', 
            success: false, 
            error: error.message 
          });
        } else {
          console.log(`Receipt sent successfully to ${order.customer_email}:`, data?.id);
          emails.push({ 
            email: order.customer_email, 
            type: 'receipt', 
            success: true, 
            id: data?.id 
          });
        }
      } catch (error) {
        console.error(`Error sending receipt to ${order.customer_email}:`, error);
        emails.push({ 
          email: order.customer_email, 
          type: 'receipt', 
          success: false, 
          error: error.message 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Emails processed for order #${order.id}`,
        emails,
        order_id: order.id
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error processing email request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
});