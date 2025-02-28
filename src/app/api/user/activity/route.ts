import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { getUserTaskActivitySummary } from '@/lib/task-history';

// Helper to get authenticated user ID with type safety
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    logger.error('Error getting user session:', {
      component: 'api/user/activity',
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

// GET /api/user/activity - Get user task activity summary
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Get the days parameter from the URL query string (default to 7)
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    if (isNaN(days) || days <= 0 || days > 90) {
      return errorResponse('Invalid days parameter. Must be a number between 1 and 90.', 400);
    }
    
    // Get the user's task activity summary
    const activitySummary = await getUserTaskActivitySummary(userId, days);
    
    // Get some additional user stats
    const taskStats = await prisma.$transaction([
      // Total tasks
      prisma.task.count({
        where: { userId },
      }),
      // Completed tasks
      prisma.task.count({
        where: { 
          userId,
          completedAt: { not: null },
        },
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          userId,
          completedAt: null,
          dueDate: {
            lt: new Date(),
          },
        },
      }),
      // Tasks due today
      prisma.task.count({
        where: {
          userId,
          completedAt: null,
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);
    
    return NextResponse.json({
      activity: activitySummary,
      stats: {
        totalTasks: taskStats[0],
        completedTasks: taskStats[1],
        overdueTasks: taskStats[2],
        tasksDueToday: taskStats[3],
        completionRate: taskStats[0] > 0 ? Math.round((taskStats[1] / taskStats[0]) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error('Error fetching user activity:', {
      component: 'api/user/activity',
      data: error
    });
    return errorResponse('Failed to fetch user activity', 500);
  }
} 