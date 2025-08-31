import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get visitor's IP address from an external service
const getVisitorIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get IP:', error);
    return null;
  }
};

// Get detailed location and device info
const getVisitorDetails = async (ip: string) => {
  try {
    // Use ipapi.co for location data (free tier)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    
    return {
      country: data.country_name,
      region: data.region,
      city: data.city,
    };
  } catch (error) {
    console.error('Failed to get location:', error);
    return {
      country: null,
      region: null,
      city: null,
    };
  }
};

// Parse user agent for device/browser info
const parseUserAgent = (userAgent: string) => {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);
  
  let deviceType = 'desktop';
  if (isMobile && !isTablet) deviceType = 'mobile';
  else if (isTablet) deviceType = 'tablet';
  
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Get URL parameters
const getURLParameters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
  };
};

// Track visitor session
export const trackVisitor = async () => {
  try {
    const sessionId = getSessionId();
    const ip = await getVisitorIP();
    
    if (!ip) return null;
    
    const locationData = await getVisitorDetails(ip);
    const deviceInfo = parseUserAgent(navigator.userAgent);
    const utmParams = getURLParameters();
    
    // Check if visitor already exists
    const { data: existingVisitor } = await supabase
      .from('site_visitors')
      .select('id')
      .eq('session_id', sessionId)
      .single();
    
    if (existingVisitor) {
      // Update existing visitor's last activity
      await supabase
        .from('site_visitors')
        .update({
          last_activity: new Date().toISOString(),
          page_views: supabase.rpc('increment_page_views', { session_id: sessionId })
        })
        .eq('session_id', sessionId);
      
      return existingVisitor.id;
    }
    
    // Create new visitor record
    const { data: newVisitor, error } = await supabase
      .from('site_visitors')
      .insert({
        session_id: sessionId,
        ip_address: ip,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || null,
        landing_page: window.location.pathname,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term,
        utm_content: utmParams.utm_content,
        country: locationData.country,
        region: locationData.region,
        city: locationData.city,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screen_resolution: `${screen.width}x${screen.height}`,
        first_visit: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        page_views: 1,
        is_active: true,
        restaurant_id: '3b29861a-5ade-4800-b269-d0a03c351eb6', // Bluefin restaurant ID
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Failed to create visitor record:', error);
      return null;
    }
    
    return newVisitor.id;
  } catch (error) {
    console.error('Failed to track visitor:', error);
    return null;
  }
};

// Track page view
export const trackPageView = async (pageUrl: string, pageTitle?: string) => {
  try {
    const sessionId = getSessionId();
    
    // Get visitor ID
    const { data: visitor } = await supabase
      .from('site_visitors')
      .select('id')
      .eq('session_id', sessionId)
      .single();
    
    if (!visitor) return;
    
    // Track page view
    await supabase
      .from('page_views')
      .insert({
        visitor_id: visitor.id,
        session_id: sessionId,
        page_url: pageUrl,
        page_title: pageTitle || document.title,
        timestamp: new Date().toISOString(),
      });
    
    // Update visitor's last activity
    await supabase
      .from('site_visitors')
      .update({
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
    
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

// Track cart creation/updates
export const trackCart = async (cartItems: any[], cartTotal: number, stage: string = 'cart_created') => {
  try {
    const sessionId = getSessionId();
    
    // Get visitor ID
    const { data: visitor } = await supabase
      .from('site_visitors')
      .select('id')
      .eq('session_id', sessionId)
      .single();
    
    if (!visitor) return;
    
    // Update visitor to indicate they have a cart
    await supabase
      .from('site_visitors')
      .update({
        has_cart: true,
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
    
    // Check for existing cart session
    const { data: existingCart } = await supabase
      .from('cart_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();
    
    if (existingCart) {
      // Update existing cart
      await supabase
        .from('cart_sessions')
        .update({
          cart_items: cartItems,
          cart_total: cartTotal,
          items_count: cartItems.length,
          updated_at: new Date().toISOString(),
          abandonment_stage: stage,
        })
        .eq('session_id', sessionId);
    } else {
      // Create new cart session
      await supabase
        .from('cart_sessions')
        .insert({
          visitor_id: visitor.id,
          session_id: sessionId,
          cart_items: cartItems,
          cart_total: cartTotal,
          items_count: cartItems.length,
          abandonment_stage: stage,
        });
    }
  } catch (error) {
    console.error('Failed to track cart:', error);
  }
};

// Track cart abandonment
export const trackCartAbandon = async () => {
  try {
    const sessionId = getSessionId();
    
    await supabase
      .from('cart_sessions')
      .update({
        is_abandoned: true,
        abandoned_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
    
  } catch (error) {
    console.error('Failed to track cart abandonment:', error);
  }
};

// Track successful order
export const trackOrderSuccess = async (orderId: string) => {
  try {
    const sessionId = getSessionId();
    
    // Update visitor to indicate successful order
    await supabase
      .from('site_visitors')
      .update({
        has_order: true,
        last_activity: new Date().toISOString(),
      })
      .eq('session_id', sessionId);
    
    // Mark cart as recovered if it exists
    await supabase
      .from('cart_sessions')
      .update({
        is_abandoned: false,
        recovered_at: new Date().toISOString(),
        converted_order_id: orderId,
      })
      .eq('session_id', sessionId);
    
    // Update the order with visitor tracking data
    const { data: visitor } = await supabase
      .from('site_visitors')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (visitor) {
      await supabase
        .from('orders')
        .update({
          session_id: sessionId,
          visitor_ip: visitor.ip_address,
          referrer_url: visitor.referrer_url,
          utm_source: visitor.utm_source,
          utm_medium: visitor.utm_medium,
          utm_campaign: visitor.utm_campaign,
        })
        .eq('id', orderId);
    }
    
  } catch (error) {
    console.error('Failed to track order success:', error);
  }
};

// Track custom interaction
export const trackInteraction = async (interactionType: string, data?: any) => {
  try {
    const sessionId = getSessionId();
    
    // Get visitor ID
    const { data: visitor } = await supabase
      .from('site_visitors')
      .select('id')
      .eq('session_id', sessionId)
      .single();
    
    if (!visitor) return;
    
    // Track interaction
    await supabase
      .from('customer_interactions')
      .insert({
        visitor_id: visitor.id,
        session_id: sessionId,
        interaction_type: interactionType,
        interaction_data: data,
        timestamp: new Date().toISOString(),
      });
    
  } catch (error) {
    console.error('Failed to track interaction:', error);
  }
};

// Initialize analytics (call this on app startup)
export const initializeAnalytics = async () => {
  try {
    await trackVisitor();
    await trackPageView(window.location.pathname, document.title);
    
    // Track page navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(() => trackPageView(window.location.pathname, document.title), 100);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(() => trackPageView(window.location.pathname, document.title), 100);
    };
    
    // Track back/forward navigation
    window.addEventListener('popstate', () => {
      setTimeout(() => trackPageView(window.location.pathname, document.title), 100);
    });
    
    // Track page unload (potential abandonment)
    window.addEventListener('beforeunload', () => {
      // Check if user has items in cart but hasn't ordered
      const cartItems = sessionStorage.getItem('cart');
      if (cartItems && JSON.parse(cartItems).length > 0) {
        navigator.sendBeacon('/api/track-abandon', JSON.stringify({ sessionId: getSessionId() }));
      }
    });
    
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
};