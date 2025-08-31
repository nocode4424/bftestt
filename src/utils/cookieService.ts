// Cookie management utility for tracking first visits and check-ins

export interface CookieData {
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  checkInDate?: string;
}

export class CookieService {
  private static COOKIE_NAME = 'bluefin_visitor_data';
  private static COOKIE_EXPIRY_DAYS = 365; // 1 year

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
   * Get visitor data from cookie
   */
  static getVisitorData(): CookieData | null {
    try {
      const cookieValue = this.getCookie(this.COOKIE_NAME);
      if (!cookieValue) return null;
      
      return JSON.parse(decodeURIComponent(cookieValue));
    } catch (error) {
      console.error('Error parsing visitor cookie:', error);
      return null;
    }
  }

  /**
   * Set visitor data in cookie
   */
  static setVisitorData(data: CookieData): void {
    try {
      const cookieValue = encodeURIComponent(JSON.stringify(data));
      this.setCookie(this.COOKIE_NAME, cookieValue, this.COOKIE_EXPIRY_DAYS);
    } catch (error) {
      console.error('Error setting visitor cookie:', error);
    }
  }

  /**
   * Check if this is the user's first visit
   */
  static isFirstVisit(): boolean {
    const data = this.getVisitorData();
    return !data || !data.firstVisit;
  }

  /**
   * Record a visit (first visit or return visit)
   */
  static recordVisit(): CookieData {
    const now = new Date().toISOString();
    const existingData = this.getVisitorData();
    
    let visitorData: CookieData;
    
    if (existingData) {
      // Return visitor
      visitorData = {
        ...existingData,
        lastVisit: now,
        visitCount: existingData.visitCount + 1
      };
    } else {
      // First time visitor
      visitorData = {
        firstVisit: now,
        lastVisit: now,
        visitCount: 1
      };
    }
    
    this.setVisitorData(visitorData);
    return visitorData;
  }

  /**
   * Record a check-in (daily visit)
   */
  static recordCheckIn(): boolean {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const existingData = this.getVisitorData();
    if (!existingData) {
      // First visit, record it
      this.recordVisit();
      return true;
    }
    
    // Check if already checked in today
    if (existingData.checkInDate === today) {
      return false; // Already checked in today
    }
    
    // Record check-in
    const updatedData: CookieData = {
      ...existingData,
      lastVisit: now.toISOString(),
      visitCount: existingData.visitCount + 1,
      checkInDate: today
    };
    
    this.setVisitorData(updatedData);
    return true; // New check-in
  }

  /**
   * Get visit statistics
   */
  static getVisitStats(): {
    isFirstVisit: boolean;
    visitCount: number;
    daysSinceFirstVisit: number;
    lastVisitDate: string | null;
  } {
    const data = this.getVisitorData();
    
    if (!data) {
      return {
        isFirstVisit: true,
        visitCount: 0,
        daysSinceFirstVisit: 0,
        lastVisitDate: null
      };
    }
    
    const now = new Date();
    const firstVisit = new Date(data.firstVisit);
    const daysSinceFirstVisit = Math.floor((now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isFirstVisit: false,
      visitCount: data.visitCount,
      daysSinceFirstVisit,
      lastVisitDate: data.lastVisit
    };
  }

  /**
   * Clear all visitor data
   */
  static clearVisitorData(): void {
    document.cookie = `${this.COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
}
