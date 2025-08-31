import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request
    const requestBody = await req.json()
    const { 
      cart,
      customerInfo,
      restaurant,
      paymentIntentId,
      total,
      subtotal,
      tax,
      tip,
      processingFee,
      orderType = 'pickup',
      deliveryAddress = null,
      couponCode = null,
      couponDiscount = 0
    } = requestBody

    // Extract restaurant ID
    const restaurantId = restaurant?.id || '3b29861a-5ade-4800-b269-d0a03c351eb6'

    // Create order in database - this will appear in kitchen immediately
    const orderData = {
      restaurant_id: restaurantId,
      customer_name: customerInfo?.name || null,
      customer_email: customerInfo?.email || null,
      customer_phone: customerInfo?.phone || null,
      cart: cart || [],
      total: parseFloat(total) || 0,
      payment_intent_id: paymentIntentId || null,
      payment_status: 'succeeded',
      delivery_type: orderType || 'pickup',
      delivery_address: deliveryAddress,
      status: 'NEW', // This triggers kitchen alert
      coupon_code: couponCode,
      coupon_discount_amount: parseFloat(couponDiscount) || 0,
      created_at: new Date().toISOString(),
      estimated_ready_time: new Date(Date.now() + 20 * 60000).toISOString()
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      throw new Error('Failed to create order: ' + orderError.message)
    }

    // Send SMS notification to restaurant staff
    try {
      // Format cart items for SMS
      const formattedItems = cart.map(item => ({
        name: item.product?.name || item.name || 'Unknown Item',
        quantity: item.quantity || 1,
        price: item.total_price || item.price || 0,
        special_instructions: item.notes || ''
      }))

      // Create order object for SMS function
      const orderForSMS = {
        id: order.id,
        customer_name: customerInfo?.name || 'Unknown Customer',
        customer_phone: customerInfo?.phone || '',
        customer_email: customerInfo?.email || '',
        order_type: orderType === 'delivery' ? 'delivery' : 'pickup',
        restaurant_id: restaurantId,
        restaurant_name: 'BlueFin Sushi',
        items: formattedItems,
        total: parseFloat(total) || 0,
        created_at: order.created_at
      }

      // Call the proper SMS notification function
      await supabase.functions.invoke('send-sms-notification', {
        body: {
          order: orderForSMS,
          type: 'new_order'
        }
      })
      
      console.log('SMS notification sent successfully')
    } catch (err: any) {
      console.error('SMS notification failed:', err.message)
      // Don't fail the order creation if SMS fails
    }

    return new Response(JSON.stringify({
      success: true,
      order: order,
      orderId: order.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to record order'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})