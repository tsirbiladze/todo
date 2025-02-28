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
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

// Audio fade duration in milliseconds
const FADE_DURATION = 1000;

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
  const [showMixer, setShowMixer] = useState(false);
  const [isBreathingAnimationActive, setIsBreathingAnimationActive] = useState(false);
  
  const soundAudioRef = useRef<HTMLAudioElement | null>(null);
  const brainwaveAudioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const brainwaveFadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Track active task for focus session logging
  useEffect(() => {
    if (currentTask) {
      localStorage.setItem('activeTaskId', currentTask.id);
    } else {
      localStorage.removeItem('activeTaskId');
    }
  }, [currentTask]);

  // Track active sound settings for focus session logging
  useEffect(() => {
    if (activeSound) {
      localStorage.setItem('activeAmbientSound', activeSound);
    } else {
      localStorage.removeItem('activeAmbientSound');
    }
  }, [activeSound]);

  // Track active brainwave for focus session logging
  useEffect(() => {
    if (activeBrainwave) {
      localStorage.setItem('activeBrainwave', activeBrainwave);
    } else {
      localStorage.removeItem('activeBrainwave');
    }
  }, [activeBrainwave]);

  // Fade audio in
  const fadeInAudio = (audioElement: HTMLAudioElement, targetVolume: number, isAmbient: boolean) => {
    if (!audioElement) return;
    
    // Clear any existing fade intervals
    if (isAmbient && fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    } else if (!isAmbient && brainwaveFadeIntervalRef.current) {
      clearInterval(brainwaveFadeIntervalRef.current);
    }
    
    // Start from a very low volume
    audioElement.volume = 0.01;
    
    // Start playing
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Set up the fade-in
        let volume = 0.01;
        const step = targetVolume / (FADE_DURATION / 50); // 50ms intervals
        
        const fadeInterval = setInterval(() => {
          volume = Math.min(volume + step, targetVolume);
          audioElement.volume = volume;
          
          if (volume >= targetVolume) {
            if (isAmbient) {
              setIsSoundPlaying(true);
              fadeIntervalRef.current = null;
            } else {
              setIsBrainwavePlaying(true);
              brainwaveFadeIntervalRef.current = null;
            }
            clearInterval(fadeInterval);
          }
        }, 50);
        
        if (isAmbient) {
          fadeIntervalRef.current = fadeInterval;
        } else {
          brainwaveFadeIntervalRef.current = fadeInterval;
        }
      }).catch((error) => {
        console.error('Audio playback failed:', error);
        if (isAmbient) {
          setIsSoundPlaying(false);
          alert(`Unable to play ${activeSound} sound. Please try another sound.`);
          setActiveSound(null);
        } else {
          setIsBrainwavePlaying(false);
          alert(`Unable to play ${activeBrainwave} wave. Please try another brainwave.`);
          setActiveBrainwave(null);
        }
      });
    }
  };
  
  // Fade audio out
  const fadeOutAudio = (audioElement: HTMLAudioElement, isAmbient: boolean, onComplete?: () => void) => {
    if (!audioElement) {
      if (onComplete) onComplete();
      return;
    }
    
    // Clear any existing fade intervals
    if (isAmbient && fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    } else if (!isAmbient && brainwaveFadeIntervalRef.current) {
      clearInterval(brainwaveFadeIntervalRef.current);
      brainwaveFadeIntervalRef.current = null;
    }
    
    // Get starting volume
    const startVolume = audioElement.volume;
    let volume = startVolume;
    const step = startVolume / (FADE_DURATION / 50); // 50ms intervals
    
    const fadeInterval = setInterval(() => {
      volume = Math.max(volume - step, 0);
      audioElement.volume = volume;
      
      if (volume <= 0) {
        clearInterval(fadeInterval);
        audioElement.pause();
        if (isAmbient) {
          setIsSoundPlaying(false);
          fadeIntervalRef.current = null;
        } else {
          setIsBrainwavePlaying(false);
          brainwaveFadeIntervalRef.current = null;
        }
        if (onComplete) onComplete();
      }
    }, 50);
    
    if (isAmbient) {
      fadeIntervalRef.current = fadeInterval;
    } else {
      brainwaveFadeIntervalRef.current = fadeInterval;
    }
  };

  // Handle ambient sound changes and volume
  useEffect(() => {
    if (activeSound) {
      if (soundAudioRef.current) {
        // Fade out current sound before changing
        fadeOutAudio(soundAudioRef.current, true, () => {
          const soundFile = ambientSounds.find((sound) => sound.id === activeSound)?.file;
          if (!soundFile) return;
          
          try {
            soundAudioRef.current = new Audio(soundFile);
            
            if (soundAudioRef.current) {
              soundAudioRef.current.loop = true;
              fadeInAudio(soundAudioRef.current, soundVolume, true);
            }
          } catch (error) {
            console.error('Error creating audio element:', error);
            setIsSoundPlaying(false);
            alert(`Unable to load ${activeSound} sound. Please try another sound.`);
            setActiveSound(null);
          }
        });
      } else {
        // First initialization, no fade needed
        const soundFile = ambientSounds.find((sound) => sound.id === activeSound)?.file;
        if (!soundFile) return;
        
        try {
          soundAudioRef.current = new Audio(soundFile);
          
          if (soundAudioRef.current) {
            soundAudioRef.current.loop = true;
            fadeInAudio(soundAudioRef.current, soundVolume, true);
          }
        } catch (error) {
          console.error('Error creating audio element:', error);
          setIsSoundPlaying(false);
          alert(`Unable to load ${activeSound} sound. Please try another sound.`);
          setActiveSound(null);
        }
      }
    } else if (soundAudioRef.current && isSoundPlaying) {
      fadeOutAudio(soundAudioRef.current, true);
    }

    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, [activeSound]);

  // Handle brainwave sound changes and volume
  useEffect(() => {
    if (activeBrainwave) {
      if (brainwaveAudioRef.current) {
        // Fade out current sound before changing
        fadeOutAudio(brainwaveAudioRef.current, false, () => {
          const brainwaveFile = brainwaves.find((wave) => wave.id === activeBrainwave)?.file;
          if (!brainwaveFile) return;
          
          try {
            brainwaveAudioRef.current = new Audio(brainwaveFile);
            
            if (brainwaveAudioRef.current) {
              brainwaveAudioRef.current.loop = true;
              fadeInAudio(brainwaveAudioRef.current, brainwaveVolume, false);
            }
          } catch (error) {
            console.error('Error creating audio element:', error);
            setIsBrainwavePlaying(false);
            alert(`Unable to load ${activeBrainwave} wave. Please try another brainwave.`);
            setActiveBrainwave(null);
          }
        });
      } else {
        // First initialization, no fade needed
        const brainwaveFile = brainwaves.find((wave) => wave.id === activeBrainwave)?.file;
        if (!brainwaveFile) return;
        
        try {
          brainwaveAudioRef.current = new Audio(brainwaveFile);
          
          if (brainwaveAudioRef.current) {
            brainwaveAudioRef.current.loop = true;
            fadeInAudio(brainwaveAudioRef.current, brainwaveVolume, false);
          }
        } catch (error) {
          console.error('Error creating audio element:', error);
          setIsBrainwavePlaying(false);
          alert(`Unable to load ${activeBrainwave} wave. Please try another brainwave.`);
          setActiveBrainwave(null);
        }
      }
    } else if (brainwaveAudioRef.current && isBrainwavePlaying) {
      fadeOutAudio(brainwaveAudioRef.current, false);
    }

    return () => {
      if (brainwaveFadeIntervalRef.current) {
        clearInterval(brainwaveFadeIntervalRef.current);
      }
    };
  }, [activeBrainwave]);

  // Update ambient sound volume when changed
  useEffect(() => {
    if (soundAudioRef.current && isSoundPlaying) {
      // Use volume fade for smooth transition
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      
      const startVolume = soundAudioRef.current.volume;
      const endVolume = soundVolume;
      let currentVolume = startVolume;
      const step = Math.abs(endVolume - startVolume) / (FADE_DURATION / 50);
      
      const fadeInterval = setInterval(() => {
        if (currentVolume < endVolume) {
          currentVolume = Math.min(currentVolume + step, endVolume);
        } else if (currentVolume > endVolume) {
          currentVolume = Math.max(currentVolume - step, endVolume);
        } else {
          clearInterval(fadeInterval);
          fadeIntervalRef.current = null;
          return;
        }
        
        soundAudioRef.current!.volume = currentVolume;
        
        if (Math.abs(currentVolume - endVolume) < 0.01) {
          soundAudioRef.current!.volume = endVolume;
          clearInterval(fadeInterval);
          fadeIntervalRef.current = null;
        }
      }, 50);
      
      fadeIntervalRef.current = fadeInterval;
    }
  }, [soundVolume]);

  // Update brainwave volume when changed
  useEffect(() => {
    if (brainwaveAudioRef.current && isBrainwavePlaying) {
      // Use volume fade for smooth transition
      if (brainwaveFadeIntervalRef.current) {
        clearInterval(brainwaveFadeIntervalRef.current);
      }
      
      const startVolume = brainwaveAudioRef.current.volume;
      const endVolume = brainwaveVolume;
      let currentVolume = startVolume;
      const step = Math.abs(endVolume - startVolume) / (FADE_DURATION / 50);
      
      const fadeInterval = setInterval(() => {
        if (currentVolume < endVolume) {
          currentVolume = Math.min(currentVolume + step, endVolume);
        } else if (currentVolume > endVolume) {
          currentVolume = Math.max(currentVolume - step, endVolume);
        } else {
          clearInterval(fadeInterval);
          brainwaveFadeIntervalRef.current = null;
          return;
        }
        
        brainwaveAudioRef.current!.volume = currentVolume;
        
        if (Math.abs(currentVolume - endVolume) < 0.01) {
          brainwaveAudioRef.current!.volume = endVolume;
          clearInterval(fadeInterval);
          brainwaveFadeIntervalRef.current = null;
        }
      }, 50);
      
      brainwaveFadeIntervalRef.current = fadeInterval;
    }
  }, [brainwaveVolume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (soundAudioRef.current) {
        soundAudioRef.current.pause();
        soundAudioRef.current = null;
      }
      if (brainwaveAudioRef.current) {
        brainwaveAudioRef.current.pause();
        brainwaveAudioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (brainwaveFadeIntervalRef.current) {
        clearInterval(brainwaveFadeIntervalRef.current);
      }
    };
  }, []);

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
        fadeOutAudio(soundAudioRef.current, true);
      } else {
        fadeInAudio(soundAudioRef.current, soundVolume, true);
      }
    }
  };

  // Toggle brainwave playback
  const toggleBrainwavePlayback = () => {
    if (brainwaveAudioRef.current) {
      if (isBrainwavePlaying) {
        fadeOutAudio(brainwaveAudioRef.current, false);
      } else {
        fadeInAudio(brainwaveAudioRef.current, brainwaveVolume, false);
      }
    }
  };

  // Toggle breathing animation
  const toggleBreathingAnimation = () => {
    setIsBreathingAnimationActive(prev => !prev);
  };

  // Toggle sound mixer panel
  const toggleMixer = () => {
    setShowMixer(prev => !prev);
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

  // Render audio controls with advanced mixer
  const renderAdvancedMixer = () => {
    if (!showMixer) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 animate-fade-in">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">Sound Mixer</h3>
          <button 
            onClick={toggleMixer}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Ambient Sound Controls */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ambient Sound
              </span>
              <button
                onClick={toggleSoundPlayback}
                className={`${
                  isSoundPlaying
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                } p-1 rounded-full`}
              >
                {isSoundPlaying ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {ambientSounds.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => setActiveSound(sound.id)}
                  className={`text-xs py-1 px-2 rounded-md ${
                    activeSound === sound.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {sound.name}
                </button>
              ))}
            </div>
            <div className="flex items-center">
              <SpeakerWaveIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                className="flex-grow h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700"
              />
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          </div>
          
          {/* Brainwave Controls */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Brainwave Entrainment
              </span>
              <button
                onClick={toggleBrainwavePlayback}
                className={`${
                  isBrainwavePlaying
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                } p-1 rounded-full`}
              >
                {isBrainwavePlaying ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2 max-h-24 overflow-y-auto">
              {brainwaves.map((wave) => (
                <button
                  key={wave.id}
                  onClick={() => setActiveBrainwave(wave.id)}
                  title={wave.description}
                  className={`text-xs py-1 px-2 rounded-md ${
                    activeBrainwave === wave.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {wave.name}
                </button>
              ))}
            </div>
            <div className="flex items-center">
              <BoltIcon className="h-4 w-4 text-gray-600 dark:text-gray-400 mr-2" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={brainwaveVolume}
                onChange={(e) => setBrainwaveVolume(parseFloat(e.target.value))}
                className="flex-grow h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700"
              />
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                {Math.round(brainwaveVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render breathing animation
  const renderBreathingAnimation = () => {
    if (!isBreathingAnimationActive) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className={`w-64 h-64 rounded-full bg-opacity-20 transition-all duration-4000 ease-in-out ${
          currentMode === 'dark' ? 'bg-blue-400' : 'bg-blue-600'
        } animate-breathing`}></div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full transition-colors duration-300 ${
        currentMode === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'
      }`}
    >
      {renderBreathingAnimation()}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Column - Controls and AI Coach */}
        <div className="w-full md:w-1/3 p-4 flex flex-col overflow-y-auto">
          {/* Top Controls */}
          <div className="flex justify-between mb-4">
            <div className="flex space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <ArrowsPointingInIcon className="h-5 w-5" />
                ) : (
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title={currentMode === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              >
                <MoonIcon className="h-5 w-5" />
              </button>
              <button
                onClick={toggleMixer}
                className={`p-2 rounded-full ${
                  showMixer 
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                title="Sound Mixer"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
              <button
                onClick={toggleBreathingAnimation}
                className={`p-2 rounded-full ${
                  isBreathingAnimationActive 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                title={isBreathingAnimationActive ? "Turn off breathing animation" : "Turn on breathing animation"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
              </button>
              <a
                href="/focus/history"
                className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                title="View Focus History"
              >
                <ChartBarIcon className="h-5 w-5" />
              </a>
            </div>
            <button
              onClick={() => setShowTips(!showTips)}
              className="p-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Show productivity tips"
            >
              <SparklesIcon className="h-5 w-5" />
            </button>
          </div>

          <PomodoroTimer />

          {renderAdvancedMixer()}

          {/* Productivity Tips */}
          {showTips && (
            <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-medium text-lg mb-2 text-gray-900 dark:text-white">
                Productivity Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                {renderProductivityTips()}
              </ul>
            </div>
          )}

          {/* Sound Quick Controls (if mixer is hidden) */}
          {!showMixer && (
            <div className="mt-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Sound Controls</h3>
                <button
                  onClick={toggleMixer}
                  className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200"
                >
                  Advanced
                </button>
              </div>
              <div className="flex space-x-2 mb-2">
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MusicalNoteIcon className="h-4 w-4" />
                    Ambient
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={toggleSoundPlayback}
                      className={`mr-2 p-1 rounded-full ${
                        isSoundPlaying
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {isSoundPlaying ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                      className="flex-grow h-1.5 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <BoltIcon className="h-4 w-4" />
                    Brainwave
                  </label>
                  <div className="flex items-center">
                    <button
                      onClick={toggleBrainwavePlayback}
                      className={`mr-2 p-1 rounded-full ${
                        isBrainwavePlaying
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200'
                          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {isBrainwavePlaying ? (
                        <PauseIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={brainwaveVolume}
                      onChange={(e) => setBrainwaveVolume(parseFloat(e.target.value))}
                      className="flex-grow h-1.5 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {activeSound && (
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 flex items-center">
                    {ambientSounds.find(s => s.id === activeSound)?.name}
                    <button 
                      onClick={() => setActiveSound(null)} 
                      className="ml-1 text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-100"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeBrainwave && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 flex items-center">
                    {brainwaves.find(b => b.id === activeBrainwave)?.name}
                    <button 
                      onClick={() => setActiveBrainwave(null)} 
                      className="ml-1 text-purple-500 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-100"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* AI Focus Coach */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 dark:text-white">AI Focus Coach</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsAICoachActive(!isAICoachActive)}
                  className={`p-1 rounded-full ${
                    isAICoachActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                  title={isAICoachActive ? "Disable AI coach" : "Enable AI coach"}
                >
                  <BoltIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <AIFocusCoach
              isActive={isAICoachActive}
              focusStartTime={focusStartTime}
              currentTask={currentTask}
              nextTask={nextTask}
              completedTasks={completedTasks}
              remainingTasks={remainingTasks}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
            />
          </div>
        </div>

        {/* Right Column - Current Task Focus Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="h-full flex flex-col items-center justify-center">
            {currentTask ? (
              <div className="w-full max-w-md text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Current Focus:
                </h2>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                    {currentTask.title}
                  </h3>
                  {currentTask.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {currentTask.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Stay focused on this task and minimize distractions.
                  </div>
                </div>
                
                {nextTask && (
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Coming up next:
                    </div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {nextTask.title}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  No Task Selected
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Select a task to focus on, or use this time for unstructured deep work.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 