import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
// AdminUser interface - removed AdminAuth import to avoid browser compatibility issues with bcrypt/jwt
import { Users, ShoppingCart, TrendingUp, DollarSign, Eye, LogIn, Lock, User, Clock, ChevronDown, X, Package } from 'lucide-react';

// AdminUser interface (copied from adminAuth to avoid browser compatibility issues)
interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  restaurant_id: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
}

// Google Sign-In types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

interface CustomerOverview {
  restaurant_id: string;
  restaurant_name: string;
  total_visitors: number;
  visitors_with_carts: number;
  converted_visitors: number;
  total_orders: number;
  total_revenue: number;
  conversion_rate: number;
  average_order_value: number;
}

interface TodayMetrics {
  today_visitors: number;
  today_orders: number;
  today_revenue: number;
  average_order_value: number;
  top_selling_item: string;
  most_carted_item: string;
  peak_website_hour: number;
  peak_order_hour: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_type: string;
  status: string;
  payment_status: string;
  subtotal: number;
  total: number;
  created_at: string;
  customer_ip: string;
  referrer_url: string;
  utm_source: string;
  items_count: number;
  cart: any;
}

interface PopularItem {
  item_name: string;
  times_ordered: number;
  total_quantity: number;
  total_revenue: number;
  popularity_rank: number;
}

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Dashboard data states
  const [overview, setOverview] = useState<CustomerOverview | null>(null);
  const [todayMetrics, setTodayMetrics] = useState<TodayMetrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);

  // Authentication check
  useEffect(() => {
    checkAuth();
  }, []);

  // Load dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated && currentAdmin) {
      loadDashboardData();
    }
  }, [isAuthenticated, currentAdmin]);


  const checkAuth = async () => {
    try {
      // First check for Supabase OAuth session (Google login)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user is authorized admin via email
        const { data: adminData, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', session.user.email)
          .eq('is_active', true)
          .single();

        if (adminData && !error) {
          const adminUser: AdminUser = {
            id: adminData.id,
            username: adminData.username,
            full_name: session.user.user_metadata?.full_name || adminData.full_name,
            email: session.user.email || '',
            restaurant_id: adminData.restaurant_id,
            role: adminData.role,
            is_active: adminData.is_active,
            last_login_at: adminData.last_login_at
          };
          
          // Update last login
          await supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', adminData.id);
          
          setCurrentAdmin(adminUser);
          setIsAuthenticated(true);
          return;
        }
      }

      // Clean up any old traditional auth tokens to avoid compatibility issues
      const token = localStorage.getItem('admin_token');
      if (token) {
        localStorage.removeItem('admin_token');
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      // First, try traditional admin_users table authentication
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .or(`username.eq.${username.trim()},email.eq.${username.trim()}`)
        .eq('is_active', true)
        .single();

      if (adminData && !adminError) {
        // Use bcryptjs to verify password (client-side for now)
        const bcrypt = await import('bcryptjs');
        const passwordMatch = await bcrypt.compare(password, adminData.password_hash);
        
        if (passwordMatch) {
          const adminUser: AdminUser = {
            id: adminData.id,
            username: adminData.username,
            full_name: adminData.full_name,
            email: adminData.email,
            restaurant_id: adminData.restaurant_id,
            role: adminData.role,
            is_active: adminData.is_active,
            last_login_at: adminData.last_login_at
          };

          // Update last login
          await supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', adminData.id);

          setCurrentAdmin(adminUser);
          setIsAuthenticated(true);
          setUsername('');
          setPassword('');
          return;
        } else {
          setLoginError('Invalid password.');
          return;
        }
      }

      // Fallback: Try Supabase Auth with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username.trim(),
        password: password,
      });

      if (error) {
        setLoginError('Invalid username/email or password.');
      } else if (data.user) {
        // Check if user is authorized admin
        const { data: supabaseAdminData, error: supabaseAdminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', data.user.email)
          .eq('is_active', true)
          .single();

        if (supabaseAdminData && !supabaseAdminError) {
          const adminUser: AdminUser = {
            id: supabaseAdminData.id,
            username: supabaseAdminData.username,
            full_name: data.user.user_metadata?.full_name || supabaseAdminData.full_name,
            email: data.user.email || '',
            restaurant_id: supabaseAdminData.restaurant_id,
            role: supabaseAdminData.role,
            is_active: supabaseAdminData.is_active,
            last_login_at: supabaseAdminData.last_login_at
          };

          setCurrentAdmin(adminUser);
          setIsAuthenticated(true);
          setUsername('');
          setPassword('');
        } else {
          setLoginError('Your account is not authorized for admin access.');
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleLogout = async () => {
    // Sign out from Supabase (Google OAuth)
    await supabase.auth.signOut();
    
    // Clear any legacy auth tokens
    localStorage.removeItem('admin_token');
    
    // Reset state
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    setUsername('');
    setPassword('');
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get restaurant ID for current admin
      const restaurantId = currentAdmin?.restaurant_id;
      
      // Load customer overview
      const { data: overviewData } = await supabase
        .from('customer_overview')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .single();
      
      setOverview(overviewData);
      
      // Load today's metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Today's visitors
      const { data: todayVisitors } = await supabase
        .from('site_visitors')
        .select('*')
        .gte('created_at', today.toISOString())
        .eq('restaurant_id', restaurantId);
        
      // Today's orders  
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('*, cart')
        .gte('created_at', today.toISOString())
        .eq('restaurant_id', restaurantId);
        
      // Calculate today's metrics
      const todayRevenue = todayOrders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const avgOrderValue = todayOrders?.length ? todayRevenue / todayOrders.length : 0;
      
      // Get most ordered items from cart data
      const itemCounts: { [key: string]: number } = {};
      todayOrders?.forEach(order => {
        if (order.cart && Array.isArray(order.cart)) {
          order.cart.forEach((item: any) => {
            const itemName = item.product?.name || item.name || 'Unknown';
            itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
          });
        }
      });
      
      const topItem = Object.entries(itemCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
      
      // Peak hours calculation
      const hourCounts = todayOrders?.reduce((acc: any, order) => {
        const hour = new Date(order.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});
      
      const peakOrderHour = Object.entries(hourCounts || {}).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 0;
      
      setTodayMetrics({
        today_visitors: todayVisitors?.length || 0,
        today_orders: todayOrders?.length || 0,
        today_revenue: todayRevenue,
        average_order_value: avgOrderValue,
        top_selling_item: topItem,
        most_carted_item: topItem, // Simplified for now
        peak_website_hour: 12, // Would need visitor tracking by hour
        peak_order_hour: parseInt(peakOrderHour.toString())
      });

      // Load recent orders with full data
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      setRecentOrders(ordersData || []);

      // Load popular items (top 10)
      const { data: itemsData } = await supabase
        .from('popular_items_analysis')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('popularity_rank', { ascending: true })
        .limit(10);
      
      setPopularItems(itemsData || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <Lock className="h-8 w-8 text-blue-600" />
              Bluefin Analytics
            </CardTitle>
            <p className="text-gray-600 mt-2">Access restaurant analytics dashboard</p>
          </CardHeader>
          <CardContent>
            {/* Google OAuth Temporarily Disabled - OAuth secret not configured */}
            {/* <div className="space-y-4 mb-6">
              <Button disabled className="w-full h-12 text-base font-semibold bg-gray-100 text-gray-400 border border-gray-300 flex items-center justify-center gap-3">
                Google Sign-In (Configuration Required)
              </Button>
            </div> */}

            {/* Username/Password Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="username"
                    type="email"
                    placeholder="Enter your email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-10 text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 text-base"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 text-base font-semibold bg-gray-600 hover:bg-gray-700" 
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            {/* Error Message */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <div className="text-red-800 text-sm font-medium">{loginError}</div>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 mt-6">
              <p>Only authorized admin accounts can access this dashboard.</p>
              <p className="mt-1">Use your email and password to sign in.</p>
              <p className="mt-1 text-xs text-red-600">Note: Google Sign-In requires OAuth configuration in Supabase.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Welcome back, {currentAdmin?.name}</p>
            {currentAdmin?.role && (
              <Badge variant="secondary" className="mt-1">
                {currentAdmin.role.charAt(0).toUpperCase() + currentAdmin.role.slice(1)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            {currentAdmin?.picture && (
              <img 
                src={currentAdmin.picture} 
                alt={currentAdmin.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Today's Metrics - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{todayMetrics?.today_visitors || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently browsing
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{todayMetrics?.today_orders || 0}</div>
              <p className="text-xs text-muted-foreground">
                ${todayMetrics?.today_revenue.toFixed(2) || '0.00'} revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${todayMetrics?.average_order_value.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Today's average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Selling Item</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{todayMetrics?.top_selling_item || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                Most ordered today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Popular in Cart</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{todayMetrics?.most_carted_item || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                Added to cart most
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Website Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMetrics?.peak_website_hour || 0}:00</div>
              <p className="text-xs text-muted-foreground">
                Most traffic
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Order Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayMetrics?.peak_order_hour || 0}:00</div>
              <p className="text-xs text-muted-foreground">
                Most orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Recommendations</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1">
                <p>• Promote mobile ordering</p>
                <p>• Add delivery deals</p>
                <p>• Create combo bundles</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders and Popular Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentOrders.slice(0, 10).map((order) => {
                  // Format name as first name + last initial
                  const formatName = (fullName: string | null) => {
                    if (!fullName) return 'Anonymous';
                    const parts = fullName.trim().split(' ');
                    if (parts.length === 1) return parts[0];
                    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
                  };
                  
                  // Calculate subtotal from cart items
                  let subtotal = 0;
                  let items: any[] = [];
                  if (order.cart && Array.isArray(order.cart)) {
                    items = order.cart;
                    subtotal = order.cart.reduce((sum: number, item: any) => {
                      const price = item.total_price || (item.product?.base_price || 0) * (item.quantity || 1);
                      return sum + price;
                    }, 0);
                  }
                  
                  return (
                    <div 
                      key={order.id} 
                      className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">Order:</span>
                            <span className="font-medium">{formatName(order.customer_name)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.delivery_type} • {items.length} items
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">${subtotal.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Subtotal</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Popular Items */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularItems.slice(0, 8).map((item) => (
                  <div key={item.item_name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.item_name}</div>
                      <div className="text-sm text-gray-600">
                        {item.times_ordered} orders • {item.total_quantity} total qty
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${parseFloat(item.total_revenue.toString()).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">#{item.popularity_rank}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Order Details</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name || 'Anonymous'}</p>
                  <p className="text-sm">{selectedOrder.customer_phone}</p>
                  <p className="text-sm">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Info</p>
                  <p className="font-medium">#{selectedOrder.id.slice(0, 8)}</p>
                  <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  <p className="text-sm">{selectedOrder.delivery_type}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Items Ordered</h4>
                <div className="space-y-2">
                  {(selectedOrder.cart && Array.isArray(selectedOrder.cart) ? selectedOrder.cart : []).map((item: any, index: number) => {
                    const itemPrice = item.total_price || (item.product?.base_price || 0) * (item.quantity || 1);
                    return (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <div>
                          <p className="font-medium">{item.product?.name || item.name || 'Unknown Item'}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity || 1}</p>
                          {item.customizations?.modifiers && (
                            <p className="text-xs text-gray-500">
                              {item.customizations.modifiers.map((m: any) => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="font-medium">
                          ${itemPrice.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Subtotal</span>
                    <span>
                      ${
                        (selectedOrder.cart && Array.isArray(selectedOrder.cart) ? selectedOrder.cart : [])
                          .reduce((sum: number, item: any) => {
                            const price = item.total_price || (item.product?.base_price || 0) * (item.quantity || 1);
                            return sum + price;
                          }, 0).toFixed(2)
                      }
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">*Tax and fees not shown</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;