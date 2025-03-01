import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth';

/**
 * GET handler for the debug client vs server tasks endpoint
 * This will return a simplified structure for debugging frontend vs backend task state
 */
export async function GET() {
  try {
    // Check if user is authenticated
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get all tasks for this user
    const tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return a simplified response for easier debugging
    return NextResponse.json({
      success: true,
      data: {
        taskCount: tasks.length,
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          created: t.createdAt.toISOString(),
          updated: t.updatedAt.toISOString(),
        })),
      },
      message: 'Debug endpoint for checking client vs server task state',
    });
  } catch (error) {
    console.error('Error in debug/clientside endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 