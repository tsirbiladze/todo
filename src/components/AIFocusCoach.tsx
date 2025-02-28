'use client';

import { useState, useEffect, useRef } from 'react';
import { TypingAnimation } from './ui/TypingAnimation';
import { AiReminderService, ReminderType } from '@/lib/ai-reminder-service';
import { TTSService } from '@/lib/tts-service';
import { Task } from '@prisma/client';
import { 
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MicrophoneIcon,
  StopIcon,
  AdjustmentsHorizontalIcon
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
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
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
      
      await TTSService.speak(message, ttsVoice, ttsSpeed);
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
    <div className={`rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="relative">
        {/* Message Display */}
        <div className="min-h-[8rem] p-4">
          {isTyping ? (
            <TypingAnimation 
              text={currentMessage} 
              onComplete={handleTypingComplete} 
              className="text-gray-700 dark:text-gray-300"
              speed={60}
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              {currentMessage}
            </p>
          )}
        </div>
        
        {/* Bottom Controls */}
        <div className="flex justify-between items-center p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Left Controls */}
          <div className="flex space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-full ${
                isMuted
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-4 w-4" />
              ) : (
                <SpeakerWaveIcon className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={toggleTTS}
              className={`p-1.5 rounded-full ${
                ttsEnabled
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              aria-label={ttsEnabled ? "Disable voice" : "Enable voice"}
            >
              <MicrophoneIcon className="h-4 w-4" />
            </button>
            
            {ttsEnabled && (
              <>
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className={`p-1.5 rounded-full ${
                    showVoiceSettings
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  aria-label="Voice settings"
                >
                  <AdjustmentsHorizontalIcon className="h-4 w-4" />
                </button>
                
                {!isSpeaking && !isTyping && currentMessage && (
                  <button
                    onClick={() => speakMessage(currentMessage)}
                    className="p-1.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    aria-label="Speak message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
                
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-1.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    aria-label="Stop speaking"
                  >
                    <StopIcon className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
          
          {/* Right Controls */}
          <button
            onClick={handleHide}
            className="p-1.5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            aria-label="Hide AI coach"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        
        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 animate-fade-in">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voice
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['nova', 'alloy', 'echo', 'fable', 'onyx', 'shimmer'] as const).map((voice) => (
                    <button
                      key={voice}
                      onClick={() => setTtsVoice(voice)}
                      className={`text-xs py-1 px-2 rounded-md ${
                        ttsVoice === voice
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {voice.charAt(0).toUpperCase() + voice.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Speech Speed: {ttsSpeed.toFixed(1)}x
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">0.5x</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                    className="flex-grow h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">2.0x</span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    // Speak a test message with current settings
                    speakMessage("This is a test of the text-to-speech feature with the current voice settings.");
                  }}
                  className="text-xs py-1 px-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded"
                  disabled={isSpeaking}
                >
                  Test Voice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 