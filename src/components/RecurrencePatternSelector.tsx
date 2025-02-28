'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// Define the types for recurrence patterns
export interface RecurrencePattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  interval: number;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: Date;
  count?: number;
}

// Add this interface for the formatted pattern
interface FormattedRecurrencePattern {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  interval: number;
  daysOfWeek?: string;
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: string;
  count?: number;
}

interface RecurrencePatternSelectorProps {
  value: RecurrencePattern;
  onChange: (pattern: RecurrencePattern) => void;
  showPreview?: boolean;
}

// Day names for weekly recurrence
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Month names for yearly recurrence
const MONTHS_OF_YEAR = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function RecurrencePatternSelector({ 
  value, 
  onChange,
  showPreview = false 
}: RecurrencePatternSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pattern, setPattern] = useState<RecurrencePattern>(value || {
    frequency: 'DAILY',
    interval: 1,
  });
  
  // Generate human-readable description of the recurrence pattern
  const getPatternDescription = (pattern: RecurrencePattern): string => {
    if (!pattern) return 'Does not repeat';
    
    const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear } = pattern;
    
    switch (frequency) {
      case 'DAILY':
        return interval === 1 ? 'Daily' : `Every ${interval} days`;
      
      case 'WEEKLY':
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = daysOfWeek.map(day => DAYS_OF_WEEK[day]).join(', ');
          return interval === 1 
            ? `Weekly on ${dayNames}` 
            : `Every ${interval} weeks on ${dayNames}`;
        }
        return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
      
      case 'MONTHLY':
        if (dayOfMonth) {
          return interval === 1 
            ? `Monthly on day ${dayOfMonth}` 
            : `Every ${interval} months on day ${dayOfMonth}`;
        }
        return interval === 1 ? 'Monthly' : `Every ${interval} months`;
      
      case 'YEARLY':
        if (monthOfYear && dayOfMonth) {
          return interval === 1 
            ? `Yearly on ${MONTHS_OF_YEAR[monthOfYear - 1]} ${dayOfMonth}` 
            : `Every ${interval} years on ${MONTHS_OF_YEAR[monthOfYear - 1]} ${dayOfMonth}`;
        }
        return interval === 1 ? 'Yearly' : `Every ${interval} years`;
      
      case 'CUSTOM':
        return 'Custom recurrence pattern';
      
      default:
        return 'Does not repeat';
    }
  };

  // Generate preview of upcoming occurrences
  const generatePreview = (pattern: RecurrencePattern, startDate: Date, count: number = 5): Date[] => {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      // Calculate next occurrence based on pattern
      currentDate = calculateNextOccurrence(currentDate, pattern);
      occurrences.push(new Date(currentDate));
    }
    
    return occurrences;
  };
  
  // Helper function to calculate next occurrence
  const calculateNextOccurrence = (currentDate: Date, pattern: RecurrencePattern): Date => {
    const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear } = pattern;
    const nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
        
      case 'WEEKLY':
        // For simple weekly recurrence without specific days
        if (!daysOfWeek || daysOfWeek.length === 0) {
          nextDate.setDate(nextDate.getDate() + (interval * 7));
        } else {
          // For weekly recurrence with specific days
          const currentDay = nextDate.getDay();
          // Find the next day in the daysOfWeek array
          const nextDay = daysOfWeek.find(day => day > currentDay);
          
          if (nextDay !== undefined) {
            // Found a day later in the current week
            nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
          } else {
            // Move to the first day in the next week cycle
            nextDate.setDate(nextDate.getDate() + ((7 - currentDay) + daysOfWeek[0] + (interval - 1) * 7));
          }
        }
        break;
        
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + interval);
        if (dayOfMonth) {
          nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
        }
        break;
        
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        if (monthOfYear) {
          nextDate.setMonth(monthOfYear - 1);
          if (dayOfMonth) {
            nextDate.setDate(Math.min(dayOfMonth, getDaysInMonth(nextDate.getFullYear(), nextDate.getMonth())));
          }
        }
        break;
        
      case 'CUSTOM':
        // For custom recurrence, we'd implement more complex logic
        nextDate.setDate(nextDate.getDate() + interval);
        break;
    }
    
    return nextDate;
  };
  
  // Helper function to get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Handle changes to the recurrence pattern
  const handlePatternChange = (changes: Partial<RecurrencePattern>) => {
    const newPattern = { ...pattern, ...changes };
    setPattern(newPattern);
    onChange(newPattern);
  };
  
  // When value prop changes, update local state
  useEffect(() => {
    if (value) {
      setPattern(value);
    }
  }, [value]);
  
  return (
    <div className="w-full">
      <div 
        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <ArrowPathIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
          <span>{getPatternDescription(pattern)}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="mt-2 p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repeat</label>
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={pattern.frequency}
              onChange={(e) => handlePatternChange({ frequency: e.target.value as RecurrencePattern['frequency'] })}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>
          
          <div className="mb-4 flex items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">Every</span>
            <input
              type="number"
              min="1"
              className="w-16 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={pattern.interval}
              onChange={(e) => handlePatternChange({ interval: parseInt(e.target.value) || 1 })}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">
              {pattern.frequency === 'DAILY' && (pattern.interval === 1 ? 'day' : 'days')}
              {pattern.frequency === 'WEEKLY' && (pattern.interval === 1 ? 'week' : 'weeks')}
              {pattern.frequency === 'MONTHLY' && (pattern.interval === 1 ? 'month' : 'months')}
              {pattern.frequency === 'YEARLY' && (pattern.interval === 1 ? 'year' : 'years')}
            </span>
          </div>
          
          {/* Weekly recurrence options */}
          {pattern.frequency === 'WEEKLY' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On these days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      pattern.daysOfWeek?.includes(index)
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => {
                      const newDays = pattern.daysOfWeek ? [...pattern.daysOfWeek] : [];
                      if (newDays.includes(index)) {
                        handlePatternChange({ daysOfWeek: newDays.filter(d => d !== index) });
                      } else {
                        handlePatternChange({ daysOfWeek: [...newDays, index].sort() });
                      }
                    }}
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Monthly recurrence options */}
          {pattern.frequency === 'MONTHLY' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">On day</label>
              <input
                type="number"
                min="1"
                max="31"
                className="w-16 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={pattern.dayOfMonth || ''}
                onChange={(e) => handlePatternChange({ dayOfMonth: parseInt(e.target.value) || undefined })}
              />
            </div>
          )}
          
          {/* Yearly recurrence options */}
          {pattern.frequency === 'YEARLY' && (
            <div className="mb-4 space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
                <select
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={pattern.monthOfYear || 1}
                  onChange={(e) => handlePatternChange({ monthOfYear: parseInt(e.target.value) })}
                >
                  {MONTHS_OF_YEAR.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="w-16 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={pattern.dayOfMonth || ''}
                  onChange={(e) => handlePatternChange({ dayOfMonth: parseInt(e.target.value) || undefined })}
                />
              </div>
            </div>
          )}
          
          {/* End condition options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End</label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="never"
                  name="endCondition"
                  className="mr-2"
                  checked={!pattern.endDate && !pattern.count}
                  onChange={() => handlePatternChange({ endDate: undefined, count: undefined })}
                />
                <label htmlFor="never" className="text-gray-700 dark:text-gray-300">Never</label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="afterCount"
                  name="endCondition"
                  className="mr-2"
                  checked={!!pattern.count}
                  onChange={() => handlePatternChange({ count: 10, endDate: undefined })}
                />
                <label htmlFor="afterCount" className="mr-2 text-gray-700 dark:text-gray-300">After</label>
                {!!pattern.count && (
                  <input
                    type="number"
                    min="1"
                    className="w-16 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={pattern.count}
                    onChange={(e) => handlePatternChange({ count: parseInt(e.target.value) || 1 })}
                  />
                )}
                <span className="ml-2 text-gray-700 dark:text-gray-300">occurrences</span>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="onDate"
                  name="endCondition"
                  className="mr-2"
                  checked={!!pattern.endDate}
                  onChange={() => {
                    const defaultEndDate = new Date();
                    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
                    handlePatternChange({ endDate: defaultEndDate, count: undefined });
                  }}
                />
                <label htmlFor="onDate" className="mr-2 text-gray-700 dark:text-gray-300">On date</label>
                {!!pattern.endDate && (
                  <input
                    type="date"
                    className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={pattern.endDate.toISOString().split('T')[0]}
                    onChange={(e) => handlePatternChange({ 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Preview upcoming occurrences */}
          {showPreview && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upcoming Occurrences</h4>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded space-y-1">
                {generatePreview(pattern, new Date(), 5).map((date, index) => (
                  <div key={index} className="flex items-center">
                    <CalendarDaysIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {date.toLocaleDateString(undefined, { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded mr-2"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded flex items-center"
              onClick={() => {
                onChange(pattern);
                setIsOpen(false);
              }}
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format recurrence pattern for API
export function formatRecurrencePattern(pattern: RecurrencePattern): FormattedRecurrencePattern {
  const formattedPattern: FormattedRecurrencePattern = {
    frequency: pattern.frequency,
    interval: pattern.interval,
    daysOfWeek: pattern.daysOfWeek ? JSON.stringify(pattern.daysOfWeek) : undefined,
    dayOfMonth: pattern.dayOfMonth,
    monthOfYear: pattern.monthOfYear,
    endDate: pattern.endDate ? pattern.endDate.toISOString() : undefined,
    count: pattern.count
  };
  
  return formattedPattern;
}

// Helper function to parse recurrence pattern from API
export function parseRecurrencePattern(data: FormattedRecurrencePattern): RecurrencePattern {
  return {
    frequency: data.frequency,
    interval: data.interval,
    daysOfWeek: data.daysOfWeek ? JSON.parse(data.daysOfWeek) : undefined,
    dayOfMonth: data.dayOfMonth,
    monthOfYear: data.monthOfYear,
    endDate: data.endDate ? new Date(data.endDate) : undefined,
    count: data.count
  };
} 