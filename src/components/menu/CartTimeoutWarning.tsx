import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, ShoppingCart } from 'lucide-react';

interface CartTimeoutWarningProps {
  isOpen: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  formattedTimeLeft: string;
  cartItemsCount: number;
  onExtendSession: () => void;
  onContinueShopping: () => void;
  onCheckoutNow: () => void;
  onClose: () => void;
}

export const CartTimeoutWarning: React.FC<CartTimeoutWarningProps> = ({
  isOpen,
  remainingMinutes,
  remainingSeconds,
  formattedTimeLeft,
  cartItemsCount,
  onExtendSession,
  onContinueShopping,
  onCheckoutNow,
  onClose
}) => {
  const isUrgent = remainingMinutes <= 1;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${isUrgent ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
              <Clock className={`h-6 w-6 ${isUrgent ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {isUrgent ? '🚨 Cart Expiring Soon!' : '⏰ Cart Timeout Warning'}
              </DialogTitle>
              <DialogDescription className="text-base">
                Your shopping cart will expire soon
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time remaining display */}
          <div className={`p-4 rounded-lg border-2 text-center ${
            isUrgent 
              ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800' 
              : 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${isUrgent ? 'text-red-500' : 'text-orange-500'}`} />
              <span className="font-semibold">Time Remaining</span>
            </div>
            <div className={`text-3xl font-mono font-black ${
              isUrgent ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              {formattedTimeLeft}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isUrgent ? 'Less than a minute left!' : `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} remaining`}
            </p>
          </div>

          {/* Cart info */}
          <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
            <ShoppingCart className="h-4 w-4" />
            <span className="text-sm">
              You have <Badge variant="outline" className="mx-1">{cartItemsCount}</Badge> 
              item{cartItemsCount !== 1 ? 's' : ''} in your cart
            </span>
          </div>

          {/* Warning message */}
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Why do carts expire?</strong><br />
              To ensure fair access to limited menu items and maintain fresh pricing, 
              we automatically clear inactive carts after 30 minutes.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col space-y-2">
          {cartItemsCount > 0 && (
            <Button 
              onClick={onCheckoutNow} 
              className="w-full" 
              size="lg"
            >
              🚀 Checkout Now
            </Button>
          )}
          
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button 
              onClick={onExtendSession} 
              variant="outline"
              size="sm"
            >
              ⏰ Extend Time
            </Button>
            <Button 
              onClick={onContinueShopping} 
              variant="outline"
              size="sm"
            >
              🛍️ Keep Shopping
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center mt-2">
            Extending your session adds 30 more minutes
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};