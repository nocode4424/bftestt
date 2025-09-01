import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Mail, Phone, ArrowLeft, CreditCard, ShoppingBag } from 'lucide-react';
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
  const [mode, setMode] = useState<'auth' | 'signup'>('auth');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auth form (works for both login and signup)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { toast } = useToast();

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.total_price, 0);
  };

  const calculateTaxAndFees = () => {
    const subtotal = calculateSubtotal();
    const tax = Math.round(subtotal * 0.065 * 100) / 100; // 6.5% tax
    const processingFee = Math.round(subtotal * 0.03 * 100) / 100; // 3% processing fee
    return tax + processingFee;
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const taxAndFees = calculateTaxAndFees();
    return subtotal + taxAndFees;
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to sign in first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // If login fails, try to create account
        if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
          // Check if we have name and phone for signup
          if (!name || !phone) {
            setMode('signup');
            setError('Account not found. Please complete your information to create an account.');
            return;
          }

          // Create new account
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                phone
              }
            }
          });

          if (signupError) throw signupError;

          if (signupData.user) {
            // Create customer profile
            await supabase
              .from('customers')
              .insert({
                id: signupData.user.id,
                name,
                phone,
                email,
                restaurant_id: restaurant.id
              });

            // Save user session with tokens
            CheckoutCookieService.saveUserLogin({
              id: signupData.user.id,
              email,
              name,
              phone
            });

            // Save customer info to cookies
            CheckoutCookieService.saveCustomerInfo({
              name,
              phone,
              email
            });

            onContinue({
              name,
              phone,
              email,
              userId: signupData.user.id
            });

            toast({
              title: "Account Created!",
              description: `Welcome to ${restaurant.name}, ${name}! Your account has been created successfully.`,
            });
            return;
          }
        }
        throw error;
      }

      if (data.user) {
        // Get user profile data
        const { data: profile, error: profileError } = await supabase
          .from('customers')
          .select('name, phone, email')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          // Save user session with tokens
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

          toast({
            title: "Welcome Back!",
            description: `Great to see you again, ${profile.name}!`,
          });
        } else {
          // User exists in auth but not in customers table
          // Use auth metadata or create a basic profile
          const authUser = data.user;
          const userName = authUser.user_metadata?.name || email.split('@')[0];
          const userPhone = authUser.user_metadata?.phone || '';
          
          // Try to create customer profile
          await supabase
            .from('customers')
            .insert({
              id: authUser.id,
              name: userName,
              phone: userPhone,
              email: authUser.email,
              restaurant_id: restaurant.id
            });

          // Save user session with tokens
          CheckoutCookieService.saveUserLogin({
            id: authUser.id,
            email: authUser.email,
            name: userName,
            phone: userPhone
          });

          onContinue({
            name: userName,
            phone: userPhone,
            email: authUser.email,
            userId: authUser.id
          });

          toast({
            title: "Welcome Back!",
            description: `Great to see you again, ${userName}!`,
          });
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'Authentication failed');
      toast({
        title: "Authentication Failed",
        description: error.message || "Please check your information and try again.",
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
    setPhone(formattedPhone);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
    setAgreedToTerms(false);
    setError(null);
    setMode('auth');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
      <DialogContent className="max-w-2xl w-full max-h-[95vh] overflow-y-auto bg-white m-2 sm:m-4">
        <DialogHeader className="bg-[#2671BC] text-white -m-6 mb-3 p-3 rounded-t-lg">
          <DialogTitle className="text-center text-white text-lg font-semibold">
            {restaurant.name} - Sign In or Create Account
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* Order Summary */}
          <div className="mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {restaurant.logo_url && (
                    <img 
                      src={restaurant.logo_url} 
                      alt={`${restaurant.name} logo`}
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
                    <ShoppingBag className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start bg-white rounded-lg p-2 shadow-sm">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Qty: {item.quantity}
                          </Badge>
                          {item.notes && (
                            <Badge variant="outline" className="text-xs">
                              Note: {item.notes}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-blue-900">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t-2 border-blue-200 pt-3 space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Tax & Processing:</span>
                    <span className="font-semibold">${calculateTaxAndFees().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-blue-900 text-lg font-bold border-t border-blue-200 pt-2">
                    <span>Total:</span>
                    <span>${calculateGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <Card className="bg-white shadow-lg border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <User className="h-4 w-4" />
                  {mode === 'auth' ? 'Sign In or Create Account' : 'Complete Your Account'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-900 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-black bg-white border-gray-300 h-12"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-black bg-white border-gray-300 h-12"
                  />
                </div>
                
                {mode === 'signup' && (
                  <>
                    <div>
                      <Label htmlFor="name" className="text-gray-900 font-medium">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-black bg-white border-gray-300 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-900 font-medium">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="text-black bg-white border-gray-300 h-12"
                      />
                    </div>
                  </>
                )}
                
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
                  onClick={handleAuth}
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-semibold"
                  size="lg"
                >
                  {isLoading ? 'Processing...' : 'Continue to Checkout'}
                </Button>
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
