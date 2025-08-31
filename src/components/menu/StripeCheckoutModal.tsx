import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, AlertCircle, Tag, X } from 'lucide-react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CartItem } from '@/pages/Menu';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  couponCode?: string;
  couponDiscount?: number;
  cartTotal: number;
  cart: CartItem[];
  restaurantName: string;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  customerName,
  customerPhone,
  customerEmail,
  couponCode: initialCouponCode,
  couponDiscount: initialCouponDiscount,
  cartTotal,
  cart,
  restaurantName
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
  const [selectedTip, setSelectedTip] = useState<number>(18);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  // email comes from props
  const { toast } = useToast();

  // Fixed restaurant ID for BlueFin Sushi
  const restaurantId = '3b29861a-5ade-4800-b269-d0a03c351eb6';
  
  const restaurant = {
    id: restaurantId,
    name: restaurantName || 'BlueFin Sushi',
    tip_percentage_1: 15,
    tip_percentage_2: 18,
    tip_percentage_3: 20
  };

  const [localCouponCode, setCouponCode] = useState<string>(initialCouponCode || '');
  const [localCouponDiscount, setCouponDiscount] = useState<number>(initialCouponDiscount || 0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const calculateSubtotal = () => cartTotal - localCouponDiscount;

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
    return subtotal + taxAndProcessing + tip;
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

      const customerInfo = { name: customerName, phone: customerPhone, email: customerEmail };

      // Step 1: Create payment intent
      console.log('🚀 DEBUG: Calling create-payment-intent with data:', {
        amount: total,
        currency: 'usd',
        customerInfo,
        restaurant
      });
      
      const { data: paymentIntentData, error: paymentIntentError } = await supabase.functions.invoke('bfcreate', {
        body: {
          amount: total,
          currency: 'usd',
          customerInfo,
          restaurant,
          orderType: 'pickup', // Default to pickup
          metadata: {
            order_type: 'pickup',
            order_time: 'now',
            subtotal: subtotal.toString(),
            tax: tax.toString(),
            tip: tip.toString(),
            processing_fee: processingFee.toString(),
            coupon_code: localCouponCode || null,
            coupon_discount: localCouponDiscount.toString() || '0'
          }
        }
      });
      
      console.log('🔍 DEBUG: Function response received:', {
        data: paymentIntentData,
        error: paymentIntentError
      });

      if (paymentIntentError || !paymentIntentData?.success) {
        // Log detailed error information for debugging
        console.error('🔍 DEBUG: Payment intent creation failed:', {
          error: paymentIntentError,
          data: paymentIntentData,
          fullResponse: paymentIntentData
        });
        
        const errorMessage = paymentIntentData?.error || paymentIntentError?.message || 'Failed to create payment intent';
        const debugInfo = paymentIntentData?.debug || 'No debug info';
        
        throw new Error(`${errorMessage} (Debug: ${debugInfo})`);
      }

      console.log('Payment intent created:', paymentIntentData.paymentIntentId);

      // Step 2: Get card element and create payment method
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
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message || 'Failed to create payment method');
      }

      // Note: Payment method attachment is handled automatically by Stripe during payment confirmation

      // Step 3: Confirm payment using the same client secret from server
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentData.clientSecret,
        {
          payment_method: paymentMethod.id
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      // Step 4: Create order ONLY AFTER payment succeeds
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded, creating order...');
        
        // Now create the order with successful payment
        const { data: orderData, error: orderError } = await supabase.functions.invoke('bfrecord', {
          body: {
            cart,
            customerInfo,
            restaurant,
            orderType: 'pickup',
            orderTime: 'now',
            scheduledDateTime: null,
            deliveryAddress: null,
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
        
        // fire external webhook with full order details
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order: {
                orderId: orderData.order.id,
                orderType: 'pickup',
                restaurantId: restaurant.id,
                restaurantName: restaurant.name,
                customer: customerInfo,
                couponCode: localCouponCode,
                couponDiscount: localCouponDiscount,
                items: cart,
                subtotal,
                tax,
                processingFee,
                tip,
                total,
              }
            })
          }).catch(console.error);
        }
        
        toast({
          title: "Order Complete!",
          description: "Your payment was processed successfully.",
          duration: 3000,
        });
        
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
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : 'Payment failed. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[95vh] overflow-y-auto bg-white m-2 sm:m-4">
        <DialogHeader className="bg-[#2671BC] text-white -m-6 mb-3 p-3 rounded-t-lg">
          <DialogTitle className="text-center text-white text-lg font-semibold">
            {restaurantName || 'BlueFin Sushi'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Complete your order payment for {restaurantName || 'BlueFin Sushi'}. Add a tip, enter coupon codes, and provide payment information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 animate-in slide-in-from-bottom duration-300 bg-white px-3 sm:px-4">
        {/* Order summary message */}
        <div className="text-center py-3 bg-white">
          <p className="text-lg sm:text-xl font-bold text-[#2671BC] mb-3">Complete Payment</p>
          <p className="text-base sm:text-lg font-bold text-gray-900 mb-2">Order total: ${calculateGrandTotal().toFixed(2)}</p>
          <p className="text-sm sm:text-base text-gray-700 mb-3">We look forward to preparing your order!</p>
          <p className="text-sm sm:text-base text-gray-900 font-medium mb-3">Would you like to add a tip for our staff?</p>
          
          {/* Tip Options */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[18, 20, 22].map((percentage) => (
              <Button
                key={percentage}
                variant={selectedTip === percentage && !isCustomTip ? "default" : "outline"}
                onClick={() => handleTipSelect(percentage)}
                className={`text-sm py-2.5 ${selectedTip === percentage && !isCustomTip 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-600' 
                  : 'bg-white text-gray-900 border-2 border-gray-400 hover:bg-gray-50'
                }`}
              >
                {percentage}%
              </Button>
            ))}
            <Button
              variant={isCustomTip ? "default" : "outline"}
              onClick={handleCustomTipClick}
              className={`text-sm py-2.5 ${isCustomTip 
                ? 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-600' 
                : 'bg-white text-gray-900 border-2 border-gray-400 hover:bg-gray-50'
              }`}
            >
              Custom
            </Button>
          </div>

          {isCustomTip && (
            <div className="flex items-center justify-center space-x-2 mb-3">
              <span className="text-sm text-gray-900">$</span>
              <Input
                type="text"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder="0.00"
                className="w-20 text-center text-gray-900 bg-white border-gray-300 text-sm py-2"
              />
            </div>
          )}
        </div>

        {/* Payment Section */}
        <Card className="bg-white border border-gray-300">
          <CardHeader className="pb-2 bg-white border-b border-gray-200">
            <CardTitle className="text-base sm:text-lg text-gray-900 font-bold">Credit Card Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 bg-white pt-3">
            {/* Order Summary */}
            <div className="space-y-1.5">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Order Summary</h3>
              <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                <span>Subtotal</span>
                <span className="text-gray-900 font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                <span>Tax & Processing</span>
                <span className="text-gray-900 font-medium">${calculateTaxAndProcessing().total.toFixed(2)}</span>
              </div>
              {calculateTip() > 0 && (
                <div className="flex justify-between text-xs sm:text-sm text-gray-700">
                  <span>Tip</span>
                  <span className="text-gray-900 font-medium">${calculateTip().toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-1.5">
                <div className="flex justify-between font-bold text-sm sm:text-base text-gray-900">
                  <span>Total</span>
                  <span className="text-blue-600">${calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <p className="text-xs sm:text-sm text-gray-700 font-medium">Coupon or promo code (optional)</p>
              {couponError && <AlertDescription className="text-red-600 bg-red-50 border border-red-200 p-1.5 rounded text-xs">{couponError}</AlertDescription>}
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  value={localCouponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1 bg-white text-gray-900 border border-gray-300 placeholder-gray-500 focus:border-blue-500 text-sm py-2"
                />
                <Button 
                  className="py-2 px-3 text-sm"
                  onClick={async () => {
                  setCouponError(null);
                  try {
                    const { data, error } = await supabase.rpc('validate_coupon', {
                      p_coupon_code: localCouponCode.trim().toUpperCase(),
                      p_restaurant_id: restaurant.id,
                      p_order_subtotal: cartTotal
                    });
                    if (error) throw error;
                    const result = data?.[0];
                    if (result?.valid) {
                      setCouponDiscount(result.discount_amount);
                      toast({ title: 'Coupon applied!', description: result.message });
                    } else {
                      setCouponError(result?.message || 'Invalid coupon');
                    }
                  } catch (err) {
                    setCouponError('Error validating coupon');
                  }
                }}>Apply</Button>
              </div>
              {localCouponDiscount > 0 && (
                <div className="text-xs text-green-600 font-medium">
                  Coupon applied: -${localCouponDiscount.toFixed(2)}
                </div>
              )}
            </div>

            {/* Payment Element */}
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#374151',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                      invalid: {
                        color: '#EF4444',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Payment Error Alert */}
          {paymentError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{paymentError}</AlertDescription>
            </Alert>
          )}

          {/* Order Success Alert */}
          {orderComplete && (
            <Alert className="border-green-500 bg-green-50">
              <CreditCard className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Order completed successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {/* Complete Order Button */}
          <Button 
            onClick={handleCompleteOrder}
            className="w-full py-3 text-base font-semibold"
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
              `Complete Payment - $${calculateGrandTotal().toFixed(2)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
