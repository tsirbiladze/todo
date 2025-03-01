import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Debug endpoint to see all tasks directly from the database
export async function GET() {
  try {
    // Get all tasks with more detailed relations
    const tasks = await prisma.task.findMany({
      include: {
        categories: true,
        subTasks: {
          include: {
            categories: true
          }
        },
        parent: true
      },
    });
    
    // Add more comprehensive info to help with debugging
    return NextResponse.json({
      tasks,
      count: tasks.length,
      data: {
        tasksById: Object.fromEntries(tasks.map(task => [task.id, task])),
        tasksByStatus: {
          completed: tasks.filter(t => t.completedAt).length,
          active: tasks.filter(t => !t.completedAt).length
        }
      },
      message: 'Debug tasks endpoint'
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 