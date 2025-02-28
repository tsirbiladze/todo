'use client';

/**
 * Service for text-to-speech functionality using OpenAI's TTS API
 */
export class TTSService {
  private static audioContext: AudioContext | null = null;
  private static audioQueue: HTMLAudioElement[] = [];
  private static isPlaying = false;
  private static audioCache = new Map<string, string>();
  private static cacheSize = 20; // Maximum number of cached audio files

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  static initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Convert text to speech using OpenAI's API
   * @param text The text to convert to speech
   * @param voice The voice to use (alloy, echo, fable, onyx, nova, shimmer)
   * @param speed The speed of the speech (0.25 to 4.0)
   * @returns A promise that resolves to the audio URL
   */
  static async textToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
    speed: number = 1.0
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${text}-${voice}-${speed}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          speed,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Add to cache
      this.audioCache.set(cacheKey, data.audioUrl);
      
      // Manage cache size
      if (this.audioCache.size > this.cacheSize) {
        const firstKey = this.audioCache.keys().next().value;
        this.audioCache.delete(firstKey);
      }
      
      return data.audioUrl;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Play audio from a URL
   * @param audioUrl The URL of the audio to play
   * @returns A promise that resolves when the audio starts playing
   */
  static async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(audioUrl);
        
        audio.oncanplaythrough = () => {
          this.queueAudio(audio);
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('Error loading audio:', error);
          reject(error);
        };
        
        audio.load();
      } catch (error) {
        console.error('Error creating audio element:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Queue audio for playback
   * @param audio The audio element to queue
   */
  private static queueAudio(audio: HTMLAudioElement) {
    this.audioQueue.push(audio);
    this.processQueue();
  }
  
  /**
   * Process the audio queue
   */
  private static processQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) {
      return;
    }
    
    this.isPlaying = true;
    const audio = this.audioQueue.shift()!;
    
    audio.onended = () => {
      this.isPlaying = false;
      this.processQueue();
    };
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      this.processQueue();
    });
  }
  
  /**
   * Speak text using TTS
   * @param text The text to speak
   * @param voice The voice to use
   * @param speed The speed of the speech
   * @returns A promise that resolves when the audio starts playing
   */
  static async speak(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
    speed: number = 1.0
  ): Promise<void> {
    try {
      // Initialize audio context if needed (must be after user interaction)
      this.initAudioContext();
      
      const audioUrl = await this.textToSpeech(text, voice, speed);
      await this.playAudio(audioUrl);
    } catch (error) {
      console.error('Error speaking text:', error);
      throw error;
    }
  }
  
  /**
   * Stop all audio playback
   */
  static stopAll() {
    this.audioQueue.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.audioQueue = [];
    this.isPlaying = false;
  }
} 