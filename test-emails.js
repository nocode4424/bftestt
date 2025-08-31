// Test script for email notifications
// Run with: node test-emails.js

const fetch = require('node-fetch');

// Get Supabase URL and anon key (replace with your actual values)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const testOrderData = {
  order: {
    id: 'TEST-' + Date.now(),
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    customer_phone: '(555) 123-4567', 
    order_type: 'pickup',
    delivery_address: null,
    items: [
      {
        id: '1',
        name: 'California Roll',
        quantity: 2,
        price: 12.99,
        modifiers: ['Extra Avocado', 'Spicy Mayo'],
        special_instructions: null
      },
      {
        id: '2',
        name: 'Miso Soup', 
        quantity: 1,
        price: 3.50,
        modifiers: [],
        special_instructions: 'No green onions please'
      }
    ],
    subtotal: 29.48,
    tax: 2.36,
    delivery_fee: 0,
    tip: 5.00,
    total: 36.84,
    created_at: new Date().toISOString(),
    restaurant_name: 'Bluefin Sushi Restaurant',
    estimated_ready_time: '15 minutes'
  },
  type: 'notification' // Test notification emails to restaurant staff
};

async function testEmails() {
  console.log('🧪 Testing email notification system...');
  console.log('📧 Sending to: jeffagordon@gmail.com, jeff@platedagent.com, dangtri168@yahoo.com');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-order-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testOrderData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email test completed!');
      console.log('📋 Results:', JSON.stringify(result, null, 2));
      
      if (result.emails) {
        result.emails.forEach(email => {
          const status = email.success ? '✅' : '❌';
          console.log(`${status} ${email.email}: ${email.success ? 'Sent' : email.error}`);
        });
      }
    } else {
      console.error('❌ Email test failed:', result);
    }
    
  } catch (error) {
    console.error('🚨 Error testing emails:', error.message);
  }
}

// Check if environment variables are set
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('⚠️ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  console.log('Example:');
  console.log('export VITE_SUPABASE_URL="https://your-project.supabase.co"');
  console.log('export VITE_SUPABASE_ANON_KEY="your-anon-key"');
  console.log('Then run: node test-emails.js');
  process.exit(1);
}

testEmails();