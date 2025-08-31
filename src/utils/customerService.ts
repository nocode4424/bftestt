import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

/**
 * Register a new customer account
 */
export async function registerCustomer(customerData: CustomerData, restaurantId: string) {
  try {
    // If password is provided, create a full account
    if (customerData.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customerData.email,
        password: customerData.password,
        options: {
          data: {
            name: customerData.name,
            phone: customerData.phone,
          }
        }
      });

      if (authError) {
        throw new Error(`Account creation failed: ${authError.message}`);
      }

      return {
        success: true,
        user: authData.user,
        message: 'Account created successfully'
      };
    }

    // For guest users, we don't create an auth account
    // Customer data will be stored with the order
    return {
      success: true,
      user: null,
      message: 'Guest checkout ready'
    };

  } catch (error) {
    console.error('Customer registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}

/**
 * Login an existing customer
 */
export async function loginCustomer(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Login failed: ${error.message}`);
    }

    return {
      success: true,
      user: data.user,
      session: data.session
    };

  } catch (error) {
    console.error('Customer login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
}

/**
 * Check if customer email already exists
 */
export async function checkCustomerExists(email: string) {
  try {
    // Try to get user by email - this is a simple check
    // In production, you might want to use a proper user lookup function
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy-password-for-check' // This will fail but tell us if user exists
    });

    // If error is "Invalid login credentials", user exists but password is wrong
    // If error is "Email not confirmed", user exists but not confirmed
    // Other errors might mean user doesn't exist or other issues
    return error?.message?.includes('Invalid login credentials') || 
           error?.message?.includes('Email not confirmed');

  } catch (error) {
    return false;
  }
}

export default {
  registerCustomer,
  loginCustomer,
  checkCustomerExists
};