import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, AlertCircle, Tag, Clock, User, History } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Restaurant, CartItem } from '@/pages/Menu';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CheckoutCookieService } from '@/utils/checkoutCookieService';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

interface EnhancedStripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  cart: CartItem[];
  restaurant: Restaurant;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
}

export const EnhancedStripeCheckoutModal: React.FC<EnhancedStripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  customerName,
  customerPhone,
  customerEmail,
  cart,
  restaurant,
  total,
  couponCode,
  couponDiscount = 0
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user, isAuthenticated } = useCustomerAuth();
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [localCouponCode, setLocalCouponCode] = useState(couponCode || '');
  const [localCouponDiscount, setLocalCouponDiscount] = useState(couponDiscount);
  const [showPreviousOrders, setShowPreviousOrders] = useState(false);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  // Load previous orders if user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPreviousOrders();
    }
  }, [isAuthenticated, user]);

  const loadPreviousOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total, items, status')
        .eq('customer_email', user?.email)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setPreviousOrders(data || []);
    } catch (error) {
      console.error('Error loading previous orders:', error);
    }
  };

  const calculateSubtotal = () => {
    const subtotal = cart.reduce((total, item) => total + item.total_price, 0);
    return Math.max(0, subtotal);
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
    const totalWithFees = subtotal + tax + processingFee + tipAmount;
    const finalTotal = totalWithFees - localCouponDiscount;
    return Math.max(0, finalTotal);
  };

  const handleTipChange = (amount: number) => {
    setTipAmount(amount);
  };

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setTipAmount(value);
  };

  const handleCouponApply = async () => {
    if (!localCouponCode.trim()) return;

    try {
      // Simulate coupon validation - replace with actual API call
      if (localCouponCode.toUpperCase() === 'LABORDAY') {
        setLocalCouponDiscount(5);
        toast({
          title: "Coupon Applied!",
          description: "You've saved $5.00 on your order!",
        });
      } else {
        setLocalCouponDiscount(0);
        toast({
          title: "Invalid Coupon",
          description: "Please check your coupon code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOrder = async () => {
    if (!stripe || !elements) {
      setPaymentError('Stripe is not loaded. Please refresh the page.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Step 1: Create payment intent
      const { data: paymentIntentData, error: paymentError } = await supabase.functions.invoke('bfcreate', {
        body: {
          amount: calculateGrandTotal(),
          currency: 'usd',
          paymentMethodId: null // Will be created in next step
        }
      });

      if (paymentError || !paymentIntentData?.success) {
        throw new Error(paymentError?.message || paymentIntentData?.error || 'Failed to create payment intent');
      }

      // Step 2: Confirm payment with card
      const { error: confirmError } = await stripe.confirmCardPayment(
        paymentIntentData.paymentIntentId,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      // Step 3: Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('bfrecord', {
        body: {
          cart,
          customerInfo: { name: customerName, phone: customerPhone, email: customerEmail },
          restaurant,
          orderType: 'pickup',
          orderTime: 'now',
          scheduledDateTime: null,
          deliveryAddress: null,
          paymentIntentId: paymentIntentData.paymentIntentId,
          total: calculateGrandTotal(),
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          processingFee: calculateProcessingFee(),
          tip: tipAmount
        }
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderError?.message || orderData?.error || 'Failed to create order');
      }

      // Save order to cookie history
      CheckoutCookieService.addOrderToHistory({
        id: orderData.order.id,
        total: calculateGrandTotal(),
        items: cart.map(item => item.product.name)
      });

      // Save customer info to cookies
      CheckoutCookieService.saveCustomerInfo({
        name: customerName,
        phone: customerPhone,
        email: customerEmail
      });

      setOrderComplete(true);
      
      toast({
        title: "Order Complete!",
        description: `Your order #${orderData.order.id.slice(-4)} has been placed successfully!`,
      });

      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatOrderTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[95vh] overflow-y-auto bg-white m-2 sm:m-4">
        <DialogHeader className="bg-[#2671BC] text-white -m-6 mb-3 p-3 rounded-t-lg">
          <DialogTitle className="text-center text-white text-lg font-semibold">
            {restaurant.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Complete your order payment for {restaurant.name}. Add a tip, enter coupon codes, and provide payment information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
          {/* Left Column - Cart and Previous Orders */}
          <div className="lg:col-span-1 space-y-4">
            {/* Current Cart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🛒 Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-500">Note: {item.notes}</p>
                      )}
                    </div>
                    <p className="font-medium">${item.total_price.toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee:</span>
                    <span>${calculateProcessingFee().toFixed(2)}</span>
                  </div>
                  {tipAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Tip:</span>
                      <span>${tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {localCouponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${localCouponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${calculateGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Orders */}
            {isAuthenticated && previousOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {previousOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(-4)}</p>
                          <p className="text-sm text-gray-600">
                            {formatOrderDate(order.created_at)} at {formatOrderTime(order.created_at)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Payment Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={customerName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={customerPhone} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={customerEmail} readOnly />
                </div>
              </CardContent>
            </Card>

            {/* Tip Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Add a Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[0, 2, 3, 4].map((amount) => (
                    <Button
                      key={amount}
                      variant={tipAmount === amount ? "default" : "outline"}
                      onClick={() => handleTipChange(amount)}
                      className="h-10"
                    >
                      {amount === 0 ? "No Tip" : `$${amount}`}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Custom tip amount"
                    value={tipAmount || ''}
                    onChange={handleCustomTipChange}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => setTipAmount(0)}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Coupon Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Coupon Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={localCouponCode}
                    onChange={(e) => setLocalCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCouponApply} disabled={!localCouponCode.trim()}>
                    Apply
                  </Button>
                </div>
                {localCouponDiscount > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    Coupon applied! You've saved ${localCouponDiscount.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="card-element">Card Details</Label>
                    <div className="mt-2 p-3 border rounded-md">
                      <CardElement
                        id="card-element"
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {paymentError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleCompleteOrder}
                    disabled={!stripe || isProcessingPayment}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessingPayment ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </div>
                    ) : (
                      `Complete Order - $${calculateGrandTotal().toFixed(2)}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
