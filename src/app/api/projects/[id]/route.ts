import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  errorResponse, 
  getAuthenticatedUserId, 
  notFoundResponse, 
  successResponse, 
  unauthorizedResponse, 
  verifyResourceOwnership 
} from '@/lib/server/api-helpers';
import { logger } from '@/lib/logger';
import { z } from 'zod';

type RouteParams = {
  params: {
    id: string;
  };
};

// Project validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be 100 characters or less'),
  description: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

// Update schema is a partial of the full schema
const updateProjectSchema = projectSchema.partial();

// Helper function to validate project data
async function validateProjectData(data: any, isUpdate = false) {
  const schema = isUpdate ? updateProjectSchema : projectSchema;
  try {
    return { 
      success: true, 
      data: await schema.parseAsync(data),
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

// GET /api/projects/[id] - Get a single project by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const projectId = params.id;
    
    // Verify the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership('project', projectId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Project', projectId);
    }
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            categories: true
          }
        }
      }
    });
    
    return successResponse({ project });
  } catch (error) {
    logger.error('Error fetching project:', {
      component: 'api/projects/[id]/GET',
      data: error
    });
    
    return errorResponse('Failed to fetch project', 500);
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const projectId = params.id;
    
    // Verify the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership('project', projectId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Project', projectId);
    }
    
    const data = await req.json();
    
    // Validate the data
    const { success, data: validatedData, error } = await validateProjectData(data);
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid data format', 400);
    }
    
    // Check for name conflicts (only if name is being updated)
    if (validatedData.name) {
      const existingProject = await prisma.project.findFirst({
        where: {
          userId,
          name: {
            equals: validatedData.name,
            mode: 'insensitive' // Case insensitive comparison
          },
          id: {
            not: projectId // Exclude current project
          }
        }
      });
      
      if (existingProject) {
        return errorResponse('A project with this name already exists', 400);
      }
    }
    
    // Prepare update data with date conversion
    const updateData = {
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null
    };
    
    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });
    
    return successResponse({ project: updatedProject });
  } catch (error) {
    logger.error('Error updating project:', {
      component: 'api/projects/[id]/PUT',
      data: error
    });
    
    return errorResponse('Failed to update project', 500);
  }
}

// PATCH /api/projects/[id] - Partially update a project
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const projectId = params.id;
    
    // Verify the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership('project', projectId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Project', projectId);
    }
    
    const patchData = await req.json();
    
    // Validate with partial schema
    const { success, data: validatedData, error } = await validateProjectData(patchData, true);
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid data format', 400);
    }
    
    // Check for name conflicts (only if name is being updated)
    if (validatedData.name) {
      const existingProject = await prisma.project.findFirst({
        where: {
          userId,
          name: {
            equals: validatedData.name,
            mode: 'insensitive' // Case insensitive comparison
          },
          id: {
            not: projectId // Exclude current project
          }
        }
      });
      
      if (existingProject) {
        return errorResponse('A project with this name already exists', 400);
      }
    }
    
    // Convert date if provided
    const updateData = {
      ...validatedData,
      dueDate: validatedData.dueDate !== undefined 
        ? (validatedData.dueDate ? new Date(validatedData.dueDate) : null)
        : undefined
    };
    
    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      }
    });
    
    return successResponse({ project: updatedProject });
  } catch (error) {
    logger.error('Error patching project:', {
      component: 'api/projects/[id]/PATCH',
      data: error
    });
    
    return errorResponse('Failed to update project', 500);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const projectId = params.id;
    
    // Verify the project exists and belongs to the user
    const isOwner = await verifyResourceOwnership('project', projectId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Project', projectId);
    }
    
    // Check if there are tasks associated with this project
    const tasksCount = await prisma.task.count({
      where: { projectId }
    });
    
    // Get query parameters for cascade option
    const { searchParams } = new URL(req.url);
    const cascade = searchParams.get('cascade') === 'true';
    
    // If there are associated tasks and cascade is not enabled, return an error
    if (tasksCount > 0 && !cascade) {
      return errorResponse(
        `Cannot delete project with ${tasksCount} associated tasks. Set cascade=true to delete tasks as well.`,
        400
      );
    }
    
    // If cascade is enabled, delete all associated tasks first
    if (cascade && tasksCount > 0) {
      // Delete all tasks associated with this project
      await prisma.task.deleteMany({
        where: { projectId }
      });
    }
    
    // Delete the project
    await prisma.project.delete({
      where: { id: projectId }
    });
    
    return successResponse({ 
      message: 'Project deleted successfully',
      tasksDeleted: cascade ? tasksCount : 0
    });
  } catch (error) {
    logger.error('Error deleting project:', {
      component: 'api/projects/[id]/DELETE',
      data: error
    });
    
    return errorResponse('Failed to delete project', 500);
  }
} 