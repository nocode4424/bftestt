import { supabase } from '@/integrations/supabase/client';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = 'your-google-client-id';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export interface AdminUser extends GoogleUser {
  restaurant_id: string;
  role: 'admin' | 'manager' | 'viewer';
  is_authorized: boolean;
}

export class GoogleAuth {
  // Initialize Google Sign-In
  static initializeGoogleSignIn() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: this.handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        resolve(true);
      } else {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: this.handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          resolve(true);
        };
        document.head.appendChild(script);
      }
    });
  }

  // Handle Google Sign-In response
  static handleGoogleResponse = (response: any) => {
    // This will be overridden by the component using it
    console.log('Google response:', response);
  };

  // Parse Google JWT token (client-side only - for development)
  static async verifyGoogleToken(credential: string): Promise<GoogleUser | null> {
    try {
      // Simple JWT payload extraction (not for production without server verification)
      const parts = credential.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Basic validation
      if (!payload.sub || !payload.email) {
        throw new Error('Invalid token payload');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture || '',
        email_verified: payload.email_verified || false,
      };
    } catch (error) {
      console.error('Error parsing Google token:', error);
      return null;
    }
  }

  // Admin authentication - check if user is authorized admin
  static async authenticateAdmin(googleUser: GoogleUser): Promise<AdminUser | null> {
    try {
      // Check if user exists in admin_google_users table
      const { data: adminUser, error } = await supabase
        .from('admin_google_users')
        .select(`
          *,
          restaurants!inner(id, name)
        `)
        .eq('google_id', googleUser.id)
        .eq('is_active', true)
        .single();

      if (error || !adminUser) {
        // Check if email is pre-authorized for admin access
        const { data: preAuthorized } = await supabase
          .from('admin_email_whitelist')
          .select('*')
          .eq('email', googleUser.email)
          .eq('is_active', true)
          .single();

        if (preAuthorized) {
          // Create new admin user
          const { data: newAdmin, error: createError } = await supabase
            .from('admin_google_users')
            .insert({
              google_id: googleUser.id,
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture,
              restaurant_id: preAuthorized.restaurant_id,
              role: preAuthorized.default_role || 'viewer',
              is_active: true,
              first_login_at: new Date().toISOString(),
              last_login_at: new Date().toISOString()
            })
            .select(`
              *,
              restaurants!inner(id, name)
            `)
            .single();

          if (createError) {
            console.error('Error creating admin user:', createError);
            return null;
          }

          return {
            ...googleUser,
            restaurant_id: newAdmin.restaurant_id,
            role: newAdmin.role,
            is_authorized: true
          };
        }

        return null; // Not authorized
      }

      // Update last login
      await supabase
        .from('admin_google_users')
        .update({ 
          last_login_at: new Date().toISOString(),
          name: googleUser.name, // Update name in case it changed
          picture: googleUser.picture
        })
        .eq('id', adminUser.id);

      // Log admin access
      await supabase
        .from('admin_access_logs')
        .insert({
          admin_user_id: adminUser.id,
          action: 'google_login',
          ip_address: null, // Will be added by backend if needed
          timestamp: new Date().toISOString()
        });

      return {
        ...googleUser,
        restaurant_id: adminUser.restaurant_id,
        role: adminUser.role,
        is_authorized: true
      };
    } catch (error) {
      console.error('Admin authentication error:', error);
      return null;
    }
  }

  // Customer authentication - create or get customer user
  static async authenticateCustomer(googleUser: GoogleUser): Promise<any> {
    try {
      // Check if customer exists
      const { data: existingCustomer, error } = await supabase
        .from('customer_google_users')
        .select('*')
        .eq('google_id', googleUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Customer doesn't exist, create new one
        const { data: newCustomer, error: createError } = await supabase
          .from('customer_google_users')
          .insert({
            google_id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            is_active: true,
            first_login_at: new Date().toISOString(),
            last_login_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating customer user:', createError);
          return null;
        }

        return { ...googleUser, customer_id: newCustomer.id };
      }

      if (existingCustomer) {
        // Update last login
        await supabase
          .from('customer_google_users')
          .update({ 
            last_login_at: new Date().toISOString(),
            name: googleUser.name,
            picture: googleUser.picture
          })
          .eq('id', existingCustomer.id);

        return { ...googleUser, customer_id: existingCustomer.id };
      }

      return null;
    } catch (error) {
      console.error('Customer authentication error:', error);
      return null;
    }
  }

  // Sign out
  static signOut() {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('google_auth_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('customer_user');
  }
}

// Extend Window interface for Google Identity Services
declare global {
  interface Window {
    google: any;
  }
}