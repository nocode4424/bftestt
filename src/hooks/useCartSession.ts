import { useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/pages/Menu';

interface CartSession {
  id: string;
  items: CartItem[];
  lastActivity: Date;
  timeoutWarningShown: boolean;
  expiresAt: Date;
}

interface UseCartSessionOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  onTimeout?: () => void;
  onWarning?: (remainingMinutes: number) => void;
}

interface CartSessionState {
  cart: CartItem[];
  isExpired: boolean;
  isWarningActive: boolean;
  remainingTime: number;
  lastActivity: Date;
}

export const useCartSession = (options: UseCartSessionOptions = {}) => {
  const {
    timeoutMinutes = 30,
    warningMinutes = 2,
    onTimeout,
    onWarning
  } = options;

  const [session, setSession] = useState<CartSession | null>(null);
  const [state, setState] = useState<CartSessionState>({
    cart: [],
    isExpired: false,
    isWarningActive: false,
    remainingTime: 0,
    lastActivity: new Date()
  });

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Initialize or restore session
  const initializeSession = useCallback((initialCart: CartItem[] = []) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);
    
    const newSession: CartSession = {
      id: generateSessionId(),
      items: initialCart,
      lastActivity: now,
      timeoutWarningShown: false,
      expiresAt
    };
    
    setSession(newSession);
    
    // Save to localStorage
    localStorage.setItem('cart_session', JSON.stringify({
      ...newSession,
      lastActivity: newSession.lastActivity.toISOString(),
      expiresAt: newSession.expiresAt.toISOString()
    }));
    
    return newSession;
  }, [timeoutMinutes, generateSessionId]);

  // Update cart and refresh activity
  const updateCart = useCallback((newCart: CartItem[]) => {
    if (!session) return;
    
    const now = new Date();
    const updatedSession: CartSession = {
      ...session,
      items: newCart,
      lastActivity: now,
      timeoutWarningShown: false
    };
    
    setSession(updatedSession);
    
    // Save to localStorage
    localStorage.setItem('cart_session', JSON.stringify({
      ...updatedSession,
      lastActivity: updatedSession.lastActivity.toISOString(),
      expiresAt: updatedSession.expiresAt.toISOString()
    }));
    
    setState(prev => ({
      ...prev,
      cart: newCart,
      lastActivity: now,
      isWarningActive: false
    }));
  }, [session]);

  // Reset session and clear cart
  const resetSession = useCallback(() => {
    const newSession = initializeSession([]);
    setState({
      cart: [],
      isExpired: false,
      isWarningActive: false,
      remainingTime: timeoutMinutes * 60,
      lastActivity: new Date()
    });
    localStorage.removeItem('cart_session');
    return newSession;
  }, [initializeSession, timeoutMinutes]);

  // Extend session when user is active
  const extendSession = useCallback((additionalMinutes: number = timeoutMinutes) => {
    if (!session) return;
    
    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + additionalMinutes * 60 * 1000);
    
    const updatedSession: CartSession = {
      ...session,
      lastActivity: now,
      expiresAt: newExpiresAt,
      timeoutWarningShown: false
    };
    
    setSession(updatedSession);
    
    localStorage.setItem('cart_session', JSON.stringify({
      ...updatedSession,
      lastActivity: updatedSession.lastActivity.toISOString(),
      expiresAt: updatedSession.expiresAt.toISOString()
    }));
    
    setState(prev => ({
      ...prev,
      lastActivity: now,
      isWarningActive: false
    }));
  }, [session, timeoutMinutes]);

  // Check session status and handle warnings/timeouts
  useEffect(() => {
    const checkSession = () => {
      if (!session) return;
      
      const now = new Date();
      const remainingMs = session.expiresAt.getTime() - now.getTime();
      const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
      const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      setState(prev => ({
        ...prev,
        remainingTime: Math.max(0, remainingSeconds + (remainingMinutes * 60))
      }));
      
      // Session expired
      if (remainingMs <= 0) {
        setState(prev => ({
          ...prev,
          isExpired: true,
          isWarningActive: false
        }));
        onTimeout?.();
        return;
      }
      
      // Warning threshold reached
      if (remainingMinutes <= warningMinutes && !session.timeoutWarningShown) {
        setSession(prev => prev ? { ...prev, timeoutWarningShown: true } : null);
        setState(prev => ({
          ...prev,
          isWarningActive: true
        }));
        onWarning?.(remainingMinutes);
      }
    };
    
    // Initial check
    checkSession();
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(checkSession, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [session, warningMinutes]); // Removed onTimeout and onWarning from deps to prevent infinite loop

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cart_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        const restoredSession: CartSession = {
          ...parsed,
          lastActivity: new Date(parsed.lastActivity),
          expiresAt: new Date(parsed.expiresAt)
        };
        
        // Check if session is still valid
        const now = new Date();
        if (restoredSession.expiresAt > now) {
          setSession(restoredSession);
          setState({
            cart: restoredSession.items,
            isExpired: false,
            isWarningActive: false,
            remainingTime: Math.floor((restoredSession.expiresAt.getTime() - now.getTime()) / 1000),
            lastActivity: restoredSession.lastActivity
          });
        } else {
          // Session expired, clean up
          localStorage.removeItem('cart_session');
        }
      }
    } catch (error) {
      console.error('Failed to restore cart session:', error);
      localStorage.removeItem('cart_session');
    }
  }, []);

  return {
    // Session data
    session,
    cart: state.cart,
    isExpired: state.isExpired,
    isWarningActive: state.isWarningActive,
    remainingTime: state.remainingTime,
    lastActivity: state.lastActivity,
    
    // Session controls
    initializeSession,
    updateCart,
    resetSession,
    extendSession,
    
    // Helper methods
    getRemainingMinutes: () => Math.floor(state.remainingTime / 60),
    getRemainingSeconds: () => state.remainingTime % 60,
    getFormattedTimeLeft: () => {
      const minutes = Math.floor(state.remainingTime / 60);
      const seconds = state.remainingTime % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };
};