import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import { MicrophoneIcon, StopIcon, TrashIcon, PlayIcon, PauseIcon } from "@heroicons/react/24/outline";
import { TaskFormField } from './TaskFormField';
import { useTranslation } from "@/lib/i18n";

interface AudioRecorderProps {
  onAudioChange: (url: string | null) => void;
}

/**
 * AudioRecorder component for recording, playing, and managing audio input for tasks
 * Extracted from AddTaskForm to improve component size and maintainability
 * Memoized with React.memo to prevent unnecessary re-renders
 */
function AudioRecorderComponent({ onAudioChange }: AudioRecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Effect to handle audio playback state changes
  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => setIsPlaying(false);
      audioRef.current.addEventListener('ended', handleEnded);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [audioRef.current]);

  // Play the recorded audio
  const playAudio = useCallback(() => {
    if (audioRef.current && audioURL) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [audioURL]);

  // Pause the audio playback
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Clear the recorded audio
  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setAudioURL(null);
    setIsPlaying(false);
    onAudioChange(null);
  }, [onAudioChange]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/mp3' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onAudioChange(url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please ensure you have granted permission.");
    }
  }, [onAudioChange]);

  // Stop recording audio
  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      // Stop all tracks on the stream
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs">
      {!isRecording && !audioURL && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startRecording}
            className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/70 transition-colors duration-200 shadow-sm"
            aria-label="Record voice note"
          >
            <MicrophoneIcon className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Voice note
          </span>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full bg-red-100 dark:bg-red-900/60 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors duration-200 animate-pulse shadow-sm"
            aria-label="Stop recording"
          >
            <StopIcon className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-red-600 dark:text-red-400 animate-pulse">
            Recording...
          </span>
        </div>
      )}

      {audioURL && (
        <div className="flex items-center gap-2 justify-between w-full">
          <audio ref={audioRef} src={audioURL} className="hidden" />
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                type="button"
                onClick={playAudio}
                className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/70 transition-colors duration-200 shadow-sm"
                aria-label="Play recording"
              >
                <PlayIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseAudio}
                className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800/70 transition-colors duration-200 shadow-sm"
                aria-label="Pause recording"
              >
                <PauseIcon className="h-4 w-4" />
              </button>
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recorded
            </span>
          </div>
          
          <button
            type="button"
            onClick={clearAudio}
            className="rounded-full bg-gray-100 dark:bg-gray-700 p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 shadow-sm"
            aria-label="Delete recording"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Export a memoized version of the component
export const AudioRecorder = memo(AudioRecorderComponent); 