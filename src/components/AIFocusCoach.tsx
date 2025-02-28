'use client';

import { useState, useEffect, useRef } from 'react';
import { TypingAnimation } from './ui/TypingAnimation';
import { AiReminderService, ReminderType } from '@/lib/ai-reminder-service';
import { TTSService } from '@/lib/tts-service';
import { Task } from '@prisma/client';
import { 
  BoltIcon, 
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MicrophoneIcon,
  StopIcon
} from '@heroicons/react/24/outline';

interface AIFocusCoachProps {
  isActive: boolean;
  focusStartTime?: Date;
  currentTask?: Task;
  nextTask?: Task;
  completedTasks?: Task[];
  remainingTasks?: Task[];
  className?: string;
}

export function AIFocusCoach({
  isActive,
  focusStartTime = new Date(),
  currentTask,
  nextTask,
  completedTasks = [],
  remainingTasks = [],
  className = ''
}: AIFocusCoachProps) {
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [lastReminderType, setLastReminderType] = useState<ReminderType | undefined>(undefined);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [showAgainTimeout, setShowAgainTimeout] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(false);
  const [ttsVoice, setTtsVoice] = useState<'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'>('nova');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  
  const reminderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simulate voice with subtle audio feedback when new messages appear
  const audioFeedbackRef = useRef<HTMLAudioElement | null>(null);
  
  // Track elapsed time in minutes
  useEffect(() => {
    if (!isActive) return;
    
    // Initialize the timer
    minuteTimerRef.current = setInterval(() => {
      // Calculate minutes elapsed since focus started
      const elapsed = Math.floor((new Date().getTime() - focusStartTime.getTime()) / (1000 * 60));
      setElapsedMinutes(elapsed);
    }, 60000); // Update every minute
    
    // Initial calculation
    const initialElapsed = Math.floor((new Date().getTime() - focusStartTime.getTime()) / (1000 * 60));
    setElapsedMinutes(initialElapsed);
    
    return () => {
      if (minuteTimerRef.current) {
        clearInterval(minuteTimerRef.current);
      }
    };
  }, [isActive, focusStartTime]);
  
  // Start reminders when active
  useEffect(() => {
    if (!isActive) {
      // Clear timers when not active
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
      return;
    }
    
    // Show initial greeting message
    if (!currentMessage && !isTyping) {
      const greeting = AiReminderService.getGreeting();
      setCurrentMessage(greeting);
      setIsTyping(true);
      setLastReminderType('greeting');
      playAudioFeedback();
    }
    
    return () => {
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
    };
  }, [isActive, currentMessage, isTyping, isHidden, elapsedMinutes, currentTask, nextTask, completedTasks, remainingTasks, lastReminderType, focusStartTime, ttsEnabled, isMuted]);
  
  // Schedule next reminder when typing completes
  const handleTypingComplete = () => {
    setIsTyping(false);
    
    // Auto-speak if TTS is enabled
    if (ttsEnabled && !isMuted && currentMessage) {
      speakMessage(currentMessage);
    }
    
    // Schedule the next reminder when typing is complete
    scheduleNextReminder();
  };
  
  const scheduleNextReminder = () => {
    // Clear any existing timer
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
    }
    
    // Random interval between 2-5 minutes for the next reminder
    // Shorter during the first 10 minutes, longer after that
    const minInterval = elapsedMinutes < 10 ? 1 : 2;
    const maxInterval = elapsedMinutes < 10 ? 3 : 5;
    const minutes = minInterval + Math.floor(Math.random() * (maxInterval - minInterval + 1));
    const ms = minutes * 60 * 1000;
    
    reminderTimerRef.current = setTimeout(() => {
      if (!isActive) return;
      
      // Generate a contextual reminder
      const { message, type } = AiReminderService.getSmartReminder(elapsedMinutes, {
        currentTask,
        nextTask,
        focusStartTime,
        completedTasks,
        remainingTasks,
        lastReminderType
      });
      
      setCurrentMessage(message);
      setLastReminderType(type);
      setIsTyping(true);
      
      // If the message was hidden, show it again
      if (isHidden) {
        setIsHidden(false);
      }
      
      // Play audio feedback for new message
      playAudioFeedback();
      
    }, ms);
  };
  
  // Play subtle audio feedback for new messages
  const playAudioFeedback = () => {
    if (isMuted) return;
    
    try {
      if (!audioFeedbackRef.current) {
        audioFeedbackRef.current = new Audio('/sounds/notification-soft.mp3');
        audioFeedbackRef.current.volume = 0.2;
      }
      
      audioFeedbackRef.current.play().catch(err => {
        console.log('Audio playback error (likely user interaction required):', err);
      });
    } catch (error) {
      console.error('Failed to play audio feedback:', error);
    }
  };
  
  // Speak the current message using TTS
  const speakMessage = async (message: string) => {
    if (isSpeaking || isMuted) return;
    
    try {
      setIsSpeaking(true);
      
      // Initialize audio context (must be after user interaction)
      TTSService.initAudioContext();
      
      await TTSService.speak(message, ttsVoice);
    } catch (error) {
      console.error('Error speaking message:', error);
    } finally {
      setIsSpeaking(false);
    }
  };
  
  // Stop speaking
  const stopSpeaking = () => {
    TTSService.stopAll();
    setIsSpeaking(false);
  };
  
  // Toggle TTS
  const toggleTTS = () => {
    // If turning on TTS, initialize audio context
    if (!ttsEnabled) {
      TTSService.initAudioContext();
    }
    
    setTtsEnabled(!ttsEnabled);
  };
  
  // Handle temporarily hiding the coach
  const handleHide = () => {
    setIsHidden(true);
    
    // Stop any ongoing speech
    if (isSpeaking) {
      stopSpeaking();
    }
    
    // Automatically show again after 10 minutes
    if (showAgainTimeout) {
      window.clearTimeout(showAgainTimeout);
    }
    
    const timeoutId = window.setTimeout(() => {
      setIsHidden(false);
    }, 10 * 60 * 1000);
    
    setShowAgainTimeout(timeoutId);
  };
  
  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (showAgainTimeout) {
        window.clearTimeout(showAgainTimeout);
      }
      
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
      
      if (minuteTimerRef.current) {
        clearInterval(minuteTimerRef.current);
      }
      
      // Stop any ongoing speech
      TTSService.stopAll();
    };
  }, [showAgainTimeout]);
  
  if (!isActive || isHidden) return null;
  
  return (
    <div className={`bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-4 shadow-lg transition-all duration-300 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center">
          <BoltIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
          <h3 className="font-medium text-purple-900 dark:text-purple-300">Focus Coach</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label={isMuted ? "Unmute notifications" : "Mute notifications"}
          >
            {isMuted ? (
              <SpeakerXMarkIcon className="h-5 w-5" />
            ) : (
              <SpeakerWaveIcon className="h-5 w-5" />
            )}
          </button>
          
          <button 
            onClick={toggleTTS}
            className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${
              ttsEnabled ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded' : ''
            }`}
            aria-label={ttsEnabled ? "Disable voice" : "Enable voice"}
          >
            {ttsEnabled ? (
              <MicrophoneIcon className="h-5 w-5" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5" />
            )}
          </button>
          
          <button 
            onClick={handleHide} 
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Hide AI coach"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {showVoiceSettings && (
        <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Voice
            </label>
            <select
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer')}
              className="w-full p-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
            >
              <option value="nova">Nova (Female)</option>
              <option value="alloy">Alloy (Neutral)</option>
              <option value="echo">Echo (Male)</option>
              <option value="fable">Fable (Male)</option>
              <option value="onyx">Onyx (Male)</option>
              <option value="shimmer">Shimmer (Female)</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowVoiceSettings(false)}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <div className="min-h-[60px] flex items-center">
        <TypingAnimation 
          text={currentMessage}
          speed={40}
          onComplete={handleTypingComplete}
          className="text-gray-800 dark:text-gray-200 text-sm"
        />
      </div>
      
      <div className="flex justify-between mt-3">
        <div>
          {ttsEnabled && (
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              Voice settings
            </button>
          )}
        </div>
        
        <div className="flex space-x-2">
          {!isTyping && currentMessage && ttsEnabled && (
            <>
              {isSpeaking ? (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded"
                >
                  <StopIcon className="h-3 w-3 mr-1" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => speakMessage(currentMessage)}
                  className="flex items-center text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded"
                >
                  <MicrophoneIcon className="h-3 w-3 mr-1" />
                  Speak
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 