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
    console.log('🚀 DEBUG: Function started')
    
    // Step 1: Test environment
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No Stripe key found',
        debug: 'STEP_1_FAILED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    console.log('✅ DEBUG: Step 1 - Environment OK')

    // Step 2: Test Stripe initialization
    let stripe
    try {
      stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-08-01' })
    } catch (stripeError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Stripe init failed: ' + stripeError.message,
        debug: 'STEP_2_FAILED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }
    console.log('✅ DEBUG: Step 2 - Stripe Init OK')

    // Step 3: Test basic Stripe call
    try {
      const account = await stripe.accounts.retrieve()
      console.log('✅ DEBUG: Step 3 - Basic Stripe API call OK, account:', account.id)
    } catch (accountError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Stripe API failed: ' + accountError.message,
        debug: 'STEP_3_FAILED',
        accountError: accountError.type + ' - ' + accountError.code
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Step 4: Test connected account
    const connectedAccountId = 'acct_1Rcf9pQ5nGi8wO63'
    try {
      const connectedAccount = await stripe.accounts.retrieve(connectedAccountId)
      console.log('✅ DEBUG: Step 4 - Connected account OK:', connectedAccount.id)
    } catch (connectedError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Connected account failed: ' + connectedError.message,
        debug: 'STEP_4_FAILED',
        connectedError: connectedError.type + ' - ' + connectedError.code
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Step 5: Parse request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('✅ DEBUG: Step 5 - Request body parsed OK')
    } catch (parseError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Request body parsing failed: ' + parseError.message,
        debug: 'STEP_5_FAILED'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // If we get here, return success with debug info
    return new Response(JSON.stringify({
      success: true,
      debug: 'ALL_STEPS_PASSED',
      message: 'Debug function completed successfully',
      stripeKeyPrefix: stripeSecretKey.substring(0, 15),
      receivedData: {
        amount: requestBody.amount,
        email: requestBody.customerInfo?.email
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (globalError) {
    console.error('💥 DEBUG: Global error:', globalError)
    return new Response(JSON.stringify({
      success: false,
      error: 'Global error: ' + globalError.message,
      debug: 'GLOBAL_ERROR',
      stack: globalError.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})