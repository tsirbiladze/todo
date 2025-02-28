import { Priority } from '@prisma/client';

export interface PriorityOption {
  value: number;
  label: string;
  color: string;
  textColor: string;
  hover: string;
  darkColor?: string;
  darkTextColor?: string;
  darkHover?: string;
}

export const priorityOptions: PriorityOption[] = [
  { 
    value: 0, 
    label: 'None', 
    color: 'bg-gray-100', 
    textColor: 'text-gray-600', 
    hover: 'hover:bg-gray-200',
    darkColor: 'dark:bg-gray-700',
    darkTextColor: 'dark:text-gray-300',
    darkHover: 'dark:hover:bg-gray-600'
  },
  { 
    value: 1, 
    label: 'Low', 
    color: 'bg-blue-100', 
    textColor: 'text-blue-700', 
    hover: 'hover:bg-blue-200',
    darkColor: 'dark:bg-blue-900/60',
    darkTextColor: 'dark:text-blue-300',
    darkHover: 'dark:hover:bg-blue-800/70'
  },
  { 
    value: 2, 
    label: 'Medium', 
    color: 'bg-yellow-100', 
    textColor: 'text-yellow-700', 
    hover: 'hover:bg-yellow-200',
    darkColor: 'dark:bg-yellow-900/60',
    darkTextColor: 'dark:text-yellow-300',
    darkHover: 'dark:hover:bg-yellow-800/70'
  },
  { 
    value: 3, 
    label: 'High', 
    color: 'bg-orange-100', 
    textColor: 'text-orange-700', 
    hover: 'hover:bg-orange-200',
    darkColor: 'dark:bg-orange-900/60',
    darkTextColor: 'dark:text-orange-300',
    darkHover: 'dark:hover:bg-orange-800/70'
  },
  { 
    value: 4, 
    label: 'Urgent', 
    color: 'bg-red-100', 
    textColor: 'text-red-700', 
    hover: 'hover:bg-red-200',
    darkColor: 'dark:bg-red-900/60',
    darkTextColor: 'dark:text-red-300',
    darkHover: 'dark:hover:bg-red-800/70'
  },
];

// Map from numeric value to Priority enum
export const PRIORITY_MAP: Record<number, Priority> = {
  0: 'NONE',
  1: 'LOW',
  2: 'MEDIUM',
  3: 'HIGH',
  4: 'URGENT'
}; 