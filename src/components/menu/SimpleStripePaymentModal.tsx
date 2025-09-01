import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Percent, DollarSign, ArrowLeft, ShoppingBag, Plus, Minus } from 'lucide-react';
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
  const [showOrderSummary, setShowOrderSummary] = useState(true);

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
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={onBackToCart}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowOrderSummary(!showOrderSummary)}
          className="text-gray-600 hover:text-gray-700"
        >
          {showOrderSummary ? 'Hide' : 'Show'} Order
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
        {/* Collapsible Order Summary */}
        {showOrderSummary && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {restaurant.logo_url && (
                  <img 
                    src={restaurant.logo_url} 
                    alt={`${restaurant.name} logo`}
                    className="h-6 w-6 object-contain"
                  />
                )}
                <CardTitle className="text-blue-900 text-sm font-semibold">
                  Order Summary ({cart.length} items)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 bg-white rounded p-2 shadow-sm">
                    {item.product.image_url && (
                      <img 
                        src={item.product.image_url} 
                        alt={item.product.name}
                        className="h-8 w-8 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-xs truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            {item.quantity}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    <p className="font-bold text-blue-900 text-sm">${item.total_price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-blue-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax & Processing:</span>
                  <span>${calculateTaxAndFees().toFixed(2)}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-gray-700">
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
                <div className="flex justify-between text-blue-900 font-bold border-t border-blue-200 pt-1">
                  <span>Total:</span>
                  <span>${calculateGrandTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coupon Code */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-900 text-sm flex items-center gap-2">
              <Percent className="h-3 w-3" />
              Coupon Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="text-black bg-white border-gray-300 h-10 text-sm"
              />
              <Button
                type="button"
                onClick={handleCouponApply}
                variant="outline"
                className="h-10 px-3 text-sm"
              >
                Apply
              </Button>
            </div>
            {couponDiscount > 0 && (
              <Badge variant="secondary" className="text-green-600 bg-green-100 text-xs">
                Coupon applied: ${couponDiscount} off
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Tip Options */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-900 text-sm flex items-center gap-2">
              <DollarSign className="h-3 w-3" />
              Add a Tip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {tipOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={tipAmount === option.value ? "default" : "outline"}
                  onClick={() => handleTipChange(option.value)}
                  className="h-10 text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div>
              <Label htmlFor="custom-tip" className="text-gray-900 text-xs font-medium">Custom Tip</Label>
              <Input
                id="custom-tip"
                type="number"
                placeholder="Enter custom tip amount"
                value={customTip}
                onChange={handleCustomTipChange}
                className="text-black bg-white border-gray-300 h-10 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-white shadow-sm border border-gray-200 flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-900 text-sm flex items-center gap-2">
              <CreditCard className="h-3 w-3" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-300 rounded-lg p-3 bg-white">
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
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isProcessing ? 'Processing...' : `Pay $${calculateGrandTotal().toFixed(2)}`}
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
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-hidden bg-white m-2 sm:m-4">
        <DialogHeader className="bg-[#2671BC] text-white -m-6 mb-4 p-3 rounded-t-lg">
          <DialogTitle className="text-center text-white text-base font-semibold">
            Complete Your Order - {restaurant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 flex-1 overflow-hidden">
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
