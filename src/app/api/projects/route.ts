import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { projectSchema, validateData } from '@/lib/server/validation';
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  handleCommonErrors,
  HttpStatus,
  getAuthenticatedUserId
} from '@/lib/server/api';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Project validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be 100 characters or less'),
  description: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
});

// Helper function to validate project data
async function validateProjectData(data: any) {
  try {
    return { 
      success: true, 
      data: await projectSchema.parseAsync(data),
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

// GET /api/projects - Get all projects for authenticated user
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search');
    
    // Build the where clause based on filters
    const where: any = { userId };
    
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Get projects for the authenticated user
    const projects = await prisma.project.findMany({
      where,
      include: {
        goals: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { tasks: true }
            }
          }
        },
        _count: {
          select: { goals: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Enhance projects with goal counts
    const enhancedProjects = projects.map(project => ({
      ...project,
      goalCount: project._count.goals,
      taskCount: project.goals.reduce((sum, goal) => sum + goal._count.tasks, 0),
      _count: undefined, // Remove the _count property from the response
    }));
    
    return successResponse({ projects: enhancedProjects });
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/GET');
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(projectSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    // Create the project
    const project = await prisma.project.create({
      data: {
        ...validation.data,
        userId, // Always set from the authenticated user
      },
    });
    
    return successResponse({ project }, HttpStatus.CREATED);
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/POST');
  }
}

// DELETE /api/projects - Delete multiple projects (bulk delete)
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const projectIds = searchParams.get("ids")?.split(",");

    if (!projectIds || projectIds.length === 0) {
      return errorResponse("Project IDs are required", HttpStatus.BAD_REQUEST);
    }

    // Ensure all projects belong to the user
    const projects = await prisma.project.findMany({
      where: { 
        id: { in: projectIds },
      },
      select: { id: true, userId: true },
    });

    // Filter out projects that don't belong to the user
    const authorizedProjectIds = projects
      .filter(project => project.userId === userId)
      .map(project => project.id);

    if (authorizedProjectIds.length === 0) {
      return errorResponse("No authorized projects found", HttpStatus.NOT_FOUND);
    }

    // Delete the projects
    await prisma.project.deleteMany({
      where: { 
        id: { in: authorizedProjectIds },
        userId 
      },
    });

    return successResponse({ 
      deletedCount: authorizedProjectIds.length,
      message: 'Projects deleted successfully'
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/projects/DELETE');
  }
} 