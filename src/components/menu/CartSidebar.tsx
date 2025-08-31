import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Minus, Plus, Trash2, X, ArrowLeft, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/pages/Menu';

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
  const [showExpandedItems, setShowExpandedItems] = useState(false);

  const subtotal = Math.max(0, total); // Ensure subtotal is never negative
  const taxAndFees = subtotal * 0.065 + 2.49 + (subtotal > 50 ? (subtotal - 50) * 0.05 : 0);
  const finalTotal = subtotal + taxAndFees;

  const handleCheckout = () => {
    onCheckout({
      name: '',
      phone: '',
      email: '',
    });
  };

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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600">Add some delicious items to get started!</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 bg-white border-l border-gray-200">
        <SheetHeader className="bg-[#2671BC] text-white -m-6 mb-3 p-3 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-base font-semibold text-white uppercase flex-1">
              Continue Shopping
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          <div className="px-3 pb-3">
            <p className="text-gray-800 font-semibold text-sm">Your order is currently as follows:</p>
          </div>
          {cart.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white shadow-sm mx-3">
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

        {/* Cart Footer */}
        <div className="border-t border-gray-200 pt-3 space-y-3 px-3">
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
              onClick={handleCheckout}
              className="w-full btn-primary font-bold text-lg py-3 mt-3"
            >
              Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
