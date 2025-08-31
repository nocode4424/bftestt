import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCartSession } from '@/hooks/useCartSession';
import { OrderModal } from '@/components/menu/OrderModal';
import { MenuDisplay } from '@/components/menu/MenuDisplay';
import { CartSidebar } from '@/components/menu/CartSidebar';
import { ItemCustomizationModal } from '@/components/menu/ItemCustomizationModal';
import { CartTimeoutWarning } from '@/components/menu/CartTimeoutWarning';
import { StripeProvider } from '@/components/payment/StripeProvider';
import { CheckoutAuthModal } from '@/components/menu/CheckoutAuthModal';
import { SimplePaymentModal } from '@/components/menu/SimplePaymentModal';
import { CheckoutCookieService } from '@/utils/checkoutCookieService';
import { OrderConfirmation } from '@/components/menu/OrderConfirmation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { initializeAnalytics, trackInteraction, trackCart, trackOrderSuccess } from '@/services/analytics';
import { CookieService } from '@/utils/cookieService';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo_url: string;
  hours: any;
  tax_rate: number;
  processing_fee: number;
  tip_percentage_1: number;
  tip_percentage_2: number;
  tip_percentage_3: number;
  minimum_order_pickup: number;
  minimum_order_delivery: number;
  delivery_enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  available_times: any;
  available_days: any;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  thumbnail_url?: string;
  category_id: string;
  restaurant_id: string;
  available_menus: any;
  allow_comments: boolean;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  notes?: string;
  customizations?: Record<string, any>;
  total_price: number;
}

export type OrderType = 'pickup' | 'delivery';
export type OrderTime = 'now' | 'scheduled';

