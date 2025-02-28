import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { taskSchema, validateData } from '@/lib/server/validation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Priority, Emotion } from "@prisma/client";
import { recordTaskChange } from '@/lib/task-history';
import { logger } from '@/lib/logger';
import {
  errorResponse,
  getAuthenticatedUserId,
  handleCommonErrors,
  HttpStatus,
  successResponse,
  unauthorizedResponse,
} from '@/lib/server/api-helpers';
import { processRelation, validateRelationIds } from '@/lib/server/relation-helpers';

// GET /api/tasks - Get all tasks for authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const priority = searchParams.get('priority');
    const searchTerm = searchParams.get('search');
    
    // Build the where clause based on filters
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (categoryId) {
      where.categories = {
        some: { id: categoryId }
      };
    }
    
    if (priority) {
      where.priority = priority;
    }
    
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Get tasks for the authenticated user only
    const tasks = await prisma.task.findMany({
      where,
      include: {
        categories: true,
        subtasks: {
          include: {
            categories: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return successResponse({ tasks });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/GET');
  }
}

// POST /api/tasks - Create a new task with validation
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(taskSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Extract and validate category IDs using the helper
    const categoryValidation = validateRelationIds(
      body,
      'categoryIds',
      'categories'
    );
    
    // If validation failed, return an error
    if (!categoryValidation.success) {
      return errorResponse(`Category validation error: ${categoryValidation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Extract validated data and remove categoryIds and categories
    const { categoryIds: _, categories: __, ...taskData } = validation.data;
    
    // Get category IDs from validation result
    const categoryIds = categoryValidation.data || [];
    
    // Create the task
    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId, // Always set from the authenticated user
        categories: categoryIds.length > 0 ? {
          connect: categoryIds.map(id => ({ id })),
        } : undefined,
      },
      include: {
        categories: true,
      },
    });

    // Record task creation in task history
    await recordTaskChange(
      task.id,
      userId,
      'CREATED',
      {
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        categories: task.categories.map(c => c.id),
      }
    );
    
    return successResponse({ task }, HttpStatus.CREATED);
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/POST');
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Task ID is required", HttpStatus.BAD_REQUEST);
    }

    // Check if the task belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { userId: true, title: true },
    });

    if (!existingTask) {
      return errorResponse("Task not found", HttpStatus.NOT_FOUND);
    }

    if (existingTask.userId !== userId) {
      return errorResponse("You are not authorized to delete this task", HttpStatus.FORBIDDEN);
    }

    await prisma.task.delete({
      where: { id },
    });

    // Record the deletion in task history
    await recordTaskChange(
      id,
      userId,
      'DELETED',
      {
        deletedAt: new Date().toISOString(),
      },
      {
        title: existingTask.title,
        taskId: id
      }
    );

    return successResponse({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/DELETE');
  }
}
