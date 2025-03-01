import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTaskSchema, validateData } from '@/lib/server/validation';
import { recordTaskChange, extractTaskChanges } from '@/lib/task-history';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  handleCommonErrors,
  HttpStatus,
  getAuthenticatedUserId,
  verifyResourceOwnership,
  validateRelationIds,
  processRelation
} from '@/lib/server/api';

type RouteParams = {
  params: {
    taskId: string;
  };
};

// GET /api/tasks/[taskId] - Get a single task by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
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
      return notFoundResponse('Task');
    }
    
    // Verify ownership
    if (task.userId !== userId) {
      return forbiddenResponse();
    }

    // Format history entries for the response
    const formattedHistory = task.history?.map(entry => ({
      id: entry.id,
      changeType: entry.changeType,
      changeData: JSON.parse(entry.changeData),
      previousData: entry.previousData ? JSON.parse(entry.previousData) : null,
      createdAt: entry.createdAt,
    })) || [];
    
    return successResponse({ 
      task: {
        ...task,
        history: formattedHistory,
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/[taskId]/GET');
  }
}

// PUT /api/tasks/[taskId] - Update a task (complete replacement)
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { taskId } = params;
    
    // Get the existing task first to compare changes
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        categories: {
          select: { id: true }
        }
      }
    });
    
    if (!existingTask) {
      return notFoundResponse('Task');
    }
    
    // Check ownership
    if (existingTask.userId !== userId) {
      return forbiddenResponse();
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(updateTaskSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Extract and validate category IDs
    const categoryValidation = await validateRelationIds(
      body,
      'categoryIds',
      'categories'
    );
    
    if (!categoryValidation.success) {
      return errorResponse(`Category validation error: ${categoryValidation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Extract validated data and remove categoryIds and categories fields
    const { categoryIds: _, categories: __, ...taskData } = validation.data;
    
    // Get category IDs from validation result
    const categoryIds = categoryValidation.data || [];
    
    // Process category relations
    const categoryRelations = processRelation(categoryIds);
    
    // Detect completion status change for special handling
    const isCompletionStatusChange = 
      'completedAt' in taskData && 
      !!taskData.completedAt !== !!existingTask.completedAt;
    
    // Extract changes for history tracking
    const changes = extractTaskChanges(existingTask, {
      ...taskData,
      categories: categoryIds
    });
    
    // Update the task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskData,
        // Handle categories 
        categories: categoryRelations
          ? { set: [], ...categoryRelations }
          : undefined
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
      { ...existingTask, categories: existingTask.categories.map(c => c.id) }
    );
    
    return successResponse({ task });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/[taskId]/PUT');
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
      return unauthorizedResponse();
    }
    
    const { taskId } = params;
    
    // Check if task exists and belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        categories: {
          select: { id: true }
        }
      }
    });
    
    if (!existingTask) {
      return notFoundResponse('Task');
    }
    
    if (existingTask.userId !== userId) {
      return forbiddenResponse();
    }
    
    const body = await req.json();
    
    // Validate the partial update data
    const validation = await validateData(updateTaskSchema.partial(), body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Handle category relations
    let categoryUpdate = undefined;
    
    // If categoryIds or categories is in the request, process them
    if ('categoryIds' in body || 'categories' in body) {
      const categoryValidation = await validateRelationIds(
        body,
        'categoryIds',
        'categories'
      );
      
      if (!categoryValidation.success) {
        return errorResponse(`Category validation error: ${categoryValidation.error}`, HttpStatus.BAD_REQUEST);
      }
      
      const categoryIds = categoryValidation.data || [];
      
      // If the client explicitly provided categories, update them
      // Otherwise, leave them unchanged
      if (categoryIds.length > 0 || ('categoryIds' in body || 'categories' in body)) {
        categoryUpdate = {
          set: [], // Clear existing connections
          ...(categoryIds.length > 0 ? { connect: categoryIds.map(id => ({ id })) } : {})
        };
      }
    }
    
    // Extract validated data and remove category-related fields
    const { categoryIds: _, categories: __, ...taskData } = validation.data;
    
    // Detect completion status change for special handling
    const isCompletionStatusChange = 
      'completedAt' in taskData && 
      !!taskData.completedAt !== !!existingTask.completedAt;
    
    // Extract changes for history tracking
    const changes = extractTaskChanges(existingTask, {
      ...taskData,
      ...(categoryUpdate ? { categories: body.categoryIds || (body.categories || []).map((c: any) => typeof c === 'string' ? c : c.id) } : {})
    });
    
    // Update the task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...taskData,
        categories: categoryUpdate
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
      { ...existingTask, categories: existingTask.categories.map(c => c.id) }
    );
    
    return successResponse({ task });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/[taskId]/PATCH');
  }
}

// DELETE /api/tasks/[taskId] - Delete a specific task
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { taskId } = params;
    
    // Check if the task exists and belongs to the user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, userId: true, title: true }
    });
    
    if (!task) {
      return notFoundResponse('Task');
    }
    
    if (task.userId !== userId) {
      return forbiddenResponse();
    }
    
    // Delete the task
    await prisma.task.delete({
      where: { id: taskId }
    });
    
    // Record the deletion in task history
    await recordTaskChange(
      taskId,
      userId,
      'DELETED',
      {
        deletedAt: new Date().toISOString(),
      },
      {
        title: task.title,
        taskId: task.id
      }
    );
    
    return successResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/[taskId]/DELETE');
  }
} 