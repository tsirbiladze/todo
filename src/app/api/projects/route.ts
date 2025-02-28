import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  errorResponse, 
  getAuthenticatedUserId, 
  successResponse, 
  unauthorizedResponse 
} from '@/lib/server/api-helpers';
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
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    // Build where clause based on query parameters
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }
    
    // Get projects for the authenticated user
    const projects = await prisma.project.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return successResponse({ projects });
  } catch (error) {
    logger.error('Error fetching projects:', {
      component: 'api/projects/GET',
      data: error
    });
    
    return errorResponse('Failed to fetch projects', 500);
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const data = await req.json();
    
    // Validate project data
    const { success, data: validatedData, error } = await validateProjectData(data);
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid project data', 400);
    }
    
    // Check if a project with the same name already exists for this user
    const existingProject = await prisma.project.findFirst({
      where: {
        userId,
        name: {
          equals: validatedData.name,
          mode: 'insensitive' // Case insensitive comparison
        }
      }
    });
    
    if (existingProject) {
      return errorResponse('A project with this name already exists', 400);
    }
    
    // Create the project
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color || '#3b82f6', // Default blue color
        status: validatedData.status || 'ACTIVE',
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        userId
      }
    });
    
    return successResponse({ project }, 201);
  } catch (error) {
    logger.error('Error creating project:', {
      component: 'api/projects/POST',
      data: error
    });
    
    return errorResponse('Failed to create project', 500);
  }
} 