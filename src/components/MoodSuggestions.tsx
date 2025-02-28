import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';

interface MoodSuggestionsProps {
  mood: string;
  className?: string;
}

export function MoodSuggestions({ mood, className = '' }: MoodSuggestionsProps) {
  // Get suggestions based on mood
  const suggestions = getMoodSuggestions(mood);
  
  if (!suggestions) {
    return null;
  }
  
  return (
    <div className={`rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-4 ${className}`}>
      <div className="flex items-start">
        <LightBulbIcon className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-medium text-indigo-800 dark:text-indigo-300 text-sm mb-1">
            {getTitleForMood(mood)}
          </h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            {suggestions}
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper to get title based on mood
function getTitleForMood(mood: string): string {
  switch (mood) {
    case 'excited':
      return 'Channel Your Energy';
    case 'neutral':
      return 'Find Your Focus';
    case 'anxious':
      return 'Reduce Anxiety';
    case 'overwhelmed':
      return 'Tackle Overwhelm';
    case 'confident':
      return 'Maximize Momentum';
    default:
      return 'Productivity Tip';
  }
}

// Helper to get suggestions based on mood
function getMoodSuggestions(mood: string): string | null {
  switch (mood) {
    case 'excited':
      return "You're feeling excited! This is a great time to tackle creative tasks or start new projects. Your energy can help you make significant progress.";
    
    case 'neutral':
      return "While feeling neutral, focus on routine tasks that require steady attention. This balanced state is ideal for methodical work and planning.";
    
    case 'anxious':
      return "When anxious, break down tasks into smaller steps. Consider starting with a quick, achievable task to build momentum and reduce worry.";
    
    case 'overwhelmed':
      return "Feeling overwhelmed? Prioritize just 1-3 essential tasks. Take short breaks, practice deep breathing, and remember to celebrate small wins.";
    
    case 'confident':
      return "With your confidence high, this is the perfect time to tackle challenging tasks or important decisions that you've been postponing.";
    
    default:
      return null;
  }
} 