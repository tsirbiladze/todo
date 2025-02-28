import React, { useState, useEffect } from 'react';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import { emotionOptions } from '@/data/emotions';

interface EmotionTrackerProps {
  currentMood: string | null;
  onMoodChange: (mood: string) => void;
  showLabel?: boolean;
  className?: string;
}

export function EmotionTracker({
  currentMood,
  onMoodChange,
  showLabel = true,
  className = '',
}: EmotionTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverEmotion, setHoverEmotion] = useState<string | null>(null);

  // Close the picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.emotion-tracker-container')) {
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

  // Find the current mood object
  const selectedMood = currentMood 
    ? emotionOptions.find(e => e.value === currentMood) 
    : null;

  // Handle mood selection
  const handleMoodSelect = (value: string) => {
    onMoodChange(value);
    setIsExpanded(false);
  };

  return (
    <div className={`emotion-tracker-container relative ${className}`}>
      <div className="flex items-center gap-3">
        {showLabel && (
          <div className="flex items-center">
            <HeartIconSolid className="h-5 w-5 text-pink-500 dark:text-pink-400 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              How are you feeling?
            </span>
          </div>
        )}
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Current Selection (if any) */}
          {selectedMood && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                ${selectedMood.color} ${selectedMood.textColor} 
                border border-transparent hover:border-${selectedMood.color.split('-')[1]}-300
                transition-all duration-200
              `}
            >
              <span className="text-lg">{selectedMood.emoji}</span>
              <span>{selectedMood.label}</span>
            </button>
          )}
          
          {/* Quick Mood Selection */}
          <div className="flex gap-1">
            {emotionOptions.map((emotion) => (
              <button
                key={emotion.value}
                type="button"
                onClick={() => handleMoodSelect(emotion.value)}
                className={`
                  h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200
                  ${currentMood === emotion.value
                    ? `${emotion.color} ${emotion.textColor} ring-2 ring-${emotion.color.split('-')[1]}-400 ring-offset-1 dark:ring-offset-gray-800`
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm border border-gray-200 dark:border-gray-600'
                  }
                `}
                title={emotion.label}
              >
                <span className="text-lg">{emotion.emoji}</span>
              </button>
            ))}
            
            {/* More Info Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-9 w-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 shadow-sm transition-all duration-200"
              aria-label="Emotion details"
              title="See details"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Expanded View */}
      <Transition
        show={isExpanded}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <div className="absolute left-0 z-10 mt-2 w-80 origin-top-left bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Your Emotional State</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Tracking your emotions helps you understand your productivity patterns and mental wellbeing.
            </p>
            
            <div className="grid grid-cols-1 gap-1 mt-2">
              {emotionOptions.map((emotion) => (
                <button
                  key={emotion.value}
                  type="button"
                  onClick={() => handleMoodSelect(emotion.value)}
                  onMouseEnter={() => setHoverEmotion(emotion.value)}
                  onMouseLeave={() => setHoverEmotion(null)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-left
                    ${(currentMood === emotion.value || hoverEmotion === emotion.value)
                      ? `${emotion.color} ${emotion.textColor}`
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    transition-all duration-100
                  `}
                >
                  <span className="text-xl">{emotion.emoji}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{emotion.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getEmotionDescription(emotion.value)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Your emotional data is used to provide insights in the Analytics section.
            </div>
          </div>
        </div>
      </Transition>
    </div>
  );
}

// Helper function to get descriptions for each emotion
function getEmotionDescription(emotion: string): string {
  switch (emotion) {
    case 'excited':
      return 'Feeling energized and positive about today\'s tasks';
    case 'neutral':
      return 'Neither particularly positive nor negative today';
    case 'anxious':
      return 'Feeling uncertain or worried about pending tasks';
    case 'overwhelmed':
      return 'Feeling like there\'s too much to handle right now';
    case 'confident':
      return 'Feeling capable and ready to tackle today\'s challenges';
    default:
      return '';
  }
} 