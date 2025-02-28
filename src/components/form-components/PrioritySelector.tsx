import React from 'react';
import { priorityOptions, PriorityOption } from "@/data/priorities";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/solid";
import { TaskFormField } from './TaskFormField';
import { useTranslation } from "@/lib/i18n";

interface PrioritySelectorProps {
  value: number;
  onChange: (priority: number) => void;
  onBlur?: () => void;
  error?: string;
}

/**
 * PrioritySelector component for selecting task priority
 * Utilizes Tailwind CSS for responsive layout and styling
 */
export function PrioritySelector({ value, onChange, onBlur, error }: PrioritySelectorProps) {
  const { t } = useTranslation();

  // Function to get dynamic button classes
  const getButtonClasses = (option: PriorityOption, isSelected: boolean) => {
    const baseClasses = "px-2 py-1 rounded text-xs font-medium transition-all duration-200 border flex items-center gap-1 flex-1 shadow-sm";
    
    if (isSelected) {
      // For selected option, use the pre-defined color classes with dark mode support
      return `${baseClasses} ${option.color} ${option.textColor} ${option.darkColor} ${option.darkTextColor} border-transparent`;
    } else {
      // For non-selected options, use standard classes
      return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600`;
    }
  };

  // Function to get dot classes
  const getDotClasses = (option: PriorityOption, isSelected: boolean) => {
    if (isSelected) {
      switch (option.value) {
        case 4: return "w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"; // Urgent
        case 3: return "w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"; // High
        case 2: return "w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"; // Medium
        case 1: return "w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"; // Low
        default: return "w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400"; // None
      }
    }
    return "w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"; // Unselected
  };

  return (
    <TaskFormField
      id="priority"
      label="Priority"
      icon={<ArrowsPointingOutIcon className="h-3.5 w-3.5" />}
      error={error}
    >
      <div 
        role="radiogroup" 
        aria-labelledby="priority-label"
        className="flex flex-wrap gap-1"
      >
        {priorityOptions.map((option: PriorityOption) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              if (onBlur) onBlur();
            }}
            className={getButtonClasses(option, value === option.value)}
            aria-checked={value === option.value}
            role="radio"
          >
            <span className={getDotClasses(option, value === option.value)}></span>
            {option.label}
          </button>
        ))}
      </div>
    </TaskFormField>
  );
}