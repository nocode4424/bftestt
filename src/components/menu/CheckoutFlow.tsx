import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, AlertCircle, Tag } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Restaurant, CartItem, OrderType, OrderTime } from '@/pages/Menu';
import { CustomerAuthModal } from './CustomerAuthModal';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface CheckoutFlowProps {
  restaurant: Restaurant;
  cart: CartItem[];
  orderType: OrderType;
  orderTime: OrderTime;
  scheduledDateTime: Date | null;
  deliveryAddress: string;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    password: string;
    agreedToTerms: boolean;
  };
  setCustomerInfo: (info: any) => void;
  onComplete: () => void;
  onBack: () => void;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  restaurant,
  cart,
  orderType,
  orderTime,
  scheduledDateTime,
  deliveryAddress,
  customerInfo,
  setCustomerInfo,
  onComplete,
  onBack
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [step, setStep] = useState<'auth' | 'confirmation'>('auth');
  const [selectedTip, setSelectedTip] = useState<number>(restaurant.tip_percentage_2 || 18);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<{ type: string; value: number; amount: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { toast } = useToast();

  const calculateSubtotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.total_price || 0), 0);
    // Ensure subtotal is never negative
    return Math.max(0, subtotal);
  };

  const calculateTaxAndProcessing = () => {
    const subtotal = calculateSubtotal();
    const salesTax = subtotal * 0.065; // 6.5% sales tax
    
    // Check if cart only contains $1 water
    const isOnlyWater = cart.length === 1 && 
      cart[0].quantity === 1 && 
      cart[0].product.name.toLowerCase().includes('water') && 
      cart[0].product.base_price === 1;
    
    let processingFee = 0;
    
    // Only add processing fee if not just $1 water
    if (!isOnlyWater) {
      processingFee = 2.49; // Base processing fee
      
      if (subtotal > 50) {
        processingFee += (subtotal - 50) * 0.05; // 5% of amount over $50
      }
    }
    
    return { tax: salesTax, processingFee, total: salesTax + processingFee };
  };

  const calculateTip = () => {
    const subtotal = calculateSubtotal();
    if (isCustomTip) {
      return parseFloat(customTip) || 0;
    }
    return subtotal * (selectedTip / 100);
  };

  const calculateGrandTotal = () => {
    const subtotal = calculateSubtotal();
    const { total: taxAndProcessing } = calculateTaxAndProcessing();
    const tip = calculateTip();
    const discount = couponDiscount?.amount || 0;
    return Math.max(0, subtotal + taxAndProcessing + tip - discount);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsValidatingCoupon(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_coupon_code: couponCode.trim(),
        p_restaurant_id: restaurant.id,
        p_order_subtotal: calculateSubtotal()
      });

      if (error) throw error;

      if (data && data[0]) {
        const result = data[0];
        if (result.valid) {
          setCouponDiscount({
            type: result.discount_type,
            value: result.discount_value,
            amount: result.discount_amount
          });
          toast({
            title: "Coupon Applied!",
            description: result.message,
            variant: "default"
          });
        } else {
          toast({
            title: "Invalid Coupon",
            description: result.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Error",
        description: "Failed to validate coupon code",
        variant: "destructive"
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(null);
    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order",
      variant: "default"
    });
  };

  const handleContinueGuest = () => {
    setStep('confirmation');
  };

  const handleCreateAccount = (customerData: any) => {
    // Here you would typically create the customer account
    setStep('confirmation');
  };

  const handleTipSelect = (percentage: number) => {
    setSelectedTip(percentage);
    setIsCustomTip(false);
    setCustomTip('');
  };

  const handleCustomTipClick = () => {
    setIsCustomTip(true);
    setSelectedTip(0);
  };

  const handleCustomTipChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setCustomTip(value);
    }
  };

  const handleCompleteOrder = async () => {
    if (!stripe || !elements) {
      setPaymentError('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Calculate totals
      const subtotal = calculateSubtotal();
      const { tax, processingFee } = calculateTaxAndProcessing();
      const tip = calculateTip();
      const total = calculateGrandTotal();

      console.log('Creating payment intent...', { total, subtotal, tax, tip });

      // Step 1: Create payment intent - FIXED TO USE NEW FUNCTION
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke('bfcreate', {
        body: {
          amount: total,
          currency: 'usd',
          customerInfo,
          restaurant,
          orderType,
          metadata: {
            order_type: orderType,
            order_time: orderTime,
            subtotal: subtotal.toString(),
            tax: tax.toString(),
            tip: tip.toString(),
            processing_fee: processingFee.toString(),
            coupon_code: couponCode || null,
            coupon_discount: couponDiscount?.amount?.toString() || '0'
          }
        }
      });

      if (paymentIntentError || !paymentIntentData?.success) {
        throw new Error(paymentIntentError?.message || paymentIntentData?.error || 'Failed to create payment intent');
      }

      console.log('Payment intent created:', paymentIntentData.paymentIntentId);

      // Step 2: Get card element and create payment method first
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: orderType === 'delivery' ? {
            line1: deliveryAddress
          } : undefined,
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || 'Failed to create payment method');
      }

      // Note: Payment method attachment is handled automatically by Stripe during payment confirmation

      // Confirm payment using the same client secret from server
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      // Step 3: Create order ONLY AFTER payment succeeds - FIXED TO USE NEW FUNCTION
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded, creating order...');
        
        // Now create the order with successful payment
        const { data: orderData, error: orderError } = await supabase.functions.invoke('bfrecord', {
          body: {
            cart,
            customerInfo,
            restaurant,
            orderType,
            orderTime,
            scheduledDateTime,
            deliveryAddress,
            paymentIntentId: paymentIntentData.paymentIntentId,
            total,
            subtotal,
            tax,
            processingFee,
            tip
          }
        });

        if (orderError || !orderData?.success) {
          console.error('Order creation failed after successful payment:', orderError);
          throw new Error(orderError?.message || orderData?.error || 'Failed to create order after payment');
        }

        console.log('Order created successfully:', orderData.order.id);
        setOrderComplete(true);
        
        // Show success message briefly, then complete
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        throw new Error(`Payment failed with status: ${paymentIntent?.status || 'unknown'}`);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (step === 'auth') {
    return (
      <CustomerAuthModal
        restaurant={restaurant}
        isOpen={true}
        onClose={onBack}
        onContinueGuest={handleContinueGuest}
        onCreateAccount={handleCreateAccount}
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setStep('auth')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {restaurant.logo_url && (
            <img 
              src={restaurant.logo_url} 
              alt={restaurant.name}
              className="h-12 mr-3"
            />
          )}
          <h1 className="text-xl font-bold">Order Confirmation</h1>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Summary
              <Badge variant="outline">
                {orderType === 'pickup' ? 'Pick-up' : 'Delivery'}
              </Badge>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {orderType === 'pickup' ? (
                <div>
                  <div className="font-bold">
                    Pick-up {orderTime === 'now' ? 'ASAP' : 'Scheduled'}
                  </div>
                  {orderTime === 'scheduled' && scheduledDateTime && (
                    <div className="font-bold">
                      {scheduledDateTime.toLocaleDateString()} at{' '}
                      {scheduledDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                  <div className="mt-1">
                    {restaurant.address.includes(',') ? (
                      <>
                        {restaurant.address.split(',').slice(0, -1).join(',')}<br />
                        {restaurant.address.split(',').slice(-1)[0].trim()}
                      </>
                    ) : (
                      restaurant.address
                    )}
                  </div>
                  <div className="mt-1 font-medium">{restaurant.phone}</div>
                </div>
              ) : (
                <div>
                  <div className="font-bold">Delivery Address:</div>
                  <div>{deliveryAddress}</div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.product.name}</div>
                  {item.notes && (
                    <div className="text-xs text-muted-foreground">Note: {item.notes}</div>
                  )}
                  <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                </div>
                <div className="font-medium">${item.total_price.toFixed(2)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pricing Breakdown */}
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Item Subtotal</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Tax & Processing Fee</span>
              <span>${calculateTaxAndProcessing().total.toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Order Total</span>
                <span>${(calculateSubtotal() + calculateTaxAndProcessing().total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tip Selection */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle>Add Tip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[restaurant.tip_percentage_1, restaurant.tip_percentage_2, restaurant.tip_percentage_3].map((percentage) => (
                <Button
                  key={percentage}
                  variant={selectedTip === percentage && !isCustomTip ? 'default' : 'outline'}
                  onClick={() => handleTipSelect(percentage)}
                  className="flex flex-col py-3 h-auto"
                >
                  <span className="text-sm font-bold">{percentage}%</span>
                  <span className="text-xs">${(calculateSubtotal() * (percentage / 100)).toFixed(2)}</span>
                </Button>
              ))}
              <Button
                variant={isCustomTip ? 'default' : 'outline'}
                onClick={handleCustomTipClick}
                className="flex flex-col py-3 h-auto"
              >
                <span className="text-sm font-bold">Custom</span>
                <span className="text-xs">$</span>
              </Button>
            </div>
            
            {isCustomTip && (
              <div className="mb-3">
                <Label htmlFor="customTip" className="text-sm">Custom Tip Amount</Label>
                <Input
                  id="customTip"
                  type="text"
                  value={customTip}
                  onChange={(e) => handleCustomTipChange(e.target.value)}
                  placeholder="Enter amount"
                  className="mt-1 text-center"
                />
              </div>
            )}
            
            {/* Coupon Code Section */}
            <div className="border-t pt-3 mb-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Promo Code</Label>
                {!couponDiscount ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                      disabled={isValidatingCoupon}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      variant="outline"
                      disabled={!couponCode.trim() || isValidatingCoupon}
                      className="btn-accent"
                    >
                      {isValidatingCoupon ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>Apply</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">{couponCode}</span>
                        <Badge className="bg-green-600 text-white">
                          {couponDiscount.type === 'percentage' 
                            ? `${couponDiscount.value}% OFF`
                            : `$${couponDiscount.value} OFF`}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                      Discount: -${couponDiscount.amount.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {couponDiscount && (
              <div className="flex justify-between text-sm mb-2">
                <span>Discount</span>
                <span className="text-green-600">-${couponDiscount.amount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span className="text-[#E97700]">${calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-card">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: 'hsl(var(--foreground))',
                      '::placeholder': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                    },
                    invalid: {
                      color: 'hsl(var(--destructive))',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Error Alert */}
        {paymentError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}

        {/* Order Success Alert */}
        {orderComplete && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CreditCard className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Order completed successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {/* Complete Order Button */}
        <Button 
          onClick={handleCompleteOrder}
          className="w-full btn-primary"
          size="lg"
          disabled={!stripe || !elements || isProcessingPayment || orderComplete}
        >
          {isProcessingPayment ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : orderComplete ? (
            'Order Complete!'
          ) : (
            `Complete Order - $${calculateGrandTotal().toFixed(2)}`
          )}
        </Button>
      </div>
    </div>
  );
};