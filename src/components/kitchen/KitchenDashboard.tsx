import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Clock, Star, Utensils, DollarSign, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  todayOrders: number;
  averageOrderTime: number;
  mostPopularItems: Array<{ name: string; count: number; percentage: number }>;
  hourlyOrders: Array<{ hour: string; orders: number }>;
  orderTypeBreakdown: Array<{ type: string; count: number; color: string }>;
}

interface KitchenDashboardProps {
  orders: any[];
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({ orders }) => {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    averageOrderTime: 0,
    mostPopularItems: [],
    hourlyOrders: [],
    orderTypeBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);

    try {
      // Get today's date in Eastern Time
      const today = new Date();
      const easternToday = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/New_York'
      }).format(today);
      
      const startOfDay = `${easternToday}T00:00:00-05:00`;
      const endOfDay = `${easternToday}T23:59:59-05:00`;

      // Fetch today's orders for BlueFin restaurant only
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', '3b29861a-5ade-4800-b269-d0a03c351eb6')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
        return;
      }

      // Process data
      const todayOrders = orders?.length || 0;
      
      // Calculate most popular items
      const itemCounts: Record<string, number> = {};
      let totalItems = 0;
      
      orders?.forEach(order => {
        // Handle different cart data structures
        let cartItems: any[] = [];
        
        if (Array.isArray(order.cart)) {
          // If cart is an array (older format)
          cartItems = order.cart;
        } else if (order.cart && Array.isArray(order.cart.items)) {
          // If cart is an object with items array (newer format)
          cartItems = order.cart.items;
        }
        
        cartItems.forEach((item: any) => {
          const itemName = item.product?.name || item.name || 'Unknown Item';
          const quantity = item.quantity || 1;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
          totalItems += quantity;
        });
      });

      const mostPopularItems = Object.entries(itemCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalItems) * 100) || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate hourly breakdown
      const hourlyData: Record<string, number> = {};
      for (let i = 0; i < 24; i++) {
        hourlyData[`${i.toString().padStart(2, '0')}:00`] = 0;
      }

      orders?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        const hourKey = `${hour.toString().padStart(2, '0')}:00`;
        hourlyData[hourKey]++;
      });

      const hourlyOrders = Object.entries(hourlyData)
        .map(([hour, orders]) => ({ hour, orders }))
        .filter(entry => entry.orders > 0); // Only show hours with orders

      // Order type breakdown
      const deliveryCount = orders?.filter(o => o.delivery_type === 'delivery').length || 0;
      const pickupCount = orders?.filter(o => o.delivery_type === 'pickup').length || 0;

      const orderTypeBreakdown = [
        { type: 'Delivery', count: deliveryCount, color: '#3B82F6' },
        { type: 'Pickup', count: pickupCount, color: '#10B981' }
      ].filter(item => item.count > 0);

      setStats({
        todayOrders,
        averageOrderTime: 0, // This would need more complex calculation with order timestamps
        mostPopularItems,
        hourlyOrders,
        orderTypeBreakdown
      });

    } catch (error) {
      console.error('Error processing dashboard stats:', error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold">{stats.todayOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Time</p>
                <p className="text-2xl font-bold">12m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Hour</p>
                <p className="text-2xl font-bold">
                  {stats.hourlyOrders.length > 0 
                    ? stats.hourlyOrders.reduce((max, current) => 
                        current.orders > max.orders ? current : max
                      ).hour
                    : '--:--'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-full">
                <Star className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Item</p>
                <p className="text-xl font-bold truncate">
                  {stats.mostPopularItems[0]?.name || 'No data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Most Popular Items */}
        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <Star className="h-8 w-8" />
              🔥 MOST POPULAR ITEMS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.mostPopularItems.length > 0 ? (
              <div className="space-y-4">
                {stats.mostPopularItems.map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">{item.name}</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">{item.count} orders</Badge>
                    </div>
                    <Progress value={item.percentage} className="h-4" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-xl">No order data available for today</p>
            )}
          </CardContent>
        </Card>

        {/* Most Popular Times */}
        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <Clock className="h-8 w-8" />
              ⏰ PEAK TIMES
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.hourlyOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.hourlyOrders
                  .sort((a, b) => b.orders - a.orders)
                  .slice(0, 5)
                  .map((hour, index) => (
                    <div key={hour.hour} className="flex justify-between items-center p-3 bg-muted rounded border-2">
                      <span className="text-lg font-bold">{hour.hour}</span>
                      <Badge className="text-lg px-3 py-1">{hour.orders} orders</Badge>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-xl">No order data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <TrendingUp className="h-8 w-8" />
              💡 RECOMMENDATIONS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/20 rounded border-2 border-green-500">
                <h4 className="font-bold text-lg">📱 Mobile Orders</h4>
                <p className="text-sm">Promote app-based ordering for faster processing</p>
              </div>
              <div className="p-4 bg-blue-500/20 rounded border-2 border-blue-500">
                <h4 className="font-bold text-lg">🚚 Delivery Deals</h4>
                <p className="text-sm">Offer delivery specials during slow hours</p>
              </div>
              <div className="p-4 bg-orange-500/20 rounded border-2 border-orange-500">
                <h4 className="font-bold text-lg">📦 Bundle Offers</h4>
                <p className="text-sm">Create combo deals for popular items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card className="border-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-3xl font-black">
            <Package className="h-10 w-10" />
            📋 RECENT ORDERS ({stats.todayOrders} today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="p-4 bg-muted rounded border-2 cursor-pointer hover:bg-muted/80">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-bold">{order.customer_name}</span>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('en-US', {
                          timeZone: 'America/New_York'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge>{order.status}</Badge>
                      <p className="text-lg font-bold">
                        ${(() => {
                          if (order.total) {
                            return parseFloat(order.total).toFixed(2);
                          }
                          // Fallback calculation if total is not available
                          let cartItems: any[] = [];
                          if (Array.isArray(order.cart)) {
                            cartItems = order.cart;
                          } else if (order.cart && Array.isArray(order.cart.items)) {
                            cartItems = order.cart.items;
                          }
                          const sum = cartItems.reduce((sum: number, item: any) => {
                            const price = item.total_price || (item.price * item.quantity) || 0;
                            return sum + price;
                          }, 0);
                          return sum.toFixed(2);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-xl">No recent orders</p>
          )}
        </CardContent>
      </Card>

      {/* Hourly Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Orders by Hour (Today)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.hourlyOrders.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No order data available for today</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};