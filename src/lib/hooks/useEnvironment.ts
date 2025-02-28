import { useState, useEffect } from 'react';

interface EnvironmentState {
  aiFeatureEnabled: boolean;
  hasGeminiKey: boolean;
  isValidKey: boolean;
  isAIAvailable: boolean;
  apiKeyMessage: string | null;
}

/**
 * Hook to check the presence of required environment variables
 * and determine if AI features should be available
 */
export function useEnvironment(): EnvironmentState {
  const [state, setState] = useState<EnvironmentState>({
    aiFeatureEnabled: false,
    hasGeminiKey: false,
    isValidKey: false,
    isAIAvailable: false,
    apiKeyMessage: null
  });
  
  useEffect(() => {
    // Parse the AI feature flag, defaulting to false if not present or not 'true'
    const aiFeatureEnabled = process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED === 'true';
    
    // Get the API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // Check if the API key is present
    const hasGeminiKey = !!apiKey;
    
    // Check if the API key appears to be valid (not the placeholder and at least 20 chars)
    const isPlaceholder = apiKey === 'YOUR_GEMINI_API_KEY_HERE';
    // Most Gemini API keys should be around 39 characters
    const isLikelyInvalid = hasGeminiKey && !isPlaceholder && apiKey!.length < 20;
    const isValidKey = hasGeminiKey && !isPlaceholder && !isLikelyInvalid;

    // Determine if AI is available (feature flag is on, has key, and key is not placeholder)
    const isAIAvailable = aiFeatureEnabled && isValidKey;
    
    // Generate a message about the API key status
    let apiKeyMessage = null;
    if (!hasGeminiKey) {
      apiKeyMessage = "Missing Gemini API key. Update your .env.local file.";
    } else if (isPlaceholder) {
      apiKeyMessage = "Using placeholder API key. Replace it with a valid Gemini API key in your .env.local file.";
    } else if (isLikelyInvalid) {
      apiKeyMessage = "The Gemini API key appears to be invalid. Please check your .env.local file.";
    }
    
    // Update state with our environment checks
    setState({ 
      aiFeatureEnabled, 
      hasGeminiKey, 
      isValidKey,
      isAIAvailable,
      apiKeyMessage
    });

    // Log environment status to console for debugging
    console.log(`Gemini Features Enabled: ${aiFeatureEnabled}`);
    console.log(`Gemini API Key Present: ${hasGeminiKey}`);
    console.log(`Gemini API Key Valid: ${isValidKey}`);
    console.log(`Gemini Assistance Available: ${isAIAvailable}`);
    if (apiKeyMessage) {
      console.warn(apiKeyMessage);
    }
  }, []);
  
  return state;
} 