import { Emotion } from '@prisma/client';

export interface EmotionOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
  textColor: string;
}

export const emotionOptions: EmotionOption[] = [
  { value: 'excited', label: 'Excited', emoji: '😊', color: 'bg-green-100', textColor: 'text-green-700' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-gray-100', textColor: 'text-gray-700' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-yellow-100', textColor: 'text-yellow-700' },
  { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😫', color: 'bg-red-100', textColor: 'text-red-700' },
  { value: 'confident', label: 'Confident', emoji: '💪', color: 'bg-blue-100', textColor: 'text-blue-700' },
];

// Map from string value to Emotion enum
export const EMOTION_MAP: Record<string, Emotion> = {
  'excited': 'EXCITED',
  'neutral': 'NEUTRAL',
  'anxious': 'ANXIOUS',
  'overwhelmed': 'OVERWHELMED',
  'confident': 'CONFIDENT'
}; 