import { Priority, Emotion } from '@prisma/client';

/**
 * Type conversion utilities for consistent handling of Priority and Emotion values
 * throughout the application.
 */

// Priority conversions
export function priorityToNumber(priority: Priority | null | undefined): number {
  if (!priority) return 0;
  
  const mapping: Record<Priority, number> = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    URGENT: 4
  };
  
  return mapping[priority];
}

export function numberToPriority(value: number): Priority {
  const mapping: Record<number, Priority> = {
    0: 'NONE',
    1: 'LOW',
    2: 'MEDIUM',
    3: 'HIGH',
    4: 'URGENT'
  };
  
  return mapping[value in mapping ? value : 0];
}

export function priorityToLabel(priority: Priority | null | undefined): string {
  if (!priority) return 'None';
  
  const mapping: Record<Priority, string> = {
    NONE: 'None',
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent'
  };
  
  return mapping[priority];
}

// Emotion conversions
export function emotionToString(emotion: Emotion | null | undefined): string {
  if (!emotion) return '';
  
  const mapping: Record<Emotion, string> = {
    EXCITED: 'excited',
    NEUTRAL: 'neutral',
    ANXIOUS: 'anxious',
    OVERWHELMED: 'overwhelmed',
    CONFIDENT: 'confident'
  };
  
  return mapping[emotion];
}

export function stringToEmotion(value: string): Emotion | null {
  if (!value) return null;
  
  const mapping: Record<string, Emotion> = {
    'excited': 'EXCITED',
    'neutral': 'NEUTRAL',
    'anxious': 'ANXIOUS',
    'overwhelmed': 'OVERWHELMED',
    'confident': 'CONFIDENT'
  };
  
  return value in mapping ? mapping[value] : null;
}

export function emotionToEmoji(emotion: Emotion | null | undefined): string {
  if (!emotion) return '';
  
  const mapping: Record<Emotion, string> = {
    EXCITED: '😊',
    NEUTRAL: '😐',
    ANXIOUS: '😰',
    OVERWHELMED: '😫',
    CONFIDENT: '💪'
  };
  
  return mapping[emotion];
}

// Helper to get the priority color class
export function getPriorityColorClass(priority: Priority | number | null | undefined): string {
  // Convert to number if it's a Priority enum
  const numericPriority = typeof priority === 'number' 
    ? priority 
    : priorityToNumber(priority as Priority);
  
  const colorClasses: Record<number, string> = {
    0: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
    1: 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    2: 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    3: 'text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    4: 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  };
  
  return colorClasses[numericPriority in colorClasses ? numericPriority : 0];
} 