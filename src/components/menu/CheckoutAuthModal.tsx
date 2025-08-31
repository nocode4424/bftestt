import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Mail, Phone, ArrowLeft, CreditCard } from 'lucide-react';
import { Restaurant, CartItem } from '@/pages/Menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckoutCookieService } from '@/utils/checkoutCookieService';

interface CheckoutAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (customerData: { name: string; phone: string; email: string; userId?: string }) => void;
  cart: CartItem[];
  restaurant: Restaurant;
  total: number;
}

export const CheckoutAuthModal: React.FC<CheckoutAuthModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  cart,
  restaurant,
  total
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup form
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { toast } = useToast();

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return Math.round(subtotal * 0.065 * 100) / 100; // 6.5% tax
  };

  const calculateProcessingFee = () => {
    const subtotal = calculateSubtotal();
    return Math.round(subtotal * 0.03 * 100) / 100; // 3% processing fee
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const processingFee = calculateProcessingFee();
    return subtotal + tax + processingFee;
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (data.user) {
        // Get user profile data
        const { data: profile } = await supabase
          .from('customers')
          .select('name, phone, email')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          // Save user session
          CheckoutCookieService.saveUserLogin({
            id: data.user.id,
            email: profile.email,
            name: profile.name,
            phone: profile.phone
          });

          onContinue({
            name: profile.name,
            phone: profile.phone,
            email: profile.email,
            userId: data.user.id
          });
        }
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!signupName || !signupPhone || !signupEmail || !signupPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: signupName,
            phone: signupPhone
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        try {
          // Create customer profile
          const { error: profileError } = await supabase
            .from('customers')
            .insert({
              id: authData.user.id,
              name: signupName,
              phone: signupPhone,
              email: signupEmail,
              restaurant_id: restaurant.id
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Continue anyway - user can complete profile later
          }

          // Save user session
          CheckoutCookieService.saveUserLogin({
            id: authData.user.id,
            email: signupEmail,
            name: signupName,
            phone: signupPhone
          });

          // Save customer info to cookies
          CheckoutCookieService.saveCustomerInfo({
            name: signupName,
            phone: signupPhone,
            email: signupEmail
          });

          onContinue({
            name: signupName,
            phone: signupPhone,
            email: signupEmail,
            userId: authData.user.id
          });

          toast({
            title: "Account Created!",
            description: "Welcome to Bluefin Sushi! Your account has been created successfully.",
          });
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
          // Continue with checkout even if profile creation fails
          onContinue({
            name: signupName,
            phone: signupPhone,
            email: signupEmail,
            userId: authData.user.id
          });
        }
      } else if (authData.session) {
        // User was created and confirmed immediately
        onContinue({
          name: signupName,
          phone: signupPhone,
          email: signupEmail,
          userId: authData.session.user.id
        });
      } else {
        // Email confirmation required
        toast({
          title: "Check Your Email",
          description: "Please check your email to confirm your account before continuing.",
        });
        setError('Please check your email to confirm your account');
      }
    } catch (error: any) {
      setError(error.message || 'Signup failed');
      toast({
        title: "Signup Failed",
        description: error.message || "Please try again with different information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formattedPhone = formatPhoneNumber(value);
    setSignupPhone(formattedPhone);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[95vh] overflow-y-auto bg-white m-2 sm:m-4">
        <DialogHeader className="bg-[#2671BC] text-white -m-6 mb-3 p-3 rounded-t-lg">
          <DialogTitle className="text-center text-white text-lg font-semibold">
            {restaurant.name} - Sign In or Create Account
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Order Summary */}
          <div className="mb-6">
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  🛒 Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-500">Note: {item.notes}</p>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">${item.total_price.toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-gray-900">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span>Tax:</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900">
                    <span>Processing Fee:</span>
                    <span>${calculateProcessingFee().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900">
                    <span>Total:</span>
                    <span>${calculateGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={mode === 'login' ? 'default' : 'ghost'}
                onClick={() => setMode('login')}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                variant={mode === 'signup' ? 'default' : 'ghost'}
                onClick={() => setMode('signup')}
                className="flex-1"
              >
                Create Account
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {mode === 'login' ? (
              /* Login Form */
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <User className="h-4 w-4" />
                    Sign In to Continue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-gray-900">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-gray-900">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In & Continue'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              /* Signup Form */
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <User className="h-4 w-4" />
                    Create Your Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name" className="text-gray-900">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-phone" className="text-gray-900">Phone Number</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={signupPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email" className="text-gray-900">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-gray-900">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-gray-900">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="text-black bg-white border-gray-300"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-900">
                      I agree to the Terms & Conditions and Privacy Policy
                    </Label>
                  </div>
                  <Button
                    onClick={handleSignup}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account & Continue'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
