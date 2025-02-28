import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { goalSchema, validateData } from '@/lib/server/validation';
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

/**
 * GET /api/goals - Get all goals for authenticated user
 * Optional query parameters:
 * - projectId: Filter goals by project
 * - search: Search in goal names and descriptions
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const searchTerm = searchParams.get('search');
    
    // Build the where clause based on filters
    const where: any = {};
    
    // Only get goals from projects owned by the current user
    where.project = {
      userId
    };
    
    // Add specific projectId if provided
    if (projectId) {
      where.projectId = projectId;
    }
    
    // Add search term if provided
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Get goals
    const goals = await prisma.goal.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    });
    
    return successResponse({ goals });
  } catch (error) {
    return handleCommonErrors(error, 'api/goals/GET');
  }
}

/**
 * POST /api/goals - Create a new goal
 * Required fields:
 * - name: string
 * - projectId: string
 * Optional fields:
 * - description: string
 * - taskIds: string[] (existing task IDs to connect)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(goalSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Validate the project exists and belongs to the user
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
    
    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        ...goalData,
        projectId: validation.data!.projectId,
        tasks: taskIds.length > 0 ? {
          connect: taskIds.map(id => ({ id })),
        } : undefined,
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
    
    logger.info(`Goal created: ${goal.id}`, {
      goalId: goal.id,
      userId
    });
    
    return successResponse({ goal }, HttpStatus.CREATED);
  } catch (error) {
    return handleCommonErrors(error, 'api/goals/POST');
  }
} 