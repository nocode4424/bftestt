import { supabase } from '../integrations/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: string[];
  special_instructions?: string;
}

interface OrderEmailData {
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

export type EmailType = 'notification' | 'receipt' | 'both';

export interface EmailResult {
  success: boolean;
  message?: string;
  emails?: Array<{
    email: string;
    type: string;
    success: boolean;
    id?: string;
    error?: string;
  }>;
  order_id?: string;
  error?: string;
  details?: string;
}

/**
 * Send order notification emails via Supabase Edge Function
 * 
 * @param order - The order data to send in the email
 * @param type - Type of email to send ('notification', 'receipt', or 'both')
 * @returns Promise with email sending results
 */
export async function sendOrderEmails(
  order: OrderEmailData, 
  type: EmailType = 'both'
): Promise<EmailResult> {
  try {
    console.log(`Sending ${type} emails for order #${order.id}...`);
    
    const { data, error } = await supabase.functions.invoke('send-order-notification', {
      body: { order, type }
    });

    if (error) {
      console.error('Error invoking email function:', error);
      return {
        success: false,
        error: 'Failed to send emails',
        details: error.message
      };
    }

    console.log('Email function response:', data);
    return data as EmailResult;

  } catch (error) {
    console.error('Error sending order emails:', error);
    return {
      success: false,
      error: 'Email service error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send order notification to restaurant staff only
 */
export async function sendOrderNotification(order: OrderEmailData): Promise<EmailResult> {
  return sendOrderEmails(order, 'notification');
}

/**
 * Send customer receipt email only
 */
export async function sendCustomerReceipt(order: OrderEmailData): Promise<EmailResult> {
  return sendOrderEmails(order, 'receipt');
}

/**
 * Utility function to format order data from database for email service
 * This helps convert database order format to the email service format
 */
export function formatOrderForEmail(
  orderData: any,
  restaurantName: string = 'Restaurant'
): OrderEmailData {
  return {
    id: orderData.id || orderData.order_id || 'UNKNOWN',
    customer_name: orderData.customer_name || orderData.name || 'Customer',
    customer_email: orderData.customer_email || orderData.email || '',
    customer_phone: orderData.customer_phone || orderData.phone || '',
    order_type: orderData.order_type || orderData.type || 'pickup',
    delivery_address: orderData.delivery_address || orderData.address,
    items: orderData.items || orderData.order_items || [],
    subtotal: parseFloat(orderData.subtotal || orderData.subtotal_amount || 0),
    tax: parseFloat(orderData.tax || orderData.tax_amount || 0),
    delivery_fee: parseFloat(orderData.delivery_fee || 0),
    tip: parseFloat(orderData.tip || orderData.tip_amount || 0),
    total: parseFloat(orderData.total || orderData.total_amount || 0),
    created_at: orderData.created_at || new Date().toISOString(),
    restaurant_name: restaurantName,
    estimated_ready_time: orderData.estimated_ready_time || orderData.ready_time
  };
}

/**
 * Test the email system with sample data
 */
export async function testEmailSystem(): Promise<EmailResult> {
  const testOrder: OrderEmailData = {
    id: 'TEST-' + Date.now(),
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '(555) 123-4567',
    order_type: 'pickup',
    items: [
      {
        id: '1',
        name: 'California Roll',
        quantity: 2,
        price: 12.99,
        modifiers: ['Extra Avocado', 'Spicy Mayo']
      },
      {
        id: '2', 
        name: 'Miso Soup',
        quantity: 1,
        price: 3.50,
        special_instructions: 'No green onions please'
      }
    ],
    subtotal: 29.48,
    tax: 2.36,
    delivery_fee: 0,
    tip: 5.00,
    total: 36.84,
    created_at: new Date().toISOString(),
    restaurant_name: 'Test Sushi Restaurant',
    estimated_ready_time: '15 minutes'
  };

  console.log('Testing email system with sample order...');
  return sendOrderEmails(testOrder, 'notification');
}

export default {
  sendOrderEmails,
  sendOrderNotification, 
  sendCustomerReceipt,
  formatOrderForEmail,
  testEmailSystem
};