import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalSchema, updateGoalSchema, validateData } from '@/lib/server/validation';
import { logger } from '@/lib/logger';
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
import { processRelation, validateRelationIds } from '@/lib/server/relation-helpers';

/**
 * GET /api/goals/[id] - Get a specific goal by ID
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
    
    // Fetch the goal with its project and tasks
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      },
    });
    
    // Check if the goal exists
    if (!goal) {
      return notFoundResponse('Goal', id);
    }
    
    // Check if the goal belongs to the authenticated user
    if (goal.project.userId !== userId) {
      return forbiddenResponse('You do not have permission to access this goal');
    }
    
    return successResponse({ goal });
  } catch (error) {
    return handleCommonErrors(error, 'api/goals/[id]/GET');
  }
}

/**
 * PUT /api/goals/[id] - Update a goal completely (replace)
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
    
    // Validate request body
    const validation = await validateData(goalSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } }
    });
    
    if (!existingGoal) {
      return notFoundResponse('Goal', id);
    }
    
    // Check if the goal belongs to the authenticated user
    if (existingGoal.project.userId !== userId) {
      return forbiddenResponse('You do not have permission to update this goal');
    }
    
    // Validate that the project exists and belongs to the user
    const project = await prisma.project.findUnique({
      where: {
        id: validation.data!.projectId,
        userId
      }
    });
    
    if (!project) {
      return errorResponse(
        `Project with ID ${validation.data!.projectId} not found or does not belong to you`,
        HttpStatus.NOT_FOUND
      );
    }
    
    // Extract and validate task IDs using the helper
    const taskValidation = validateRelationIds(
      body,
      'taskIds',
      'tasks'
    );
    
    // If validation failed, return an error
    if (!taskValidation.success) {
      return errorResponse(`Task validation error: ${taskValidation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Extract validated data and remove taskIds and tasks
    const { taskIds: _, tasks: __, ...goalData } = validation.data!;
    
    // Get task IDs from validation result
    const taskIds = taskValidation.data || [];
    
    // If there are task IDs, ensure they all exist and belong to the user
    if (taskIds.length > 0) {
      const tasksCount = await prisma.task.count({
        where: {
          id: { in: taskIds },
          userId
        }
      });
      
      if (tasksCount !== taskIds.length) {
        return errorResponse(
          'Some of the provided tasks do not exist or do not belong to you',
          HttpStatus.BAD_REQUEST
        );
      }
    }
    
    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...goalData,
        tasks: {
          set: [], // Clear existing connections
          connect: taskIds.map(id => ({ id })), // Connect new ones
        }
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
    });
    
    logger.info(`Goal updated: ${id}`, {
      goalId: id,
      userId
    });
    
    return successResponse({ goal: updatedGoal });
  } catch (error) {
    return handleCommonErrors(error, 'api/goals/[id]/PUT');
  }
}

/**
 * PATCH /api/goals/[id] - Partially update a goal
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
    
    // Validate request body using the partial schema
    const validation = await validateData(updateGoalSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } }
    });
    
    if (!existingGoal) {
      return notFoundResponse('Goal', id);
    }
    
    // Check if the goal belongs to the authenticated user
    if (existingGoal.project.userId !== userId) {
      return forbiddenResponse('You do not have permission to update this goal');
    }
    
    // If projectId is being updated, validate it
    if (validation.data!.projectId) {
      const project = await prisma.project.findUnique({
        where: {
          id: validation.data!.projectId,
          userId
        }
      });
      
      if (!project) {
        return errorResponse(
          `Project with ID ${validation.data!.projectId} not found or does not belong to you`,
          HttpStatus.NOT_FOUND
        );
      }
    }
    
    // Handle task relationship changes
    let taskUpdateOperation = undefined;
    
    // Extract and validate task IDs if present in the request
    if (body.taskIds !== undefined || body.tasks !== undefined) {
      const taskValidation = validateRelationIds(
        body,
        'taskIds',
        'tasks'
      );
      
      // If validation failed, return an error
      if (!taskValidation.success) {
        return errorResponse(`Task validation error: ${taskValidation.error}`, HttpStatus.BAD_REQUEST);
      }
      
      // Get task IDs from validation result
      const taskIds = taskValidation.data || [];
      
      // If there are task IDs, ensure they all exist and belong to the user
      if (taskIds.length > 0) {
        const tasksCount = await prisma.task.count({
          where: {
            id: { in: taskIds },
            userId
          }
        });
        
        if (tasksCount !== taskIds.length) {
          return errorResponse(
            'Some of the provided tasks do not exist or do not belong to you',
            HttpStatus.BAD_REQUEST
          );
        }
      }
      
      // Create the task update operation
      taskUpdateOperation = {
        set: taskIds.map(id => ({ id })), // Replace with new connections
      };
    }
    
    // Extract validated data and remove taskIds and tasks
    const { taskIds: _, tasks: __, ...goalData } = validation.data!;
    
    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: {
        ...goalData,
        tasks: taskUpdateOperation,
      },
      include: {
        project: {
          select: {
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
    });
    
    logger.info(`Goal partially updated: ${id}`, {
      goalId: id,
      userId
    });
    
    return successResponse({ goal: updatedGoal });
  } catch (error) {
    return handleCommonErrors(error, 'api/goals/[id]/PATCH');
  }
}

/**
 * DELETE /api/goals/[id] - Delete a goal
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
    
    // Check if the goal exists
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } }
    });
    
    if (!existingGoal) {
      return notFoundResponse('Goal', id);
    }
    
    // Check if the goal belongs to the authenticated user
    if (existingGoal.project.userId !== userId) {
      return forbiddenResponse('You do not have permission to delete this goal');
    }
    
    // Delete the goal
    await prisma.goal.delete({
      where: { id }
    });
    
    logger.info(`Goal deleted: ${id}`, {
      goalId: id,
      userId
    });
    
    // Return 204 No Content
    return noContentResponse();
  } catch (error) {
    return handleCommonErrors(error, 'api/goals/[id]/DELETE');
  }
} 