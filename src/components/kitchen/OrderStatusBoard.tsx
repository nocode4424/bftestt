import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Phone, Package, Truck, User, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '@/pages/Kitchen';

interface OrderStatusBoardProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string) => void;
}

interface ExpandedOrdersState {
  [orderId: string]: boolean;
}

const statusConfig = {
  new: { 
    label: 'NEW ORDER', 
    color: 'text-white font-black',
    cardBg: '#dc3545', // Bold red background and quarter
    quarterBg: '#dc3545',
    next: 'preparing',
    nextLabel: 'START PREPARING'
  },
  preparing: { 
    label: 'PREPARING', 
    color: 'text-white font-black',
    cardBg: '#fd7e14', // Bold orange background and quarter
    quarterBg: '#fd7e14',
    next: 'ready',
    nextLabel: 'MARK READY'
  },
  ready: { 
    label: 'READY', 
    color: 'text-white font-black',
    cardBg: '#198754', // Bold green background and quarter
    quarterBg: '#198754',
    next: 'completed',
    nextLabel: 'COMPLETED'
  },
  completed: { 
    label: 'COMPLETED', 
    color: 'text-white font-black',
    cardBg: '#6c757d', // Gray background and quarter
    quarterBg: '#6c757d',
    next: null,
    nextLabel: null
  }
};

