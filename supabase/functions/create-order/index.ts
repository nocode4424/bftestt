import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { 
      cart, 
      customerInfo, 
      restaurant, 
      orderType, 
      orderTime,
      scheduledDateTime,
      deliveryAddress,
      paymentIntentId,
      total,
      subtotal,
      tax,
      processingFee,
      tip
    } = await req.json()

    console.log('Creating order:', {
      restaurantId: restaurant.id,
      customerName: customerInfo.name,
      paymentIntentId,
      total
    })

    // Create order record
    const orderData = {
      restaurant_id: restaurant.id,
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      delivery_address: orderType === 'delivery' ? deliveryAddress : null,
      delivery_type: orderType,
      cart: {
        items: cart,
        subtotal,
        tax,
        processingFee,
        tip,
        total,
        orderTime,
        scheduledDateTime
      },
      total,
      payment_intent_id: paymentIntentId,
      payment_status: 'succeeded', // Order only created after payment succeeds
      status: 'new',
      user_id: null // Guest order
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new Error(`Failed to create order: ${orderError.message}`)
    }

    console.log('Order created successfully:', order.id)

    // Send notification emails
    try {
      console.log('Sending notification emails...')
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-order-notification', {
        body: {
          order: {
            id: order.id,
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            customer_phone: customerInfo.phone,
            order_type: orderType,
            delivery_address: deliveryAddress,
            items: cart.map((item: any) => ({
              id: item.id,
              name: item.product.name,
              quantity: item.quantity,
              price: item.total_price,
              modifiers: item.selected_modifiers?.map((m: any) => m.name) || [],
              special_instructions: item.notes
            })),
            subtotal,
            tax,
            delivery_fee: 0,
            tip,
            total,
            created_at: order.created_at,
            restaurant_name: restaurant.name,
            estimated_ready_time: '15-20 minutes'
          },
          type: 'both'
        }
      })

      if (emailError) {
        console.error('Email sending error:', emailError)
      } else {
        console.log('Emails sent successfully:', emailResult)
      }
    } catch (emailError) {
      console.error('Failed to send emails:', emailError)
      // Don't fail the order if emails fail
    }

    // Send SMS notifications
    try {
      console.log('Sending SMS notifications...')
      const smsOrderData = {
        id: order.id,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        order_type: orderType,
        restaurant_id: restaurant.id, // Pass restaurant ID for SMS routing
        items: cart.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.total_price,
          special_instructions: item.notes
        })),
        total,
        restaurant_name: restaurant.name,
        created_at: order.created_at
      }

      const { data: smsResult, error: smsError } = await supabase.functions.invoke('send-sms-notification', {
        body: {
          order: smsOrderData,
          type: 'new_order'
        }
      })

      if (smsError) {
        console.error('SMS sending error:', smsError)
      } else {
        console.log('SMS notifications sent successfully:', smsResult)
      }
    } catch (smsError) {
      console.error('Failed to send SMS notifications:', smsError)
      // Don't fail the order if SMS fails
    }

    return new Response(JSON.stringify({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error creating order:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create order'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})