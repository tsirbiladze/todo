import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecurrenceFrequency } from '@prisma/client';
import { calculateNextOccurrence } from '../utils';

// Update a recurring task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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

    // Get the data from the request body
    const data = await request.json();
    const { 
      templateId, 
      nextDueDate, 
      frequency, 
      interval = 1,
      daysOfWeek,
      dayOfMonth,
      monthOfYear,
      startDate,
      endDate,
      count 
    } = data;

    // Verify the recurring task belongs to the user
    const existingTask = await prisma.recurringTask.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Recurring task not found or access denied' },
        { status: 404 }
      );
    }

    // Update the recurring task
    const recurringTask = await prisma.recurringTask.update({
      where: { id },
      data: {
        templateId,
        nextDueDate: new Date(nextDueDate),
        frequency: frequency as RecurrenceFrequency,
        interval,
        daysOfWeek,
        dayOfMonth,
        monthOfYear,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        count,
      },
    });

    return NextResponse.json({ recurringTask });
  } catch (error) {
    console.error('Error updating recurring task:', error);
    return NextResponse.json(
      { error: 'Failed to update recurring task' },
      { status: 500 }
    );
  }
}

// Delete a recurring task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
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

    // Verify the recurring task belongs to the user
    const existingTask = await prisma.recurringTask.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Recurring task not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the recurring task
    await prisma.recurringTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring task:', error);
    return NextResponse.json(
      { error: 'Failed to delete recurring task' },
      { status: 500 }
    );
  }
} 