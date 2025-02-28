import { Priority } from '@prisma/client';

export interface PriorityOption {
  value: number;
  label: string;
  color: string;
  textColor: string;
  hover: string;
}

export const priorityOptions: PriorityOption[] = [
  { value: 0, label: 'None', color: 'bg-gray-100', textColor: 'text-gray-600', hover: 'hover:bg-gray-200' },
  { value: 1, label: 'Low', color: 'bg-blue-100', textColor: 'text-blue-700', hover: 'hover:bg-blue-200' },
  { value: 2, label: 'Medium', color: 'bg-yellow-100', textColor: 'text-yellow-700', hover: 'hover:bg-yellow-200' },
  { value: 3, label: 'High', color: 'bg-orange-100', textColor: 'text-orange-700', hover: 'hover:bg-orange-200' },
  { value: 4, label: 'Urgent', color: 'bg-red-100', textColor: 'text-red-700', hover: 'hover:bg-red-200' },
];

// Map from numeric value to Priority enum
export const PRIORITY_MAP: Record<number, Priority> = {
  0: 'NONE',
  1: 'LOW',
  2: 'MEDIUM',
  3: 'HIGH',
  4: 'URGENT'
}; 