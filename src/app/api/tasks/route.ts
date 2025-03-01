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
  validateRelationIds,
  processRelation
} from '@/lib/server/api';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build the where clause based on filters
    const where: any = { userId };
    
    if (status) {
      if (status === 'completed') {
        where.completedAt = { not: null };
      } else if (status === 'active') {
        where.completedAt = null;
      }
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
    
    // Get total count for pagination
    const total = await prisma.task.count({ where });
    
    // Get tasks for the authenticated user with pagination
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
      skip,
      take: limit,
    });
    
    return successResponse({ 
      tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/GET');
  }
}

// POST /api/tasks - Create a new task with validation
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("POST /api/tasks - Request received");
    
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      console.log("POST /api/tasks - Unauthorized: No user ID found");
      return unauthorizedResponse();
    }
    
    console.log("POST /api/tasks - User authenticated:", userId);
    
    const body = await req.json();
    console.log("POST /api/tasks - Request body:", JSON.stringify(body));
    
    // Validate the request body
    const validation = await validateData(taskSchema, body);
    
    if (!validation.success) {
      console.error("POST /api/tasks - Validation error:", validation.error);
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    console.log("POST /api/tasks - Validation successful");
    
    // Extract and validate category IDs using the helper
    const categoryValidation = await validateRelationIds(
      body,
      'categoryIds',
      'categories'
    );
    
    // If validation failed, return an error
    if (!categoryValidation.success) {
      console.error("POST /api/tasks - Category validation error:", categoryValidation.error);
      return errorResponse(`Category validation error: ${categoryValidation.error}`, HttpStatus.BAD_REQUEST);
    }
    
    console.log("POST /api/tasks - Category validation successful");
    
    // Extract validated data and remove categoryIds and categories from the validation data
    const validatedData = validation.data || {};
    // Using type assertion to ensure TypeScript knows these properties exist
    const { categoryIds: _, categories: __, status: ___, ...taskData } = validatedData as {
      categoryIds?: string[];
      categories?: any[];
      status?: string;
      [key: string]: any;
    };
    
    // Get category IDs from validation result
    const categoryIds = categoryValidation.data || [];
    
    // Process category relations
    const categoryRelations = processRelation(categoryIds);
    
    // Handle completion status if needed
    if (body.status === "COMPLETED") {
      taskData.completedAt = new Date();
    }
    
    console.log("POST /api/tasks - Processed task data:", {
      ...taskData,
      categoryRelations: categoryRelations,
    });
    
    // Create the task
    try {
      // Use type assertion to ensure the data matches what Prisma expects
      const task = await prisma.task.create({
        data: {
          ...(taskData as any), // Type assertion to bypass TypeScript's strict type checking
          userId, // Always set from the authenticated user
          categories: categoryRelations,
        },
        include: {
          categories: true,
        },
      });

      console.log("POST /api/tasks - Task created successfully:", task.id);

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
          categories: task.categories?.map((c: any) => c.id) || [],
        }
      );
      
      console.log("POST /api/tasks - Task history recorded");
      return successResponse({ task }, HttpStatus.CREATED);
    } catch (prismaError) {
      console.error("POST /api/tasks - Database error:", prismaError);
      throw prismaError; // Let the common error handler deal with it
    }
  } catch (error) {
    console.error("POST /api/tasks - Unhandled error:", error);
    return handleCommonErrors(error, 'api/tasks/POST');
  }
}

// DELETE /api/tasks - Delete multiple tasks (bulk delete)
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(req.url);
    const taskIds = searchParams.get("ids")?.split(",");

    if (!taskIds || taskIds.length === 0) {
      return errorResponse("Task IDs are required", HttpStatus.BAD_REQUEST);
    }

    // Ensure all tasks belong to the user
    const tasks = await prisma.task.findMany({
      where: { 
        id: { in: taskIds },
      },
      select: { id: true, userId: true, title: true },
    });

    // Filter out tasks that don't belong to the user
    const authorizedTaskIds = tasks
      .filter(task => task.userId === userId)
      .map(task => task.id);

    if (authorizedTaskIds.length === 0) {
      return errorResponse("No authorized tasks found", HttpStatus.NOT_FOUND);
    }

    // Delete the tasks
    await prisma.task.deleteMany({
      where: { 
        id: { in: authorizedTaskIds },
        userId 
      },
    });

    // Record the deletions in task history
    for (const task of tasks.filter(t => t.userId === userId)) {
      await recordTaskChange(
        task.id,
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
    }

    return successResponse({ 
      deletedCount: authorizedTaskIds.length,
      message: 'Tasks deleted successfully'
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/tasks/DELETE');
  }
}
