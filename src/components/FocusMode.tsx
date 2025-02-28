'use client';

import { useState, useRef, useEffect } from 'react';
import { PomodoroTimer } from './PomodoroTimer';
import { AIFocusCoach } from './AIFocusCoach';
import { Task } from '@prisma/client';
import {
  SpeakerWaveIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  SparklesIcon,
  MoonIcon,
  MusicalNoteIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

const ambientSounds = [
  { id: 'whiteNoise', name: 'White Noise', file: '/sounds/white-noise.mp3' },
  { id: 'rain', name: 'Rain', file: '/sounds/rain.mp3' },
  { id: 'cafe', name: 'Cafe', file: '/sounds/cafe.mp3' },
  { id: 'nature', name: 'Nature', file: '/sounds/nature.mp3' },
  { id: 'brownNoise', name: 'Brown Noise', file: '/sounds/brown-noise.mp3' },
];

const brainwaves = [
  { id: 'alpha', name: 'Alpha (8-13 Hz)', description: 'Promotes relaxation and creativity', file: '/sounds/alpha-waves.mp3' },
  { id: 'beta', name: 'Beta (13-30 Hz)', description: 'Enhances focus and logical thinking', file: '/sounds/beta-waves.mp3' },
  { id: 'theta', name: 'Theta (4-8 Hz)', description: 'Deepens meditation and problem solving', file: '/sounds/theta-waves.mp3' },
  { id: 'delta', name: 'Delta (0.5-4 Hz)', description: 'Promotes deep sleep and healing', file: '/sounds/delta-waves.mp3' },
  { id: 'gamma', name: 'Gamma (30-100 Hz)', description: 'Heightens perception and cognition', file: '/sounds/gamma-waves.mp3' },
];

export function FocusMode({ 
  currentTask, 
  nextTask, 
  completedTasks, 
  remainingTasks 
}: { 
  currentTask?: Task; 
  nextTask?: Task; 
  completedTasks?: Task[]; 
  remainingTasks?: Task[]; 
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [activeBrainwave, setActiveBrainwave] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [brainwaveVolume, setBrainwaveVolume] = useState(0.5);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [isBrainwavePlaying, setIsBrainwavePlaying] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'ambient' | 'brainwaves'>('ambient');
  const [focusStartTime, setFocusStartTime] = useState(new Date());
  const [isAICoachActive, setIsAICoachActive] = useState(true);
  
  const soundAudioRef = useRef<HTMLAudioElement | null>(null);
  const brainwaveAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check system preference for dark mode
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setCurrentMode(isDarkMode ? 'dark' : 'light');
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle ambient sound changes and volume
  useEffect(() => {
    if (activeSound) {
      if (soundAudioRef.current) {
        soundAudioRef.current.pause();
      }
      
      const soundFile = ambientSounds.find((sound) => sound.id === activeSound)?.file;
      if (!soundFile) return;
      
      try {
        soundAudioRef.current = new Audio(soundFile);
        
        if (soundAudioRef.current) {
          soundAudioRef.current.loop = true;
          soundAudioRef.current.volume = soundVolume;
          
          const playPromise = soundAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsSoundPlaying(true);
              })
              .catch((error) => {
                console.error('Ambient sound playback failed:', error);
                setIsSoundPlaying(false);
                alert(`Unable to play ${activeSound} sound. Please try another sound.`);
                setActiveSound(null);
              });
          }
        }
      } catch (error) {
        console.error('Error creating audio element:', error);
        setIsSoundPlaying(false);
        alert(`Unable to load ${activeSound} sound. Please try another sound.`);
        setActiveSound(null);
      }
    } else if (soundAudioRef.current) {
      soundAudioRef.current.pause();
      setIsSoundPlaying(false);
    }

    return () => {
      if (soundAudioRef.current) {
        soundAudioRef.current.pause();
      }
    };
  }, [activeSound, soundVolume]);

  // Handle brainwave sound changes and volume
  useEffect(() => {
    if (activeBrainwave) {
      if (brainwaveAudioRef.current) {
        brainwaveAudioRef.current.pause();
      }
      
      const brainwaveFile = brainwaves.find((wave) => wave.id === activeBrainwave)?.file;
      if (!brainwaveFile) return;
      
      try {
        brainwaveAudioRef.current = new Audio(brainwaveFile);
        
        if (brainwaveAudioRef.current) {
          brainwaveAudioRef.current.loop = true;
          brainwaveAudioRef.current.volume = brainwaveVolume;
          
          const playPromise = brainwaveAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsBrainwavePlaying(true);
              })
              .catch((error) => {
                console.error('Brainwave sound playback failed:', error);
                setIsBrainwavePlaying(false);
                alert(`Unable to play ${activeBrainwave} wave. Please try another brainwave.`);
                setActiveBrainwave(null);
              });
          }
        }
      } catch (error) {
        console.error('Error creating audio element:', error);
        setIsBrainwavePlaying(false);
        alert(`Unable to load ${activeBrainwave} wave. Please try another brainwave.`);
        setActiveBrainwave(null);
      }
    } else if (brainwaveAudioRef.current) {
      brainwaveAudioRef.current.pause();
      setIsBrainwavePlaying(false);
    }

    return () => {
      if (brainwaveAudioRef.current) {
        brainwaveAudioRef.current.pause();
      }
    };
  }, [activeBrainwave, brainwaveVolume]);

  // Update ambient sound volume when changed
  useEffect(() => {
    if (soundAudioRef.current) {
      soundAudioRef.current.volume = soundVolume;
    }
  }, [soundVolume]);

  // Update brainwave volume when changed
  useEffect(() => {
    if (brainwaveAudioRef.current) {
      brainwaveAudioRef.current.volume = brainwaveVolume;
    }
  }, [brainwaveVolume]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const toggleTheme = () => {
    setCurrentMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Toggle ambient sound playback
  const toggleSoundPlayback = () => {
    if (soundAudioRef.current) {
      if (isSoundPlaying) {
        soundAudioRef.current.pause();
        setIsSoundPlaying(false);
      } else {
        soundAudioRef.current.play().then(() => {
          setIsSoundPlaying(true);
        }).catch(error => {
          console.error('Error playing ambient sound:', error);
        });
      }
    }
  };

  // Toggle brainwave playback
  const toggleBrainwavePlayback = () => {
    if (brainwaveAudioRef.current) {
      if (isBrainwavePlaying) {
        brainwaveAudioRef.current.pause();
        setIsBrainwavePlaying(false);
      } else {
        brainwaveAudioRef.current.play().then(() => {
          setIsBrainwavePlaying(true);
        }).catch(error => {
          console.error('Error playing brainwave:', error);
        });
      }
    }
  };

  // Render productivity tips
  const renderProductivityTips = () => {
    const tips = [
      "Follow the 2-minute rule: If a task takes less than 2 minutes, do it now.",
      "Use the Pomodoro Technique: 25 minutes of focused work, then a 5-minute break.",
      "Group similar tasks together to minimize context switching.",
      "Break large tasks into smaller, manageable subtasks.",
      "Designate specific times for checking emails and messages.",
      "Keep your workspace organized to minimize distractions.",
      "Use the 80/20 rule: Focus on the 20% of tasks that yield 80% of results.",
      "Set clear, achievable goals for each work session.",
      "Take regular breaks to maintain mental energy and focus.",
      "Practice mindfulness to improve concentration and reduce stress."
    ];

    // If in fullscreen mode, render tips as a floating modal
    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className={`relative max-w-md w-full p-6 rounded-lg shadow-xl ${
              currentMode === 'light' ? 'bg-white' : 'bg-gray-800'
            }`}
          >
            <button 
              onClick={() => setShowTips(false)}
              className={`absolute top-3 right-3 p-1 rounded-full ${
                currentMode === 'light' ? 'text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            <h3 className={`text-xl font-medium mb-4 ${
              currentMode === 'light' ? 'text-blue-800' : 'text-blue-300'
            }`}>
              Productivity Tips
            </h3>
            
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li 
                    key={index}
                    className={`${currentMode === 'light' ? 'text-gray-700' : 'text-gray-200'} py-1`}
                  >
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Regular display for non-fullscreen mode
    return (
      <div 
        className={`mt-6 p-4 rounded-lg ${
          currentMode === 'light' ? 'bg-blue-50 border border-blue-100' : 'bg-blue-900/20 border border-blue-800/30'
        }`}
      >
        <h3 className={`text-lg font-medium mb-3 ${
          currentMode === 'light' ? 'text-blue-800' : 'text-blue-300'
        }`}>
          Productivity Tips
        </h3>
        <ul className="space-y-2 text-sm">
          {tips.map((tip, index) => (
            <li 
              key={index}
              className={currentMode === 'light' ? 'text-blue-700' : 'text-blue-200'}
            >
              • {tip}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Audio controls UI component
  const renderAudioControls = (volume: number, setVolume: (value: number) => void, isPlaying: boolean, togglePlayback: () => void) => (
    <div className="mt-6">
      <label
        htmlFor="volume"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Volume
      </label>
      <input
        type="range"
        id="volume"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-400"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      
      <div className="flex justify-center mt-4">
        <button
          onClick={togglePlayback}
          className={`flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium ${
            isPlaying
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/40'
          } transition-colors duration-200`}
        >
          {isPlaying ? (
            <>
              <PauseIcon className="h-4 w-4 mr-2" />
              Pause
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`${
        isFullscreen 
          ? 'fixed inset-0 flex flex-col items-center justify-center p-8 z-40 overflow-hidden' 
          : 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700'
      } ${
        currentMode === 'dark' && isFullscreen 
          ? 'bg-gray-900 text-white' 
          : currentMode === 'light' && isFullscreen 
          ? 'bg-gray-50 text-gray-900' 
          : ''
      } transition-all duration-300`}
    >
      <div className="flex justify-between items-center mb-6 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Focus Mode</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <SparklesIcon className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => setIsAICoachActive(!isAICoachActive)}
            className={`text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors ${
              isAICoachActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : ''
            }`}
            aria-label={isAICoachActive ? "Disable AI Coach" : "Enable AI Coach"}
          >
            <BoltIcon className="h-6 w-6" />
          </button>
          
          {isFullscreen && (
            <button
              onClick={toggleTheme}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
            >
              <MoonIcon className="h-6 w-6" />
            </button>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-6 w-6" />
            ) : (
              <ArrowsPointingOutIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        <div className="md:col-span-1">
          <PomodoroTimer />
          
          <AIFocusCoach
            isActive={isAICoachActive}
            focusStartTime={focusStartTime}
            currentTask={currentTask}
            nextTask={nextTask}
            completedTasks={completedTasks}
            remainingTasks={remainingTasks}
            className="mt-6"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Ambient Sounds
            </h3>
            <div className="flex">
              <SparklesIcon className="h-5 w-5 text-teal-600 dark:text-teal-400 mr-1" />
            </div>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
            {ambientSounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() =>
                  setActiveSound(activeSound === sound.id ? null : sound.id)
                }
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-150 ${
                  activeSound === sound.id
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-1 ring-teal-300 dark:ring-teal-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="font-medium">{sound.name}</span>
                {activeSound === sound.id && <SparklesIcon className="h-5 w-5" />}
              </button>
            ))}

            {activeSound && renderAudioControls(soundVolume, setSoundVolume, isSoundPlaying, toggleSoundPlayback)}
          </div>
          
          {showTips && renderProductivityTips()}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Brainwaves
            </h3>
            <div className="flex">
              <SparklesIcon className="h-5 w-5 text-teal-600 dark:text-teal-400 mr-1" />
            </div>
          </div>
          
          <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
            {brainwaves.map((wave) => (
              <button
                key={wave.id}
                onClick={() =>
                  setActiveBrainwave(activeBrainwave === wave.id ? null : wave.id)
                }
                className={`flex flex-col items-start w-full px-4 py-3 rounded-lg transition-colors duration-150 ${
                  activeBrainwave === wave.id
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 ring-1 ring-teal-300 dark:ring-teal-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{wave.name}</span>
                  {activeBrainwave === wave.id && <SparklesIcon className="h-5 w-5" />}
                </div>
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{wave.description}</p>
              </button>
            ))}

            {activeBrainwave && renderAudioControls(brainwaveVolume, setBrainwaveVolume, isBrainwavePlaying, toggleBrainwavePlayback)}
          </div>
        </div>
      </div>
    </div>
  );
} 