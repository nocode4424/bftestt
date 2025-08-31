import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Restaurant, OrderType, OrderTime } from '@/pages/Menu';
import { cn } from '@/lib/utils';
import OrderTypeOption from './OrderTypeOption';
import { CheckoutCookieService } from '@/utils/checkoutCookieService';

interface OrderModalProps {
  restaurant: Restaurant;
  onStartOrder: (orderType: OrderType, orderTime: OrderTime, deliveryAddress?: string, scheduledDateTime?: Date) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  orderTime: OrderTime;
  setOrderTime: (time: OrderTime) => void;
  scheduledDateTime: Date | null;
  setScheduledDateTime: (date: Date | null) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
}

export const OrderModal = ({
  restaurant,
  onStartOrder,
  orderType,
  setOrderType,
  orderTime,
  setOrderTime,
  deliveryAddress,
  setDeliveryAddress,
}: OrderModalProps) => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState(true);
  const [isTimeExpanded, setIsTimeExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');
  const [selectedTime, setSelectedTime] = useState('18:17');

  // Load saved preferences from cookies
  useEffect(() => {
    const savedData = CheckoutCookieService.getCheckoutData();
    if (savedData) {
      if (savedData.orderType) {
        setOrderType(savedData.orderType);
      }
      if (savedData.deliveryAddress) {
        setDeliveryAddress(savedData.deliveryAddress);
      }
    }
  }, [setOrderType, setDeliveryAddress]);

  useEffect(() => {
    checkRestaurantHours();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setSelectedTime(`${hours}:${minutes}`);
  }, [restaurant]);

  const checkRestaurantHours = () => {
    // Restaurant hours logic
  };

  const handleStartOrder = () => {
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      alert('Please enter a delivery address.');
      return;
    }
    
    // Save preferences to cookies
    CheckoutCookieService.saveOrderType(orderType);
    if (deliveryAddress.trim()) {
      CheckoutCookieService.saveDeliveryAddress(deliveryAddress);
    }
    
    onStartOrder(orderType, orderTime, deliveryAddress);
  };

  const handleTimeToggle = () => {
    setIsTimeExpanded(!isTimeExpanded);
  };

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const formatDate = (date: Date) => {
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  return (
    <Dialog open={true}>
      <DialogContent className="p-0 border-0 w-full max-w-md mx-auto overflow-hidden shadow-2xl" style={{ margin: '8px' }}>
        <DialogTitle className="sr-only">Order Options</DialogTitle>
        <DialogDescription className="sr-only">
          Select your order type (pickup or delivery), timing, and provide delivery address if needed.
        </DialogDescription>
        <div 
          style={{
            background: 'linear-gradient(135deg, #2671BC, #8ECAE6)',
            overflow: 'hidden',
            width: '100%',
            minHeight: '100%'
          }}
        >
          {/* Header */}
          <div 
            style={{
              background: '#2671BC',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 10px rgba(38, 113, 188, 0.3)'
            }}
          >
            <div 
              style={{
                width: '80px',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img 
                src={restaurant.logo_url || "https://kbgzetvmczooddjhzpqc.supabase.co/storage/v1/object/sign/restaurant-assets/icons/Whisk_a77c233a2a.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YjRiYmM1ZS1iMzIyLTQwMjctOWIyMC0zMDIwMzM0ZDI0NzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZXN0YXVyYW50LWFzc2V0cy9pY29ucy9XaGlza19hNzdjMjMzYTJhLmpwZyIsImlhdCI6MTc1NDUyMTc0NCwiZXhwIjoxOTEyMjAxNzQ0fQ.7dMq2N2DA9ZyYqb-xFKiiBAXTaM3mBjG9KbwLXK-ff8"}
                alt="Restaurant Logo"
                style={{ width: '80px', height: 'auto', objectFit: 'contain' }}
              />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <h2 style={{ 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '4px',
                letterSpacing: '-0.5px'
              }}>
                {restaurant.name}
              </h2>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '11px', 
                lineHeight: '1.3'
              }}>
                {restaurant.address}
              </p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '20px 24px', background: 'white' }}>
            {/* Pickup/Delivery Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                color: '#2671BC',
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                display: 'block'
              }}>
                How would you like your order?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                <OrderTypeOption
                  type="pickup"
                  selected={orderType === 'pickup'}
                  onSelect={() => setOrderType('pickup')}
                />
                <OrderTypeOption
                  type="delivery"
                  selected={orderType === 'delivery'}
                  onSelect={() => restaurant.delivery_enabled && setOrderType('delivery')}
                  disabled={!restaurant.delivery_enabled}
                />
              </div>
            </div>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#2671BC',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Delivery Address
                </label>
                <Input
                  id="address"
                  placeholder="Enter your full address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  style={{ 
                    height: '48px', 
                    border: '2px solid #E97700',
                    fontSize: '16px',
                    padding: '12px 16px'
                  }}
                />
              </div>
            )}

            {/* Time Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px', 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#2671BC'
              }}>
                <span style={{ fontSize: '18px', color: '#E97700' }}>🕐</span>
                When would you like your order?
              </label>
              
              <div style={{
                background: 'white',
                border: `2px solid ${isTimeExpanded ? '#E97700' : 'rgba(233, 119, 0, 0.3)'}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                boxShadow: isTimeExpanded ? '0 4px 12px rgba(233, 119, 0, 0.15)' : 'none'
              }}>
                <div 
                  onClick={handleTimeToggle}
                  style={{
                    padding: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: 'white',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#2671BC', marginBottom: '2px' }}>
                      ASAP
                    </div>
                    <div style={{ fontSize: '12px', color: '#E97700', fontWeight: '500' }}>
                      Ready in 15-20 minutes
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#E97700',
                    transition: 'transform 0.3s ease',
                    fontSize: '12px',
                    transform: isTimeExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </div>
                </div>
                
                {isTimeExpanded && (
                  <div style={{
                    padding: '0 14px 14px',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginTop: '14px',
                      marginBottom: '14px'
                    }}>
                      <button
                        onClick={() => setSelectedDate('today')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: selectedDate === 'today' ? '#E97700' : 'white',
                          border: '2px solid rgba(233, 119, 0, 0.3)',
                          borderColor: selectedDate === 'today' ? '#E97700' : 'rgba(233, 119, 0, 0.3)',
                          color: selectedDate === 'today' ? 'white' : '#2671BC',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                          Today
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>
                          {formatDate(today)}
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSelectedDate('tomorrow')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: selectedDate === 'tomorrow' ? '#E97700' : 'white',
                          border: '2px solid rgba(233, 119, 0, 0.3)',
                          borderColor: selectedDate === 'tomorrow' ? '#E97700' : 'rgba(233, 119, 0, 0.3)',
                          color: selectedDate === 'tomorrow' ? 'white' : '#2671BC',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>
                          Tomorrow
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>
                          {formatDate(tomorrow)}
                        </div>
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px'
                    }}>
                      <label style={{ fontSize: '13px', color: '#2671BC', fontWeight: '500' }}>
                        Time:
                      </label>
                      <input 
                        type="time" 
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        min="08:00" 
                        max="21:00"
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: '2px solid rgba(233, 119, 0, 0.3)',
                          fontSize: '13px',
                          transition: 'all 0.3s ease',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Proceed Button */}
            <button
              onClick={handleStartOrder}
              disabled={(orderType === 'delivery' && !deliveryAddress.trim())}
              style={{
                width: '100%',
                padding: '16px',
                background: (orderType === 'delivery' && !deliveryAddress.trim()) ? '#ccc' : '#E97700',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: (orderType === 'delivery' && !deliveryAddress.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: (orderType === 'delivery' && !deliveryAddress.trim()) ? 'none' : '0 4px 12px rgba(233, 119, 0, 0.25)',
                letterSpacing: '0.5px',
                marginTop: '8px'
              }}
            >
              🍣 Start Your Order
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};