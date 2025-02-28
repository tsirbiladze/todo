import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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
      component: 'api/tasks/[taskId]/history',
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

// GET /api/tasks/[taskId]/history - Get history for a task
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
    
    // Verify task exists and belongs to user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { 
        userId: true,
        title: true,
      },
    });
    
    if (!task) {
      return errorResponse('Task not found', 404);
    }
    
    if (task.userId !== userId) {
      return errorResponse('Unauthorized access to this task', 403);
    }
    
    // Get the task history
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse the JSON data in the history records
    const formattedHistory = history.map(entry => ({
      id: entry.id,
      taskId: entry.taskId,
      userId: entry.userId,
      changeType: entry.changeType,
      changeData: JSON.parse(entry.changeData),
      previousData: entry.previousData ? JSON.parse(entry.previousData) : null,
      createdAt: entry.createdAt,
    }));
    
    return NextResponse.json({
      taskTitle: task.title,
      history: formattedHistory,
    });
  } catch (error) {
    logger.error('Error fetching task history:', {
      component: 'api/tasks/[taskId]/history',
      data: { params, error }
    });
    return errorResponse('Failed to fetch task history', 500);
  }
} 