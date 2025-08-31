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
    const { restaurant_id } = await req.json()
    
    if (!restaurant_id) {
      throw new Error('Restaurant ID is required')
    }

    // Get current restaurant settings
    const { data: settings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError
    }

    const now = new Date()
    let orderingEnabled = true
    let disableInfo = null

    if (settings) {
      // Check if ordering is currently disabled
      if (settings.ordering_disabled) {
        // Check if disable period has expired
        if (settings.disable_until) {
          const disableUntil = new Date(settings.disable_until)
          
          if (now >= disableUntil) {
            // Time has expired, re-enable ordering
            const { error: updateError } = await supabase
              .from('restaurant_settings')
              .update({ 
                ordering_disabled: false,
                disable_until: null,
                updated_at: now.toISOString()
              })
              .eq('restaurant_id', restaurant_id)

            if (updateError) {
              console.error('Error re-enabling ordering:', updateError)
            } else {
              console.log(`Automatically re-enabled ordering for restaurant ${restaurant_id}`)
            }
            
            orderingEnabled = true
          } else {
            // Still within disable period
            orderingEnabled = false
            disableInfo = {
              disabled_by: settings.disabled_by,
              disable_reason: settings.disable_reason,
              approved_by: settings.approved_by,
              disable_until: settings.disable_until,
              disabled_at: settings.disabled_at
            }
          }
        } else {
          // No end time specified, ordering is disabled indefinitely
          orderingEnabled = false
          disableInfo = {
            disabled_by: settings.disabled_by,
            disable_reason: settings.disable_reason,
            approved_by: settings.approved_by,
            disabled_at: settings.disabled_at
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ordering_enabled: orderingEnabled,
      disable_info: disableInfo,
      checked_at: now.toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Error checking ordering status:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to check ordering status',
      ordering_enabled: true // Default to enabled on error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})