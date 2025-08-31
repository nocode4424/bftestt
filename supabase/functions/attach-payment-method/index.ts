import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) throw new Error('Stripe secret key not configured')

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-08-01' })

    const { paymentMethodId, customer } = await req.json()

    if (!paymentMethodId) throw new Error('paymentMethodId is required')
    if (!customer) throw new Error('customer is required')

    // Attach the payment method to the customer on the platform account
    const attached = await stripe.paymentMethods.attach(
      paymentMethodId,
      { customer }
    )

    return new Response(JSON.stringify({ success: true, paymentMethod: attached }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error attaching payment method:', error)
    return new Response(JSON.stringify({ success: false, error: (error as any).message || 'Failed to attach payment method' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
