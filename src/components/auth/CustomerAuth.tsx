import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleAuth } from '@/lib/googleAuth';
import { User, ShoppingBag } from 'lucide-react';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  customer_id: string;
}

interface CustomerAuthProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: CustomerUser) => void;
  triggerText?: string;
  description?: string;
}

export const CustomerAuth: React.FC<CustomerAuthProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  triggerText = "Sign in to continue",
  description = "Sign in with Google to save your order preferences and track order history"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      initializeGoogle();
    }
  }, [isOpen]);

  const initializeGoogle = async () => {
    try {
      await GoogleAuth.initializeGoogleSignIn();
      GoogleAuth.handleGoogleResponse = handleGoogleSignIn;
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      setError('Failed to initialize sign-in. Please refresh and try again.');
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    if (!response.credential) {
      setError('Sign-in failed. Please try again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify Google token
      const googleUser = await GoogleAuth.verifyGoogleToken(response.credential);
      if (!googleUser) {
        setError('Failed to verify your Google account.');
        return;
      }

      // Authenticate as customer
      const customerUser = await GoogleAuth.authenticateCustomer(googleUser);
      if (!customerUser) {
        setError('Failed to create customer account.');
        return;
      }

      // Store customer session
      localStorage.setItem('customer_user', JSON.stringify(customerUser));
      localStorage.setItem('google_auth_token', response.credential);

      onAuthenticated(customerUser);
      onClose();
    } catch (error) {
      console.error('Customer authentication error:', error);
      setError('Sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Sign In to Continue
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-gray-600 text-sm">
            {description}
          </p>

          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Benefits of signing in:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-green-600" />
                Save favorite items for faster ordering
              </li>
              <li className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Auto-fill contact information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                Track your order history
              </li>
            </ul>
          </div>

          {/* Google Sign-In Button */}
          <Button
            onClick={handleGoogleButtonClick}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center gap-3 py-6"
            variant="outline"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              Continue as Guest
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerAuth;