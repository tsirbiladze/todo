import { RecurrenceFrequency } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

// Helper function to calculate next occurrence based on recurrence pattern
export function calculateNextOccurrence(
  currentDate: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  daysOfWeek?: string,
  dayOfMonth?: number,
  monthOfYear?: number
): Date {
  let nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'DAILY':
      nextDate = addDays(currentDate, interval);
      break;
    case 'WEEKLY':
      nextDate = addWeeks(currentDate, interval);
      
      // If specific days of week are specified
      if (daysOfWeek) {
        try {
          const days = JSON.parse(daysOfWeek) as number[];
          
          if (days.length > 0) {
            const currentDay = currentDate.getDay(); // 0-6, where 0 is Sunday
            
            // Find the next day in the days array that's after the current day
            let nextDay = days.find(day => day > currentDay);
            
            if (nextDay !== undefined) {
              // Found a day later in the current week
              nextDate = addDays(currentDate, nextDay - currentDay);
            } else {
              // Move to the first day in the next week cycle
              nextDate = addDays(
                currentDate, 
                (7 - currentDay) + days[0] + (interval - 1) * 7
              );
            }
          }
        } catch (error) {
          console.error('Error parsing daysOfWeek:', error);
          // Fallback to simple weekly recurrence
          nextDate = addWeeks(currentDate, interval);
        }
      }
      break;
    case 'MONTHLY':
      nextDate = addMonths(currentDate, interval);
      
      // If a specific day of month is specified
      if (dayOfMonth) {
        // Set the day of month, handling the case where the day doesn't exist
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      }
      break;
    case 'YEARLY':
      nextDate = addYears(currentDate, interval);
      
      // If specific month is specified
      if (monthOfYear) {
        nextDate.setMonth(monthOfYear - 1); // Month is 0-indexed in JS
        
        // If day of month is also specified
        if (dayOfMonth) {
          // Set the day of month, handling the case where the day doesn't exist
          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
        }
      }
      break;
    case 'CUSTOM':
      // For custom recurrence, we use a simplified approach for now
      nextDate = addDays(currentDate, interval);
      break;
  }
  
  return nextDate;
}

// Generate upcoming occurrences based on a pattern
export function generateOccurrences(
  startDate: Date, 
  pattern: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek?: string;
    dayOfMonth?: number;
    monthOfYear?: number;
  },
  count: number = 5,
  endDate?: Date
): Date[] {
  const occurrences: Date[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    const nextDate = calculateNextOccurrence(
      currentDate,
      pattern.frequency,
      pattern.interval,
      pattern.daysOfWeek,
      pattern.dayOfMonth,
      pattern.monthOfYear
    );
    
    // If we have an end date and this occurrence exceeds it, stop
    if (endDate && nextDate > endDate) {
      break;
    }
    
    occurrences.push(new Date(nextDate));
    currentDate = nextDate;
  }
  
  return occurrences;
} 