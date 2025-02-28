import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Check if the API key is valid or still using the placeholder
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const isApiKeyPlaceholder = GEMINI_API_KEY === '' || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE';

// Initialize the Google Generative AI client with the server-side API key
const genAI = !isApiKeyPlaceholder ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Configure safety settings for Gemini
// Use more compatible safety settings for newer models
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Define available models with the latest ones first
const GEMINI_MODELS = {
  // Latest models
  'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',  // Latest flash lite model
  'gemini-2.0-pro': 'gemini-2.0-pro',                // Latest pro model
  
  // Legacy/fallback models
  'gemini-pro': 'gemini-pro',                        // Legacy model
  'gemini-1.5-flash': 'gemini-1.5-flash',            // Legacy model
};

// Default model to use
const DEFAULT_MODEL = GEMINI_MODELS['gemini-2.0-flash-lite'];

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (isApiKeyPlaceholder) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please update your .env.local file with a valid API key.' },
        { status: 500 }
      );
    }

    // Only allow authenticated users to access this endpoint in production
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    // Parse the request body
    const body = await req.json();
    const { text, fieldType, action, model = 'gemini' } = body;
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Determine which model to use
    let modelName = DEFAULT_MODEL;
    
    // If a specific model is requested and it's in our list, use it
    if (model && model !== 'gemini' && GEMINI_MODELS[model]) {
      modelName = GEMINI_MODELS[model];
    }
    
    logger.info(`Using Gemini model: ${modelName}`, {
      component: 'api/ai/completions',
    });
    
    // Choose the appropriate model based on the action
    const modelInstance = genAI!.getGenerativeModel({ 
      model: modelName,
      safetySettings,
    });
    
    // Check if this is a direct response prompt
    const isDirectResponsePrompt = text.includes('[DIRECT RESPONSE ONLY]');
    
    // Different prompts based on the action and field type
    let prompt = text;
    
    // For non-direct prompts, use our standard prompt formats
    if (!isDirectResponsePrompt) {
      switch (action) {
        case 'complete':
          if (fieldType === 'title') {
            prompt = `Complete this task title in a concise and actionable way: "${text}"`;
          } else {
            prompt = `Complete this task description with helpful details: "${text}"`;
          }
          break;
          
        case 'improve':
          prompt = `Improve this task text to be clearer and more effective: "${text}"`;
          break;
          
        case 'expand':
          prompt = `Expand this task text with more helpful details: "${text}"`;
          break;
          
        case 'shorten':
          prompt = `Make this task text more concise while keeping the meaning: "${text}"`;
          break;
          
        case 'professional':
          prompt = `Rewrite this task text in a more professional tone: "${text}"`;
          break;
          
        case 'related':
          prompt = `Based on this task: "${text}", suggest one related task that might be needed.`;
          break;
          
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }
    }
    
    // Set generation config based on the action
    const generationConfig = {
      temperature: action === 'related' ? 0.8 : 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: action === 'complete' && fieldType === 'title' ? 30 : 150,
    };
    
    // For direct response prompts, adjust the temperature to be lower for more deterministic outputs
    if (isDirectResponsePrompt) {
      generationConfig.temperature = 0.3;
    }
    
    try {
      // Generate the completion using Gemini
      const result = await modelInstance.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });
      
      // Process the response from Gemini
      const response = result.response;
      
      if (!response || !response.text()) {
        return NextResponse.json(
          { error: 'No completion generated' },
          { status: 500 }
        );
      }
      
      let completion = response.text().trim();
      
      // For direct response prompts, do additional processing to ensure a clean response
      if (isDirectResponsePrompt) {
        // Remove any quotes that might be surrounding the response
        completion = completion.replace(/^["']|["']$/g, '');
        
        // Remove any explanatory phrases (common with AI responses)
        const explanatoryPhrases = [
          /^(here are|here's|I would|I've|I'd|I will|I can|I'm going to|to improve|I'll|for this task)[^.]*/i,
          /^(the improved|improved|better|enhanced|more concise|more professional|expanded) (version|text|description|task)[^.]*/i,
          /^(a|the) (good|better|improved|professional|concise|detailed) (description|version|text) (is|would be|could be)[^.]*/i
        ];
        
        for (const phrase of explanatoryPhrases) {
          completion = completion.replace(phrase, '').trim();
        }
        
        // Remove any "Step X:" prefixes
        completion = completion.replace(/^Step \d+:\s*/i, '');
        
        // Use the first line if there are multiple lines
        if (completion.includes('\n')) {
          completion = completion.split('\n')[0].trim();
        }
      }
      
      // Format the response based on the action
      if (action === 'complete') {
        // For completions, we want to return just the part that would be appended
        let suggestionText = '';
        
        if (completion.toLowerCase().startsWith(text.toLowerCase())) {
          suggestionText = completion.substring(text.length);
        } else {
          suggestionText = completion;
        }
        
        return NextResponse.json({
          text: suggestionText,
          fullText: completion,
          isComplete: completion.endsWith('.') || completion.endsWith('!')
        });
      } else {
        // For other actions, return the full text
        return NextResponse.json({
          text: completion
        });
      }
    } catch (generationError: any) {
      // Handle specific Gemini API errors
      logger.error('Error generating content with Gemini:', {
        component: 'api/ai/completions',
        error: generationError,
        model: modelName
      });
      
      // If the model fails, try to fall back to an older model
      if (modelName !== GEMINI_MODELS['gemini-pro'] && generationError.message?.includes('not found')) {
        logger.info('Attempting fallback to older model gemini-pro', {
          component: 'api/ai/completions',
        });
        
        try {
          const fallbackModel = genAI!.getGenerativeModel({ 
            model: GEMINI_MODELS['gemini-pro'],
            safetySettings,
          });
          
          const fallbackResult = await fallbackModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
          });
          
          const fallbackResponse = fallbackResult.response;
          
          if (!fallbackResponse || !fallbackResponse.text()) {
            throw new Error('No completion generated from fallback model');
          }
          
          const fallbackCompletion = fallbackResponse.text().trim();
          
          if (action === 'complete') {
            let suggestionText = '';
            
            if (fallbackCompletion.toLowerCase().startsWith(text.toLowerCase())) {
              suggestionText = fallbackCompletion.substring(text.length);
            } else {
              suggestionText = fallbackCompletion;
            }
            
            return NextResponse.json({
              text: suggestionText,
              fullText: fallbackCompletion,
              isComplete: fallbackCompletion.endsWith('.') || fallbackCompletion.endsWith('!')
            });
          } else {
            return NextResponse.json({
              text: fallbackCompletion
            });
          }
        } catch (fallbackError) {
          logger.error('Fallback model also failed:', {
            component: 'api/ai/completions',
            error: fallbackError
          });
        }
      }
      
      return NextResponse.json(
        { error: `Gemini API error: ${generationError?.message || 'Unknown error during content generation'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    // Generic error handling
    logger.error('Error in Gemini AI completions endpoint:', {
      component: 'api/ai/completions',
      error
    });
    
    return NextResponse.json(
      { error: `Failed to generate completion: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
} 