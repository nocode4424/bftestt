import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Restaurant } from '@/pages/Menu';
import { registerCustomer, loginCustomer } from '@/utils/customerService';

interface CustomerAuthModalProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
  onContinueGuest: () => void;
  onCreateAccount: (customerData: any) => void;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    password: string;
    agreedToTerms: boolean;
  };
  setCustomerInfo: (info: any) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  restaurant,
  isOpen,
  onClose,
  onContinueGuest,
  onCreateAccount,
  customerInfo,
  setCustomerInfo
}) => {
  const [mode, setMode] = useState<'main' | 'login'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    let formattedValue = value;
    
    // Format phone number
    if (field === 'phone' && typeof value === 'string') {
      formattedValue = formatPhoneNumber(value);
    }
    
    setCustomerInfo({
      ...customerInfo,
      [field]: formattedValue
    });
    // Clear errors when user starts typing
    if (authError) {
      setAuthError(null);
    }
  };

  const switchMode = (newMode: 'main' | 'login') => {
    setMode(newMode);
    setAuthError(null); // Clear errors when switching modes
  };

  const canProceedGuest = () => {
    return customerInfo.name.trim() && 
           customerInfo.phone.trim() && 
           customerInfo.email.trim() && 
           customerInfo.agreedToTerms;
  };

  const canProceedSignup = () => {
    return customerInfo.name.trim() && 
           customerInfo.phone.trim() && 
           customerInfo.email.trim() && 
           customerInfo.password.trim() &&
           customerInfo.agreedToTerms;
  };

  const canProceedLogin = () => {
    return customerInfo.email.trim() && customerInfo.password.trim();
  };

  const handleGuestContinue = async () => {
    if (!canProceedGuest()) return;
    setIsLoading(true);
    try {
      onContinueGuest();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!canProceedSignup()) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await registerCustomer({
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        password: customerInfo.password
      }, restaurant.id);
      
      if (result.success) {
        onCreateAccount({...customerInfo, user: result.user});
      } else {
        setAuthError(result.error || 'Account creation failed');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!canProceedLogin()) return;

    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await loginCustomer(customerInfo.email, customerInfo.password);
      if (result.success) {
        onCreateAccount({...customerInfo, user: result.user});
      } else {
        setAuthError(result.error || 'Login failed');
      }
    } catch (error) {
      setAuthError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] max-w-xs mx-auto max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-full duration-300"
        style={{ marginBottom: '0', marginTop: 'auto' }}
      >
        <div className="space-y-2 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <ArrowLeft className="h-3 w-3" />
              </Button>
              {restaurant.logo_url && (
                <img 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="h-6 w-6 object-contain"
                />
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => switchMode('login')} className="h-6 px-2 text-xs">
              Login
            </Button>
          </div>

          {/* Error Display */}
          {authError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{authError}</AlertDescription>
            </Alert>
          )}

          {mode === 'login' ? (
            /* Login Form */
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Welcome Back</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1 h-10 text-sm bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={customerInfo.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1 h-10 text-sm bg-white border-gray-300"
                  />
                </div>

                <Button 
                  onClick={handleLogin}
                  className="w-full h-10 text-sm btn-primary"
                  disabled={isLoading || !canProceedLogin()}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    onClick={() => switchMode('main')}
                    className="text-sm"
                  >
                    Back to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Main Checkout Form */
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1 h-10 text-sm bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1 h-10 text-sm bg-white border-gray-300"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1 h-10 text-sm bg-white border-gray-300"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={customerInfo.agreedToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreedToTerms', checked as boolean)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the <a href="#" className="text-primary hover:underline">terms and conditions</a>
                  </Label>
                </div>

                {/* Continue as Guest Button */}
                <div className="pt-2">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Continue as Guest</h3>
                  </div>
                  
                  <Button 
                    onClick={handleGuestContinue}
                    disabled={isLoading || !canProceedGuest()}
                    className="w-full h-10 text-sm btn-primary mb-4"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Continue as Guest'
                    )}
                  </Button>
                </div>

                {/* Password Section */}
                <div className="border-t pt-4">
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">Create Password (Optional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={customerInfo.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a password"
                      className="mt-1 h-10 text-sm bg-white border-gray-300"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Create a password and instantly become a loyalty member, save money today!
                    </p>
                  </div>

                  <Button 
                    onClick={handleSignup}
                    disabled={isLoading || !canProceedSignup()}
                    className="w-full h-10 text-sm btn-accent mt-3"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account & Continue'
                    )}
                  </Button>

                  <div className="text-center mt-3">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <Button 
                        variant="ghost" 
                        onClick={() => switchMode('login')}
                        className="p-0 h-auto text-sm text-primary hover:underline"
                      >
                        Login
                      </Button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};