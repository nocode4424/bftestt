import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Percent, DollarSign } from 'lucide-react';
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
}> = ({ customerData, cart, restaurant, total, onComplete, onClose }) => {
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
    const tip = tipAmount;
    const discount = couponDiscount;
    return Math.max(0, subtotal + tax + processingFee + tip - discount);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-900">Order Summary</CardTitle>
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
          
          <div className="border-t pt-3 space-y-2">
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
            {tipAmount > 0 && (
              <div className="flex justify-between text-gray-900">
                <span>Tip:</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-${couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2 text-gray-900">
              <span>Total:</span>
              <span>${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tip Options */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Add a Tip
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tipAmount === 0 ? "default" : "outline"}
              onClick={() => handleTipChange(0)}
              className="flex-1"
            >
              No Tip
            </Button>
            <Button
              type="button"
              variant={tipAmount === 2 ? "default" : "outline"}
              onClick={() => handleTipChange(2)}
              className="flex-1"
            >
              $2
            </Button>
            <Button
              type="button"
              variant={tipAmount === 5 ? "default" : "outline"}
              onClick={() => handleTipChange(5)}
              className="flex-1"
            >
              $5
            </Button>
          </div>
          <div>
            <Label htmlFor="custom-tip" className="text-gray-900">Custom Tip</Label>
            <Input
              id="custom-tip"
              type="number"
              placeholder="Enter custom tip amount"
              value={customTip}
              onChange={handleCustomTipChange}
              className="text-black bg-white border-gray-300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coupon Code */}
      <Card className="bg-white">
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
              className="text-black bg-white border-gray-300"
            />
            <Button
              type="button"
              onClick={handleCouponApply}
              variant="outline"
            >
              Apply
            </Button>
          </div>
          {couponDiscount > 0 && (
            <Badge variant="secondary" className="text-green-600">
              Coupon applied: ${couponDiscount} off
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-300 rounded-md p-3 bg-white">
            <CardElement
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
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1"
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
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
};
