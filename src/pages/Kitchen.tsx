import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Clock, CheckCircle, Utensils, Package, Truck } from 'lucide-react';
import { OrderStatusBoard } from '@/components/kitchen/OrderStatusBoard';
import { ServiceToggleControls } from '@/components/kitchen/ServiceToggleControls';
import { ConnectionStatus } from '@/components/kitchen/ConnectionStatus';
import { KitchenDashboard } from '@/components/kitchen/KitchenDashboard';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from 'next-themes';

export interface Order {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_type: string | null;
  delivery_address: string | null;
  cart: any;
  status: string | null;
  created_at: string;
  total: number;
  restaurant_id: string;
}

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { setTheme } = useTheme();

  // Force light theme for kitchen
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Audio alert for new orders - MAXIMUM VOLUME with multiple strategies
  const playAlert = async () => {
    console.log('🔊 ATTEMPTING TO PLAY KITCHEN ALERT');
    
    try {
      // Strategy 1: Web Audio API with urgent beeps
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const playBeep = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'square'; // Harsher sound for kitchen
        
        // MAXIMUM VOLUME
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Play URGENT kitchen alert sequence
      const now = audioContext.currentTime;
      playBeep(1200, now, 0.4);        // Very high urgent beep
      playBeep(800, now + 0.5, 0.4);   // Lower warning beep
      playBeep(1500, now + 1.0, 0.6);  // Highest alert beep
      playBeep(1000, now + 1.7, 0.8);  // Sustained attention beep
      
      console.log('🔊 WEB AUDIO API ALERT PLAYED - MAX VOLUME');
    } catch (error) {
      console.error('Web Audio API failed:', error);
      
      try {
        // Strategy 2: HTML5 Audio as backup
        const audio = new Audio();
        audio.volume = 1.0; // Maximum volume
        
        // Generate a simple beep using data URI
        const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvGIeBD2O1/LLeSsFJHfJ8N2PQAoUXrPl86tWFAlGo+DyvGEeBD2O2fHIeSsFJHfH8N2QQAoUXrTp66hWFAlGn+DyvGIeBD2O1/LLeisFJHfH8N2PQAkUXrPl86tWFAlGnt/0vWIeBDyO2fHIeSsBJHfJ8N6PQQkUXbPl86tXFQpFnt/0vWMeBDyO2fHIeSgBJHfJ8N6QQQkUXbPl86tXFApFnt/0vWMfBDyN2fHJeSgBJHfH8N6QQQoUXbTlS6tXFQpFnt/0vWMfBDyN2fHJeSgBJHfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJHfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpFnt/0vGMfBDyN2fHJeSgBJnfH8N6QQQoUXbTm86tXFQpF';
        audio.src = beepSound;
        
        await audio.play();
        console.log('🔊 HTML5 AUDIO BACKUP PLAYED');
        
        // Play multiple times for urgency
        setTimeout(() => audio.play(), 300);
        setTimeout(() => audio.play(), 600);
        
      } catch (htmlAudioError) {
        console.error('HTML5 Audio also failed:', htmlAudioError);
        
        // Strategy 3: Vibration as last resort
        if (navigator.vibrate) {
          navigator.vibrate([500, 200, 500, 200, 1000]);
          console.log('🔊 VIBRATION ALERT TRIGGERED');
        }
        
        // Strategy 4: Visual alert
        document.body.style.backgroundColor = 'red';
        setTimeout(() => {
          document.body.style.backgroundColor = '';
        }, 200);
        
        console.log('🔊 VISUAL FLASH ALERT TRIGGERED');
      }
    }
  };

  // Real-time order updates with enhanced error handling and retry logic
  useEffect(() => {
    let channel: any = null;
    let mounted = true;
    
    // Clear any existing retry timeout
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }

    const fetchOrders = async () => {
      try {
        // Only fetch orders for Bluefin restaurant
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('restaurant_id', '3b29861a-5ade-4800-b269-d0a03c351eb6')
          .neq('status', 'completed')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (mounted) {
          setOrders(data || []);
          setConnectionError(null);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (mounted) {
          setConnectionError('Failed to load orders');
        }
      }
    };

    const setupRealtimeSubscription = () => {
      if (!mounted) return;
      
      try {
        channel = supabase
          .channel(`kitchen-orders-${Date.now()}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'orders'
            },
            (payload) => {
              if (!mounted) return;
              
              const newOrder = payload.new as Order;
              // Only add orders for Bluefin restaurant
              if (newOrder.restaurant_id === '3b29861a-5ade-4800-b269-d0a03c351eb6') {
                setOrders(prev => [newOrder, ...prev]);
                playAlert();
                
                toast({
                  title: "🔥 NEW ORDER RECEIVED!",
                  description: `Order from ${newOrder.customer_name}`,
                  duration: 5000,
                });
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders'
            },
            (payload) => {
              if (!mounted) return;
              
              const updatedOrder = payload.new as Order;
              // Only update orders for Bluefin restaurant
              if (updatedOrder.restaurant_id === '3b29861a-5ade-4800-b269-d0a03c351eb6') {
                setOrders(prev => 
                  prev.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                  )
                );
              }
            }
          )
          .subscribe((status) => {
            if (!mounted) return;
            
            console.log('Kitchen subscription status:', status);
            
            switch (status) {
              case 'SUBSCRIBED':
                setIsConnected(true);
                setConnectionError(null);
                setRetryCount(0);
                toast({
                  title: "📡 Connected",
                  description: "Real-time updates active",
                  duration: 2000,
                });
                break;
                
              case 'CHANNEL_ERROR':
              case 'TIMED_OUT':
              case 'CLOSED':
                setIsConnected(false);
                setConnectionError(`Connection ${status.toLowerCase()}`);
                
                // Implement exponential backoff for reconnection
                if (retryCount < 5) {
                  const delayMs = Math.min(1000 * Math.pow(2, retryCount), 30000);
                  console.log(`Retrying connection in ${delayMs}ms (attempt ${retryCount + 1})`);
                  
                  const timeout = setTimeout(() => {
                    if (mounted) {
                      setRetryCount(prev => prev + 1);
                      setupRealtimeSubscription();
                    }
                  }, delayMs);
                  
                  setRetryTimeout(timeout);
                } else {
                  toast({
                    title: "❌ Connection Failed",
                    description: "Max retries reached. Please refresh the page.",
                    variant: "destructive",
                    duration: 10000,
                  });
                }
                break;
                
              default:
                setIsConnected(false);
            }
          });
      } catch (error) {
        console.error('Error setting up subscription:', error);
        if (mounted) {
          setConnectionError('Failed to establish connection');
        }
      }
    };

    // Initialize
    fetchOrders().then(() => {
      if (mounted) {
        setupRealtimeSubscription();
      }
    });

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [toast, retryCount]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f8f9fa'}}>
      <div className="max-w-full">
        {/* Header - Compact for iPad */}
        <div className="flex justify-between items-center p-4 mb-0" style={{backgroundColor: 'white', borderBottom: '2px solid #ddd'}}>
          <div>
            <h1 className="text-3xl font-black mb-1" style={{color: '#212529'}}>KITCHEN COMMAND</h1>
            <p className="text-lg font-bold" style={{color: '#6c757d'}}>Live Order Management System</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <ConnectionStatus 
              isConnected={isConnected} 
              error={connectionError}
              retryCount={retryCount}
            />
            
            <div className="p-3 rounded-lg" style={{backgroundColor: '#dc3545', color: 'white'}}>
              <div className="text-center">
                <div className="text-2xl font-black">
                  {orders.filter(o => o.status !== 'completed').length}
                </div>
                <div className="text-sm font-bold">ACTIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Optimized for iPad Horizontal */}
        <Tabs defaultValue="orders" className="">
          <TabsList className="grid w-full grid-cols-3 h-14 text-lg font-black border-0 rounded-none" style={{backgroundColor: '#212529', margin: '0', padding: '0'}}>
            <TabsTrigger value="orders" className="flex items-center gap-2 h-12 text-base rounded-none" style={{color: 'white', borderRight: '1px solid #444'}}>
              <Utensils className="h-6 w-6" />
              ORDERS
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2 h-12 text-base rounded-none" style={{color: 'white', borderRight: '1px solid #444'}}>
              <AlertTriangle className="h-6 w-6" />
              SERVICE CONTROLS
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2 h-12 text-base rounded-none" style={{color: 'white'}}>
              <CheckCircle className="h-6 w-6" />
              DASHBOARD
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0 p-4">
            <OrderStatusBoard 
              orders={orders} 
              onUpdateStatus={updateOrderStatus}
            />
          </TabsContent>

          <TabsContent value="controls" className="mt-0 p-4">
            <ServiceToggleControls />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0 p-4">
            <KitchenDashboard orders={orders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Kitchen;