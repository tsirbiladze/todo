import React from 'react';
import { emotionOptions } from "@/data/emotions";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { TaskFormField } from './TaskFormField';
import { useTranslation } from '@/lib/i18n';

interface EmotionSelectorProps {
  value: string;
  onChange: (emotion: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function EmotionSelector({ value, onChange, onBlur, error }: EmotionSelectorProps) {
  const { t } = useTranslation();

  // Handle emotion selection
  const handleSelect = (emotionValue: string) => {
    onChange(emotionValue);
    if (onBlur) onBlur();
  };

  return (
    <TaskFormField
      id="emotion"
      label="Emotion"
      icon={<FaceSmileIcon className="h-3.5 w-3.5" />}
      error={error}
    >
      <div 
        role="radiogroup" 
        aria-labelledby="emotion-label"
        className="flex flex-wrap gap-1"
      >
        {emotionOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
              value === option.value 
                ? `${option.color} ${option.textColor} border-transparent`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600'
            }`}
            role="radio"
            aria-checked={value === option.value}
          >
            <span className="text-base" aria-hidden="true">{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </TaskFormField>
  );
} 