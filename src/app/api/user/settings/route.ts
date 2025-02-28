import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { 
  errorResponse, 
  getAuthenticatedUserId, 
  handleCommonErrors, 
  HttpStatus, 
  successResponse, 
  unauthorizedResponse,
  ValidationResult
} from '@/lib/server/api-helpers';
import { logger } from '@/lib/logger';

// User settings validation schema
const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().optional(),
  weekStartsOn: z.number().min(0).max(6).optional(),
  hourFormat: z.enum(['12', '24']).optional(),
  enableNotifications: z.boolean().optional(),
  notificationSound: z.string().optional(),
  notificationVolume: z.number().min(0).max(100).optional(),
  focusMode: z.object({
    defaultDuration: z.number().min(1).max(240).optional(),
    breakDuration: z.number().min(1).max(60).optional(),
    longBreakDuration: z.number().min(1).max(120).optional(),
    sessionsUntilLongBreak: z.number().min(1).max(10).optional(),
    autoStartBreaks: z.boolean().optional(),
    autoStartNextSession: z.boolean().optional(),
    defaultSoundType: z.string().optional(),
    defaultSound: z.string().optional(),
    soundVolume: z.number().min(0).max(100).optional(),
  }).optional(),
  aiAssistant: z.object({
    defaultModel: z.string().optional(),
    autoSuggestAIHelp: z.boolean().optional(),
  }).optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
});

/**
 * Validate settings data against the schema
 */
async function validateSettingsData(data: any): Promise<ValidationResult<z.infer<typeof userSettingsSchema>>> {
  try {
    const validatedData = await userSettingsSchema.parseAsync(data);
    return { 
      success: true, 
      data: validatedData,
      error: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        success: false,
        data: null,
        error: errorMessages,
      };
    }
    
    return {
      success: false,
      data: null,
      error: 'Invalid data format',
    };
  }
}

// GET /api/user/settings - Get user settings
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    // Get user settings
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    
    // If settings don't exist yet, return default settings
    if (!userSettings) {
      const defaultSettings = {
        theme: 'system',
        timezone: 'UTC',
        weekStartsOn: 0, // Sunday
        hourFormat: '12',
        enableNotifications: true,
        notificationSound: 'bell.mp3',
        notificationVolume: 80,
        focusMode: {
          defaultDuration: 25,
          breakDuration: 5,
          longBreakDuration: 15,
          sessionsUntilLongBreak: 4,
          autoStartBreaks: false,
          autoStartNextSession: false,
          defaultSoundType: 'ambient',
          defaultSound: 'white-noise.mp3',
          soundVolume: 50,
        },
        aiAssistant: {
          defaultModel: 'gpt-3.5-turbo',
          autoSuggestAIHelp: true,
        },
        language: 'en',
        dateFormat: 'MM/DD/YYYY',
      };
      
      return successResponse({ settings: defaultSettings });
    }
    
    // Parse JSON fields
    const parsedSettings = {
      ...userSettings,
      focusMode: userSettings.focusMode ? JSON.parse(userSettings.focusMode as string) : undefined,
      aiAssistant: userSettings.aiAssistant ? JSON.parse(userSettings.aiAssistant as string) : undefined,
    };
    
    return successResponse({ settings: parsedSettings });
  } catch (error) {
    return handleCommonErrors(error, 'api/user/settings/GET');
  }
}

// PUT /api/user/settings - Replace all user settings
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const data = await req.json();
    
    // Validate the data
    const { success, data: validatedData, error } = await validateSettingsData(data);
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid data format', HttpStatus.BAD_REQUEST);
    }
    
    // Prepare complex objects for storage
    const updateData = {
      ...validatedData,
      focusMode: validatedData.focusMode 
        ? JSON.stringify(validatedData.focusMode) 
        : undefined,
      aiAssistant: validatedData.aiAssistant 
        ? JSON.stringify(validatedData.aiAssistant) 
        : undefined,
      userId // Ensure userId is included
    };
    
    // Upsert the settings (create if they don't exist, update if they do)
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      create: updateData,
      update: updateData,
    });
    
    // Parse JSON fields for response
    const parsedSettings = {
      ...updatedSettings,
      focusMode: updatedSettings.focusMode ? JSON.parse(updatedSettings.focusMode as string) : undefined,
      aiAssistant: updatedSettings.aiAssistant ? JSON.parse(updatedSettings.aiAssistant as string) : undefined,
    };
    
    return successResponse({ settings: parsedSettings });
  } catch (error) {
    return handleCommonErrors(error, 'api/user/settings/PUT');
  }
}

// PATCH /api/user/settings - Update specific user settings
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const data = await req.json();
    
    // Validate the data (partial)
    const { success, data: validatedData, error } = await validateSettingsData(data);
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid data format', HttpStatus.BAD_REQUEST);
    }
    
    // Get existing settings
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    
    // Handle complex objects (merge with existing data)
    let mergedFocusMode = validatedData.focusMode;
    let mergedAiAssistant = validatedData.aiAssistant;
    
    // If updating focusMode, merge with existing
    if (validatedData.focusMode && existingSettings?.focusMode) {
      const existingFocusMode = JSON.parse(existingSettings.focusMode as string);
      mergedFocusMode = {
        ...existingFocusMode,
        ...validatedData.focusMode
      };
    }
    
    // If updating aiAssistant, merge with existing
    if (validatedData.aiAssistant && existingSettings?.aiAssistant) {
      const existingAiAssistant = JSON.parse(existingSettings.aiAssistant as string);
      mergedAiAssistant = {
        ...existingAiAssistant,
        ...validatedData.aiAssistant
      };
    }
    
    // Prepare update data
    const updateData = {
      ...validatedData,
      focusMode: mergedFocusMode ? JSON.stringify(mergedFocusMode) : validatedData.focusMode 
        ? JSON.stringify(validatedData.focusMode) 
        : undefined,
      aiAssistant: mergedAiAssistant ? JSON.stringify(mergedAiAssistant) : validatedData.aiAssistant 
        ? JSON.stringify(validatedData.aiAssistant) 
        : undefined,
    };
    
    // Remove undefined properties
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });
    
    // Upsert the settings
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        ...updateData,
        userId
      },
      update: updateData,
    });
    
    // Parse JSON fields for response
    const parsedSettings = {
      ...updatedSettings,
      focusMode: updatedSettings.focusMode ? JSON.parse(updatedSettings.focusMode as string) : undefined,
      aiAssistant: updatedSettings.aiAssistant ? JSON.parse(updatedSettings.aiAssistant as string) : undefined,
    };
    
    return successResponse({ settings: parsedSettings });
  } catch (error) {
    return handleCommonErrors(error, 'api/user/settings/PATCH');
  }
} 