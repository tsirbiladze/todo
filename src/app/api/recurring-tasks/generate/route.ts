import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculateNextOccurrence } from '../utils';

// Generate a task from a template
async function generateTaskFromTemplate(
  userId: string,
  templateId: string,
  recurringTaskId: string,
  dueDate: Date
) {
  try {
    // Fetch the template
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      include: { categories: true },
    });
    
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }
    
    // Create a new task based on the template
    const task = await prisma.task.create({
      data: {
        title: template.name,
        description: template.description,
        priority: template.priority,
        emotion: template.emotion,
        estimatedDuration: template.estimatedDuration,
        dueDate,
        userId,
        recurringTaskId,
        categories: {
          connect: template.categories.map(cat => ({ id: cat.id })),
        },
      },
      include: {
        categories: true,
      },
    });
    
    // Create a history entry for the task creation
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        userId,
        changeType: 'CREATED',
        changeData: JSON.stringify({
          source: 'recurring',
          recurringTaskId,
          templateId,
        }),
      },
    });
    
    return task;
  } catch (error) {
    console.error('Error generating task from template:', error);
    throw error;
  }
}

// Generate tasks for recurring tasks that are due
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user ID based on the email from the session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Parse the request body to see if specific task IDs were provided
    const body = await req.json();
    const { taskIds } = body || {};
    
    // Build the where clause for the query
    const whereClause: any = {
      userId: user.id
    };
    
    // If specific task IDs were provided, filter by them
    if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
      whereClause.id = { in: taskIds };
    } else {
      // Otherwise, get all recurring tasks that are due
      whereClause.nextDueDate = { lte: new Date() };
    }

    // Get all recurring tasks for the user that are due
    const recurringTasks = await prisma.recurringTask.findMany({
      where: whereClause,
    });

    const generatedTasks = [];

    // Generate tasks for each due recurring task
    for (const recurringTask of recurringTasks) {
      try {
        // Generate task
        const task = await generateTaskFromTemplate(
          user.id,
          recurringTask.templateId,
          recurringTask.id,
          recurringTask.nextDueDate
        );
        
        generatedTasks.push(task);
        
        // Calculate next occurrence
        const nextDueDate = calculateNextOccurrence(
          recurringTask.nextDueDate,
          recurringTask.frequency,
          recurringTask.interval,
          recurringTask.daysOfWeek || undefined,
          recurringTask.dayOfMonth || undefined,
          recurringTask.monthOfYear || undefined
        );
        
        // Update recurring task with new next due date
        await prisma.recurringTask.update({
          where: { id: recurringTask.id },
          data: {
            nextDueDate,
            lastGeneratedDate: new Date(),
          },
        });
      } catch (error) {
        console.error(`Error processing recurring task ${recurringTask.id}:`, error);
        // Continue with other recurring tasks even if one fails
      }
    }

    return NextResponse.json({ 
      generatedTasks,
      count: generatedTasks.length,
      message: generatedTasks.length > 0 
        ? `Generated ${generatedTasks.length} tasks`
        : 'No tasks were generated'
    });
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring tasks' },
      { status: 500 }
    );
  }
} 