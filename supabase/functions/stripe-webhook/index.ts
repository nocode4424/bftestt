import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature || !STRIPE_WEBHOOK_SECRET) {
      console.error('Missing Stripe signature or webhook secret');
      return new Response('Missing signature or webhook secret', { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    console.log(`Processing Stripe webhook: ${event.type}`);

    // Check if this is a connected account event
    const stripeAccount = req.headers.get('stripe-account') || event.account;
    console.log(`Webhook account context:`, { stripeAccount, eventAccount: event.account });

    // Handle payment success events
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment succeeded: ${paymentIntent.id}`, {
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        applicationFee: paymentIntent.application_fee_amount,
        transferData: paymentIntent.transfer_data,
        onBehalfOf: paymentIntent.on_behalf_of,
        account: stripeAccount
      });

      // Find the order associated with this payment intent
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants!inner(id, name)
        `)
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (orderError) {
        console.log('Order not found - this is EXPECTED with new payment flow where orders are created after payment succeeds');
        console.log(`Payment intent ${paymentIntent.id} processed successfully in frontend, no webhook action needed`);
        return new Response('Payment processed successfully - order created in frontend flow', { status: 200 });
      }

      if (!order) {
        console.log('No order data - this is EXPECTED with new payment flow where orders are created after payment succeeds');
        console.log(`Payment intent ${paymentIntent.id} processed successfully in frontend, no webhook action needed`);
        return new Response('Payment processed successfully - order created in frontend flow', { status: 200 });
      }

      // Update order status to confirm payment
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'succeeded',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('Failed to update order payment status:', updateError);
      }

      // Prepare order data for notifications
      const orderData = {
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        order_type: order.delivery_type, // Note: using delivery_type from DB
        delivery_address: order.delivery_address,
        items: order.cart?.items ? order.cart.items.map((item: any) => ({
          id: item.id || item.product_id,
          name: item.name || item.product?.name,
          quantity: item.quantity,
          price: item.price || item.total_price,
          modifiers: item.selected_modifiers?.map((m: any) => m.name) || [],
          special_instructions: item.notes || item.special_instructions
        })) : [],
        subtotal: order.cart?.subtotal || 0,
        tax: order.cart?.tax || 0,
        delivery_fee: order.cart?.delivery_fee || 0,
        tip: order.cart?.tip || 0,
        total: order.total,
        created_at: order.created_at,
        restaurant_name: order.restaurants.name,
        restaurant_id: order.restaurants.id,
        estimated_ready_time: '15-20 minutes',
        payment_status: 'succeeded'
      };

      // Send restaurant manager notifications
      try {
        console.log('Sending restaurant payment success notifications via webhook...');
        const { data: restaurantResult, error: restaurantError } = await supabase.functions.invoke('send-restaurant-notifications', {
          body: {
            order: orderData,
            email_type: 'payment_success'
          }
        });

        if (restaurantError) {
          console.error('Restaurant notification error:', restaurantError);
        } else {
          console.log('Restaurant notifications sent successfully via webhook:', restaurantResult);
        }
      } catch (error) {
        console.error('Failed to send restaurant notifications via webhook:', error);
      }

      // Send customer receipt (if customer email exists)
      if (order.customer_email) {
        try {
          console.log('Sending customer receipt via webhook...');
          const { data: customerResult, error: customerError } = await supabase.functions.invoke('send-order-notification', {
            body: {
              order: orderData,
              type: 'receipt'
            }
          });

          if (customerError) {
            console.error('Customer receipt error via webhook:', customerError);
          } else {
            console.log('Customer receipt sent successfully via webhook:', customerResult);
          }
        } catch (error) {
          console.error('Failed to send customer receipt via webhook:', error);
        }
      }

      return new Response('Payment success notifications sent', { status: 200 });
    }

    // Handle payment failure events
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment failed: ${paymentIntent.id}`);

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_intent_id', paymentIntent.id);

      if (updateError) {
        console.error('Failed to update failed payment status:', updateError);
      }

      return new Response('Payment failure handled', { status: 200 });
    }

    // Handle other webhook events
    console.log(`Unhandled webhook event type: ${event.type}`);
    return new Response('Event received but not processed', { status: 200 });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});