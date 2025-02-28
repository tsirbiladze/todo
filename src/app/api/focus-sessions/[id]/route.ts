import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { focusSessionSchema, validateData } from '@/lib/server/validation';
import { 
  errorResponse, 
  getAuthenticatedUserId, 
  notFoundResponse, 
  successResponse, 
  unauthorizedResponse, 
  verifyResourceOwnership,
  handleCommonErrors,
  HttpStatus,
  forbiddenResponse,
  noContentResponse
} from '@/lib/server/api-helpers';
import { logger } from '@/lib/logger';

type RouteParams = {
  params: {
    id: string;
  };
};

// GET /api/focus-sessions/[id] - Get a single focus session by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const sessionId = params.id;
    
    // Verify the focus session exists and belongs to the user
    const isOwner = await verifyResourceOwnership('focusSession', sessionId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Focus session', sessionId);
    }
    
    const focusSession = await prisma.focusSession.findUnique({
      where: { id: sessionId },
      include: {
        task: true
      }
    });
    
    return successResponse({ focusSession });
  } catch (error) {
    return handleCommonErrors(error, 'api/focus-sessions/[id]/GET');
  }
}

// PUT /api/focus-sessions/[id] - Update a focus session
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const sessionId = params.id;
    
    // Verify the focus session exists and belongs to the user
    const isOwner = await verifyResourceOwnership('focusSession', sessionId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Focus session', sessionId);
    }
    
    const data = await req.json();
    
    // Validate the data
    const { success, data: validatedData, error } = await validateData(
      focusSessionSchema, 
      data
    );
    
    if (!success || !validatedData) {
      return errorResponse(error || 'Invalid data format', HttpStatus.BAD_REQUEST);
    }
    
    // Update the focus session
    const updatedSession = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        taskId: validatedData.taskId,
        startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
        duration: validatedData.duration,
        notes: validatedData.notes,
      },
      include: {
        task: true
      }
    });
    
    logger.info(`Focus session updated: ${sessionId}`, {
      data: { sessionId, userId }
    });
    
    return successResponse({ focusSession: updatedSession });
  } catch (error) {
    return handleCommonErrors(error, 'api/focus-sessions/[id]/PUT');
  }
}

// PATCH /api/focus-sessions/[id] - Partially update a focus session
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const sessionId = params.id;
    
    // Verify the focus session exists and belongs to the user
    const isOwner = await verifyResourceOwnership('focusSession', sessionId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Focus session', sessionId);
    }
    
    const patchData = await req.json();
    
    // Only update fields that are provided
    const updateData: Record<string, any> = {};
    
    if (patchData.taskId !== undefined) updateData.taskId = patchData.taskId;
    if (patchData.startTime !== undefined) updateData.startTime = new Date(patchData.startTime);
    if (patchData.endTime !== undefined) updateData.endTime = patchData.endTime ? new Date(patchData.endTime) : null;
    if (patchData.duration !== undefined) updateData.duration = patchData.duration;
    if (patchData.notes !== undefined) updateData.notes = patchData.notes;
    
    // Update metadata if provided
    if (patchData.metadata !== undefined) {
      updateData.metadata = typeof patchData.metadata === 'string' 
        ? patchData.metadata 
        : JSON.stringify(patchData.metadata);
    }
    
    // Update the focus session
    const updatedSession = await prisma.focusSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        task: true
      }
    });
    
    logger.info(`Focus session patched: ${sessionId}`, {
      data: { sessionId, userId }
    });
    
    return successResponse({ focusSession: updatedSession });
  } catch (error) {
    return handleCommonErrors(error, 'api/focus-sessions/[id]/PATCH');
  }
}

// DELETE /api/focus-sessions/[id] - Delete a focus session
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }
    
    const sessionId = params.id;
    
    // Verify the focus session exists and belongs to the user
    const isOwner = await verifyResourceOwnership('focusSession', sessionId, userId);
    
    if (!isOwner) {
      return notFoundResponse('Focus session', sessionId);
    }
    
    // Delete the focus session
    await prisma.focusSession.delete({
      where: { id: sessionId }
    });
    
    logger.info(`Focus session deleted: ${sessionId}`, {
      data: { sessionId, userId }
    });
    
    return noContentResponse();
  } catch (error) {
    return handleCommonErrors(error, 'api/focus-sessions/[id]/DELETE');
  }
} 