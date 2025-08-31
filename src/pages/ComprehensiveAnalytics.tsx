import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Clock,
  Globe,
  Smartphone,
  Search,
  Filter,
  Download,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesRecord {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_type: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  items_count: number;
  visitor_ip_address: string;
  visitor_referrer: string;
  visitor_utm_source: string;
  country: string;
  city: string;
  device_type: string;
  browser: string;
  session_duration: number;
  page_views: number;
  order_items: any[];
}

interface ActiveVisitor {
  id: string;
  session_id: string;
  ip_address: string;
  referrer_url: string;
  landing_page: string;
  utm_source: string;
  country: string;
  city: string;
  device_type: string;
  browser: string;
  first_visit: string;
  last_activity: string;
  page_views: number;
  session_duration: number;
  has_cart: boolean;
  has_order: boolean;
  total_time_seconds: number;
  seconds_since_last_activity: number;
}

interface AbandonedCart {
  id: string;
  session_id: string;
  total_value: number;
  total_items: number;
  created_at: string;
  last_activity: string;
  ip_address: string;
  referrer: string;
  status: string;
  abandonment_reason: string;
  time_spent_minutes: number;
}

const ComprehensiveAnalytics = () => {
  const [salesHistory, setSalesHistory] = useState<SalesRecord[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<ActiveVisitor[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadAnalyticsData();
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive sales history
      const { data: salesData } = await supabase
        .from('comprehensive_sales_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Load active visitors (real-time)
      const { data: visitorsData } = await supabase
        .from('active_visitors')
        .select('*')
        .order('last_activity', { ascending: false });

      // Load abandoned carts from existing table
      const { data: cartsData } = await supabase
        .from('cart_sessions')
        .select('*')
        .eq('status', 'abandoned')
        .order('last_activity', { ascending: false })
        .limit(200);

      setSalesHistory(salesData || []);
      setActiveVisitors(visitorsData || []);
      setAbandonedCarts(cartsData || []);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = salesHistory.filter(sale => {
    const matchesSearch = !searchTerm || 
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_phone?.includes(searchTerm) ||
      sale.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.visitor_ip_address?.includes(searchTerm);
    
    const matchesDate = !dateFilter || 
      new Date(sale.created_at).toDateString() === new Date(dateFilter).toDateString();
    
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    
    return matchesSearch && matchesDate && matchesStatus;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const exportData = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && salesHistory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg font-semibold">Loading comprehensive analytics...</div>
      </div>
    );
  }

  const totalRevenue = salesHistory.reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);
  const totalOrders = salesHistory.length;
  const activeVisitorCount = activeVisitors.length;
  const abandonedCartCount = abandonedCarts.length;
  const conversionRate = totalOrders > 0 ? ((totalOrders / (totalOrders + abandonedCartCount)) * 100).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comprehensive Analytics</h1>
            <p className="text-gray-600">Complete visitor tracking, sales history, and cart analytics</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => exportData(filteredSales, 'sales-history')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Sales
            </Button>
            <Button onClick={() => exportData(activeVisitors, 'active-visitors')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Visitors
            </Button>
          </div>
        </div>

        {/* Real-time Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-green-600" />
                Live Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeVisitorCount}</div>
              <p className="text-xs text-gray-600">Currently browsing</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-gray-600">All time</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-gray-600">All time</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                Abandoned Carts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{abandonedCartCount}</div>
              <p className="text-xs text-gray-600">Total abandoned</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
              <p className="text-xs text-gray-600">Order conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Sales History</TabsTrigger>
            <TabsTrigger value="visitors">Live Visitors</TabsTrigger>
            <TabsTrigger value="abandoned">Abandoned Carts</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Sales History Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <CardTitle className="text-xl font-bold">Complete Sales History</CardTitle>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search orders, customers, IPs..."
                        className="pl-10 min-w-[250px] border-2"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Input
                      type="date"
                      className="border-2"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    <select
                      className="px-3 py-2 border-2 border-gray-200 rounded-md"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="new">New</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 font-bold">Order Details</th>
                        <th className="text-left p-3 font-bold">Customer</th>
                        <th className="text-left p-3 font-bold">Visitor Data</th>
                        <th className="text-left p-3 font-bold">Source</th>
                        <th className="text-left p-3 font-bold">Amount</th>
                        <th className="text-left p-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.order_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium text-sm">#{sale.order_id.slice(0, 8)}</div>
                            <div className="text-xs text-gray-600">{new Date(sale.created_at).toLocaleString()}</div>
                            <div className="text-xs text-gray-600">{sale.items_count} items</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-sm">{sale.customer_name || 'Anonymous'}</div>
                            <div className="text-xs text-gray-600">{sale.customer_email}</div>
                            <div className="text-xs text-gray-600">{sale.customer_phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div><strong>IP:</strong> {sale.visitor_ip_address}</div>
                              <div><strong>Location:</strong> {sale.city}, {sale.country}</div>
                              <div><strong>Device:</strong> {sale.device_type}</div>
                              <div><strong>Browser:</strong> {sale.browser}</div>
                              <div><strong>Session:</strong> {formatTime(sale.session_duration || 0)}</div>
                              <div><strong>Pages:</strong> {sale.page_views || 0}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              {sale.visitor_utm_source && (
                                <Badge variant="secondary" className="text-xs mb-1">
                                  {sale.visitor_utm_source}
                                </Badge>
                              )}
                              {sale.visitor_referrer && (
                                <div className="text-gray-600 truncate max-w-[150px]">
                                  {sale.visitor_referrer}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-lg">{formatCurrency(parseFloat(sale.total.toString()))}</div>
                            <div className="text-xs text-gray-600">{sale.delivery_type}</div>
                          </td>
                          <td className="p-3">
                            <Badge 
                              variant={sale.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {sale.status}
                            </Badge>
                            <div className="text-xs text-gray-600 mt-1">{sale.payment_status}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredSales.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No sales data found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Visitors Tab */}
          <TabsContent value="visitors" className="space-y-6">
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Live Website Visitors ({activeVisitorCount})
                </CardTitle>
                <p className="text-sm text-gray-600">Real-time visitor tracking and session data</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 font-bold">Visitor Info</th>
                        <th className="text-left p-3 font-bold">Location & Device</th>
                        <th className="text-left p-3 font-bold">Session Activity</th>
                        <th className="text-left p-3 font-bold">Source</th>
                        <th className="text-left p-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVisitors.map((visitor) => (
                        <tr key={visitor.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium text-sm">{visitor.ip_address}</div>
                            <div className="text-xs text-gray-600">Session: {visitor.session_id.slice(0, 12)}...</div>
                            <div className="text-xs text-gray-600">
                              Last seen: {Math.floor(visitor.seconds_since_last_activity / 60)}m {visitor.seconds_since_last_activity % 60}s ago
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div><strong>Location:</strong> {visitor.city}, {visitor.country}</div>
                              <div><strong>Device:</strong> {visitor.device_type}</div>
                              <div><strong>Browser:</strong> {visitor.browser}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div><strong>Duration:</strong> {formatTime(visitor.total_time_seconds)}</div>
                              <div><strong>Page Views:</strong> {visitor.page_views}</div>
                              <div><strong>Landing:</strong> {visitor.landing_page || 'Unknown'}</div>
                              <div><strong>Started:</strong> {new Date(visitor.first_visit).toLocaleTimeString()}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              {visitor.utm_source && (
                                <Badge variant="secondary" className="text-xs mb-1">
                                  {visitor.utm_source}
                                </Badge>
                              )}
                              {visitor.referrer_url && (
                                <div className="text-gray-600 truncate max-w-[150px]">
                                  {visitor.referrer_url}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {visitor.has_cart && (
                                <Badge variant="default" className="text-xs bg-blue-600">
                                  Has Cart
                                </Badge>
                              )}
                              {visitor.has_order && (
                                <Badge variant="default" className="text-xs bg-green-600">
                                  Ordered
                                </Badge>
                              )}
                              {!visitor.has_cart && !visitor.has_order && (
                                <Badge variant="secondary" className="text-xs">
                                  Browsing
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {activeVisitors.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No active visitors right now
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Abandoned Carts Tab */}
          <TabsContent value="abandoned" className="space-y-6">
            <Card className="border-2 border-red-200">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Abandoned Carts ({abandonedCartCount})
                </CardTitle>
                <p className="text-sm text-gray-600">Potential customers who left without purchasing</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 font-bold">Cart Details</th>
                        <th className="text-left p-3 font-bold">Customer Data</th>
                        <th className="text-left p-3 font-bold">Timing</th>
                        <th className="text-left p-3 font-bold">Source</th>
                        <th className="text-left p-3 font-bold">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abandonedCarts.map((cart) => (
                        <tr key={cart.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium text-sm">{cart.total_items} items</div>
                            <div className="text-xs text-gray-600">Session: {cart.session_id.slice(0, 12)}...</div>
                            <div className="text-xs text-gray-600">Stage: {cart.abandonment_reason || 'cart_created'}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div><strong>IP:</strong> {cart.ip_address}</div>
                              <div><strong>User Agent:</strong> {(cart as any).user_agent?.slice(0, 30)}...</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div><strong>Created:</strong> {new Date(cart.created_at).toLocaleString()}</div>
                              <div><strong>Last Activity:</strong> {new Date(cart.last_activity).toLocaleString()}</div>
                              <div><strong>Time spent:</strong> {cart.time_spent_minutes}m</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs">
                              {cart.referrer && (
                                <div className="text-gray-600 truncate max-w-[150px]">
                                  {cart.referrer}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-lg text-red-600">
                              {formatCurrency(parseFloat(cart.total_value?.toString() || '0'))}
                            </div>
                            <div className="text-xs text-gray-600">Lost revenue</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {abandonedCarts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No abandoned carts found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Analysis coming soon with more data...</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>Peak Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">Time-based analytics coming soon...</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveAnalytics;