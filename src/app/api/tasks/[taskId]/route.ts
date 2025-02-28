import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTaskSchema, validateData } from '@/lib/server/validation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { recordTaskChange, extractTaskChanges } from '@/lib/task-history';
import { logger } from '@/lib/logger';

type RouteParams = {
  params: {
    taskId: string;
  };
};

// Helper to get authenticated user ID with type safety
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    logger.error('Error getting user session:', {
      component: 'api/tasks/[taskId]',
      data: error
    });
    return null;
  }
}

// Generic error response builder
function errorResponse(message: string, statusCode: number = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  );
}

// Check if a task belongs to the authenticated user
async function verifyTaskOwnership(taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { userId: true },
  });
  
  return task?.userId === userId;
}

// GET /api/tasks/[taskId] - Get a single task by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    const { taskId } = params;
    
    // Check if task exists and belongs to the user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        categories: true,
        subtasks: {
          include: {
            categories: true,
          }
        },
        history: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Include recent history
        },
      },
    });
    
    if (!task) {
      return errorResponse('Task not found', 404);
    }
    
    // Verify ownership
    if (task.userId !== userId) {
      return errorResponse('Unauthorized', 403);
    }

    // Format history entries for the response
    const formattedHistory = task.history?.map(entry => ({
      id: entry.id,
      changeType: entry.changeType,
      changeData: JSON.parse(entry.changeData),
      previousData: entry.previousData ? JSON.parse(entry.previousData) : null,
      createdAt: entry.createdAt,
    })) || [];
    
    return NextResponse.json({ 
      task: {
        ...task,
        history: formattedHistory,
      }
    });
  } catch (error) {
    logger.error('Error fetching task:', {
      component: 'api/tasks/[taskId]',
      data: { params, error }
    });
    return errorResponse('Failed to fetch task', 500);
  }
}

// PUT /api/tasks/[taskId] - Update a task
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    const { taskId } = params;
    
    // Get the existing task first to compare changes
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });
    
    if (!existingTask) {
      return errorResponse('Task not found', 404);
    }
    
    // Check ownership
    if (existingTask.userId !== userId) {
      return errorResponse('Unauthorized access to this task', 403);
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(updateTaskSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, 400);
    }
    
    // Extract categoryIds - support both 'categoryIds' and 'categories' fields for backward compatibility
    let categoryIds = validation.data.categoryIds;
    
    // If categoryIds isn't present but there's a categories field, use that instead
    if (!categoryIds && body.categories) {
      // Check if it's an array of strings (IDs) or an array of objects with IDs
      if (Array.isArray(body.categories)) {
        if (body.categories.length > 0) {
          // If it's an array of objects with an id property, extract just the IDs
          if (typeof body.categories[0] === 'object' && body.categories[0].id) {
            categoryIds = body.categories.map((cat: any) => cat.id);
          } 
          // If it's already an array of strings, use directly
          else if (typeof body.categories[0] === 'string') {
            categoryIds = body.categories;
          }
        } else {
          // Empty array
          categoryIds = [];
        }
      }
    }
    
    // Remove both from taskData to avoid any confusions
    const { categoryIds: _, categories: __, ...taskData } = validation.data;
    
    // Detect completion status change for special handling
    const isCompletionStatusChange = 
      'completedAt' in taskData && 
      !!taskData.completedAt !== !!existingTask.completedAt;
    
    // Extract changes for history tracking
    const changes = extractTaskChanges(existingTask, taskData);
    
    // Update the task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskData,
        // Handle categories if provided
        categories: categoryIds ? {
          set: [], // Clear existing connections
          connect: categoryIds.map(catId => ({ id: catId })),
        } : undefined,
      },
      include: {
        categories: true,
        subtasks: {
          include: {
            categories: true,
          }
        },
      },
    });
    
    // Record the change in task history
    const changeType = isCompletionStatusChange
      ? (taskData.completedAt ? 'COMPLETED' : 'UPDATED')
      : 'UPDATED';
    
    await recordTaskChange(
      taskId,
      userId,
      changeType,
      changes,
      { ...existingTask }
    );
    
    return NextResponse.json({ task });
  } catch (error) {
    logger.error('Error updating task:', {
      component: 'api/tasks/[taskId]',
      data: { params, error }
    });
    
    if ((error as any).code === 'P2025') {
      return errorResponse('Task not found', 404);
    }
    
    return errorResponse('Failed to update task', 500);
  }
}

// PATCH /api/tasks/[taskId] - Partially update a task
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    const taskId = params.taskId;
    
    // Check if task exists and belongs to the user
    const taskOwned = await verifyTaskOwnership(taskId, userId);
    
    if (!taskOwned) {
      return errorResponse('Task not found or unauthorized', 404);
    }
    
    // Get the original task for comparison
    const originalTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { categories: true }
    });
    
    if (!originalTask) {
      return errorResponse('Task not found', 404);
    }
    
    // Get patch data
    const patchData = await req.json();
    
    // Validate the patch data
    const { success, data: validatedData, error } = await validateData(
      updateTaskSchema,
      patchData
    );
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid data format', 400);
    }
    
    // Handle category IDs or category objects
    let categoryIds = validatedData.categoryIds;
    
    // If categoryIds isn't present but there's a categories field, use that instead
    if (!categoryIds && validatedData.categories) {
      if (Array.isArray(validatedData.categories)) {
        if (validatedData.categories.length > 0) {
          // If it's an array of objects with an id property, extract just the IDs
          if (typeof validatedData.categories[0] === 'object' && validatedData.categories[0].id) {
            categoryIds = validatedData.categories.map((cat: any) => cat.id);
          }
          // If it's already an array of strings, use directly
          else if (typeof validatedData.categories[0] === 'string') {
            categoryIds = validatedData.categories;
          }
        } else {
          // Empty array
          categoryIds = [];
        }
      }
    }
    
    // Prepare update data, only including fields that were actually provided
    const updateData: any = {};
    
    // Only include fields that are explicitly provided
    for (const [key, value] of Object.entries(validatedData)) {
      if (value !== undefined && key !== 'categories' && key !== 'categoryIds') {
        updateData[key] = value;
      }
    }
    
    // Handle categories separately if provided
    if (categoryIds !== undefined) {
      updateData.categories = {
        set: categoryIds.map((id: string) => ({ id }))
      };
    }
    
    // Perform the update
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        categories: true,
        subtasks: true,
        goal: true
      }
    });
    
    // Record changes for task history
    const changes = extractTaskChanges(originalTask, updatedTask);
    
    if (Object.keys(changes).length > 0) {
      await recordTaskChange(
        taskId,
        userId,
        'UPDATED',
        changes,
        originalTask
      );
    }
    
    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    logger.error('Error patching task:', {
      component: 'api/tasks/[taskId]/PATCH',
      data: error
    });
    
    return errorResponse('Failed to update task', 500);
  }
}

// DELETE /api/tasks/[taskId] - Delete a task
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { taskId } = params;
    
    // Log the deletion attempt
    logger.info(`Attempting to delete task ${taskId}`, {
      component: 'api/tasks/[taskId]/DELETE',
      taskId
    });
    
    const userId = await getAuthenticatedUserId();
    
    // In development, allow unauthenticated requests for easier testing
    // In production, require authentication
    if (!userId && process.env.NODE_ENV !== 'development') {
      logger.warn(`Unauthorized deletion attempt for task ${taskId}`, {
        component: 'api/tasks/[taskId]/DELETE',
        taskId
      });
      return errorResponse('Unauthorized', 401);
    }
    
    // For development without authentication
    const queryUserId = userId || 'dev-user';
    
    // Get the existing task first to check ownership
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      select: { userId: true, title: true }
    });
    
    if (!existingTask) {
      logger.warn(`Task not found: ${taskId}`, {
        component: 'api/tasks/[taskId]/DELETE',
        taskId
      });
      return errorResponse('Task not found', 404);
    }
    
    // Skip ownership check in development for easier testing
    if (process.env.NODE_ENV !== 'development') {
      // Check ownership
      if (existingTask.userId !== queryUserId) {
        logger.warn(`Unauthorized access to task ${taskId}`, {
          component: 'api/tasks/[taskId]/DELETE',
          taskId,
          requestUserId: queryUserId,
          taskUserId: existingTask.userId
        });
        return errorResponse('Unauthorized access to this task', 403);
      }
    }
    
    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    // Record the deletion in task history
    try {
      await recordTaskChange(
        taskId,
        queryUserId,
        'DELETED',
        {
          deletedAt: new Date().toISOString(),
        },
        {
          title: existingTask.title,
          taskId
        }
      );
    } catch (historyError) {
      // Don't fail the request if history recording fails
      logger.error(`Failed to record task deletion history: ${historyError}`, {
        component: 'api/tasks/[taskId]/DELETE',
        taskId
      });
    }
    
    logger.info(`Successfully deleted task ${taskId}`, {
      component: 'api/tasks/[taskId]/DELETE',
      taskId
    });
    
    // Return 204 No Content for successful deletion
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error deleting task: ${errorMessage}`, {
      component: 'api/tasks/[taskId]/DELETE',
      params,
      error
    });
    
    // Check for Prisma-specific errors
    if ((error as any).code === 'P2025') {
      return errorResponse('Task not found', 404);
    }
    
    return errorResponse('Failed to delete task', 500);
  }
} 