import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { projectSchema, updateProjectSchema, validateData } from '@/lib/server/validation';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
  handleCommonErrors,
  HttpStatus,
  getAuthenticatedUserId,
  verifyResourceOwnership
} from '@/lib/server/api';

type RouteParams = {
  params: {
    id: string;
  };
};

// GET /api/projects/[projectId] - Get a single project by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Get the project with related data
    const project = await prisma.project.findUnique({
      where: { id: id },
      include: {
        goals: {
          include: {
            tasks: {
              select: {
                id: true,
                title: true,
                priority: true,
                dueDate: true,
                completedAt: true,
                categories: true
              }
            },
            _count: {
              select: { tasks: true }
            }
          }
        },
        _count: {
          select: { goals: true }
        }
      }
    });
    
    if (!project) {
      return notFoundResponse('Project');
    }
    
    // Verify ownership
    if (project.userId !== userId) {
      return forbiddenResponse();
    }
    
    // Calculate task totals
    const taskCount = project.goals.reduce((sum, goal) => sum + goal._count.tasks, 0);
    const completedTaskCount = project.goals.reduce(
      (sum, goal) => sum + goal.tasks.filter(task => task.completedAt).length, 
      0
    );
    
    return successResponse({ 
      project: {
        ...project,
        goalCount: project._count.goals,
        taskCount,
        completedTaskCount,
        progress: taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0,
        _count: undefined // Remove the _count property from the response
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/[projectId]/GET');
  }
}

// PUT /api/projects/[projectId] - Update a project (complete replacement)
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Check if the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership(
      id,
      userId,
      prisma.project
    );
    
    if (!isOwner) {
      return notFoundResponse('Project');
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(projectSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Update the project
    const project = await prisma.project.update({
      where: { id: id },
      data: validation.data,
      include: {
        _count: {
          select: { goals: true }
        }
      }
    });
    
    return successResponse({ 
      project: {
        ...project,
        goalCount: project._count.goals,
        _count: undefined // Remove the _count property from the response
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/[projectId]/PUT');
  }
}

// PATCH /api/projects/[projectId] - Partially update a project
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Check if the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership(
      id,
      userId,
      prisma.project
    );
    
    if (!isOwner) {
      return notFoundResponse('Project');
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(updateProjectSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Update the project
    const project = await prisma.project.update({
      where: { id: id },
      data: validation.data,
      include: {
        _count: {
          select: { goals: true }
        }
      }
    });
    
    return successResponse({ 
      project: {
        ...project,
        goalCount: project._count.goals,
        _count: undefined // Remove the _count property from the response
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/[projectId]/PATCH');
  }
}

// DELETE /api/projects/[projectId] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const { id } = params;
    
    // Check if the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership(
      id,
      userId,
      prisma.project
    );
    
    if (!isOwner) {
      return notFoundResponse('Project');
    }
    
    // Delete the project
    await prisma.project.delete({
      where: { id: id }
    });
    
    return successResponse({ 
      message: 'Project deleted successfully'
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/[projectId]/DELETE');
  }
} 