import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { duration, type, taskId, ambientSound, brainwaveType, notes } = data;

    // Base data object for focus session creation
    const focusSessionData = {
      userId: session.user.id,
      startTime: new Date(Date.now() - duration * 60 * 1000), // Convert minutes to milliseconds
      endTime: new Date(),
      duration, // In minutes
      type,
      metadata: JSON.stringify({
        ambientSound,
        brainwaveType,
        notes
      })
    };

    // Add taskId if it exists
    if (taskId) {
      Object.assign(focusSessionData, { taskId });
    }

    // Create focus session 
    const focusSession = await prisma.focusSession.create({
      data: focusSessionData,
      // For backward compatibility, don't try to include relations
      // that might not exist in older versions of the schema
    });

    return NextResponse.json(focusSession);
  } catch (error) {
    console.error('Error creating focus session:', error);
    return NextResponse.json(
      { error: 'Failed to create focus session' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const taskId = searchParams.get('taskId');
    const includeTask = searchParams.get('includeTask') === 'true';
    
    // Build the where clause
    const where: any = {
      userId: session.user.id,
    };
    
    // Add date filters
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.startTime = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.startTime = {
        lte: new Date(endDate),
      };
    }
    
    // Add type filter
    if (type) {
      where.type = type;
    }
    
    // Add task filter
    if (taskId) {
      where.taskId = taskId;
    }
    
    // Create query options
    const queryOptions: any = {
      where,
      orderBy: {
        startTime: 'desc',
      },
      take: limit,
      skip: offset,
    };
    
    // Only include relations if specifically requested
    // This avoids errors if the schema is updated but the code hasn't been redeployed
    if (includeTask) {
      try {
        // Only attempt to include task if specifically requested
        const testOptions = { ...queryOptions, include: { task: true } };
        const focusSessions = await prisma.focusSession.findMany(testOptions);
        return buildResponse(focusSessions, where, session.user.id);
      } catch (error) {
        console.warn('Task relation not available in schema, falling back to basic query', error);
        // Fall back to basic query without include
        const focusSessions = await prisma.focusSession.findMany(queryOptions);
        return buildResponse(focusSessions, where, session.user.id);
      }
    } else {
      // Regular query without including task
      const focusSessions = await prisma.focusSession.findMany(queryOptions);
      return buildResponse(focusSessions, where, session.user.id);
    }
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch focus sessions' },
      { status: 500 }
    );
  }
}

// Helper function to build the response
async function buildResponse(focusSessions: any[], where: any, userId: string) {
  // Get total count for pagination
  const total = await prisma.focusSession.count({
    where,
  });
  
  // Calculate stats
  const totalDuration = await prisma.focusSession.aggregate({
    where,
    _sum: {
      duration: true,
    },
  });
  
  // Get stats by day (last 7 days)
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const dailyStats = await prisma.$queryRaw`
    SELECT 
      DATE(startTime) as date,
      SUM(duration) as totalDuration,
      COUNT(*) as sessionCount
    FROM FocusSession
    WHERE userId = ${userId}
      AND startTime >= ${sevenDaysAgo}
    GROUP BY DATE(startTime)
    ORDER BY date DESC
  `;

  return NextResponse.json({
    focusSessions,
    total,
    stats: {
      totalDuration: totalDuration._sum.duration || 0,
      dailyStats,
    }
  });
} 