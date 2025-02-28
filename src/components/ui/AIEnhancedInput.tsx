import React, { useState, useEffect, useRef } from 'react';
import { enhanceTaskText, isAIServiceAvailable } from '@/lib/ai-service';
import { useEnvironment } from '@/lib/hooks/useEnvironment';
import { 
  SparklesIcon, 
  ArrowsPointingOutIcon, 
  ArrowsPointingInIcon,
  BriefcaseIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Interface for component props
interface AIEnhancedInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  label?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  inputClassName?: string;
  containerClassName?: string;
  fieldType: 'title' | 'description';
  error?: string;
  touched?: boolean;
}

export function AIEnhancedInput({
  value,
  onChange,
  onBlur,
  placeholder = '',
  id,
  name,
  label,
  type = 'input',
  rows = 3,
  inputClassName = '',
  containerClassName = '',
  fieldType,
  error,
  touched
}: AIEnhancedInputProps) {
  // Environment check
  const { isAIAvailable, envLoadComplete, apiKeyMessage } = useEnvironment();
  
  // State for AI operations
  const [isLoading, setIsLoading] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(true);
  const [showEnhanceOptions, setShowEnhanceOptions] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Disable AI mode if the service is not available
  useEffect(() => {
    if (envLoadComplete && !isAIAvailable) {
      setAiModeEnabled(false);
    }
  }, [isAIAvailable, envLoadComplete]);
  
  // References
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  
  // Handle enhancements - with 200 character limit
  const handleEnhance = async (enhancementType: 'improve' | 'expand' | 'shorten' | 'professional') => {
    if (!value) return;
    
    try {
      setIsLoading(true);
      setShowEnhanceOptions(false);
      setApiError(null);
      
      const enhanced = await enhanceTaskText(value, enhancementType);
      
      if (enhanced) {
        console.log("Original Gemini response:", enhanced);
        
        // Clean the response to remove introductory phrases
        const cleanedText = cleanGeminiResponse(enhanced);
        console.log("Cleaned text:", cleanedText);
        
        // If cleaning removed everything, use the original but cap its length
        const finalText = cleanedText.trim().length < 3 ? enhanced : cleanedText;
        
        // Apply the enhanced text with 200 character limit
        const limitedText = finalText.length > 200 
          ? finalText.substring(0, 197) + '...'
          : finalText;
        
        console.log("Final text to be applied:", limitedText);
          
        // Replace the current text with the enhanced version
        onChange(limitedText);
      } else {
        setApiError("Received empty response from AI service");
      }
    } catch (error) {
      console.error('Error enhancing text:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error enhancing text');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle generating description from title
  const handleGenerateDescription = async () => {
    if (!value || fieldType !== 'title') return;
    
    try {
      setIsLoading(true);
      setShowEnhanceOptions(false);
      setApiError(null);
      
      // Call the API with a special prompt to generate a description based on the title
      const result = await enhanceTaskText(
        `[DIRECT RESPONSE ONLY] Generate a detailed description for this task title: "${value}"
IMPORTANT: Return ONLY the description itself without any explanations, introductions, or commentary. Maximum 200 characters.`, 
        'expand'
      );
      
      if (result) {
        console.log("Original description generation response:", result);
        
        // Clean the response to remove introductory phrases
        const cleanedText = cleanGeminiResponse(result);
        console.log("Cleaned description:", cleanedText);
        
        // Apply character limit
        const limitedText = cleanedText.length > 200 
          ? cleanedText.substring(0, 197) + '...'
          : cleanedText;
        
        // Replace the current text with the generated description
        onChange(limitedText);
      } else {
        setApiError("Received empty response when generating description");
      }
    } catch (error) {
      console.error('Error generating description:', error);
      setApiError(error instanceof Error ? error.message : 'Unknown error generating description');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to clean Gemini responses by removing introductory phrases
  const cleanGeminiResponse = (text: string): string => {
    // Completely rewritten approach using more aggressive pattern matching
    
    // First, check if the response begins with a problematic phrase and contains some clear response text later
    if (text.match(/^(here are|here's|for improving|to improve|some options|a better|improved version|concise version|professional version)/i)) {
      // Try to find the actual content after explanation
      
      // Case 1: Bullet points or numbered lists
      const listItemMatch = text.match(/^.*?[-\d*•].*?[\n:](.*?)(?:[\n]|$)/is);
      if (listItemMatch && listItemMatch[1] && listItemMatch[1].trim().length > 10) {
        return listItemMatch[1].trim();
      }
      
      // Case 2: Quoted suggestions
      const quotedMatch = text.match(/"([^"]{10,})"/);
      if (quotedMatch && quotedMatch[1]) {
        return quotedMatch[1].trim();
      }
      
      // Case 3: After a colon (common pattern in Gemini responses)
      const colonMatch = text.match(/^.*?:(.*?)(?:[\n]|$)/i);
      if (colonMatch && colonMatch[1] && colonMatch[1].trim().length > 10) {
        return colonMatch[1].trim();
      }
      
      // Case 4: Find the first sentence after known explanation phrases
      const sentenceMatch = text.match(/^.*?(here are|some options|suggestions).*?[.!?][\s\n]+(.*?)[.!?]/i);
      if (sentenceMatch && sentenceMatch[2] && sentenceMatch[2].trim().length > 10) {
        return sentenceMatch[2].trim() + '.';
      }
      
      // If we can't extract a clear response, take everything after first sentence (risky but better than nothing)
      const firstSentenceEnd = text.indexOf('. ');
      if (firstSentenceEnd > 20) {
        const afterFirstSentence = text.substring(firstSentenceEnd + 2);
        if (afterFirstSentence.length > 10) {
          return afterFirstSentence.trim();
        }
      }
    }
    
    // If we've reached here, assume the response doesn't have an explanatory intro
    // Just clean up any remaining formatting
    let cleaned = text
      .replace(/^[-*•#]\s+/, '')  // Remove any bullet point at the beginning
      .trim()
      .replace(/^["']|["']$/g, ''); // Remove surrounding quotes
    
    // Ensure proper capitalization
    if (cleaned.length > 1 && /^[a-z]/.test(cleaned)) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    return cleaned;
  };
  
  // Default classes for consistent styling
  const defaultInputClass = `block w-full border ${
    touched && error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-gray-600 focus:border-teal-500 focus:ring-teal-500"
  } rounded-md p-2 text-white bg-gray-700 placeholder-gray-400 text-sm`;
  
  // Combined input classes
  const inputClasses = `${defaultInputClass} ${inputClassName}`;

  // Gemini Colors - Teal for brand identity
  const geminiColors = {
    text: 'text-teal-400',
    bg: 'bg-teal-900/30',
    hoverBg: 'hover:bg-teal-900/40',
    focusRing: 'focus:ring-teal-500',
    ghostText: 'text-teal-400/70',
    buttonBg: 'bg-teal-800/30',
    buttonText: 'text-teal-300',
    buttonBorder: 'border-teal-700',
  };
  
  // AI Mode Toggle Button
  const renderAIModeToggle = () => {
    if (!envLoadComplete) {
      return null;
    }
    
    if (!isAIAvailable) {
      return (
        <button
          type="button"
          className="p-1.5 rounded-full text-red-400 bg-red-900/30 hover:bg-red-900/40 transition-colors"
          title="Gemini AI service unavailable. Check your API key."
        >
          <ExclamationTriangleIcon className="h-4 w-4" />
        </button>
      );
    }
    
    return (
      <button
        type="button"
        onClick={() => setAiModeEnabled(!aiModeEnabled)}
        className={`p-1.5 rounded-full ${
          aiModeEnabled 
            ? `${geminiColors.text} ${geminiColors.bg} ${geminiColors.hoverBg}` 
            : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
        } transition-colors`}
        title={aiModeEnabled ? "Disable Gemini AI suggestions" : "Enable Gemini AI suggestions"}
      >
        {/* Gemini Icon - Using a sparkles icon to represent AI */}
        <div className="flex items-center">
          <SparklesIcon className="h-4 w-4" />
        </div>
      </button>
    );
  };
  
  // Render the input without ghost text
  return (
    <div className={`relative mt-5 ${containerClassName}`}>
      {/* AI Mode Toggle */}
      <div className="absolute right-2 top-2 z-10">
        {renderAIModeToggle()}
      </div>
      
      {/* API Key Error Message */}
      {envLoadComplete && !isAIAvailable && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-md p-2 mb-2 text-xs text-red-400 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>
            Gemini AI unavailable. {apiKeyMessage || 'Please check your API key in .env.local file.'}
          </span>
        </div>
      )}
      
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-md p-2 mb-2 text-xs text-red-400 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>
            Gemini API error: {apiError.includes('gemini-pro') ? 'Using an outdated model. Please update to Gemini 2.0 Flash Lite.' : apiError}
          </span>
        </div>
      )}
      
      {/* Gemini Badge - Only show when AI is enabled */}
      {aiModeEnabled && (
        <div className="absolute left-2 -top-4 z-10">
          <div className={`flex items-center text-xs ${geminiColors.text}`}>
            <SparklesIcon className="h-3 w-3 mr-1" />
            <span className="font-medium">Gemini 2.0</span>
          </div>
        </div>
      )}
      
      {/* Input Element - Either input or textarea based on type */}
      <div className="relative">
        {type === 'input' ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id={id}
            name={name}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className={inputClasses}
            autoComplete="off"
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            className={inputClasses}
            autoComplete="off"
          />
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-2 top-2">
            <div className={`animate-spin h-4 w-4 border-2 ${geminiColors.text} border-opacity-50 rounded-full border-t-transparent`}></div>
          </div>
        )}
        
        {/* Enhance Options Button */}
        {aiModeEnabled && value && value.length > 0 && !isLoading && (
          <div className="absolute right-2 -bottom-8">
            <button
              type="button"
              onClick={() => setShowEnhanceOptions(!showEnhanceOptions)}
              className={`flex items-center gap-1 text-xs ${geminiColors.text} hover:brightness-110`}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Enhance with Gemini</span>
            </button>
            
            {/* Enhance Options Popup */}
            {showEnhanceOptions && (
              <div className="absolute bottom-6 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 z-20 w-48">
                <div className="text-xs font-medium text-gray-300 mb-1.5 flex items-center">
                  <SparklesIcon className={`h-3.5 w-3.5 mr-1 ${geminiColors.text}`} />
                  Gemini AI Enhancement
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleEnhance('improve')}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-700 text-gray-300 flex items-center"
                  >
                    <SparklesIcon className={`h-3.5 w-3.5 mr-1.5 ${geminiColors.text}`} />
                    Improve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnhance('expand')}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-700 text-gray-300 flex items-center"
                  >
                    <ArrowsPointingOutIcon className={`h-3.5 w-3.5 mr-1.5 ${geminiColors.text}`} />
                    Expand
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnhance('shorten')}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-700 text-gray-300 flex items-center"
                  >
                    <ArrowsPointingInIcon className={`h-3.5 w-3.5 mr-1.5 ${geminiColors.text}`} />
                    Make concise
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEnhance('professional')}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-700 text-gray-300 flex items-center"
                  >
                    <BriefcaseIcon className={`h-3.5 w-3.5 mr-1.5 ${geminiColors.text}`} />
                    Professional tone
                  </button>
                  
                  {/* Generate Description Button - Only show for empty description fields */}
                  {fieldType === 'description' && !value && (
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-700 text-teal-400 flex items-center mt-2 pt-2 border-t border-gray-700"
                    >
                      <SparklesIcon className={`h-3.5 w-3.5 mr-1.5`} />
                      Generate from title
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Generate Description Button - Show when field is empty description */}
        {aiModeEnabled && fieldType === 'description' && !value && !isLoading && (
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handleGenerateDescription}
              className={`flex items-center gap-1 px-3 py-1.5 border border-dashed rounded-md text-sm ${geminiColors.text} border-gray-500 hover:border-teal-500 transition-colors`}
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Generate description with Gemini</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {touched && error && (
        <div className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <XMarkIcon className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
} 
