import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

type RouteParams = {
  params: {
    categoryId: string;
  };
};

// Helper to get authenticated user ID with type safety
async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    logger.error('Error getting user session:', {
      component: 'api/categories/[categoryId]',
      data: error
    });
    return null;
  }
}

// Generic error response builder
function errorResponse(message: string, statusCode: number = 400): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  );
}

// Check if a category belongs to the authenticated user
async function verifyCategoryOwnership(categoryId: string, userId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { userId: true },
  });
  
  return category?.userId === userId;
}

// GET /api/categories/[categoryId] - Get a single category by ID
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const categoryId = params.categoryId;
    
    // Verify the category exists and belongs to the user
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (category.userId !== userId) {
      return errorResponse('Unauthorized', 401);
    }

    return NextResponse.json(category);
  } catch (error) {
    logger.error('Error fetching category:', {
      component: 'api/categories/[categoryId]',
      data: error
    });
    return errorResponse('Failed to fetch category', 500);
  }
}

// PUT /api/categories/[categoryId] - Update a category
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const categoryId = params.categoryId;
    
    // Check if the category exists and belongs to the user
    const categoryExists = await verifyCategoryOwnership(categoryId, userId);
    
    if (!categoryExists) {
      return errorResponse('Category not found or unauthorized', 404);
    }

    const data = await request.json();
    
    // Validate fields
    if (data.name && data.name.length > 30) {
      return errorResponse('Category name must be 30 characters or less', 400);
    }

    // Check if updated name conflicts with existing category
    if (data.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId,
          name: {
            equals: data.name,
            mode: 'insensitive', // Case insensitive comparison
          },
          id: {
            not: categoryId, // Exclude current category
          },
        },
      });

      if (existingCategory) {
        return errorResponse('A category with this name already exists', 400);
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        color: data.color !== undefined ? data.color : undefined,
      },
    });

    return NextResponse.json({ category: updatedCategory });
  } catch (error) {
    logger.error('Error updating category:', {
      component: 'api/categories/[categoryId]',
      data: error
    });
    return errorResponse('Failed to update category', 500);
  }
}

// DELETE /api/categories/[categoryId] - Delete a category
export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return errorResponse('Unauthorized', 401);
    }

    const categoryId = params.categoryId;
    
    // Check if the category exists and belongs to the user
    const categoryExists = await verifyCategoryOwnership(categoryId, userId);
    
    if (!categoryExists) {
      return errorResponse('Category not found or unauthorized', 404);
    }

    // Option 1: Hard delete the category (deletes the record completely)
    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Optional: Remove this category from all tasks
    await prisma.task.update({
      where: {
        categories: {
          some: {
            id: categoryId
          }
        }
      },
      data: {
        categories: {
          disconnect: {
            id: categoryId
          }
        }
      }
    });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    logger.error('Error deleting category:', {
      component: 'api/categories/[categoryId]',
      data: error
    });
    return errorResponse('Failed to delete category', 500);
  }
} 