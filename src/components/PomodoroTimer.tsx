'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ForwardIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
}

// Default times in seconds
const defaultTimes: TimerSettings = {
  pomodoro: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export function PomodoroTimer() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(defaultTimes[mode]);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customTimes, setCustomTimes] = useState<TimerSettings>(defaultTimes);
  const [editableTimes, setEditableTimes] = useState<TimerSettings>(defaultTimes);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

  // Initialize audio and check for permission
  useEffect(() => {
    audioRef.current = new Audio('/sounds/bell.mp3');
    
    // Try to play audio on user interaction to get permission
    const tryToGetAudioPermission = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0.01;  // Nearly silent
        audioRef.current.play()
          .then(() => {
            // Successfully played, so permission is granted
            setAudioPermissionGranted(true);
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
          })
          .catch((err) => {
            console.log('Audio permission not granted yet:', err.message);
          });
      }
    };
    
    // Add listener for user interaction to get audio permission
    const handleInteraction = () => {
      tryToGetAudioPermission();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    
    // Load saved timer settings from localStorage
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings) as TimerSettings;
        setCustomTimes(parsedSettings);
        setEditableTimes(parsedSettings);
        setTimeLeft(parsedSettings[mode]);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      
      // Clear any timers
      if (intervalRef.current) {
        cancelAnimationFrame(intervalRef.current);
      }
    };
  }, []);

  // Apply custom times when changed
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(customTimes[mode]);
    }
  }, [customTimes, mode, isRunning]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    if (soundEnabled && audioRef.current) {
      try {
        if (audioPermissionGranted) {
          audioRef.current.volume = 1.0;
          await audioRef.current.play();
        } else {
          console.warn('Audio play was attempted but permission not granted');
          // Maybe show a visual notification instead
        }
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }

    if (mode === 'pomodoro') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      // Calculate actual duration
      const actualDuration = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
        : customTimes.pomodoro;
        
      startTimeRef.current = null;
      targetEndTimeRef.current = null;
      
      // Save focus session
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/focus-sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: session.user.id,
              duration: Math.floor(actualDuration / 60), // Convert to minutes
              type: 'pomodoro',
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to save focus session: ${response.status}`);
          }
        } catch (error) {
          console.error('Error saving focus session:', error);
          // Show a toast or notification for error
        }
      }

      // After 4 pomodoros, take a long break
      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(customTimes.longBreak);
      } else {
        setMode('shortBreak');
        setTimeLeft(customTimes.shortBreak);
      }
    } else {
      setMode('pomodoro');
      setTimeLeft(customTimes.pomodoro);
    }
  }, [completedPomodoros, mode, session, soundEnabled, customTimes, audioPermissionGranted]);

  // More precise timer using requestAnimationFrame
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      // Record start time if first start
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
        targetEndTimeRef.current = Date.now() + (timeLeft * 1000);
      } else if (pausedTimeRef.current !== null) {
        // Adjust after pause
        const pauseDuration = Date.now() - pausedTimeRef.current;
        targetEndTimeRef.current = (targetEndTimeRef.current || 0) + pauseDuration;
        pausedTimeRef.current = null;
      }
      
      // Use requestAnimationFrame for more accurate timing
      const updateTimer = () => {
        const now = Date.now();
        const target = targetEndTimeRef.current || 0;
        
        if (now >= target) {
          // Timer complete
          setTimeLeft(0);
          handleTimerComplete();
          return;
        }
        
        // Calculate remaining time
        const newTimeLeft = Math.ceil((target - now) / 1000);
        setTimeLeft(newTimeLeft);
        
        // Schedule next update
        intervalRef.current = requestAnimationFrame(updateTimer);
      };
      
      // Start the animation frame loop
      intervalRef.current = requestAnimationFrame(updateTimer);
      
      // Clean up function
      return () => {
        if (intervalRef.current) {
          cancelAnimationFrame(intervalRef.current);
        }
      };
    }
  }, [isRunning, handleTimerComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(customTimes[mode]);
    startTimeRef.current = null;
    pausedTimeRef.current = null;
    
    if (intervalRef.current) {
      cancelAnimationFrame(intervalRef.current);
    }
  };

  const skipTimer = () => {
    handleTimerComplete();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const getModeColors = () => {
    switch (mode) {
      case 'pomodoro':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'shortBreak':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'longBreak':
        return 'bg-purple-600 hover:bg-purple-700 text-white';
    }
  };

  const getProgressColor = () => {
    switch (mode) {
      case 'pomodoro':
        return 'text-blue-500 dark:text-blue-400';
      case 'shortBreak':
        return 'text-green-500 dark:text-green-400';
      case 'longBreak':
        return 'text-purple-500 dark:text-purple-400';
    }
  };

  const getProgressPercentage = () => {
    return ((customTimes[mode] - timeLeft) / customTimes[mode]) * 100;
  };

  const saveSettings = () => {
    // Validate input values
    const validatedTimes = {
      pomodoro: Math.min(Math.max(1, editableTimes.pomodoro), 120) * 60,
      shortBreak: Math.min(Math.max(1, editableTimes.shortBreak), 30) * 60,
      longBreak: Math.min(Math.max(1, editableTimes.longBreak), 60) * 60,
    };
    
    setCustomTimes(validatedTimes);
    setTimeLeft(validatedTimes[mode]);
    setShowSettings(false);
    
    // Save to localStorage
    localStorage.setItem('pomodoroSettings', JSON.stringify(validatedTimes));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Pomodoro Timer</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            {soundEnabled ? (
              <SpeakerWaveIcon className="h-5 w-5" />
            ) : (
              <SpeakerXMarkIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-center space-x-2 mb-6">
        <button
          onClick={() => {
            setMode('pomodoro');
            setTimeLeft(customTimes.pomodoro);
            setIsRunning(false);
            startTimeRef.current = null;
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            mode === 'pomodoro'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700/50'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => {
            setMode('shortBreak');
            setTimeLeft(customTimes.shortBreak);
            setIsRunning(false);
            startTimeRef.current = null;
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            mode === 'shortBreak'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 ring-1 ring-green-300 dark:ring-green-700/50'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => {
            setMode('longBreak');
            setTimeLeft(customTimes.longBreak);
            setIsRunning(false);
            startTimeRef.current = null;
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            mode === 'longBreak'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-700/50'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Long Break
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="relative mx-auto mb-4 w-48 h-48 rounded-full border-8 border-gray-100 dark:border-gray-800 flex items-center justify-center">
          <svg className="absolute inset-0 transform -rotate-90" width="100%" height="100%" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="46" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="8" 
              className="text-gray-200 dark:text-gray-700" 
            />
            <circle 
              cx="50" 
              cy="50" 
              r="46" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="8" 
              strokeDasharray="289.02652413026095" 
              className={`${getProgressColor()}`}
              initial={{ strokeDashoffset: 289.02652413026095 }}
              animate={{ 
                strokeDashoffset: 289.02652413026095 * (1 - getProgressPercentage() / 100) 
              }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <span 
            className="text-5xl font-bold text-gray-900 dark:text-white"
          >
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="flex justify-center space-x-3">
          <button
            onClick={toggleTimer}
            className={`${getModeColors()} px-5 py-2 rounded-lg font-medium flex items-center shadow-sm transition-colors duration-150`}
          >
            {isRunning ? (
              <>
                <PauseIcon className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5 mr-2" />
                Start
              </>
            )}
          </button>
          <button
            onClick={resetTimer}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg font-medium flex items-center transition-colors duration-150"
          >
            <ArrowPathIcon className="h-5 w-5 mr-1" />
            Reset
          </button>
          <button
            onClick={skipTimer}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg font-medium flex items-center transition-colors duration-150"
            title="Skip to next"
          >
            <ForwardIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="text-gray-700 dark:text-gray-300 mb-2">
          Completed Pomodoros: {completedPomodoros}
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-3 rounded-full ${
              mode === 'pomodoro' 
                ? 'bg-blue-500 dark:bg-blue-400' 
                : mode === 'shortBreak' 
                  ? 'bg-green-500 dark:bg-green-400' 
                  : 'bg-purple-500 dark:bg-purple-400'
            }`}
            style={{ width: `${(completedPomodoros % 4) * 25}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {4 - (completedPomodoros % 4)} pomodoros until long break
        </div>
      </div>

      {showSettings && (
        <div 
          className="absolute inset-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 z-10"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Timer Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={Math.floor(editableTimes.pomodoro / 60)}
                onChange={(e) => setEditableTimes({
                  ...editableTimes,
                  pomodoro: Number(e.target.value) * 60
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={Math.floor(editableTimes.shortBreak / 60)}
                onChange={(e) => setEditableTimes({
                  ...editableTimes,
                  shortBreak: Number(e.target.value) * 60
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={Math.floor(editableTimes.longBreak / 60)}
                onChange={(e) => setEditableTimes({
                  ...editableTimes,
                  longBreak: Number(e.target.value) * 60
                })}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={saveSettings}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
            >
              <CheckIcon className="h-5 w-5 mr-1.5" />
              Save Settings
            </button>
            <button
              onClick={() => {
                setEditableTimes(defaultTimes);
                setShowSettings(false);
              }}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium py-2 px-4 rounded-md"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 