/**
 * Menu timing utilities for restaurant operations
 */

export interface TimeBasedVisibility {
  isVisible: boolean;
  reason?: string;
  nextChangeTime?: Date;
}

/**
 * Check if lunch specials should be visible
 * Lunch specials are available Monday-Saturday from start of day until 3:00 PM Eastern Time
 */
export const checkLunchSpecialsVisibility = (
  currentTime: Date = new Date()
): TimeBasedVisibility => {
  // Convert to Eastern Time
  const easternTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(currentTime);

  const dayOfWeek = easternTime.find(part => part.type === 'weekday')?.value;
  const hour = parseInt(easternTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(easternTime.find(part => part.type === 'minute')?.value || '0');
  
  // Not available on Sunday
  if (dayOfWeek === 'Sunday') {
    return {
      isVisible: false,
      reason: 'Lunch specials not available on Sundays',
      nextChangeTime: getNextMonday(currentTime)
    };
  }

  // Check if it's before 3:00 PM (15:00) - available from start of day
  const currentTimeInMinutes = hour * 60 + minute;
  const cutoffTimeInMinutes = 15 * 60; // 3:00 PM
  
  // Available from start of day (0:00) until 3:00 PM
  if (currentTimeInMinutes >= cutoffTimeInMinutes) {
    return {
      isVisible: false,
      reason: 'Lunch specials end at 3:00 PM',
      nextChangeTime: getNextLunchSpecialTime(currentTime)
    };
  }

  // Available from start of day until 3:00 PM
  return {
    isVisible: true,
    nextChangeTime: getTodayAt3PM(currentTime)
  };
};

/**
 * Check if an item should be visible based on time-based availability rules
 */
export const checkItemTimeAvailability = (
  item: {
    available_times?: any;
    available_days?: any;
    category?: {
      available_times?: any;
      available_days?: any;
    };
  },
  currentTime: Date = new Date()
): TimeBasedVisibility => {
  // Default to visible if no timing rules are set
  if (!item.available_times && !item.available_days && 
      !item.category?.available_times && !item.category?.available_days) {
    return { isVisible: true };
  }

  const easternTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(currentTime);

  const dayOfWeek = easternTime.find(part => part.type === 'weekday')?.value?.toLowerCase();
  const hour = parseInt(easternTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(easternTime.find(part => part.type === 'minute')?.value || '0');
  const currentTimeInMinutes = hour * 60 + minute;

  // Check day availability
  const itemDays = item.available_days || item.category?.available_days;
  if (itemDays && Array.isArray(itemDays)) {
    if (!itemDays.includes(dayOfWeek)) {
      return {
        isVisible: false,
        reason: `Not available on ${dayOfWeek}s`
      };
    }
  }

  // Check time availability
  const itemTimes = item.available_times || item.category?.available_times;
  if (itemTimes) {
    if (typeof itemTimes === 'object' && itemTimes.start && itemTimes.end) {
      const startTime = parseTimeString(itemTimes.start);
      const endTime = parseTimeString(itemTimes.end);
      
      if (currentTimeInMinutes < startTime || currentTimeInMinutes >= endTime) {
        return {
          isVisible: false,
          reason: `Available ${formatTime(startTime)} - ${formatTime(endTime)}`
        };
      }
    }
  }

  return { isVisible: true };
};

/**
 * Get the next Monday at start of day Eastern
 */
function getNextMonday(currentTime: Date): Date {
  const nextMonday = new Date(currentTime);
  nextMonday.setUTCHours(5, 0, 0, 0); // Start of day Eastern = 5:00 UTC (approximate)
  
  const dayOfWeek = nextMonday.getUTCDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
  
  return nextMonday;
}

/**
 * Get next lunch special time (tomorrow at 9:00 AM or Monday if it's Saturday)
 */
function getNextLunchSpecialTime(currentTime: Date): Date {
  const nextTime = new Date(currentTime);
  const dayOfWeek = nextTime.getDay();
  
  if (dayOfWeek === 6) { // Saturday
    // Next availability is Monday
    return getNextMonday(currentTime);
  } else {
    // Next availability is tomorrow at start of day
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setUTCHours(5, 0, 0, 0); // Start of day Eastern
    return nextTime;
  }
}

/**
 * Get today at 3:00 PM Eastern
 */
function getTodayAt3PM(currentTime: Date): Date {
  const todayAt3PM = new Date(currentTime);
  todayAt3PM.setUTCHours(20, 0, 0, 0); // 3:00 PM Eastern = 20:00 UTC (approximate)
  return todayAt3PM;
}

/**
 * Parse time string (e.g., "14:30" or "2:30 PM") to minutes since midnight
 */
function parseTimeString(timeStr: string): number {
  const time24Format = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (time24Format) {
    return parseInt(time24Format[1]) * 60 + parseInt(time24Format[2]);
  }

  const time12Format = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (time12Format) {
    let hours = parseInt(time12Format[1]);
    const minutes = parseInt(time12Format[2]);
    const period = time12Format[3].toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  return 0; // Default to midnight if parsing fails
}

/**
 * Format minutes since midnight to human-readable time
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get a human-readable description of when lunch specials are available
 */
export const getLunchSpecialDescription = (): string => {
  return "Available Monday - Saturday from open until 3:00 PM";
};

/**
 * Check if current time is within lunch special hours
 */
export const isLunchSpecialTime = (): boolean => {
  return checkLunchSpecialsVisibility().isVisible;
};