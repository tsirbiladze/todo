import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categorySchema, validateData } from '@/lib/server/validation';
import { logger } from '@/lib/logger';
import {
  getAuthenticatedUserId,
  verifyResourceOwnership,
  errorResponse,
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  handleCommonErrors,
  HttpStatus
} from '@/lib/server/api';

type RouteParams = {
  params: {
    categoryId: string;
  };
};

// GET /api/categories/[categoryId] - Get a single category by ID
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }

    const { categoryId } = params;
    
    // Get the category with tasks count
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    if (!category) {
      return notFoundResponse('Category');
    }

    if (category.userId !== userId) {
      return errorResponse('You do not have permission to access this category', HttpStatus.FORBIDDEN);
    }

    return successResponse({ 
      category: {
        ...category,
        taskCount: category._count.tasks
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/categories/[categoryId]/GET');
  }
}

// PUT /api/categories/[categoryId] - Update a category
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }

    const { categoryId } = params;
    
    // Check if the category exists and belongs to the user
    const isOwner = await verifyResourceOwnership(
      categoryId,
      userId,
      prisma.category
    );
    
    if (!isOwner) {
      return notFoundResponse('Category');
    }

    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(categorySchema.partial(), body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }

    // Check if updated name conflicts with existing category
    if (validation.data.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: {
            equals: validation.data.name,
            mode: 'insensitive', // Case insensitive comparison
          },
          id: {
            not: categoryId, // Exclude current category
          },
        },
      });

      if (existingCategory) {
        return errorResponse(
          'A category with this name already exists', 
          HttpStatus.CONFLICT
        );
      }
    }

    // Update the category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: validation.data,
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    return successResponse({ 
      category: {
        ...category,
        taskCount: category._count.tasks
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/categories/[categoryId]/PUT');
  }
}

// PATCH /api/categories/[categoryId] - Partially update a category
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }

    const { categoryId } = params;
    
    // Check if the category exists and belongs to the user
    const isOwner = await verifyResourceOwnership(
      categoryId,
      userId,
      prisma.category
    );
    
    if (!isOwner) {
      return notFoundResponse('Category');
    }

    const body = await req.json();
    
    // Validate the request body
    const validation = await validateData(categorySchema.partial(), body);
    
    if (!validation.success) {
      return errorResponse(`Validation error: ${validation.error}`, HttpStatus.BAD_REQUEST);
    }

    // Check if updated name conflicts with existing category
    if (validation.data.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: {
            equals: validation.data.name,
            mode: 'insensitive', // Case insensitive comparison
          },
          id: {
            not: categoryId, // Exclude current category
          },
        },
      });

      if (existingCategory) {
        return errorResponse(
          'A category with this name already exists', 
          HttpStatus.CONFLICT
        );
      }
    }

    // Update the category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: validation.data,
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    return successResponse({ 
      category: {
        ...category,
        taskCount: category._count.tasks
      }
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/categories/[categoryId]/PATCH');
  }
}

// DELETE /api/categories/[categoryId] - Delete a category
export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return unauthorizedResponse();
    }

    const { categoryId } = params;
    
    // Check if the category exists and belongs to the user
    const isOwner = await verifyResourceOwnership(
      categoryId,
      userId,
      prisma.category
    );
    
    if (!isOwner) {
      return notFoundResponse('Category');
    }

    // Delete the category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return successResponse({ 
      message: 'Category deleted successfully'
    });
  } catch (error) {
    return handleCommonErrors(error, 'api/categories/[categoryId]/DELETE');
  }
} 