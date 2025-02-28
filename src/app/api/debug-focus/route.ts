import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Prisma model metadata for FocusSession
    const modelName = 'FocusSession';
    
    // Create a dummy FocusSession to test if the schema is updated
    const dummySession = await prisma.focusSession.create({
      data: {
        userId: session.user.id,
        startTime: new Date(),
        endTime: new Date(),
        duration: 5,
        type: 'debug',
      },
      include: {
        task: true,
      },
    });
    
    // Delete the dummy session right away
    await prisma.focusSession.delete({
      where: {
        id: dummySession.id,
      },
    });

    return NextResponse.json({
      message: 'Debug successful',
      focusSessionSchema: {
        hasTaskRelation: true,
      },
      testSession: dummySession,
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 