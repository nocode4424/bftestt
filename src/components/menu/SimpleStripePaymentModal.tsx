import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Percent, DollarSign, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Restaurant, CartItem } from '@/pages/Menu';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface SimpleStripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onBackToCart: () => void;
  customerData: { name: string; phone: string; email: string; userId?: string };
  cart: CartItem[];
  restaurant: Restaurant;
  total: number;
}

const PaymentForm: React.FC<{
  customerData: { name: string; phone: string; email: string; userId?: string };
  cart: CartItem[];
  restaurant: Restaurant;
  total: number;
  onComplete: () => void;
  onClose: () => void;
  onBackToCart: () => void;
}> = ({ customerData, cart, restaurant, total, onComplete, onClose, onBackToCart }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

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
    const tip = tipAmount;
    const discount = couponDiscount;
    return Math.max(0, subtotal + taxAndFees + tip - discount);
  };

  // Calculate tip options based on subtotal
  const getTipOptions = () => {
    const subtotal = calculateSubtotal();
    const tip15 = Math.round(subtotal * 0.15);
    const tip18 = Math.round(subtotal * 0.18);
    const tip20 = Math.round(subtotal * 0.20);
    const tip25 = Math.round(subtotal * 0.25);
    
    return [
      { label: 'No Tip', value: 0 },
      { label: `15% ($${tip15})`, value: tip15 },
      { label: `18% ($${tip18})`, value: tip18 },
      { label: `20% ($${tip20})`, value: tip20 },
      { label: `25% ($${tip25})`, value: tip25 }
    ];
  };

  const handleTipChange = (amount: number) => {
    setTipAmount(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setCustomTip(e.target.value);
    setTipAmount(value);
  };

  const handleCouponApply = async () => {
    if (!couponCode.trim()) return;
    
    // Simple coupon logic - you can enhance this
    if (couponCode.toUpperCase() === 'LABORDAY') {
      setCouponDiscount(5);
      toast({
        title: "Coupon Applied!",
        description: "You've received $5 off your order!",
      });
    } else {
      setCouponDiscount(0);
      toast({
        title: "Invalid Coupon",
        description: "Please check your coupon code and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      toast({
        title: "Payment Error",
        description: "Stripe is not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(calculateGrandTotal() * 100), // Convert to cents
          customerData,
          cart,
          restaurant: restaurant.id,
          tipAmount,
          couponDiscount,
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
          },
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: "Your order has been placed successfully.",
        });
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const tipOptions = getTipOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
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
                <div className="flex items-center gap-3 flex-1">
                  {item.product.image_url && (
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="h-12 w-12 object-cover rounded-md"
                    />
                  )}
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
            {tipAmount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Tip:</span>
                <span className="font-semibold">${tipAmount.toFixed(2)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="font-medium">Discount:</span>
                <span className="font-semibold">-${couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-blue-900 text-lg font-bold border-t border-blue-200 pt-2">
              <span>Total:</span>
              <span>${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Code - Before Tip */}
      <Card className="bg-white shadow-lg border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Coupon Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="text-black bg-white border-gray-300 h-12"
            />
            <Button
              type="button"
              onClick={handleCouponApply}
              variant="outline"
              className="h-12"
            >
              Apply
            </Button>
          </div>
          {couponDiscount > 0 && (
            <Badge variant="secondary" className="text-green-600 bg-green-100">
              Coupon applied: ${couponDiscount} off
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Tip Options */}
      <Card className="bg-white shadow-lg border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Add a Tip
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {tipOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={tipAmount === option.value ? "default" : "outline"}
                onClick={() => handleTipChange(option.value)}
                className="h-12 text-sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div>
            <Label htmlFor="custom-tip" className="text-gray-900 font-medium">Custom Tip</Label>
            <Input
              id="custom-tip"
              type="number"
              placeholder="Enter custom tip amount"
              value={customTip}
              onChange={handleCustomTipChange}
              className="text-black bg-white border-gray-300 h-12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="bg-white shadow-lg border-2 border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#374151',
                    fontFamily: '"Inter", sans-serif',
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
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBackToCart}
          className="flex-1 h-12"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-12"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 h-12 text-lg font-semibold"
          size="lg"
        >
          {isProcessing ? 'Processing...' : `Pay $${calculateGrandTotal().toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

export const SimpleStripePaymentModal: React.FC<SimpleStripePaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onBackToCart,
  customerData,
  cart,
  restaurant,
  total
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[95vh] overflow-y-auto bg-white m-2 sm:m-4">
        <DialogHeader className="bg-[#2671BC] text-white -m-6 mb-3 p-3 rounded-t-lg">
          <DialogTitle className="text-center text-white text-lg font-semibold">
            Complete Your Order - {restaurant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <Elements stripe={stripePromise}>
            <PaymentForm
              customerData={customerData}
              cart={cart}
              restaurant={restaurant}
              total={total}
              onComplete={onComplete}
              onClose={onClose}
              onBackToCart={onBackToCart}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
};
