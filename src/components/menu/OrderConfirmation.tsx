import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { Restaurant, OrderType } from '@/pages/Menu';

interface OrderConfirmationProps {
  restaurant: Restaurant;
  orderType: OrderType;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  restaurant,
  orderType,
  customerInfo
}) => {
  const orderNumber = `BF${Date.now().toString().slice(-6)}`;
  const estimatedTime = orderType === 'pickup' ? '20-30 minutes' : '35-45 minutes';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          {restaurant.logo_url && (
            <img 
              src={restaurant.logo_url} 
              alt={restaurant.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your order, {customerInfo.name}
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Order Details
              <Badge variant="outline">#{orderNumber}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Estimated {orderType === 'pickup' ? 'Ready' : 'Delivery'} Time</div>
                <div className="text-sm text-muted-foreground">{estimatedTime}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {orderType === 'pickup' ? (
                <MapPin className="h-5 w-5 text-primary" />
              ) : (
                <MapPin className="h-5 w-5 text-primary" />
              )}
              <div>
                <div className="font-medium">
                  {orderType === 'pickup' ? 'Pick-up Location' : 'Delivery Address'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {restaurant.address}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Restaurant Phone</div>
                <div className="text-sm text-muted-foreground">{restaurant.phone}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{customerInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone:</span>
              <span>{customerInfo.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{customerInfo.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Order Confirmation</div>
                <div className="text-sm text-muted-foreground">
                  You'll receive an email confirmation shortly
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Preparation</div>
                <div className="text-sm text-muted-foreground">
                  Our chefs will start preparing your order
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-medium">
                  {orderType === 'pickup' ? 'Ready for Pick-up' : 'Out for Delivery'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {orderType === 'pickup' 
                    ? "We'll call you when your order is ready"
                    : "Your order will be delivered to your address"
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
            size="lg"
          >
            Place Another Order
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.print()}
            className="w-full"
          >
            Print Receipt
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Questions about your order?</p>
          <p>Call us at <a href={`tel:${restaurant.phone}`} className="text-primary hover:underline">{restaurant.phone}</a></p>
        </div>
      </div>
    </div>
  );
};