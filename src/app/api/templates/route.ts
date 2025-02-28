import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Priority, Emotion } from '@prisma/client';

// Schema for template creation and update
const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']),
  estimatedDuration: z.number().optional(),
  emotion: z.enum(['NEUTRAL', 'HAPPY', 'EXCITED', 'ANXIOUS', 'DREADING']).optional(),
  categoryIds: z.array(z.string()).optional(),
  isRecurring: z.boolean().optional(),
  recurrence: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
  }).optional(),
});

// Default templates to create for new users
const DEFAULT_TEMPLATES = [
  {
    name: 'Quick Task',
    description: 'A simple task that can be completed quickly',
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 15,
    emotion: 'NEUTRAL' as Emotion,
    categoryIds: [],
    isRecurring: false
  },
  {
    name: 'Work Meeting',
    description: 'Prepare agenda and notes for team meeting',
    priority: 'HIGH' as Priority,
    estimatedDuration: 60,
    emotion: 'NEUTRAL' as Emotion,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [1] // Monday
    }
  },
  {
    name: 'Workout Session',
    description: 'Regular exercise routine for fitness goals',
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 45,
    emotion: 'EXCITED' as Emotion,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'daily',
      interval: 1
    }
  },
  {
    name: 'Study Session',
    description: 'Focused learning time for professional development',
    priority: 'HIGH' as Priority,
    estimatedDuration: 90,
    emotion: 'NEUTRAL' as Emotion,
    categoryIds: [],
    isRecurring: false
  },
  {
    name: 'Weekly Review',
    description: 'Review progress, update goals, and plan for next week',
    priority: 'HIGH' as Priority,
    estimatedDuration: 30,
    emotion: 'NEUTRAL' as Emotion,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [5] // Friday
    }
  },
  {
    name: 'Pay Bills',
    description: 'Monthly payment of recurring bills and financial review',
    priority: 'HIGH' as Priority,
    estimatedDuration: 30,
    emotion: 'ANXIOUS' as Emotion,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 1
    }
  },
  {
    name: 'Project Deadline',
    description: 'Final review and submission of project deliverables',
    priority: 'HIGH' as Priority,
    estimatedDuration: 120,
    emotion: 'ANXIOUS' as Emotion,
    categoryIds: [],
    isRecurring: false
  },
  {
    name: 'Family Call',
    description: 'Regular catch-up with family members',
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 45,
    emotion: 'HAPPY' as Emotion,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [6] // Saturday
    }
  }
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all templates for the current user
    let templates = await prisma.taskTemplate.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        categories: true,
      },
    });

    // If user has no templates, create default ones
    if (templates.length === 0) {
      console.log('Creating default templates for user:', session.user.id);
      
      // Create default templates for the user
      const createdTemplates = await Promise.all(
        DEFAULT_TEMPLATES.map(template => 
          prisma.taskTemplate.create({
            data: {
              name: template.name,
              description: template.description,
              priority: template.priority,
              estimatedDuration: template.estimatedDuration,
              emotion: template.emotion,
              isRecurring: template.isRecurring,
              recurrence: template.recurrence,
              userId: session.user.id,
              // We'll need to handle categories separately if needed
            },
            include: {
              categories: true,
            },
          })
        )
      );
      
      templates = createdTemplates;
    }

    // Transform the data to match the expected format
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description || '',
      priority: template.priority,
      estimatedDuration: template.estimatedDuration || 0,
      emotion: template.emotion,
      categoryIds: template.categories.map(cat => cat.id),
      isRecurring: template.isRecurring,
      recurrence: template.recurrence ? JSON.parse(JSON.stringify(template.recurrence)) : undefined,
    }));

    return NextResponse.json(formattedTemplates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Validate the request body
    const validatedData = templateSchema.parse(body);
    
    // Create the template
    const template = await prisma.taskTemplate.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        priority: validatedData.priority,
        estimatedDuration: validatedData.estimatedDuration,
        emotion: validatedData.emotion,
        isRecurring: validatedData.isRecurring || false,
        recurrence: validatedData.recurrence,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        categories: validatedData.categoryIds?.length
          ? {
              connect: validatedData.categoryIds.map(id => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: true,
      },
    });

    // Format the response
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      description: template.description || '',
      priority: template.priority,
      estimatedDuration: template.estimatedDuration || 0,
      emotion: template.emotion,
      categoryIds: template.categories.map(cat => cat.id),
      isRecurring: template.isRecurring,
      recurrence: template.recurrence ? JSON.parse(JSON.stringify(template.recurrence)) : undefined,
    };

    return NextResponse.json(formattedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    // Validate the request body
    const validatedData = templateSchema.parse(data);
    
    // Check if the template belongs to the user
    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    // Update the template
    const template = await prisma.taskTemplate.update({
      where: {
        id,
      },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        priority: validatedData.priority,
        estimatedDuration: validatedData.estimatedDuration,
        emotion: validatedData.emotion,
        isRecurring: validatedData.isRecurring || false,
        recurrence: validatedData.recurrence,
        categories: {
          set: [],
          connect: validatedData.categoryIds?.map(id => ({ id })) || [],
        },
      },
      include: {
        categories: true,
      },
    });

    // Format the response
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      description: template.description || '',
      priority: template.priority,
      estimatedDuration: template.estimatedDuration || 0,
      emotion: template.emotion,
      categoryIds: template.categories.map(cat => cat.id),
      isRecurring: template.isRecurring,
      recurrence: template.recurrence ? JSON.parse(JSON.stringify(template.recurrence)) : undefined,
    };

    return NextResponse.json(formattedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }
    
    // Check if the template belongs to the user
    const existingTemplate = await prisma.taskTemplate.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });
    
    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    // Delete the template
    await prisma.taskTemplate.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
} 