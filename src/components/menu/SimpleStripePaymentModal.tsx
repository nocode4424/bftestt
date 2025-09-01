import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Percent, DollarSign, ArrowLeft, ShoppingBag, CheckCircle } from 'lucide-react';
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
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
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
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}> = ({ customerData, cart, restaurant, total, onComplete, onClose, onBackToCart, onUpdateQuantity, onRemoveItem }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

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
      { label: 'No Tip', value: 0, icon: '💙' },
      { label: `15%`, value: tip15, icon: '😊' },
      { label: `18%`, value: tip18, icon: '😄' },
      { label: `20%`, value: tip20, icon: '🤩' },
      { label: `25%`, value: tip25, icon: '🥰' }
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
        title: "Coupon Applied! 🎉",
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
          title: "Payment Successful! 🎉",
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
    <div className="flex flex-col h-full">
      {/* Beautiful Header */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-t-xl"></div>
        <div className="relative p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToCart}
              className="text-white hover:bg-white/20 border border-white/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <div className="flex items-center gap-2">
              {restaurant.logo_url && (
                <img 
                  src={restaurant.logo_url} 
                  alt={`${restaurant.name} logo`}
                  className="h-8 w-8 object-contain bg-white rounded-full p-1"
                />
              )}
              <span className="font-semibold text-lg">{restaurant.name}</span>
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </h3>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {cart.length} items
              </Badge>
            </div>
            
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                  {item.product.image_url && (
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name}
                      className="h-8 w-8 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-white/70 text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-white font-bold text-sm">${item.total_price.toFixed(2)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/20 pt-3 mt-3 space-y-1">
              <div className="flex justify-between text-white/90 text-sm">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white/90 text-sm">
                <span>Tax & Processing:</span>
                <span>${calculateTaxAndFees().toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-white/90 text-sm">
                  <span>Tip:</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-300 text-sm">
                  <span>Discount:</span>
                  <span>-${couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg border-t border-white/20 pt-2">
                <span>Total:</span>
                <span>${calculateGrandTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 px-6">
        {/* Coupon Code */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Percent className="h-4 w-4 text-green-600" />
            <h3 className="text-green-800 font-semibold text-sm">Have a Coupon?</h3>
          </div>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 border-green-300 focus:border-green-500 text-sm"
            />
            <Button
              type="button"
              onClick={handleCouponApply}
              variant="outline"
              className="border-green-300 text-green-700 hover:bg-green-50 text-sm"
            >
              Apply
            </Button>
          </div>
          {couponDiscount > 0 && (
            <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Coupon applied: ${couponDiscount} off</span>
            </div>
          )}
        </div>

        {/* Tip Options */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <h3 className="text-orange-800 font-semibold text-sm">Add a Tip</h3>
          </div>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {tipOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={tipAmount === option.value ? "default" : "outline"}
                onClick={() => handleTipChange(option.value)}
                className={`h-12 text-xs font-medium ${
                  tipAmount === option.value 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-lg">{option.icon}</span>
                  <span>{option.label}</span>
                  {option.value > 0 && <span className="text-xs">${option.value}</span>}
                </div>
              </Button>
            ))}
          </div>
          <div>
            <Label htmlFor="custom-tip" className="text-orange-800 text-xs font-medium">Custom Tip</Label>
            <Input
              id="custom-tip"
              type="number"
              placeholder="Enter custom amount"
              value={customTip}
              onChange={handleCustomTipChange}
              className="border-orange-300 focus:border-orange-500 text-sm"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-4 flex-1">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-4 w-4 text-slate-600" />
            <h3 className="text-slate-800 font-semibold text-sm">Payment Method</h3>
          </div>
          <div className="border-2 border-slate-300 rounded-lg p-3 bg-white shadow-sm">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '14px',
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
        </div>

        {/* Submit Button */}
        <div className="pt-4 pb-6">
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              `Pay $${calculateGrandTotal().toFixed(2)}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export const SimpleStripePaymentModal: React.FC<SimpleStripePaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  onBackToCart,
  onUpdateQuantity,
  onRemoveItem,
  customerData,
  cart,
  restaurant,
  total
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[95vh] overflow-hidden bg-white m-2 sm:m-4 p-0">
        <div className="flex-1 overflow-hidden">
          <Elements stripe={stripePromise}>
            <PaymentForm
              customerData={customerData}
              cart={cart}
              restaurant={restaurant}
              total={total}
              onComplete={onComplete}
              onClose={onClose}
              onBackToCart={onBackToCart}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
            />
          </Elements>
        </div>
      </DialogContent>
    </Dialog>
  );
};
