import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertCircle, Tag, User, History } from 'lucide-react';
import { Restaurant, CartItem } from '@/pages/Menu';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CheckoutCookieService } from '@/utils/checkoutCookieService';

interface SimplePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  customerData: { name: string; phone: string; email: string; userId?: string };
  cart: CartItem[];
  restaurant: Restaurant;
  total: number;
}

export const SimplePaymentModal: React.FC<SimplePaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  customerData,
  cart,
  restaurant,
  total
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);
  const { toast } = useToast();

  // Load previous orders if user is authenticated
  React.useEffect(() => {
    if (customerData.userId) {
      loadPreviousOrders();
    }
  }, [customerData.userId]);

  const loadPreviousOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, total, items, status')
        .eq('customer_email', customerData.email)
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
    const finalTotal = totalWithFees - couponDiscount;
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
    if (!couponCode.trim()) return;

    try {
      // Simulate coupon validation - replace with actual API call
      if (couponCode.toUpperCase() === 'LABORDAY') {
        setCouponDiscount(5);
        toast({
          title: "Coupon Applied!",
          description: "You've saved $5.00 on your order!",
        });
      } else {
        setCouponDiscount(0);
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
    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Create payment intent using edge function
      const { data: paymentIntentData, error: paymentError } = await supabase.functions.invoke('bfcreate', {
        body: {
          amount: calculateGrandTotal(),
          currency: 'usd',
          customerEmail: customerData.email,
          customerName: customerData.name,
          customerPhone: customerData.phone
        }
      });

      if (paymentError || !paymentIntentData?.success) {
        throw new Error(paymentError?.message || paymentIntentData?.error || 'Failed to create payment intent');
      }

      // Create order using edge function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('bfrecord', {
        body: {
          cart,
          customerInfo: customerData,
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
          tip: tipAmount,
          couponCode: couponCode || null,
          couponDiscount
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
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
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
            Complete Your Order - {restaurant.name}
          </DialogTitle>
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
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-${couponDiscount.toFixed(2)}</span>
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
            {customerData.userId && previousOrders.length > 0 && (
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

          {/* Right Column - Payment Options */}
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
                    <Label>Name</Label>
                    <Input value={customerData.name} readOnly />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={customerData.phone} readOnly />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={customerData.email} readOnly />
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
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCouponApply} disabled={!couponCode.trim()}>
                    Apply
                  </Button>
                </div>
                {couponDiscount > 0 && (
                  <p className="text-green-600 text-sm mt-2">
                    Coupon applied! You've saved ${couponDiscount.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Payment will be processed securely through our payment system.</p>
                    <p className="text-sm text-gray-600">You'll be redirected to complete your payment after clicking "Complete Order".</p>
                  </div>

                  {paymentError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{paymentError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleCompleteOrder}
                    disabled={isProcessingPayment}
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