const Menu: React.FC = () => {
  console.log('Menu component is rendering!');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showOrderModal, setShowOrderModal] = useState(true);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCheckoutAuth, setShowCheckoutAuth] = useState(false);
  const [showSimplePayment, setShowSimplePayment] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [orderTime, setOrderTime] = useState<OrderTime>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    agreedToTerms: false
  });
  const [tempCustomerData, setTempCustomerData] = useState<{ name: string; phone: string; email: string; couponCode?: string; couponDiscount?: number }>({ name: '', phone: '', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { setTheme } = useTheme();
  
  // Cart session management with timeout warnings
  const {
    cart,
    isExpired,
    isWarningActive,
    remainingTime,
    initializeSession,
    updateCart,
    resetSession,
    extendSession,
    getRemainingMinutes,
    getRemainingSeconds,
    getFormattedTimeLeft
  } = useCartSession({
    timeoutMinutes: 30,
    warningMinutes: 2,
    onTimeout: () => {
      toast({
        title: "Cart Expired",
        description: "Your cart has been cleared due to inactivity",
        variant: "destructive"
      });
      setShowTimeoutWarning(false);
    },
    onWarning: (remainingMinutes) => {
      setShowTimeoutWarning(true);
      toast({
        title: "Cart Expiring Soon",
        description: `Your cart will expire in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`,
        variant: "destructive"
      });
    }
  });

  // Handle visitor tracking and welcome messages
  const handleVisitorTracking = useCallback(() => {
    const isFirstVisit = CookieService.isFirstVisit();
    const isNewCheckIn = CookieService.recordCheckIn();
    const visitStats = CookieService.getVisitStats();
    
    if (isFirstVisit) {
      // First time visitor
      toast({
        title: "🎉 Welcome to Bluefin Sushi!",
        description: "We're excited to have you here. Explore our fresh menu and enjoy your first order!",
        duration: 6000
      });
    } else if (isNewCheckIn) {
      // Daily check-in
      if (visitStats.visitCount <= 3) {
        toast({
          title: "👋 Welcome back!",
          description: `Great to see you again! This is your ${visitStats.visitCount}${visitStats.visitCount === 2 ? 'nd' : visitStats.visitCount === 3 ? 'rd' : 'th'} visit.`,
          duration: 4000
        });
      } else if (visitStats.visitCount <= 10) {
        toast({
          title: "🌟 Loyal Customer!",
          description: `You're becoming a regular! This is visit #${visitStats.visitCount}.`,
          duration: 4000
        });
      } else {
        toast({
          title: "🏆 VIP Customer!",
          description: `Welcome back, valued customer! This is visit #${visitStats.visitCount}.`,
          duration: 4000
        });
      }
    }
  }, [toast]);

  // Force dark theme for menu
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);
  
  // Handle cart expiry notifications
  useEffect(() => {
    if (isExpired && cart.length > 0) {
      // Session expired with items in cart - this should have been handled by the timeout callback
      toast({
        title: "Cart Expired",
        description: "Your cart has been automatically cleared due to inactivity",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [isExpired, cart.length, toast]);

  useEffect(() => {
    fetchRestaurantData();
    // Initialize cart session when component mounts
    initializeSession([]);
    // Initialize analytics tracking
    initializeAnalytics();
    
    // Handle visitor tracking and welcome messages
    handleVisitorTracking();
    
    // Load saved checkout preferences
    const savedData = CheckoutCookieService.getCheckoutData();
    if (savedData) {
      if (savedData.orderType) {
        setOrderType(savedData.orderType);
      }
      if (savedData.deliveryAddress) {
        setDeliveryAddress(savedData.deliveryAddress);
      }
      if (savedData.customerInfo) {
        setCustomerInfo(prev => ({
          ...prev,
          name: savedData.customerInfo!.name,
          phone: savedData.customerInfo!.phone,
          email: savedData.customerInfo!.email
        }));
      }
    }
    
    // Check for continue_checkout parameter after Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('continue_checkout') === 'true') {
      // User returned from Google OAuth, continue checkout if there's a cart
      setTimeout(() => {
        if (cart.length > 0) {
          setShowCartSidebar(true);
        }
      }, 1000);
      // Clean up the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [initializeSession, cart.length, handleVisitorTracking]);

  const fetchRestaurantData = async () => {
    console.log('fetchRestaurantData called');
    try {
      // Fetch restaurant data for BlueFin Sushi
      const menuDomain = import.meta.env.VITE_MENU_DOMAIN || 'menu.bluefinwc.com';
      console.log('menuDomain:', menuDomain);
      
      // For localhost development, use the actual restaurant domain
      let domain = menuDomain;
      if (menuDomain === 'localhost') {
        domain = 'bluefinwc.com'; // Use the actual restaurant domain for development
      } else {
        domain = menuDomain.replace('menu.', ''); // Extract base domain
      }
      console.log('Using domain for restaurant lookup:', domain);
      
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('domain', domain)
        .single();

      if (restaurantError) throw restaurantError;
      console.log('Restaurant data loaded:', restaurantData);
      setRestaurant(restaurantData as any);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_active', true)
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData as any);

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_active', true)
        .order('sort_order');

      if (productsError) throw productsError;
      console.log('Fetched products data:', productsData);
      console.log('Number of products fetched:', productsData?.length || 0);
      setProducts(productsData as any);

    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive"
      });
    }
  };

  const addToCart = (item: CartItem) => {
    // Check if cart is expired
    if (isExpired) {
      toast({
        title: "Cart Expired",
        description: "Your cart has expired. Starting a new session...",
        variant: "destructive"
      });
      resetSession();
      return;
    }
    
    const existingItemIndex = cart.findIndex(
      cartItem => cartItem.product.id === item.product.id && 
      JSON.stringify(cartItem.customizations) === JSON.stringify(item.customizations)
    );

    let updatedCart: CartItem[];
    if (existingItemIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += item.quantity;
      updatedCart[existingItemIndex].total_price += item.total_price;
    } else {
      updatedCart = [...cart, { ...item, id: `${item.product.id}-${Date.now()}` }];
    }
    
    // Update cart through session management
    updateCart(updatedCart);
    
    // Track cart analytics
    const cartTotal = updatedCart.reduce((total, cartItem) => total + cartItem.total_price, 0);
    trackCart(updatedCart, cartTotal, 'cart_updated');
    trackInteraction('cart_add', { 
      product_id: item.product.id, 
      product_name: item.product.name,
      quantity: item.quantity,
      total_price: item.total_price 
    });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Play better chime sound
    const playChimeSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant two-note chime
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playNote(523.25, now, 0.2); // C5
      playNote(659.25, now + 0.1, 0.3); // E5
    };

    playChimeSound();

    // Removed toast notification as requested - no bottom-right card notification
  };

  const removeFromCart = (itemId: string) => {
    const itemToRemove = cart.find(item => item.id === itemId);
    const updatedCart = cart.filter(item => item.id !== itemId);
    updateCart(updatedCart);
    
    // Track cart analytics
    const cartTotal = updatedCart.reduce((total, cartItem) => total + cartItem.total_price, 0);
    trackCart(updatedCart, cartTotal, 'item_removed');
    if (itemToRemove) {
      trackInteraction('cart_remove', { 
        product_id: itemToRemove.product.id, 
        product_name: itemToRemove.product.name 
      });
    }
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cart.map(item =>
      item.id === itemId
        ? { ...item, quantity, total_price: (item.total_price / item.quantity) * quantity }
        : item
    );
    
    updateCart(updatedCart);
  };

  const getCartTotal = () => {
    const total = cart.reduce((total, item) => total + (item.total_price || 0), 0);
    // Ensure cart total is never negative
    return Math.max(0, total);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleStartOrder = () => {
    // Save order preferences to cookies
    CheckoutCookieService.saveOrderType(orderType);
    if (deliveryAddress.trim()) {
      CheckoutCookieService.saveDeliveryAddress(deliveryAddress);
    }
    setShowOrderModal(false);
  };

  const handleItemClick = (product: Product) => {
    setSelectedItem(product);
    setShowItemModal(true);
  };

  const handleCheckout = (customerData: { name: string; phone: string; email: string; couponCode?: string; couponDiscount?: number }) => {
    console.log('handleCheckout called with:', customerData);
    console.log('restaurant:', restaurant);
    console.log('cart:', cart);
    
    setShowCartSidebar(false);
    setShowCheckoutAuth(true);
  };

  const handleAuthComplete = (customerData: { name: string; phone: string; email: string; userId?: string }) => {
    setShowCheckoutAuth(false);
    setTempCustomerData({
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email,
      couponCode: '',
      couponDiscount: 0,
    });
    setShowSimplePayment(true);
  };

  const handlePaymentComplete = () => {
    setShowSimplePayment(false);
    setShowConfirmation(true);
    resetSession();
  };

  // Removed - checkout handled in CartSidebar

  const handleOrderComplete = (orderId?: string) => {
    setShowCheckout(false);
    setShowConfirmation(true);
    
    // Track successful order conversion
    if (orderId) {
      trackOrderSuccess(orderId);
      trackInteraction('order_completed', { 
        order_id: orderId,
        cart_total: getCartTotal(),
        items_count: getCartItemCount()
      });
    }
    
    // Clear cart through session management
    resetSession();
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-foreground">Loading Bluefin Sushi...</p>
          <p className="text-sm text-muted-foreground mt-2">Connecting to database...</p>
          <p className="text-xs text-muted-foreground mt-1">Menu component is rendering!</p>
          <button 
            onClick={() => fetchRestaurantData()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Debug info */}
      <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded text-xs z-50">
        Menu loaded! Restaurant: {restaurant ? restaurant.name : 'null'}
      </div>
      
      {/* Order Type Selection Modal */}
      {showOrderModal && (
        <OrderModal
          restaurant={restaurant}
          onStartOrder={handleStartOrder}
          orderType={orderType}
          setOrderType={setOrderType}
          orderTime={orderTime}
          setOrderTime={setOrderTime}
          scheduledDateTime={scheduledDateTime}
          setScheduledDateTime={setScheduledDateTime}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
        />
      )}

      {/* Menu Display */}
      {!showOrderModal && !showCheckout && !showConfirmation && (
        <MenuDisplay
          restaurant={restaurant}
          categories={categories}
          products={products.filter(product => 
            searchQuery === '' || 
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )}
          onItemClick={handleItemClick}
          cartItemCount={getCartItemCount()}
          onCartClick={() => setShowCartSidebar(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={addToCart}
        />
      )}

      {/* Cart Sidebar */}
      {showCartSidebar && (
        <CartSidebar
          cart={cart}
          onClose={() => setShowCartSidebar(false)}
          onUpdateQuantity={updateCartItemQuantity}
          onRemoveItem={removeFromCart}
          onCheckout={handleCheckout}
          total={getCartTotal()}
          restaurantName={restaurant?.name}
          restaurantId={restaurant?.id}
        />
      )}


      {/* Item Customization Modal */}
      {showItemModal && selectedItem && (
        <ItemCustomizationModal
          product={selectedItem}
          onClose={() => setShowItemModal(false)}
          onAddToCart={addToCart}
        />
      )}

      {/* Checkout Authentication Modal */}
      {showCheckoutAuth && (
        <CheckoutAuthModal
          isOpen={showCheckoutAuth}
          onClose={() => setShowCheckoutAuth(false)}
          onContinue={handleAuthComplete}
          cart={cart}
          restaurant={restaurant}
          total={getCartTotal()}
        />
      )}

      {/* Simple Payment Modal */}
      {showSimplePayment && (
        <SimplePaymentModal
          isOpen={showSimplePayment}
          onClose={() => setShowSimplePayment(false)}
          onComplete={handlePaymentComplete}
          customerData={tempCustomerData}
          cart={cart}
          restaurant={restaurant}
          total={getCartTotal()}
        />
      )}


      {/* Order Confirmation */}
      {showConfirmation && (
        <OrderConfirmation
          restaurant={restaurant}
          orderType={orderType}
          customerInfo={customerInfo}
        />
      )}
      
      {/* Cart Timeout Warning Modal */}
      {showTimeoutWarning && isWarningActive && (
        <CartTimeoutWarning
          isOpen={showTimeoutWarning}
          remainingMinutes={getRemainingMinutes()}
          remainingSeconds={getRemainingSeconds()}
          formattedTimeLeft={getFormattedTimeLeft()}
          cartItemsCount={getCartItemCount()}
          onExtendSession={() => {
            extendSession();
            setShowTimeoutWarning(false);
            toast({
              title: "Session Extended",
              description: "Your cart session has been extended by 30 minutes",
            });
          }}
          onContinueShopping={() => {
            setShowTimeoutWarning(false);
          }}
          onCheckoutNow={() => {
            setShowTimeoutWarning(false);
            setShowCartSidebar(true);
          }}
          onClose={() => setShowTimeoutWarning(false)}
        />
      )}
      </div>
  );
};

export default Menu;
