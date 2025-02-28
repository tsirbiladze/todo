import React, { useState, useEffect, useMemo } from 'react';
import { emotionOptions } from "@/data/emotions";
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { TaskFormField } from './TaskFormField';
import { Transition } from '@headlessui/react';

interface EmotionSelectorProps {
  selectedEmotion: string;
  onEmotionChange: (emotion: string) => void;
}

export function EmotionSelector({ selectedEmotion, onEmotionChange }: EmotionSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverEmotion, setHoverEmotion] = useState<string | null>(null);
  
  const emotionIcon = useMemo(() => (
    <FaceSmileIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" aria-hidden="true" />
  ), []);

  // Close the picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.emotion-selector-container')) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Find the selected emotion object
  const selectedEmotionObj = selectedEmotion 
    ? emotionOptions.find(e => e.value === selectedEmotion) 
    : null;

  return (
    <TaskFormField
      id="emotion-group"
      label="How do you feel about this task?"
      icon={emotionIcon}
    >
      <div 
        role="radiogroup" 
        aria-labelledby="emotion-group-label"
        className="emotion-selector-container"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Current Selection Button */}
          {selectedEmotionObj && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5
                ${selectedEmotionObj.color} ${selectedEmotionObj.textColor}
                border border-transparent hover:border-${selectedEmotionObj.color.split('-')[1]}-400
                transition-all duration-200
              `}
            >
              <span className="text-lg">{selectedEmotionObj.emoji}</span>
              <span>{selectedEmotionObj.label}</span>
            </button>
          )}
          
          {/* Quick Select Buttons */}
          <div className="flex gap-1.5">
            {emotionOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onEmotionChange(option.value)}
                className={`
                  h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200
                  ${selectedEmotion === option.value
                    ? `${option.color} ${option.textColor} ring-2 ring-${option.color.split('-')[1]}-400 ring-offset-1`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}
                `}
                role="radio"
                aria-checked={selectedEmotion === option.value}
                aria-label={`Feeling: ${option.label}`}
              >
                <span aria-hidden="true" className="text-lg">{option.emoji}</span>
              </button>
            ))}
            
            {/* Expand Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              aria-label="More emotions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Expanded View */}
        <Transition
          show={isExpanded}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md">
            <div className="grid grid-cols-1 gap-1">
              {emotionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onEmotionChange(option.value);
                    setIsExpanded(false);
                  }}
                  onMouseEnter={() => setHoverEmotion(option.value)}
                  onMouseLeave={() => setHoverEmotion(null)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors duration-150
                    ${(selectedEmotion === option.value || hoverEmotion === option.value)
                      ? `${option.color} ${option.textColor}`
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
                  `}
                  role="radio"
                  aria-checked={selectedEmotion === option.value}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getEmotionDescription(option.value)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Transition>
      </div>
    </TaskFormField>
  );
}

// Helper function to get descriptions for each emotion
function getEmotionDescription(emotion: string): string {
  switch (emotion) {
    case 'excited':
      return 'Eagerly looking forward to this task';
    case 'neutral':
      return 'Neither positive nor negative about this';
    case 'anxious':
      return 'Feeling worried or uneasy about this';
    case 'overwhelmed':
      return 'Feeling like this is too much to handle';
    case 'confident':
      return 'Feeling capable and ready to tackle this';
    default:
      return '';
  }
} 