import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Stripe key
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured')
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    // Parse request
    const requestBody = await req.json()
    const { 
      amount,
      customerInfo,
      metadata = {}
    } = requestBody

    // Validate amount - ensure it's positive and reasonable
    if (!amount || amount <= 0) {
      throw new Error('Invalid payment amount: amount must be greater than 0')
    }
    
    // Additional validation to prevent negative amounts
    const validatedAmount = Math.max(0, amount);
    if (validatedAmount !== amount) {
      throw new Error('Invalid payment amount: amount cannot be negative')
    }
    
    // Sanity check for extremely large amounts (optional)
    if (validatedAmount > 10000) {
      throw new Error('Invalid payment amount: amount exceeds maximum limit')
    }

    // Create customer on platform account
    let customerId = null
    if (customerInfo?.email) {
      try {
        const customers = await stripe.customers.list({ 
          email: customerInfo.email, 
          limit: 1 
        })
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
        } else {
          const newCustomer = await stripe.customers.create({
            email: customerInfo.email,
            name: customerInfo.name,
            phone: customerInfo.phone,
          })
          customerId = newCustomer.id
        }
      } catch (err: any) {
        console.log('Customer creation skipped:', err.message)
      }
    }

    // Create payment intent with transfer to connected account
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(validatedAmount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: 'acct_1Rcf9pQ5nGi8wO63', // BlueFin connected account
      },
      metadata: {
        customer_name: customerInfo?.name || '',
        customer_email: customerInfo?.email || '',
        customer_phone: customerInfo?.phone || '',
        ...metadata
      }
    })

    return new Response(JSON.stringify({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      customerId: customerId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create payment intent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})