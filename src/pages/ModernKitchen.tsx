import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  cart: any[];
  total: number;
  status: string;
  delivery_type: string;
  created_at: string;
  kitchen_notes?: string;
  special_instructions?: string;
}

const ModernKitchen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [showOrderFlash, setShowOrderFlash] = useState(false);
  const [flashCustomer, setFlashCustomer] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedDurationModal, setSelectedDurationModal] = useState<number | null>(null);
  const [orderHistoryFilter, setOrderHistoryFilter] = useState('today');
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [topMenuItems, setTopMenuItems] = useState<Array<{name: string; count: number}>>([]);
  
  // Settings modal state
  const [settingsStep, setSettingsStep] = useState(1); // 1: duration, 2: details, 3: confirmation
  const [staffName, setStaffName] = useState('');
  const [disableReason, setDisableReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Audio refs for alerts
  const newOrderAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutAudioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<any>(null);

  // Audio generation functions
  const createNewOrderSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = 2;
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      const data = buffer.getChannelData(0);

      // Create a bell-like sound with multiple frequencies
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-t * 3);
        const bell1 = Math.sin(2 * Math.PI * 800 * t) * decay;
        const bell2 = Math.sin(2 * Math.PI * 1200 * t) * decay * 0.5;
        const bell3 = Math.sin(2 * Math.PI * 1600 * t) * decay * 0.25;
        data[i] = (bell1 + bell2 + bell3) * 0.3;
      }

      return {
        play: async () => {
          try {
            const source1 = audioContext.createBufferSource();
            source1.buffer = buffer;
            source1.connect(audioContext.destination);
            source1.start();
            
            // Play 3 times for emphasis
            setTimeout(() => {
              const source2 = audioContext.createBufferSource();
              source2.buffer = buffer;
              source2.connect(audioContext.destination);
              source2.start();
            }, 300);
            
            setTimeout(() => {
              const source3 = audioContext.createBufferSource();
              source3.buffer = buffer;
              source3.connect(audioContext.destination);
              source3.start();
            }, 600);
          } catch (e) {
            console.error('Audio play failed:', e);
          }
        },
        volume: 1.0
      };
    } catch {
      // Fallback for older browsers
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgiBT2c4/DJdhcFNY/R8tKWQQsVYrjq66xWFAg+ltryxnkpBSl+zfDadioELojJ8dqcZBAOUarn7rVtGgg+mtPyxnElBCt+zfLae';
      audio.volume = 1.0;
      return audio;
    }
  };

  const createAlarmSound = () => {
    const audio = new Audio();
    // Create a more persistent alarm tone
    audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAAA==';
    audio.volume = 1.0;
    audio.loop = true;
    return audio;
  };

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', '3b29861a-5ade-4800-b269-d0a03c351eb6')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadOrderHistory = async () => {
    try {
      let dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);
      
      if (orderHistoryFilter === 'yesterday') {
        dateFilter.setDate(dateFilter.getDate() - 1);
      } else if (orderHistoryFilter === 'last_week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (orderHistoryFilter === 'last_2_weeks') {
        dateFilter.setDate(dateFilter.getDate() - 14);
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', '3b29861a-5ade-4800-b269-d0a03c351eb6')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrderHistory(data || []);
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const loadTopMenuItems = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('orders')
        .select('cart')
        .eq('restaurant_id', '3b29861a-5ade-4800-b269-d0a03c351eb6')
        .gte('created_at', todayStart.toISOString());

      if (error) throw error;
      
      // Count menu items
      const itemCounts: { [key: string]: number } = {};
      
      data.forEach(order => {
        if (order.cart && Array.isArray(order.cart)) {
          order.cart.forEach(item => {
            const itemName = item.product?.name || item.name || 'Unknown Item';
            itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
          });
        }
      });
      
      // Convert to sorted array
      const topItems = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTopMenuItems(topItems);
    } catch (error) {
      console.error('Error loading top menu items:', error);
    }
  };

  const disableOrdering = async () => {
    try {
      if (!selectedDurationModal || !staffName || !disableReason || !approvedBy) {
        alert('Please fill in all required fields');
        return;
      }

      const disableUntil = new Date();
      disableUntil.setMinutes(disableUntil.getMinutes() + selectedDurationModal);

      // Update restaurant settings to disable ordering
      const { error } = await supabase
        .from('restaurant_settings')
        .upsert({
          restaurant_id: '3b29861a-5ade-4800-b269-d0a03c351eb6',
          ordering_disabled: true,
          disable_until: disableUntil.toISOString(),
          disabled_by: staffName,
          disable_reason: disableReason,
          approved_by: approvedBy,
          disabled_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database error:', error);
        // Fallback: try inserting instead of upserting
        const { error: insertError } = await supabase
          .from('restaurant_settings')
          .insert({
            restaurant_id: '3b29861a-5ade-4800-b269-d0a03c351eb6',
            ordering_disabled: true,
            disable_until: disableUntil.toISOString(),
            disabled_by: staffName,
            disable_reason: disableReason,
            approved_by: approvedBy,
            disabled_at: new Date().toISOString()
          });
        
        if (insertError) {
          throw insertError;
        }
      }

      // Reset form and close modal
      setShowSettingsModal(false);
      setSettingsStep(1);
      setStaffName('');
      setDisableReason('');
      setApprovedBy('');
      setSelectedDurationModal(null);
      setShowConfirmation(false);
      
      alert(`Ordering disabled for ${selectedDurationModal} minutes until ${disableUntil.toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}`);
      
    } catch (error) {
      console.error('Error disabling ordering:', error);
      alert('Failed to disable ordering. Please try again.');
    }
  };

  const handleDurationSelect = (minutes: number) => {
    setSelectedDurationModal(minutes);
    setSettingsStep(2);
  };

  const handleDetailsSubmit = () => {
    if (!staffName || !disableReason || !approvedBy) {
      alert('Please fill in all fields');
      return;
    }
    setSettingsStep(3);
  };

  const resetSettingsModal = () => {
    setShowSettingsModal(false);
    setSettingsStep(1);
    setStaffName('');
    setDisableReason('');
    setApprovedBy('');
    setSelectedDurationModal(null);
    setShowConfirmation(false);
  };

  const setupRealtimeSubscription = () => {
    channelRef.current = supabase
      .channel('kitchen-orders-modern')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: 'restaurant_id=eq.3b29861a-5ade-4800-b269-d0a03c351eb6'
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders(prev => [newOrder, ...prev]);
          
          // Trigger new order alert
          showNewOrderAlert(newOrder.customer_name);
          playNewOrderSound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'restaurant_id=eq.3b29861a-5ade-4800-b269-d0a03c351eb6'
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders(prev => prev.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
          ));
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status);
        console.log('Real-time subscription status:', status);
      });
  };

  const showNewOrderAlert = (customerName: string) => {
    setFlashCustomer(customerName);
    setShowOrderFlash(true);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      setShowOrderFlash(false);
    }, 10000);
  };

  const playNewOrderSound = () => {
    if (newOrderAudioRef.current) {
      newOrderAudioRef.current.volume = 1.0;
      if (typeof newOrderAudioRef.current.play === 'function') {
        newOrderAudioRef.current.play().catch(console.error);
      } else {
        // For generated audio objects
        newOrderAudioRef.current.play?.();
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      console.log(`Updated order ${orderId} to status: ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const hideOrderFlash = () => {
    setShowOrderFlash(false);
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const formatOrderTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York'
    });
  };

  const getOrderAge = (timestamp: string) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const minutesElapsed = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    return minutesElapsed;
  };

  const formatCartItems = (cart: any[]) => {
    if (!cart || cart.length === 0) return 'No items';
    
    return cart.slice(0, 3).map(item => 
      `${item.quantity}x ${item.product?.name || item.name || 'Item'}`
    ).join(', ') + (cart.length > 3 ? ` +${cart.length - 3} more` : '');
  };

  useEffect(() => {
    // Initialize audio with generated sounds
    newOrderAudioRef.current = createNewOrderSound() as any;
    timeoutAudioRef.current = createAlarmSound() as any;
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Load initial orders
    loadOrders();
    
    // Load order history
    loadOrderHistory();
    
    // Load top menu items
    loadTopMenuItems();
    
    // Setup real-time subscription
    setupRealtimeSubscription();

    return () => {
      clearInterval(timeInterval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    loadOrderHistory();
  }, [orderHistoryFilter]);

  const newOrders = getOrdersByStatus('NEW');
  const preparingOrders = getOrdersByStatus('PREPARING');
  const readyOrders = getOrdersByStatus('READY');

  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '12px',
      color: '#333',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        padding: '12px 20px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        marginBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            fontSize: '22px',
            color: '#2c3e50',
            fontWeight: '800'
          }}>
            BlueFin Sushi Kitchen
          </div>
          <div style={{
            background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '14px'
          }}>
            {currentTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              timeZone: 'America/New_York'
            })}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '25px',
              fontWeight: '700',
              fontSize: '14px',
              background: 'linear-gradient(45deg, #6c5ce7, #a29bfe)',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>⚙️</span>
            <span>SETTINGS</span>
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '25px',
            fontWeight: '700',
            fontSize: '14px',
            background: connectionStatus === 'SUBSCRIBED' 
              ? 'linear-gradient(45deg, #00b894, #00cec9)' 
              : 'linear-gradient(45deg, #e17055, #d63031)',
            color: 'white'
          }}>
            <span>{connectionStatus === 'SUBSCRIBED' ? '🟢' : '🔴'}</span>
            <span>{connectionStatus === 'SUBSCRIBED' ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* New Order Flash Alert */}
      {showOrderFlash && (
        <div style={{
          background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
          color: 'white',
          padding: '20px',
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: '800',
          animation: 'flashPulse 1s infinite',
          marginBottom: '12px',
          borderRadius: '20px',
          position: 'relative',
          cursor: 'pointer'
        }} onClick={hideOrderFlash}>
          🚨 NEW ORDER FROM {flashCustomer.toUpperCase()}! 🚨
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'rgba(255,255,255,0.3)',
            padding: '5px 10px',
            borderRadius: '10px',
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            ✕ DISMISS
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '12px',
        height: 'calc(100vh - 120px)'
      }}>
        {/* Workflow Container */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          height: '100%'
        }}>
          {/* New Orders Column */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '15px 20px',
              fontSize: '16px',
              fontWeight: '800',
              color: 'white',
              textAlign: 'center',
              background: 'linear-gradient(45deg, #fd79a8, #e84393)',
              position: 'relative'
            }}>
              🔔 NEW ORDERS
              <span style={{
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '700',
                marginLeft: '10px'
              }}>
                {newOrders.length}
              </span>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px'
            }}>
              {newOrders.map(order => (
                <div key={order.id} style={{
                  background: 'linear-gradient(135deg, #fff 0%, #ffe8f4 100%)',
                  borderRadius: '20px',
                  padding: '15px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderLeft: '5px solid #fd79a8',
                  boxShadow: '0 4px 15px rgba(253, 121, 168, 0.2)',
                  position: 'relative'
                }}>
                  {getOrderAge(order.created_at) > 20 && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#ff6b6b',
                      animation: 'pulse 1s infinite'
                    }} />
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: '#2c3e50'
                    }}>
                      {order.customer_name}
                    </div>
                    <div style={{
                      background: '#f8f9fa',
                      color: '#6c757d',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatOrderTime(order.created_at)}
                    </div>
                  </div>
                  
                  <div style={{
                    color: '#74b9ff',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    📞 {order.customer_phone}
                  </div>
                  
                  <div style={{
                    color: '#636e72',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    marginBottom: '10px'
                  }}>
                    {formatCartItems(order.cart)}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#00b894'
                    }}>
                      ${order.total}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      style={{
                        flex: 1,
                        border: 'none',
                        padding: '10px',
                        borderRadius: '15px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: 'linear-gradient(45deg, #00b894, #00cec9)',
                        color: 'white'
                      }}
                    >
                      ✅ ACKNOWLEDGE
                    </button>
                  </div>
                </div>
              ))}
              {newOrders.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '40px 20px',
                  fontStyle: 'italic'
                }}>
                  No new orders
                </div>
              )}
            </div>
          </div>

          {/* Preparing Column */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '15px 20px',
              fontSize: '16px',
              fontWeight: '800',
              color: 'white',
              textAlign: 'center',
              background: 'linear-gradient(45deg, #fdcb6e, #e17055)'
            }}>
              🍳 PREPARING
              <span style={{
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '700',
                marginLeft: '10px'
              }}>
                {preparingOrders.length}
              </span>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px'
            }}>
              {preparingOrders.map(order => (
                <div key={order.id} style={{
                  background: 'linear-gradient(135deg, #fff 0%, #fff8e1 100%)',
                  borderRadius: '20px',
                  padding: '15px',
                  marginBottom: '10px',
                  borderLeft: '5px solid #fdcb6e',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '800',
                      color: '#2c3e50'
                    }}>
                      {order.customer_name}
                    </div>
                    <div style={{
                      background: '#f8f9fa',
                      color: '#6c757d',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {formatOrderTime(order.created_at)}
                    </div>
                  </div>
                  
                  <div style={{
                    color: '#74b9ff',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    📞 {order.customer_phone}
                  </div>
                  
                  <div style={{
                    color: '#636e72',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    marginBottom: '10px'
                  }}>
                    {formatCartItems(order.cart)}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#00b894'
                    }}>
                      ${order.total}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      style={{
                        flex: 1,
                        border: 'none',
                        padding: '10px',
                        borderRadius: '15px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        background: 'linear-gradient(45deg, #fdcb6e, #e17055)',
                        color: 'white'
                      }}
                    >
                      🎯 MARK READY
                    </button>
                  </div>
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '40px 20px',
                  fontStyle: 'italic'
                }}>
                  No orders being prepared
                </div>
              )}
            </div>
          </div>

          {/* Ready Column */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '15px 20px',
              fontSize: '16px',
              fontWeight: '800',
              color: 'white',
              textAlign: 'center',
              background: 'linear-gradient(45deg, #00b894, #00cec9)'
            }}>
              ✅ READY FOR PICKUP
              <span style={{
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: '700',
                marginLeft: '10px'
              }}>
                {readyOrders.length}
              </span>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px'
            }}>
              {readyOrders.map(order => (
                <div key={order.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '20px',
                  marginBottom: '8px',
                  borderLeft: '4px solid #00b894',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#2c3e50',
                      marginBottom: '4px'
                    }}>
                      {order.customer_name}
                    </div>
                    <div style={{
                      background: '#e8f8f5',
                      color: '#00b894',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-block',
                      marginBottom: '4px'
                    }}>
                      {formatOrderTime(order.created_at)}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#00b894'
                    }}>
                      ${order.total}
                    </div>
                  </div>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    style={{
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '15px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: 'linear-gradient(45deg, #74b9ff, #0984e3)',
                      color: 'white'
                    }}
                  >
                    📱 PICKUP
                  </button>
                </div>
              ))}
              {readyOrders.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '40px 20px',
                  fontStyle: 'italic'
                }}>
                  No orders ready
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Order History & Analytics */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100%'
        }}>
          {/* Top Menu Items */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '15px',
            maxHeight: '250px'
          }}>
            <h3>📊 Top Items Today</h3>
            <div style={{ fontSize: '13px', color: '#636e72' }}>
              {topMenuItems.map((item, index) => (
                <div key={item.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: index < topMenuItems.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <span>{item.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#00b894' }}>{item.count}</span>
                </div>
              ))}
              {topMenuItems.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
                  No orders today
                </div>
              )}
            </div>
          </div>
          
          {/* Order History */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '15px',
            flex: 1
          }}>
            <h3>📋 Order History</h3>
            
            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              {[{value: 'today', label: 'Today'}, {value: 'yesterday', label: 'Yesterday'}, {value: 'last_week', label: 'Week'}, {value: 'last_2_weeks', label: '2 Weeks'}].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setOrderHistoryFilter(filter.value)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: orderHistoryFilter === filter.value 
                      ? 'linear-gradient(45deg, #74b9ff, #0984e3)' 
                      : '#f8f9fa',
                    color: orderHistoryFilter === filter.value ? 'white' : '#6c757d'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <div style={{ overflowY: 'auto', height: '300px' }}>
              {orderHistory.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    borderLeft: '4px solid #74b9ff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#2c3e50' }}>
                      {order.customer_name}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#00b894' }}>
                      ${order.total}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    {formatOrderTime(order.created_at)} • {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Modal - Multi-Step Process */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            {/* Step 1: Duration Selection */}
            {settingsStep === 1 && (
              <>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#2c3e50',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ⚙️ Disable Online Orders
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#636e72',
                    marginBottom: '15px'
                  }}>
                    Step 1: Select Duration
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[30, 60, 120, 480].map(minutes => (
                      <button
                        key={minutes}
                        onClick={() => handleDurationSelect(minutes)}
                        style={{
                          padding: '15px',
                          border: selectedDurationModal === minutes ? '3px solid #e17055' : '2px solid #f0f0f0',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          background: selectedDurationModal === minutes ? '#fff5f5' : 'white',
                          color: selectedDurationModal === minutes ? '#e17055' : '#636e72',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {minutes < 60 ? `${minutes} minutes` : minutes === 60 ? '1 hour' : minutes === 120 ? '2 hours' : 'Rest of day'}
                        {minutes >= 480 && (
                          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                            Until end of business
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {selectedDurationModal && (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#636e72'
                    }}>
                      <strong>Ordering will be re-enabled at:</strong><br/>
                      {new Date(Date.now() + selectedDurationModal * 60000).toLocaleString('en-US', {
                        timeZone: 'America/New_York',
                        hour: 'numeric',
                        minute: '2-digit',
                        month: 'short',
                        day: 'numeric'
                      })} ET
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={resetSettingsModal}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: '#f8f9fa',
                      color: '#636e72'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedDurationModal && setSettingsStep(2)}
                    disabled={!selectedDurationModal}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: selectedDurationModal ? 'pointer' : 'not-allowed',
                      background: selectedDurationModal ? 'linear-gradient(45deg, #00b894, #00cec9)' : '#e0e0e0',
                      color: 'white',
                      opacity: selectedDurationModal ? 1 : 0.5
                    }}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Staff Details */}
            {settingsStep === 2 && (
              <>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#2c3e50',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  📝 Staff Information
                </h2>
                
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#636e72',
                    marginBottom: '15px'
                  }}>
                    Step 2: Provide Details
                  </h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>
                      Staff Name <span style={{ color: '#e17055' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Enter your name"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#00b894'}
                      onBlur={(e) => e.target.style.borderColor = '#f0f0f0'}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>
                      Reason for Disabling <span style={{ color: '#e17055' }}>*</span>
                    </label>
                    <select
                      value={disableReason}
                      onChange={(e) => setDisableReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'white'
                      }}
                    >
                      <option value="">Select a reason...</option>
                      <option value="Kitchen overwhelmed - too many orders">Kitchen overwhelmed - too many orders</option>
                      <option value="Staff shortage">Staff shortage</option>
                      <option value="Equipment malfunction">Equipment malfunction</option>
                      <option value="Ingredient shortage">Ingredient shortage</option>
                      <option value="Closing early">Closing early</option>
                      <option value="Emergency situation">Emergency situation</option>
                      <option value="Maintenance/cleaning">Maintenance/cleaning</option>
                      <option value="Private event">Private event</option>
                      <option value="Other operational issue">Other operational issue</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#2c3e50' }}>
                      Approved By <span style={{ color: '#e17055' }}>*</span>
                    </label>
                    <select
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #f0f0f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        background: 'white'
                      }}
                    >
                      <option value="">Select approval authority...</option>
                      <option value="Manager on Duty">Manager on Duty</option>
                      <option value="Assistant Manager">Assistant Manager</option>
                      <option value="General Manager">General Manager</option>
                      <option value="Owner">Owner</option>
                      <option value="Shift Supervisor">Shift Supervisor</option>
                      <option value="Head Chef">Head Chef</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setSettingsStep(1)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: '#f8f9fa',
                      color: '#636e72'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={resetSettingsModal}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: '#f8f9fa',
                      color: '#636e72'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDetailsSubmit}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: 'linear-gradient(45deg, #fdcb6e, #e17055)',
                      color: 'white'
                    }}
                  >
                    Review →
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Confirmation */}
            {settingsStep === 3 && (
              <>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#2c3e50',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  ⚠️ Confirm Disable Orders
                </h2>
                
                <div style={{ marginBottom: '25px' }}>
                  <div style={{
                    background: '#fff5f5',
                    border: '2px solid #ff6b6b',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#d63031',
                      marginBottom: '15px',
                      textAlign: 'center'
                    }}>
                      ⚠️ WARNING: This will stop all online orders!
                    </h3>
                    
                    <div style={{ fontSize: '14px', color: '#2c3e50', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Duration:</strong> {selectedDurationModal && selectedDurationModal < 60 ? `${selectedDurationModal} minutes` : selectedDurationModal === 60 ? '1 hour' : selectedDurationModal === 120 ? '2 hours' : 'Rest of day'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Until:</strong> {selectedDurationModal && new Date(Date.now() + selectedDurationModal * 60000).toLocaleString('en-US', {
                          timeZone: 'America/New_York',
                          hour: 'numeric',
                          minute: '2-digit',
                          month: 'short',
                          day: 'numeric'
                        })} ET
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Staff:</strong> {staffName}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Reason:</strong> {disableReason}
                      </div>
                      <div>
                        <strong>Approved By:</strong> {approvedBy}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#636e72',
                    textAlign: 'center'
                  }}>
                    Customers will see "Online ordering temporarily unavailable" message
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setSettingsStep(2)}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: '#f8f9fa',
                      color: '#636e72'
                    }}
                  >
                    ← Edit
                  </button>
                  <button
                    onClick={resetSettingsModal}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: '#f8f9fa',
                      color: '#636e72'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={disableOrdering}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: 'linear-gradient(45deg, #d63031, #e17055)',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(214, 48, 49, 0.3)'
                    }}
                  >
                    🚫 DISABLE ORDERING
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '25px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2>Order #{selectedOrder.id.slice(-4)}</h2>
              <button
                onClick={() => setShowOrderModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Customer:</strong> {selectedOrder.customer_name}<br/>
              <strong>Phone:</strong> {selectedOrder.customer_phone}<br/>
              <strong>Email:</strong> {selectedOrder.customer_email}<br/>
              <strong>Type:</strong> {selectedOrder.delivery_type}<br/>
              <strong>Status:</strong> {selectedOrder.status}<br/>
              <strong>Time:</strong> {formatOrderTime(selectedOrder.created_at)}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Items:</strong>
              <div style={{ marginTop: '8px' }}>
                {selectedOrder.cart?.map((item, index) => (
                  <div key={index} style={{
                    padding: '8px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '5px'
                  }}>
                    {item.quantity}x {item.product?.name || item.name} - ${item.total_price || item.price}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{
              fontSize: '18px',
              fontWeight: '800',
              color: '#00b894',
              textAlign: 'right'
            }}>
              Total: ${selectedOrder.total}
            </div>
          </div>
        </div>
      )}
      
      {/* Add CSS animations */}
      <style>
        {`
          @keyframes flashPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.02); opacity: 0.9; }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          [style*="animation: flashPulse"] {
            animation: flashPulse 1s infinite !important;
          }
          
          [style*="animation: pulse"] {
            animation: pulse 1s infinite !important;
          }
        `}
      </style>
    </div>
  );
};

export default ModernKitchen;