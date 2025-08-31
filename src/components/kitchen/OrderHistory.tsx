import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Calendar, Truck, Package, User, Clock, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/pages/Kitchen';

export const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, dateFilter]);

  const fetchOrderHistory = async () => {
    setLoading(true);
    
    // Get orders from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching order history:', error);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm)
      );
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredOrders(filtered);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubtotal = (cart: any[]) => {
    if (!Array.isArray(cart)) return 0;
    
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'completed': 'bg-green-600 text-white',
      'ready': 'bg-blue-600 text-white',
      'cooking': 'bg-orange-600 text-white',
      'preparing': 'bg-yellow-600 text-black',
      'acknowledged': 'bg-purple-600 text-white',
      'new': 'bg-red-600 text-white'
    };
    return colors[status] || 'bg-gray-600 text-white';
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const formatOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatOrderTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupOrdersByDate = (orders: Order[]) => {
    const grouped = orders.reduce((acc, order) => {
      const date = formatOrderDate(order.created_at);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
    
    // Sort dates in descending order
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
    
    return sortedDates.map(date => ({ date, orders: grouped[date] }));
  };

  const completedOrders = filteredOrders.filter(order => order.status === 'completed');
  const totalCompletedToday = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString() && order.status === 'completed';
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedOrders.length}</div>
              <div className="text-sm text-muted-foreground">Completed Orders (7 days)</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalCompletedToday}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completedOrders.filter(o => o.delivery_type === 'delivery').length}
              </div>
              <div className="text-sm text-muted-foreground">Delivery Orders</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completedOrders.filter(o => o.delivery_type === 'pickup').length}
              </div>
              <div className="text-sm text-muted-foreground">Pickup Orders</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Order History (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-transparent border-gray-300"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-auto bg-transparent border-gray-300"
              />
            </div>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setDateFilter(''); }}>
              Clear Filters
            </Button>
          </div>

          {/* Orders by Date */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                Loading order history...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                No orders found matching your criteria
              </div>
            ) : (
              groupOrdersByDate(filteredOrders).map(({ date, orders: dateOrders }) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dateOrders.map(order => {
                      const cartItems = Array.isArray(order.cart) ? order.cart : [];
                      const subtotal = getSubtotal(cartItems);
                      
                      return (
                        <div
                          key={order.id}
                          onClick={() => handleOrderClick(order)}
                          className="p-3 bg-white border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-gray-600">
                                  {formatOrderTime(order.created_at)}
                                </span>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.toUpperCase()}
                                </Badge>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  {order.delivery_type === 'delivery' ? (
                                    <Truck className="h-3 w-3" />
                                  ) : (
                                    <Package className="h-3 w-3" />
                                  )}
                                  <span className="capitalize">{order.delivery_type}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">{order.customer_name}</span>
                                <span className="text-sm text-gray-500">{order.customer_phone}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                                {cartItems.length > 0 && (
                                  <span className="ml-2">
                                    {cartItems.slice(0, 1).map((item: any) => item.name).join(', ')}
                                    {cartItems.length > 1 && ` +${cartItems.length - 1} more`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">${subtotal.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Order Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Info */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Time:</span>
                  <span className="text-sm">{formatTime(selectedOrder.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Type:</span>
                  <div className="flex items-center gap-1 text-sm">
                    {selectedOrder.delivery_type === 'delivery' ? (
                      <Truck className="h-3 w-3" />
                    ) : (
                      <Package className="h-3 w-3" />
                    )}
                    <span className="capitalize">{selectedOrder.delivery_type}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Customer</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="text-sm text-gray-600 ml-6">
                    {selectedOrder.customer_phone}
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="text-sm text-gray-600 ml-6">
                      {selectedOrder.customer_email}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {(Array.isArray(selectedOrder.cart) ? selectedOrder.cart : []).map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.quantity}x {item.name}
                        </div>
                        {item.special_instructions && (
                          <div className="text-gray-600 text-xs mt-1">
                            Note: {item.special_instructions}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Total */}
                <div className="border-t mt-4 pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total:</span>
                    <span>${getSubtotal(Array.isArray(selectedOrder.cart) ? selectedOrder.cart : []).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.special_instructions}</p>
                </div>
              )}

              {/* Address for delivery */}
              {selectedOrder.delivery_type === 'delivery' && selectedOrder.delivery_address && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Delivery Address</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.delivery_address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};