/**
 * AI Service for task input enhancement and management using Google's Gemini
 * Uses the server-side API endpoint to protect API keys
 */

/**
 * Interface for completion suggestions
 */
export interface CompletionSuggestion {
  text: string;
  isComplete: boolean;
}

/**
 * Check if the AI service is available based on environment config
 */
export function isAIServiceAvailable(): boolean {
  // Check if AI features are enabled
  const aiEnabled = process.env.NEXT_PUBLIC_AI_FEATURES_ENABLED === 'true';
  // Check if we have an API key (even if it's a placeholder)
  const hasApiKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  // Return true only if both conditions are met
  return aiEnabled && hasApiKey;
}

// Gemini model to use
// Default to Gemini 2.0 Flash Lite (faster, more efficient for simple completions)
const GEMINI_MODEL = 'gemini-2.0-flash-lite';
// For more complex task analysis, use Gemini Pro
const GEMINI_COMPLEX_MODEL = 'gemini-2.0-pro';

import { Task, Category, UserSettings } from '@prisma/client';
import { formatDate } from './date-utils';

/**
 * Interfaces for AI-powered task management
 */
export interface TaskWithCategories extends Task {
  categories?: Category[];
}

export interface TaskPrioritizationResult {
  suggestedOrder: string[];
  reasoning: string;
}

export interface DurationEstimationResult {
  estimatedMinutes: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export interface TaskBreakdownResult {
  subtasks: {
    title: string;
    description?: string;
    estimatedDuration?: number;
  }[];
  reasoning: string;
}

/**
 * Get text completion suggestions for task input
 * @param inputText The current text input by the user
 * @param field The field being completed (title or description)
 * @returns Promise with completion suggestion
 */
export async function getCompletionSuggestion(
  inputText: string,
  field: 'title' | 'description'
): Promise<CompletionSuggestion | null> {
  if (!inputText || inputText.length < 3) return null;
  
  try {
    // Check if the API key is still using the placeholder value
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('Using placeholder API key. Please update your .env.local file with a valid Gemini API key.');
    }

    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: inputText,
        fieldType: field,
        action: 'complete',
        model: GEMINI_MODEL
      }),
    });
    
    // Try to parse the error response body for more details
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (_) {
        // If we can't parse the JSON, use the status text
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      text: data.text,
      isComplete: data.isComplete
    };
  } catch (error) {
    console.error('Error getting Gemini AI completion:', error);
    // Return null to gracefully handle the error in the UI
    return null;
  }
}

/**
 * Enhance task text with Gemini AI assistance
 * @param text The current text to enhance
 * @param enhancementType The type of enhancement to apply
 * @returns Promise with enhanced text
 */
export async function enhanceTaskText(
  text: string,
  enhancementType: 'improve' | 'expand' | 'shorten' | 'professional'
): Promise<string | null> {
  if (!text) return null;
  
  try {
    // Check if the API key is still using the placeholder value
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('Using placeholder API key. Please update your .env.local file with a valid Gemini API key.');
    }

    // Define specific enhancement instructions based on the type
    let enhancementPrompt = '';
    
    switch (enhancementType) {
      case 'improve':
        enhancementPrompt = `[DIRECT RESPONSE ONLY] Improve this task text to be clearer and more effective: "${text}"
IMPORTANT: Return ONLY the improved text without any explanations, introductions, or commentary.`;
        break;
      
      case 'expand':
        enhancementPrompt = `[DIRECT RESPONSE ONLY] Expand this task text with more details: "${text}"
IMPORTANT: Return ONLY the expanded text without any explanations, introductions, or commentary.`;
        break;
      
      case 'shorten':
        enhancementPrompt = `[DIRECT RESPONSE ONLY] Make this task text more concise while preserving meaning: "${text}"
IMPORTANT: Return ONLY the shortened text without any explanations, introductions, or commentary.`;
        break;
      
      case 'professional':
        enhancementPrompt = `[DIRECT RESPONSE ONLY] Rewrite this task text in a professional tone: "${text}"
IMPORTANT: Return ONLY the professional version without any explanations, introductions, or commentary.`;
        break;
      
      default:
        enhancementPrompt = `[DIRECT RESPONSE ONLY] Improve this task text: "${text}"
IMPORTANT: Return ONLY the improved text without any explanations, introductions, or commentary.`;
    }

    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: enhancementPrompt,
        action: enhancementType,
        model: GEMINI_MODEL
      }),
    });
    
    // Try to parse the error response body for more details
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (_) {
        // If we can't parse the JSON, use the status text
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.text;
  } catch (error) {
    console.error('Error enhancing text with Gemini AI:', error);
    return null;
  }
}

/**
 * Generate a related task suggestion using Gemini
 * @param currentTask The current task title/description
 * @returns Promise with a suggested related task
 */
