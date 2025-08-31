import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerAuth, CustomerUser } from '@/lib/customerAuth';
import { User, LogIn, ShoppingCart } from 'lucide-react';

interface CustomerLoginProps {
  onLoginSuccess?: (user: CustomerUser) => void;
  onLoginError?: (error: string) => void;
  variant?: 'cart' | 'profile' | 'inline';
  showTitle?: boolean;
  className?: string;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({
  onLoginSuccess,
  onLoginError,
  variant = 'inline',
  showTitle = true,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState('');
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);

  useEffect(() => {
    // Initialize Google Sign-In and check auth
    initializeAuth();
    
    // Subscribe to auth changes
    const unsubscribe = CustomerAuth.subscribe((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  const initializeAuth = async () => {
    try {
      // Check existing auth
      await CustomerAuth.checkAuth();
      
      // Initialize Google Sign-In
      const [nonceValue] = await CustomerAuth.initializeGoogleSignIn(handleGoogleResponse);
      setNonce(nonceValue);
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setError('Authentication initialization failed');
    }
  };

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) {
      const errorMsg = 'Google sign-in failed - no credential received';
      setError(errorMsg);
      onLoginError?.(errorMsg);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await CustomerAuth.signInWithGoogle(response.credential, nonce);
      onLoginSuccess?.(user);
    } catch (error: any) {
      const errorMsg = error.message || 'Google authentication failed';
      setError(errorMsg);
      onLoginError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    try {
      CustomerAuth.triggerGoogleSignIn();
    } catch (error: any) {
      setError(error.message);
      onLoginError?.(error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await CustomerAuth.signOut();
    } catch (error: any) {
      setError('Sign out failed');
    }
  };

  // If user is signed in, show profile info
  if (currentUser) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {currentUser.picture ? (
            <img 
              src={currentUser.picture} 
              alt={currentUser.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="w-8 h-8 p-1 bg-gray-100 rounded-full" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">{currentUser.name}</span>
            <span className="text-xs text-gray-500">{currentUser.email}</span>
          </div>
        </div>
        <Button 
          onClick={handleSignOut}
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  // Cart variant - prominent call to action
  if (variant === 'cart') {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Sign Up to Continue
          </CardTitle>
          <p className="text-gray-600 mt-2">Create an account to place your order and track your favorites</p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center gap-3"
            variant="outline"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? 'Signing up...' : 'Sign up with Google'}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
              <div className="text-red-800 text-sm font-medium">{error}</div>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 mt-4">
            <p>By signing up, you agree to our Terms of Service</p>
            <p className="mt-1">Secure authentication powered by Google</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Profile variant - full form
  if (variant === 'profile') {
    return (
      <Card className={`w-full max-w-md ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <User className="h-7 w-7 text-blue-600" />
            Customer Account
          </CardTitle>
          <p className="text-gray-600 mt-2">Sign in to access your orders and favorites</p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base font-semibold bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center gap-3"
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
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
              <div className="text-red-800 text-sm font-medium">{error}</div>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-6">
            <p>Secure sign-in with your Google account</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant - simple button
  return (
    <div className={className}>
      {showTitle && (
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Account</h3>
      )}
      
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center gap-2"
        variant="outline"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
            Signing in...
          </div>
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </>
        )}
      </Button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-2">
          <div className="text-red-800 text-xs">{error}</div>
        </div>
      )}
    </div>
  );
};