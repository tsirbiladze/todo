import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUserId } from '@/lib/auth-utils';

// Simple debug endpoint to get tasks in a basic format
export async function GET() {
  try {
    // Get the authenticated user ID
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return NextResponse.json({
        error: 'Unauthorized',
        authenticated: false
      }, { status: 401 });
    }
    
    // Get all tasks without complex relations
    const tasks = await prisma.task.findMany({
      where: {
        userId: userId
      },
      // Just include basic category info
      include: {
        categories: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Return a simplified response
    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks,
        count: tasks.length,
        firstTask: tasks.length > 0 ? tasks[0] : null
      }
    });
  } catch (error) {
    console.error('Error in debug/tasks endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 