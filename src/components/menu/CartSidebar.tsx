import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Minus, Plus, Trash2, X, User, ArrowLeft, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/pages/Menu';
import { supabase } from '@/integrations/supabase/client';

interface CartSidebarProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: (customerData: { name: string; phone: string; email: string }) => void;
  total: number;
  restaurantName?: string;
  restaurantId?: string;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  total,
  restaurantName = "Bluefin Sushi",
  restaurantId = "3b29861a-5ade-4800-b269-d0a03c351eb6"
}) => {
  const [cartStage, setCartStage] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showExpandedItems, setShowExpandedItems] = useState(false);

  const subtotal = total;
  const taxAndFees = subtotal * 0.065 + 2.49 + (subtotal > 50 ? (subtotal - 50) * 0.05 : 0);
  const finalTotal = subtotal + taxAndFees;

  // Format phone number as user types
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
    setCustomerPhone(formattedPhone);
  };

  const handleInitialCheckout = () => {
    setCartStage('checkout');
  };

  const handleBackToCart = () => {
    setCartStage('cart');
  };

  // proceed directly to external Stripe checkout
  const handleProceedToPayment = () => {
    if (!canCompleteCheckout()) return;
    onCheckout({
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    });
  };

  const handleCompleteCheckout = handleProceedToPayment;

  const canCompleteCheckout = () =>
    customerName.trim() &&
    customerPhone.trim() &&
    customerEmail.trim() &&
    agreedToTerms;

  if (cart.length === 0) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:w-96 bg-white border-l border-gray-200">
          <SheetHeader className="border-b border-gray-200 pb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <SheetTitle className="text-lg font-bold text-gray-900 uppercase flex-1">Your Cart</SheetTitle>
            </div>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-muted-foreground mb-3">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                🛒
              </div>
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs">Add some delicious items to get started!</p>
            </div>
            <Button 
              onClick={onClose}
              variant="outline"
              className="mt-4"
            >
              Continue Shopping
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col bg-white border-l border-gray-200">
        <SheetHeader className="bg-[#2671BC] text-white pb-3 pt-3">
          <div className="text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider" style={{fontFamily: 'Playfair Display, serif'}}>
              {restaurantName}
            </h1>
            <div className="mt-1 border border-white/50 rounded px-2 py-1 inline-block">
              <span className="text-xs text-white/90">Wesley Chapel</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cartStage === 'cart' ? onClose : handleBackToCart}
              className="p-2 hover:bg-white/20 rounded-full text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-base font-semibold text-white uppercase flex-1">
              {cartStage === 'cart' ? 'Continue Shopping' : 'Go Back'}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Dynamic Content Based on Stage */}
        <div className="flex-1 overflow-y-auto transition-all duration-700 ease-in-out">
          {cartStage === 'cart' && (
            <div className="py-3 space-y-3">
              <div className="px-3 pb-3">
                <p className="text-gray-800 font-semibold text-sm">Your order is currently as follows:</p>
              </div>
              {cart.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.product.name}</h4>
                      {item.customizations?.selectedRolls && (
                        <div className="text-xs text-gray-700 mt-1 font-medium">
                          <strong>Rolls:</strong> {item.customizations.selectedRolls.join(', ')}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="border border-gray-300 hover:border-[#2671BC] rounded-md"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Badge variant="secondary" className="min-w-[2rem] text-center bg-gray-100 text-gray-900 border border-gray-300 font-bold rounded-md">
                        {item.quantity}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="border border-gray-300 hover:border-[#2671BC] rounded-md"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      ${item.total_price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cartStage === 'checkout' && (
            <div className="py-3 space-y-4 animate-in slide-in-from-bottom duration-700">
              {/* First Two Items */}
              <div className="space-y-2">
                {cart.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex justify-between text-base font-semibold border-b pb-2">
                    <span className="text-gray-900">{item.quantity}x {item.product.name}</span>
                    <span className="text-gray-900">${item.total_price.toFixed(2)}</span>
                  </div>
                ))}
                {cart.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExpandedItems(!showExpandedItems)}
                    className="text-base text-[#E97700] hover:text-[#D1470B] w-full font-semibold"
                  >
                    {showExpandedItems ? 'Collapse' : 'Expand'} ({cart.length - 2} more items)
                  </Button>
                )}
                {showExpandedItems && cart.slice(2).map((item) => (
                  <div key={item.id} className="flex justify-between text-base font-semibold border-b pb-2">
                    <span className="text-gray-900">{item.quantity}x {item.product.name}</span>
                    <span className="text-gray-900">${item.total_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-xl">
                  <span className="text-gray-900">Grand Total</span>
                  <span className="text-[#E97700]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Cart Footer */}
        <div className="border-t border-gray-200 pt-3 space-y-3">
          {cartStage === 'cart' && (
            <div className="space-y-1">
              {/* Pricing */}
              <div className="space-y-2 text-base font-semibold bg-white">
                <div className="flex justify-between text-gray-900">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span>Taxes & Processing</span>
                  <span>${taxAndFees.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-400 pt-2 mt-2 text-gray-900">
                  <span>Total</span>
                  <span className="text-[#E97700]">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleInitialCheckout}
                className="w-full btn-primary font-bold text-lg py-3 mt-3"
              >
                Begin Checkout
              </Button>
            </div>
          )}

          {cartStage === 'checkout' && (
            <div className="space-y-4">
              {/* Customer Information Header */}
              <div className="text-center bg-white py-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Customer Information</h3>
                <p className="text-base text-gray-700">Please fill your information below</p>
              </div>

              {/* Customer Form */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="text"
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-white border-2 border-gray-600 h-12 text-gray-900 font-semibold text-lg"
                  />
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="bg-white border-2 border-gray-600 h-12 text-gray-900 font-semibold text-lg"
                  />
                </div>
              <div className="pb-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border-2 border-gray-600 h-12 text-gray-900 font-semibold text-lg"
                />
              </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-5 w-5"
                  />
                  <label className="text-sm font-semibold text-gray-900">
                    I agree to the Terms & Conditions
                  </label>
                </div>
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!canCompleteCheckout()}
                  className="w-full btn-primary font-bold text-lg py-3"
                >
                  Go to the next page
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
