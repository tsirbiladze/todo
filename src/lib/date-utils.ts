import { format, parse, isValid, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Centralized date formatting utilities to ensure consistent date handling across the application.
 * Uses date-fns for all date formatting operations.
 */

// Date formats used throughout the application
export const DATE_FORMATS = {
  INPUT: 'yyyy-MM-dd', // Format for date inputs (HTML5 standard)
  INPUT_DATETIME: 'yyyy-MM-dd\'T\'HH:mm', // Format for datetime-local inputs
  DISPLAY_SHORT: 'MMM d, yyyy', // Short readable format (e.g., "Jan 1, 2023")
  DISPLAY_MEDIUM: 'MMMM d, yyyy', // Medium format with full month (e.g., "January 1, 2023")
  DISPLAY_LONG: 'EEEE, MMMM d, yyyy', // Long format with weekday (e.g., "Monday, January 1, 2023")
  DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a', // Date with time (e.g., "Jan 1, 2023 3:30 PM")
  MONTH_YEAR: 'MMMM yyyy', // Month and year only (e.g., "January 2023")
  DAY_MONTH: 'MMM d', // Day and month only (e.g., "Jan 1")
  TIME_ONLY: 'h:mm a', // Time only (e.g., "3:30 PM")
};

/**
 * Format a date consistently for display
 * @param date Date object or ISO string
 * @param formatStr Format string from DATE_FORMATS
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, formatStr = DATE_FORMATS.DISPLAY_SHORT): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      console.warn('Invalid date:', date);
      return '';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a date for HTML date inputs
 * @param date Date object or ISO string
 * @param includeTime Whether to include time (for datetime-local inputs)
 * @returns Date string in appropriate format for HTML inputs
 */
export function formatDateForInput(date: Date | string | null | undefined, includeTime = false): string {
  return formatDate(date, includeTime ? DATE_FORMATS.INPUT_DATETIME : DATE_FORMATS.INPUT);
}

/**
 * Get relative time (e.g., "2 days ago", "in 3 hours")
 * @param date Date object or ISO string
 * @returns Human-readable relative time
 */
export function getRelativeTimeFromNow(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return '';
  }
}

/**
 * Check if two dates are the same day
 * @param date1 First date
 * @param date2 Second date
 * @returns Boolean indicating if dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    console.error('Error comparing dates:', error);
    return false;
  }
}

/**
 * Check if a date is today
 * @param date Date to check
 * @returns Boolean indicating if date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(typeof date === 'string' ? parseISO(date) : date, new Date());
} 