const OrderCard: React.FC<{ 
  order: Order; 
  onUpdateStatus: (orderId: string, status: string) => void;
  isExpanded: boolean;
  onToggleExpand: (orderId: string) => void;
}> = ({ 
  order, 
  onUpdateStatus,
  isExpanded,
  onToggleExpand
}) => {
  const config = statusConfig[(order.status as keyof typeof statusConfig) || 'new'];
  const orderTime = new Date(order.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });

  // Extract cart items properly from order structure
  let cartItems = [];
  if (order.cart) {
    if (Array.isArray(order.cart)) {
      cartItems = order.cart;
    } else if (order.cart.items && Array.isArray(order.cart.items)) {
      cartItems = order.cart.items;
    } else if (typeof order.cart === 'object' && order.cart.items) {
      cartItems = Array.isArray(order.cart.items) ? order.cart.items : [];
    }
  }
  
  console.log('Order cart structure:', order.cart);
  console.log('Extracted cart items:', cartItems);

  const isNewOrder = order.status === 'new' || !order.status;

  return (
    <Card 
      className={`w-full border-4 shadow-2xl h-fit mb-4 ${isNewOrder ? 'border-red-400' : 'border-white'}`}
      style={{
        backgroundColor: isNewOrder ? '#fff' : 'rgba(255,255,255,0.95)', 
        animation: isNewOrder ? 'pulse 1.5s infinite' : 'none',
        borderRadius: '12px'
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`text-3xl font-black ${isNewOrder ? 'animate-bounce text-red-600' : 'text-gray-800'}`} style={{ textShadow: isNewOrder ? 'none' : '1px 1px 2px rgba(0,0,0,0.3)' }}>
              #{order.id.slice(-6)}
            </CardTitle>
            <p className={`text-lg font-bold opacity-90 ${isNewOrder ? 'text-gray-800' : 'text-gray-600'}`}>{orderTime}</p>
          </div>
          <div className={`text-lg px-4 py-2 font-black rounded ${isNewOrder ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-white'}`}>
            {config.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Customer Info */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3">
            <User className={`h-6 w-6 ${isNewOrder ? 'text-gray-600' : 'text-gray-600'}`} />
            <span className={`text-lg font-bold truncate ${isNewOrder ? 'text-gray-800' : 'text-gray-800'}`}>{order.customer_name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className={`h-6 w-6 ${isNewOrder ? 'text-gray-600' : 'text-gray-600'}`} />
            <span className={`text-lg font-bold truncate ${isNewOrder ? 'text-gray-800' : 'text-gray-800'}`}>{order.customer_phone || 'No phone'}</span>
          </div>
        </div>

        {/* Order Type */}
        <div className="flex items-center gap-3 p-3 rounded-lg border-2" style={{backgroundColor: order.delivery_type === 'delivery' ? '#3b82f6' : '#10b981', borderColor: 'white'}}>
          {order.delivery_type === 'delivery' ? (
            <>
              <Truck className="h-7 w-7 text-white" />
              <span className="text-xl font-black text-white">DELIVERY</span>
            </>
          ) : (
            <>
              <Package className="h-7 w-7 text-white" />
              <span className="text-xl font-black text-white">PICKUP</span>
            </>
          )}
        </div>

        {/* Delivery Address */}
        {order.delivery_type === 'delivery' && order.delivery_address && (
          <div className="flex items-start gap-2 p-2 rounded border" style={{backgroundColor: 'rgba(255,255,255,0.2)'}}>
            <MapPin className="h-4 w-4 text-white mt-0.5" />
            <span className="text-xs font-bold text-white">{order.delivery_address}</span>
          </div>
        )}

        <Separator />

        {/* Order Items - Enhanced for Kitchen Visibility */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-white">ITEMS ({cartItems.length}):</h4>
            {cartItems.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleExpand(order.id)}
                className="h-6 px-2 text-xs text-white hover:bg-white/10"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Expand All
                  </>
                )}
              </Button>
            )}
          </div>
          <div className={`space-y-2 ${!isExpanded && cartItems.length > 1 ? 'max-h-32' : 'max-h-64'} overflow-y-auto`}>
            {(isExpanded ? cartItems : cartItems.slice(0, 2)).map((item: any, index: number) => {
              // Handle different item structure formats
              const itemName = item.product?.name || item.name || 'Unknown Item';
              const itemQuantity = item.quantity || 1;
              const itemModifiers = item.selected_modifiers || item.modifiers || [];
              const itemNotes = item.notes || item.special_instructions || '';
              
              return (
                <div key={index} className="bg-white p-3 rounded-lg border-2 border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-lg font-black text-gray-800">
                        {itemQuantity}x {itemName}
                      </span>
                      
                      {/* Modifiers - Show ALL for Kitchen */}
                      {itemModifiers && itemModifiers.length > 0 && (
                        <div className="mt-2">
                          {itemModifiers.map((modifier: any, modIndex: number) => (
                            <div key={modIndex} className="text-sm font-bold text-blue-600 ml-4 flex items-center">
                              <span className="text-blue-400 mr-2">▶</span>
                              {modifier.name || modifier}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Special Instructions - Show FULL for Kitchen */}
                      {itemNotes && (
                        <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 rounded border-2 border-yellow-200">
                          <MessageSquare className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-bold text-yellow-700 break-words">
                            SPECIAL REQUEST: {itemNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {!isExpanded && cartItems.length > 2 && (
              <div className="text-center py-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleExpand(order.id)}
                  className="text-xs text-white hover:bg-white/10 border-white/30"
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show {cartItems.length - 2} more items
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Button - Compact */}
        {config.next && (
          <Button 
            className="w-full h-12 text-sm font-black border-2 bg-white text-gray-800 hover:bg-gray-100"
            size="sm"
            onClick={() => onUpdateStatus(order.id, config.next!)}
          >
            {config.nextLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const OrderStatusBoard: React.FC<OrderStatusBoardProps> = ({ orders, onUpdateStatus }) => {
  const [expandedOrders, setExpandedOrders] = useState<ExpandedOrdersState>({});
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const handleToggleExpand = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Check for new orders and show alert
  useEffect(() => {
    const newOrders = orders.filter(order => order.status === 'new' || !order.status);
    if (newOrders.length > 0) {
      setNewOrderAlert(true);
      // Auto-hide alert after 5 seconds
      const timer = setTimeout(() => setNewOrderAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  const groupedOrders = {
    new: orders.filter(order => order.status === 'new' || !order.status),
    preparing: orders.filter(order => order.status === 'preparing'),
    cooking: orders.filter(order => order.status === 'cooking'),
    ready: orders.filter(order => order.status === 'ready')
  };

  return (
    <>
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-white">
            <div className="text-center">
              <div className="text-lg font-black">NEW ORDERS!</div>
              <div className="text-sm">Check kitchen display</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-4 gap-0 h-[calc(100vh-200px)]">
        {Object.entries(groupedOrders).map(([status, orderList]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          
          // Fallback for undefined config
          if (!config) {
            console.warn(`Unknown status: ${status}`);
            return null;
          }
          
          return (
            <div key={status} className="flex flex-col border-r-2 border-gray-300 last:border-r-0" style={{backgroundColor: config.quarterBg}}>
              <div className="text-center py-4 px-4 border-b-2 border-white/20">
                <h3 className="text-4xl font-black text-white">{config.label}</h3>
                <p className="text-2xl font-bold text-white opacity-90">({orderList.length})</p>
              </div>
              
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {orderList.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm font-medium text-white opacity-70">No orders</p>
                  </div>
                ) : (
                  orderList.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={onUpdateStatus}
                      isExpanded={expandedOrders[order.id] || false}
                      onToggleExpand={handleToggleExpand}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};