export async function generateRelatedTaskSuggestion(
  currentTask: string
): Promise<string | null> {
  if (!currentTask) return null;
  
  try {
    // Check if the API key is still using the placeholder value
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('Using placeholder API key. Please update your .env.local file with a valid Gemini API key.');
    }

    const response = await fetch('/api/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: currentTask,
        action: 'related',
        model: GEMINI_MODEL
      }),
    });
    
    // Try to parse the error response body for more details
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
        }
      } catch (_) {
        // If we can't parse the JSON, use the status text
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.text;
  } catch (error) {
    console.error('Error generating related task with Gemini AI:', error);
    return null;
  }
}

/**
 * AI-powered task prioritization assistant
 * Analyzes tasks and suggests the best order based on deadlines, importance, and work habits
 */
export async function prioritizeTasks(
  tasks: TaskWithCategories[],
  userSettings?: UserSettings,
  userWorkHabits?: Record<string, unknown> // More type-safe than 'any'
): Promise<TaskPrioritizationResult> {
  try {
    const tasksFormatted = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate ? formatDate(task.dueDate) : null,
      estimatedDuration: task.estimatedDuration,
      categories: task.categories?.map(c => c.name).join(', ') || '',
      emotion: task.emotion,
    }));

    const prompt = `
    As an AI assistant for people with ADHD, analyze this task list and suggest the optimal order to complete these tasks.
    
    Tasks:
    ${JSON.stringify(tasksFormatted, null, 2)}
    
    Consider these factors:
    1. Urgency (due dates)
    2. Priority levels
    3. Estimated duration
    4. Task dependencies
    5. Context switching minimization (group similar categories)
    6. Emotional state attached to tasks
    
    Additional user context:
    ${JSON.stringify(userWorkHabits || {}, null, 2)}
    
    FORMAT: Return a JSON object with two properties:
    - "suggestedOrder": an array of task IDs in the suggested order
    - "reasoning": a clear explanation of your prioritization logic
    `;

    const response = await fetch('/api/ai/advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        action: 'prioritize',
        model: GEMINI_COMPLEX_MODEL,
        responseFormat: 'json'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Prioritization failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data as TaskPrioritizationResult;
  } catch (error) {
    console.error('AI Task Prioritization Error:', error);
    throw new Error('Failed to prioritize tasks');
  }
}

/**
 * Smart duration estimation
 * Predicts task duration based on historical data from similar completed tasks
 */
export async function estimateTaskDuration(
  task: Task,
  historicalTasks: Task[],
  categories?: Category[]
): Promise<DurationEstimationResult> {
  try {
    // Filter completed tasks with actual duration data
    const relevantHistoricalTasks = historicalTasks.filter(
      t => t.completedAt && t.actualDuration
    );

    const prompt = `
    As an AI assistant for people with ADHD, estimate how long this task will take to complete.
    
    New task:
    ${JSON.stringify({
      title: task.title,
      description: task.description,
      categories: categories?.map(c => c.name).join(', '),
    }, null, 2)}
    
    Historical completed task data:
    ${JSON.stringify(
      relevantHistoricalTasks.map(t => ({
        title: t.title,
        description: t.description,
        estimatedDuration: t.estimatedDuration,
        actualDuration: t.actualDuration,
      })),
      null,
      2
    )}
    
    FORMAT: Return a JSON object with three properties:
    - "estimatedMinutes": a number representing your time estimate in minutes
    - "confidence": either "high", "medium", or "low" indicating confidence level
    - "reasoning": a clear explanation of how you calculated this estimate
    `;

    const response = await fetch('/api/ai/advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        action: 'estimate',
        model: GEMINI_COMPLEX_MODEL,
        responseFormat: 'json'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Duration estimation failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data as DurationEstimationResult;
  } catch (error) {
    console.error('AI Duration Estimation Error:', error);
    throw new Error('Failed to estimate task duration');
  }
}

/**
 * Task reformulation assistant
 * Helps break down vague tasks into concrete, actionable steps
 */
export async function breakdownTask(
  task: Task,
): Promise<TaskBreakdownResult> {
  try {
    const prompt = `
    As an AI assistant for people with ADHD, help break down this potentially vague task into specific, concrete, actionable subtasks.
    
    Task to break down:
    ${JSON.stringify({
      title: task.title,
      description: task.description,
    }, null, 2)}
    
    Follow these ADHD-friendly task breakdown principles:
    1. Create clear, specific action items (start with verbs)
    2. Break into steps that take 5-25 minutes each when possible
    3. Remove ambiguity - each step should be obvious what to do
    4. Include context or resources needed for each step
    5. Create a logical sequence that minimizes context switching
    6. Make first step extremely easy to reduce starting friction
    
    FORMAT: Return a JSON object with two properties:
    - "subtasks": an array of subtask objects, each with "title", "description", and "estimatedDuration" properties
    - "reasoning": a brief explanation of your breakdown approach
    `;

    const response = await fetch('/api/ai/advanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        action: 'breakdown',
        model: GEMINI_COMPLEX_MODEL,
        responseFormat: 'json'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Task breakdown failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data as TaskBreakdownResult;
  } catch (error) {
    console.error('AI Task Breakdown Error:', error);
    throw new Error('Failed to break down task');
  }
} 