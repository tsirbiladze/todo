import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { taskSchema, validateData } from '@/lib/server/validation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Priority, Emotion } from "@prisma/client";
import { recordTaskChange } from '@/lib/task-history';
import { logger } from '@/lib/logger';

// Helper to get authenticated user ID with type safety
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    logger.error('Error getting user session:', {
      component: 'api/tasks',
      data: error
    });
    return null;
  }
}

// Generic error response builder
function errorResponse(message: string, statusCode: number = 400) {
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  );
}

// GET /api/tasks - Get all tasks for authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Get tasks for the authenticated user only
    const tasks = await prisma.task.findMany({
      where: { userId },
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
    
    return NextResponse.json({ tasks });
  } catch (error) {
    logger.error('Error fetching tasks:', {
      component: 'api/tasks',
      data: error
    });
    return errorResponse('Failed to fetch tasks', 500);
  }
}

// POST /api/tasks - Create a new task with validation
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(taskSchema, body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, 400);
    }
    
    // Extract categoryIds - support both 'categoryIds' and 'categories' fields
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
    
    // Create the task
    const task = await prisma.task.create({
      data: {
        ...taskData,
        userId, // Always set from the authenticated user
        categories: categoryIds && categoryIds.length > 0 ? {
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
    
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    logger.error('Error creating task:', {
      component: 'api/tasks',
      data: error
    });
    return errorResponse('Failed to create task', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, categories, ...taskData } = data;

    // Get the user ID and verify task ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the task belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (existingTask.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to modify this task" },
        { status: 403 }
      );
    }

    // Validate priority if present
    if (
      taskData.priority &&
      !Object.values(Priority).includes(taskData.priority)
    ) {
      return NextResponse.json(
        { error: "Invalid priority value" },
        { status: 400 }
      );
    }

    // Validate emotion if present
    if (
      taskData.emotion &&
      !Object.values(Emotion).includes(taskData.emotion)
    ) {
      return NextResponse.json(
        { error: "Invalid emotion value" },
        { status: 400 }
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...taskData,
        categories: categories
          ? {
              set: categories.map((cat: { id: string }) => ({ id: cat.id })),
            }
          : undefined,
      },
      include: {
        categories: true,
        goal: true,
      },
    });

    // Record the update in task history
    await recordTaskChange(
      id,
      user.id,
      'UPDATED',
      taskData,
      { id, ...existingTask }
    );

    return NextResponse.json({ task });
  } catch (error) {
    logger.error("Error updating task:", {
      component: 'api/tasks',
      data: error
    });
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get the user ID and verify task ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the task belongs to the user
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { userId: true, title: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (existingTask.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this task" },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    // Record the deletion in task history
    await recordTaskChange(
      id,
      user.id,
      'DELETED',
      {
        deletedAt: new Date().toISOString(),
      },
      {
        title: existingTask.title,
        taskId: id
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting task:", {
      component: 'api/tasks',
      data: error
    });
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
