// Enhanced cookie service for checkout persistence and user data

export interface CheckoutCookieData {
  orderType?: 'pickup' | 'delivery';
  orderTime?: 'now' | 'scheduled';
  deliveryAddress?: string;
  scheduledDateTime?: string;
  customerInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  lastOrderDate?: string;
  previousOrders?: Array<{
    id: string;
    date: string;
    total: number;
    items: string[];
  }>;
}

export interface UserSessionData {
  isLoggedIn: boolean;
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
  lastLogin?: string;
}

export class CheckoutCookieService {
  private static CHECKOUT_COOKIE_NAME = 'bluefin_checkout_data';
  private static USER_SESSION_COOKIE_NAME = 'bluefin_user_session';
  private static COOKIE_EXPIRY_DAYS = 30; // 30 days for checkout preferences

  /**
   * Set a cookie with the given name, value, and expiry days
   */
  private static setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  /**
   * Get a cookie value by name
   */
  private static getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Get checkout preferences from cookie
   */
  static getCheckoutData(): CheckoutCookieData | null {
    try {
      const cookieValue = this.getCookie(this.CHECKOUT_COOKIE_NAME);
      if (!cookieValue) return null;
      
      return JSON.parse(decodeURIComponent(cookieValue));
    } catch (error) {
      console.error('Error parsing checkout cookie:', error);
      return null;
    }
  }

  /**
   * Set checkout preferences in cookie
   */
  static setCheckoutData(data: CheckoutCookieData): void {
    try {
      const cookieValue = encodeURIComponent(JSON.stringify(data));
      this.setCookie(this.CHECKOUT_COOKIE_NAME, cookieValue, this.COOKIE_EXPIRY_DAYS);
    } catch (error) {
      console.error('Error setting checkout cookie:', error);
    }
  }

  /**
   * Save order type preference
   */
  static saveOrderType(orderType: 'pickup' | 'delivery'): void {
    const existingData = this.getCheckoutData() || {};
    const updatedData: CheckoutCookieData = {
      ...existingData,
      orderType,
      orderTime: existingData.orderTime || 'now'
    };
    this.setCheckoutData(updatedData);
  }

  /**
   * Save delivery address
   */
  static saveDeliveryAddress(address: string): void {
    const existingData = this.getCheckoutData() || {};
    const updatedData: CheckoutCookieData = {
      ...existingData,
      deliveryAddress: address
    };
    this.setCheckoutData(updatedData);
  }

  /**
   * Save customer info
   */
  static saveCustomerInfo(customerInfo: { name: string; phone: string; email: string }): void {
    const existingData = this.getCheckoutData() || {};
    const updatedData: CheckoutCookieData = {
      ...existingData,
      customerInfo
    };
    this.setCheckoutData(updatedData);
  }

  /**
   * Get user session data
   */
  static getUserSession(): UserSessionData | null {
    try {
      const cookieValue = this.getCookie(this.USER_SESSION_COOKIE_NAME);
      if (!cookieValue) return null;
      
      return JSON.parse(decodeURIComponent(cookieValue));
    } catch (error) {
      console.error('Error parsing user session cookie:', error);
      return null;
    }
  }

  /**
   * Set user session data
   */
  static setUserSession(data: UserSessionData): void {
    try {
      const cookieValue = encodeURIComponent(JSON.stringify(data));
      this.setCookie(this.USER_SESSION_COOKIE_NAME, cookieValue, this.COOKIE_EXPIRY_DAYS);
    } catch (error) {
      console.error('Error setting user session cookie:', error);
    }
  }

  /**
   * Save user login info
   */
  static saveUserLogin(userData: { id: string; email: string; name: string; phone?: string }): void {
    const sessionData: UserSessionData = {
      isLoggedIn: true,
      userId: userData.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      lastLogin: new Date().toISOString()
    };
    this.setUserSession(sessionData);
  }

  /**
   * Clear user session
   */
  static clearUserSession(): void {
    document.cookie = `${this.USER_SESSION_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Add completed order to history
   */
  static addOrderToHistory(order: { id: string; total: number; items: string[] }): void {
    const existingData = this.getCheckoutData() || {};
    const previousOrders = existingData.previousOrders || [];
    
    const updatedData: CheckoutCookieData = {
      orderType: existingData.orderType || 'pickup',
      orderTime: existingData.orderTime || 'now',
      ...existingData,
      lastOrderDate: new Date().toISOString(),
      previousOrders: [
        {
          id: order.id,
          date: new Date().toISOString(),
          total: order.total,
          items: order.items
        },
        ...previousOrders.slice(0, 4) // Keep only last 5 orders
      ]
    };
    
    this.setCheckoutData(updatedData);
  }

  /**
   * Get previous orders
   */
  static getPreviousOrders(): Array<{ id: string; date: string; total: number; items: string[] }> {
    const data = this.getCheckoutData();
    return data?.previousOrders || [];
  }

  /**
   * Check if user should skip order type selection
   */
  static shouldSkipOrderTypeSelection(): boolean {
    const data = this.getCheckoutData();
    return !!(data?.orderType && data?.customerInfo);
  }

  /**
   * Clear all checkout data
   */
  static clearCheckoutData(): void {
    document.cookie = `${this.CHECKOUT_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  /**
   * Clear all cookies
   */
  static clearAllData(): void {
    this.clearCheckoutData();
    this.clearUserSession();
  }
}
