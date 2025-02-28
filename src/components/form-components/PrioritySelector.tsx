import React, { useMemo } from 'react';
import { priorityOptions, PriorityOption } from "@/data/priorities";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/solid";
import { TaskFormField } from './TaskFormField';

interface PrioritySelectorProps {
  selectedPriority: number;
  onPriorityChange: (priority: number) => void;
}

export function PrioritySelector({ selectedPriority, onPriorityChange }: PrioritySelectorProps) {
  const priorityIcon = useMemo(() => (
    <ArrowsPointingOutIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" aria-hidden="true" />
  ), []);

  return (
    <TaskFormField
      id="priority-group"
      label="Priority"
      icon={priorityIcon}
    >
      <div 
        role="radiogroup" 
        aria-labelledby="priority-group-label"
        className="flex flex-wrap gap-2"
      >
        {priorityOptions.map((option: PriorityOption) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPriorityChange(option.value)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-200 ${
              selectedPriority === option.value
                ? `${option.color
                    .replace("bg-", "bg-")
                    .replace("-100", "-900/30")} 
                  ${option.textColor.replace("text-", "text-")} 
                  border-${option.color.split("-")[1]}-600`
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
            }`}
            aria-label={`Set priority to ${option.label}`}
            role="radio"
            aria-checked={selectedPriority === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </TaskFormField>
  );
} 