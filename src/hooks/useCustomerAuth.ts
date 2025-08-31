import { useState, useEffect } from 'react';
import { GoogleAuth } from '@/lib/googleAuth';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  customer_id: string;
}

export const useCustomerAuth = () => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem('customer_user');
      const authToken = localStorage.getItem('google_auth_token');
      
      if (storedUser && authToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear invalid data
      localStorage.removeItem('customer_user');
      localStorage.removeItem('google_auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = (userData: CustomerUser) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const signOut = () => {
    GoogleAuth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates: Partial<CustomerUser>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('customer_user', JSON.stringify(updatedUser));
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    updateUser
  };
};