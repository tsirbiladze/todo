import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecurrenceFrequency } from '@prisma/client';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { calculateNextOccurrence, generateOccurrences } from './utils';

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

// Helper to generate a task from a template
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

// Create a new recurring task
export async function POST(request: Request) {
  try {
    console.log("Received POST request to create recurring task");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("Error: Unauthorized - no user session");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json() as RecurringTaskInput;
    console.log("Request data received:", JSON.stringify(data, null, 2));
    
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

    // Validate required fields
    if (!templateId) {
      console.log("Error: Missing required field - templateId");
      return NextResponse.json(
        { error: 'Missing required field: templateId' },
        { status: 400 }
      );
    }

    if (!nextDueDate) {
      console.log("Error: Missing required field - nextDueDate");
      return NextResponse.json(
        { error: 'Missing required field: nextDueDate' },
        { status: 400 }
      );
    }

    // Get the user ID based on the email from the session
    console.log("Finding user with email:", session.user.email);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      console.log("Error: User not found with email:", session.user.email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log("Found user with ID:", user.id);

    // Verify template exists
    console.log("Checking if template exists with ID:", templateId);
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      console.log("Error: Template not found with ID:", templateId);
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    console.log("Found template:", template.name);

    // Create or update recurring task schedule
    console.log("Creating recurring task with data:", {
      templateId,
      userId: user.id,
      nextDueDate,
      frequency,
      interval
    });
    
    const recurringTask = await prisma.recurringTask.create({
      data: {
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

    console.log("Successfully created recurring task:", recurringTask.id);
    
    return NextResponse.json({ recurringTask });
  } catch (error) {
    console.error('Error creating recurring task:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create recurring task' },
      { status: 500 }
    );
  }
}

// Fetch all recurring tasks for the current user
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

    // Get preview parameter
    const preview = req.nextUrl.searchParams.get('preview') === 'true';
    
    // Get all recurring tasks for the user
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        userId: user.id,
      },
      include: {
        // The template relation doesn't exist in the Prisma schema
        // Remove the template include
      },
      orderBy: {
        nextDueDate: 'asc',
      },
    });

    // Get template information separately since there's no direct relation
    const templateIds = [...new Set(recurringTasks.map(task => task.templateId))];
    const templates = await prisma.taskTemplate.findMany({
      where: {
        id: {
          in: templateIds
        }
      },
      include: {
        categories: true
      }
    });

    // Create a lookup for templates
    const templateMap = templates.reduce((map, template) => {
      map[template.id] = template;
      return map;
    }, {} as Record<string, any>);

    // If preview requested, add upcoming occurrences
    let recurringTasksWithPreviews = recurringTasks.map(task => {
      // Add template information
      const template = templateMap[task.templateId] || null;
      
      if (preview) {
        const previewOccurrences = generateOccurrences(
          new Date(task.nextDueDate),
          {
            frequency: task.frequency,
            interval: task.interval,
            daysOfWeek: task.daysOfWeek,
            dayOfMonth: task.dayOfMonth,
            monthOfYear: task.monthOfYear
          },
          5,
          task.endDate ? new Date(task.endDate) : undefined
        );
        
        return {
          ...task,
          template,
          previewOccurrences
        };
      }
      
      return {
        ...task,
        template
      };
    });

    return NextResponse.json({ recurringTasks: recurringTasksWithPreviews });
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring tasks' },
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