'use client';

import { useState, useEffect, useRef } from 'react';

interface TypingAnimationProps {
  text: string;
  speed?: number; // milliseconds per character
  delay?: number; // initial delay before typing starts
  cursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

export function TypingAnimation({
  text,
  speed = 40,
  delay = 0,
  cursor = true,
  className = '',
  onComplete
}: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const currentIndexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset and start typing when text changes
  useEffect(() => {
    setDisplayedText('');
    currentIndexRef.current = 0;
    setIsTyping(true);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Delay before starting to type
    const initialDelay = setTimeout(() => {
      typeNextCharacter();
    }, delay);
    
    return () => {
      clearTimeout(initialDelay);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, delay, speed]);
  
  const typeNextCharacter = () => {
    if (!text || currentIndexRef.current >= text.length) {
      setIsTyping(false);
      if (onComplete) onComplete();
      return;
    }
    
    setDisplayedText(prev => prev + text.charAt(currentIndexRef.current));
    currentIndexRef.current += 1;
    
    // Randomize typing speed slightly for more natural effect
    const variableSpeed = speed * (0.8 + Math.random() * 0.4);
    
    // Add extra pause for punctuation
    const currentChar = text.charAt(currentIndexRef.current - 1);
    let pauseTime = variableSpeed;
    if (['.', '!', '?'].includes(currentChar)) pauseTime = variableSpeed * 6;
    else if ([',', ';', ':'].includes(currentChar)) pauseTime = variableSpeed * 3;
    
    timerRef.current = setTimeout(typeNextCharacter, pauseTime);
  };
  
  return (
    <div className={className}>
      <span>{displayedText}</span>
      {cursor && isTyping && (
        <span className="ml-1 inline-block w-2 h-4 bg-current opacity-75 animate-blink" />
      )}
    </div>
  );
} 