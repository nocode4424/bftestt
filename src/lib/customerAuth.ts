import { supabase } from '@/integrations/supabase/client';

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  created_at: string;
  last_login_at: string | null;
}

// Generate nonce for Google Sign-In security
export const generateNonce = async (): Promise<[string, string]> => {
  // Use Web Crypto API (browser compatible)
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  const nonce = btoa(String.fromCharCode(...array));
  
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return [nonce, hashedNonce];
};

export class CustomerAuth {
  private static currentUser: CustomerUser | null = null;
  private static listeners: ((user: CustomerUser | null) => void)[] = [];

  // Subscribe to authentication state changes
  static subscribe(callback: (user: CustomerUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);
    
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notify all listeners of auth state change
  private static notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }

  // Get current authenticated customer
  static getCurrentUser(): CustomerUser | null {
    return this.currentUser;
  }

  // Initialize Google Sign-In for customers
  static async initializeGoogleSignIn(callback: (response: any) => void): Promise<[string, string]> {
    try {
      const [nonce, hashedNonce] = await generateNonce();

      // Load Google script if not already loaded
      if (!window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => {
          this.setupGoogleSignIn(callback, hashedNonce);
        };
        document.head.appendChild(script);
      } else {
        this.setupGoogleSignIn(callback, hashedNonce);
      }

      return [nonce, hashedNonce];
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      throw error;
    }
  }

  // Setup Google Sign-In configuration
  private static setupGoogleSignIn(callback: (response: any) => void, hashedNonce: string) {
    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: '1065567916203-8iajb3qnv9f2n1vpbprqm7vdfdcsj0m7.apps.googleusercontent.com',
        callback: callback,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }

  // Sign in customer with Google ID token
  static async signInWithGoogle(credential: string, nonce: string): Promise<CustomerUser> {
    try {
      // Sign in with Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
        nonce: nonce,
      });

      if (error) {
        throw new Error(`Google authentication failed: ${error.message}`);
      }

      if (!data.user) {
        throw new Error('No user data received from Google');
      }

      // Create or update customer record
      const customerUser = await this.createOrUpdateCustomer(data.user);
      
      this.currentUser = customerUser;
      this.notifyListeners();
      
      return customerUser;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  // Create or update customer in database
  private static async createOrUpdateCustomer(user: any): Promise<CustomerUser> {
    try {
      // Check if customer exists
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customer_google_users')
        .select('*')
        .eq('google_id', user.id)
        .single();

      const now = new Date().toISOString();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Customer doesn't exist, create new one
        const { data: newCustomer, error: createError } = await supabase
          .from('customer_google_users')
          .insert({
            google_id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
            picture: user.user_metadata?.picture || user.user_metadata?.avatar_url,
            is_active: true,
            first_login_at: now,
            last_login_at: now
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create customer: ${createError.message}`);
        }

        return {
          id: newCustomer.id,
          email: newCustomer.email,
          name: newCustomer.name,
          picture: newCustomer.picture,
          phone: newCustomer.phone,
          created_at: newCustomer.first_login_at,
          last_login_at: newCustomer.last_login_at
        };
      }

      if (existingCustomer) {
        // Update existing customer
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customer_google_users')
          .update({
            last_login_at: now,
            name: user.user_metadata?.full_name || existingCustomer.name,
            picture: user.user_metadata?.picture || user.user_metadata?.avatar_url || existingCustomer.picture
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update customer:', updateError);
          // Continue with existing data if update fails
        }

        const customerData = updatedCustomer || existingCustomer;
        return {
          id: customerData.id,
          email: customerData.email,
          name: customerData.name,
          picture: customerData.picture,
          phone: customerData.phone,
          created_at: customerData.first_login_at,
          last_login_at: customerData.last_login_at
        };
      }

      throw new Error('Failed to create or retrieve customer data');
    } catch (error) {
      console.error('Customer creation/update error:', error);
      throw error;
    }
  }

  // Check current authentication state
  static async checkAuth(): Promise<CustomerUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get customer data
        const { data: customerData, error } = await supabase
          .from('customer_google_users')
          .select('*')
          .eq('google_id', session.user.id)
          .single();

        if (customerData && !error) {
          const customerUser: CustomerUser = {
            id: customerData.id,
            email: customerData.email,
            name: customerData.name,
            picture: customerData.picture,
            phone: customerData.phone,
            created_at: customerData.first_login_at,
            last_login_at: customerData.last_login_at
          };

          this.currentUser = customerUser;
          this.notifyListeners();
          return customerUser;
        }
      }

      this.currentUser = null;
      this.notifyListeners();
      return null;
    } catch (error) {
      console.error('Auth check error:', error);
      this.currentUser = null;
      this.notifyListeners();
      return null;
    }
  }

  // Sign out customer
  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.currentUser = null;
      this.notifyListeners();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Trigger Google One Tap
  static triggerGoogleSignIn() {
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Google One Tap failed:', error);
        throw error;
      }
    } else {
      throw new Error('Google Sign-In not available. Please refresh the page.');
    }
  }
}

// Global Google Sign-In types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}