import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecurrenceFrequency } from '@prisma/client';

// Import helper functions from the main recurring-tasks file
import { generateOccurrences } from '../../recurring-tasks/helpers';

// Generate a preview of upcoming occurrences
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { 
      startDate, 
      frequency = 'DAILY', 
      interval = 1,
      daysOfWeek,
      dayOfMonth,
      monthOfYear,
      endDate,
      count = 5
    } = data;

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      );
    }

    // Generate preview occurrences
    const occurrences = generateOccurrences(
      new Date(startDate),
      {
        frequency: frequency as RecurrenceFrequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear
      },
      count,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({ occurrences });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
} 