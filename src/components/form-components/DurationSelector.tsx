import React, { memo } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { TaskFormField } from './TaskFormField';
import { useTranslation } from "@/lib/i18n";

interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  error?: string;
}

/**
 * DurationSelector component for task duration input
 * Extracted from AddTaskForm to improve component size and maintainability
 * Memoized to prevent unnecessary re-renders
 */
function DurationSelectorComponent({
  value,
  onChange,
  onBlur,
  error
}: DurationSelectorProps) {
  const { t } = useTranslation();

  return (
    <TaskFormField
      id="estimatedDuration"
      label="Duration"
      icon={<ClockIcon className="h-3.5 w-3.5" />}
      error={error}
    >
      <div className="flex flex-row items-center space-x-1">
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          onBlur={onBlur}
          min="0"
          step="5"
          className="form-input w-20 text-sm py-1 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded"
          placeholder="0"
          aria-label="Duration"
        />
        <span className="text-xs text-gray-600 dark:text-gray-300">
          min
        </span>
      </div>
    </TaskFormField>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const DurationSelector = memo(DurationSelectorComponent); 