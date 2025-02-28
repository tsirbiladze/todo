import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Priority, Emotion, Prisma } from '@prisma/client';
import {
  errorResponse,
  getAuthenticatedUserId,
  handleCommonErrors,
  HttpStatus,
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  noContentResponse
} from '@/lib/server/api-helpers';
import { logger } from '@/lib/logger';

// Schema for template updates
const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedDuration: z.number().optional(),
  emotion: z.enum(['EXCITED', 'NEUTRAL', 'ANXIOUS', 'OVERWHELMED', 'CONFIDENT']).optional(),
  categoryIds: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
  }).optional(),
});

const updateTemplateSchema = templateSchema.partial();

// Type for template with categories
type TemplateWithCategories = Prisma.TaskTemplateGetPayload<{
  include: { categories: true }
}>;

// Type for recurrence data
type RecurrenceData = {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
};

/**
 * Format template for API response
 */
function formatTemplateResponse(template: TemplateWithCategories) {
  return {
    id: template.id,
    name: template.name,
    description: template.description || '',
    priority: template.priority,
    estimatedDuration: template.estimatedDuration || 0,
    emotion: template.emotion,
    categoryIds: template.categories.map((cat) => cat.id),
    isRecurring: template.isRecurring,
    recurrence: template.recurrence 
      ? JSON.parse(template.recurrence.toString()) as RecurrenceData 
      : undefined,
  };
}

/**
 * GET /api/templates/[id] - Get a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Fetch the template with its categories
    const template = await prisma.taskTemplate.findUnique({
      where: { id },
      include: {
        categories: true,
      },
    });
    
    // Check if the template exists
    if (!template) {
      return notFoundResponse('Template', id);
    }
    
    // Check if the template belongs to the authenticated user
    if (template.userId !== userId) {
      return forbiddenResponse('You do not have permission to access this template');
    }
    
    // Format the response
    const formattedTemplate = formatTemplateResponse(template);
    
    return successResponse({ template: formattedTemplate });
  } catch (error) {
    return handleCommonErrors(error, 'api/templates/[id]/GET');
  }
}

/**
 * PUT /api/templates/[id] - Update a template completely (replace)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    const body = await request.json();
    
    try {
      // Validate the request body
      const validatedData = await templateSchema.parseAsync(body);
      
      // Check if the template exists and belongs to the user
      const existingTemplate = await prisma.taskTemplate.findFirst({
        where: {
          id,
          userId,
        },
      });
      
      if (!existingTemplate) {
        return notFoundResponse('Template', id);
      }
      
      // Handle recurrence serialization
      let recurrenceValue: Prisma.InputJsonValue | undefined = undefined;
      if (validatedData.recurrence) {
        recurrenceValue = JSON.stringify(validatedData.recurrence) as Prisma.InputJsonValue;
      }
      
      // Update the template
      const template = await prisma.taskTemplate.update({
        where: {
          id,
        },
        data: {
          name: validatedData.name,
          description: validatedData.description,
          priority: validatedData.priority as Priority,
          estimatedDuration: validatedData.estimatedDuration,
          emotion: validatedData.emotion as Emotion | null,
          isRecurring: validatedData.isRecurring || false,
          recurrence: recurrenceValue,
          categories: {
            set: [], // Clear existing connections
            connect: validatedData.categoryIds?.map(catId => ({ id: catId })) || [],
          },
        },
        include: {
          categories: true,
        },
      });
      
      // Format the response
      const formattedTemplate = formatTemplateResponse(template);
      
      logger.info(`Template updated: ${id}`, {
        data: { templateId: id, userId }
      });
      
      return successResponse({ template: formattedTemplate });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return errorResponse(`Validation error: ${errors}`, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  } catch (error) {
    return handleCommonErrors(error, 'api/templates/[id]/PUT');
  }
}

/**
 * PATCH /api/templates/[id] - Partially update a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    const body = await request.json();
    
    try {
      // Validate the request body against partial schema
      const validatedData = await updateTemplateSchema.parseAsync(body);
      
      // Check if the template exists and belongs to the user
      const existingTemplate = await prisma.taskTemplate.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          categories: true,
        },
      });
      
      if (!existingTemplate) {
        return notFoundResponse('Template', id);
      }
      
      // Prepare the update data without recurrence (we'll handle it separately)
      const { recurrence, ...restData } = validatedData;
      const updateData: Prisma.TaskTemplateUpdateInput = { ...restData };
      
      // Handle recurrence data
      if (recurrence) {
        updateData.recurrence = JSON.stringify(recurrence) as Prisma.InputJsonValue;
      }
      
      // Handle categories if provided
      let categoryUpdate = undefined;
      if (validatedData.categoryIds) {
        categoryUpdate = {
          set: [], // Clear existing connections
          connect: validatedData.categoryIds.map(catId => ({ id: catId })),
        };
      }
      
      // Update the template
      const template = await prisma.taskTemplate.update({
        where: {
          id,
        },
        data: {
          ...updateData,
          categories: categoryUpdate,
        },
        include: {
          categories: true,
        },
      });
      
      // Format the response
      const formattedTemplate = formatTemplateResponse(template);
      
      logger.info(`Template partially updated: ${id}`, {
        data: { templateId: id, userId }
      });
      
      return successResponse({ template: formattedTemplate });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        return errorResponse(`Validation error: ${errors}`, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  } catch (error) {
    return handleCommonErrors(error, 'api/templates/[id]/PATCH');
  }
}

/**
 * DELETE /api/templates/[id] - Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Check if the template exists and belongs to the user
    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: {
        id,
        userId,
      },
    });
    
    if (!existingTemplate) {
      return notFoundResponse('Template', id);
    }
    
    // Delete the template
    await prisma.taskTemplate.delete({
      where: { id },
    });
    
    logger.info(`Template deleted: ${id}`, {
      data: { templateId: id, userId }
    });
    
    // Return 204 No Content
    return noContentResponse();
  } catch (error) {
    return handleCommonErrors(error, 'api/templates/[id]/DELETE');
  }
} 