import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecurrenceFrequency } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

interface RecurringTaskInput {
  templateId: string;
  nextDueDate: string | Date;
  frequency: RecurrenceFrequency;
  interval: number;
  daysOfWeek?: string; // JSON string like "[1,3,5]"
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  count?: number;
}

// Helper function to calculate next occurrence based on recurrence pattern
function calculateNextOccurrence(
  currentDate: Date,
  frequency: RecurrenceFrequency,
  interval: number,
  daysOfWeek?: string,
  dayOfMonth?: number,
  monthOfYear?: number
): Date {
  let nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'DAILY':
      nextDate = addDays(currentDate, interval);
      break;
    case 'WEEKLY':
      nextDate = addWeeks(currentDate, interval);
      
      // If specific days of week are specified
      if (daysOfWeek) {
        const days = JSON.parse(daysOfWeek) as number[];
        // TODO: Implement more complex weekly recurrence logic
        // This would find the next occurrence on one of the specified days
      }
      break;
    case 'MONTHLY':
      nextDate = addMonths(currentDate, interval);
      
      // If a specific day of month is specified
      if (dayOfMonth) {
        nextDate.setDate(dayOfMonth);
        // Handle case where day doesn't exist in month
        if (nextDate.getDate() !== dayOfMonth) {
          // Set to last day of previous month
          nextDate.setDate(0);
        }
      }
      break;
    case 'YEARLY':
      nextDate = addYears(currentDate, interval);
      
      // If specific month is specified
      if (monthOfYear) {
        nextDate.setMonth(monthOfYear - 1); // Month is 0-indexed in JS
        
        // If day of month is also specified
        if (dayOfMonth) {
          nextDate.setDate(dayOfMonth);
          // Handle case where day doesn't exist in month
          if (nextDate.getDate() !== dayOfMonth) {
            // Set to last day of the month
            nextDate.setDate(0);
          }
        }
      }
      break;
    case 'CUSTOM':
      // For custom recurrence, we'd implement more complex logic
      // This is a placeholder for now
      nextDate = addDays(currentDate, interval);
      break;
  }
  
  return nextDate;
}

// Helper to generate a task from a template and recurring task
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json() as RecurringTaskInput;
    const { 
      templateId, 
      nextDueDate, 
      frequency = 'DAILY', 
      interval = 1,
      daysOfWeek,
      dayOfMonth,
      monthOfYear,
      startDate,
      endDate,
      count 
    } = data;

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

    // Create or update recurring task schedule
    const recurringTask = await prisma.recurringTask.upsert({
      where: {
        templateId_userId: {
          templateId,
          userId: user.id,
        },
      },
      update: {
        nextDueDate: new Date(nextDueDate),
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        count,
      },
      create: {
        templateId,
        userId: user.id,
        nextDueDate: new Date(nextDueDate),
        frequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        count,
      },
    });

    return NextResponse.json({ recurringTask });
  } catch (error) {
    console.error('Error managing recurring task:', error);
    return NextResponse.json(
      { error: 'Failed to manage recurring task' },
      { status: 500 }
    );
  }
}

// Generate tasks for recurring tasks that are due
export async function GET(req: NextRequest) {
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

    // Get all recurring tasks for the user that are due
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        userId: user.id,
        nextDueDate: {
          lte: new Date(),
        },
      },
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
        : 'No tasks due for generation'
    });
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring tasks' },
      { status: 500 }
    );
  }
}

// Create a new endpoint to get all recurring tasks for the user
export async function PUT(req: NextRequest) {
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

    // Get all recurring tasks with their templates
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        userId: user.id,
      },
      include: {
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5, // Include only the 5 most recent generated tasks
        },
      },
    });

    // Get the templates for all recurring tasks
    const templateIds = recurringTasks.map(rt => rt.templateId);
    const templates = await prisma.taskTemplate.findMany({
      where: {
        id: { in: templateIds },
      },
    });

    // Combine recurring tasks with their templates
    const recurringTasksWithTemplates = recurringTasks.map(rt => {
      const template = templates.find(t => t.id === rt.templateId);
      return {
        ...rt,
        template,
      };
    });

    return NextResponse.json({ recurringTasks: recurringTasksWithTemplates });
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring tasks' },
      { status: 500 }
    );
  }
} 