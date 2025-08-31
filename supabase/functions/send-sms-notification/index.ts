import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Restaurant-specific SMS notification numbers
const SMS_NOTIFICATION_CONFIG = {
  // BlueFin Sushi - Wesley Chapel
  '3b29861a-5ade-4800-b269-d0a03c351eb6': [
    '+14694947732', // Jeff
    '+19178911695', // Lawrence  
    '+13183484231'  // Vance
  ],
  // PeppaJak (when restaurant_id is available)
  'peppajak': [
    '+14694947732', // Jeff
    '+13183484231', // Vance
    '+18134280522'  // Alaa
  ]
};

interface OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  order_type: 'pickup' | 'delivery';
  restaurant_id?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    special_instructions?: string;
  }>;
  total: number;
  restaurant_name: string;
  created_at: string;
}

async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    // Using Textbelt API for SMS with Paid AI account
    const textbeltApiKey = Deno.env.get('TEXTBELT_API_KEY') || 'textbelt';
    
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: to,
        message: message,
        key: textbeltApiKey,
      }),
    });

    const result = await response.json();
    console.log('SMS API Response:', result);
    
    return result.success === true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
}

function formatOrderSMS(order: OrderData): string {
  const itemsList = order.items
    .slice(0, 3) // Limit to first 3 items for SMS
    .map(item => `${item.quantity}x ${item.name}`)
    .join(', ');
  
  const moreItems = order.items.length > 3 ? ` +${order.items.length - 3} more` : '';
  
  return `🍣 NEW ORDER #${order.id.slice(-4)}
${order.restaurant_name}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Type: ${order.order_type.toUpperCase()}
Items: ${itemsList}${moreItems}
Total: $${order.total}
Time: ${new Date(order.created_at).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit'
  })}`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { order, type = 'new_order' } = await req.json() as { 
      order: OrderData; 
      type?: 'new_order' | 'order_ready' | 'order_cancelled';
    };

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order data is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Sending SMS notifications for order: ${order.id}, type: ${type}`);

    // Generate SMS message based on type
    let smsMessage: string;
    
    switch (type) {
      case 'new_order':
        smsMessage = formatOrderSMS(order);
        break;
      case 'order_ready':
        smsMessage = `🍣 ORDER READY #${order.id.slice(-4)}
${order.restaurant_name}
Customer: ${order.customer_name} (${order.customer_phone})
${order.order_type.toUpperCase()} - $${order.total}
Ready for pickup!`;
        break;
      case 'order_cancelled':
        smsMessage = `❌ ORDER CANCELLED #${order.id.slice(-4)}
${order.restaurant_name}
Customer: ${order.customer_name}
Total: $${order.total}`;
        break;
      default:
        smsMessage = formatOrderSMS(order);
    }

    const smsResults = [];

    // Get restaurant-specific phone numbers
    let phoneNumbers: string[] = [];
    
    if (order.restaurant_id) {
      phoneNumbers = SMS_NOTIFICATION_CONFIG[order.restaurant_id] || [];
    }
    
    // Fallback: if no restaurant_id or no config found, determine by restaurant name
    if (phoneNumbers.length === 0) {
      if (order.restaurant_name?.toLowerCase().includes('bluefin')) {
        phoneNumbers = SMS_NOTIFICATION_CONFIG['3b29861a-5ade-4800-b269-d0a03c351eb6'];
      } else if (order.restaurant_name?.toLowerCase().includes('peppajak')) {
        phoneNumbers = SMS_NOTIFICATION_CONFIG['peppajak'];
      } else {
        // Default to BlueFin numbers if can't determine
        phoneNumbers = SMS_NOTIFICATION_CONFIG['3b29861a-5ade-4800-b269-d0a03c351eb6'];
      }
    }

    console.log(`Sending SMS to ${phoneNumbers.length} recipients for ${order.restaurant_name}`);

    // Send SMS to restaurant-specific notification numbers
    for (const phoneNumber of phoneNumbers) {
      try {
        const success = await sendSMS(phoneNumber, smsMessage);
        
        smsResults.push({
          phone: phoneNumber,
          success,
          type: 'notification',
          timestamp: new Date().toISOString()
        });

        if (success) {
          console.log(`SMS sent successfully to ${phoneNumber}`);
        } else {
          console.error(`Failed to send SMS to ${phoneNumber}`);
        }

        // Rate limiting - wait between sends
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error sending SMS to ${phoneNumber}:`, error);
        smsResults.push({
          phone: phoneNumber,
          success: false,
          error: error.message,
          type: 'notification'
        });
      }
    }

    // Log SMS activity to database for tracking
    try {
      await supabase
        .from('order_notifications')
        .insert({
          order_id: order.id,
          notification_type: 'sms',
          details: {
            type,
            recipients: phoneNumbers,
            results: smsResults,
            message: smsMessage
          },
          created_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.error('Failed to log SMS activity:', dbError);
      // Don't fail the SMS sending if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS notifications processed for order #${order.id}`,
        results: smsResults,
        order_id: order.id,
        notification_type: type
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing SMS notification request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});