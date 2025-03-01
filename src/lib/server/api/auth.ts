import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Gets the authenticated user ID from the session
 * @returns The user ID if authenticated, null otherwise
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    logger.error('Error getting user session:', {
      component: 'auth-utils',
      data: error
    });
    return null;
  }
}

/**
 * Checks if a resource belongs to the authenticated user
 * @param resourceId The ID of the resource
 * @param userId The ID of the authenticated user
 * @param prismaModel The Prisma model to query
 * @returns True if the resource belongs to the user, false otherwise
 */
export async function verifyResourceOwnership<T extends { userId: string }>(
  resourceId: string,
  userId: string,
  prismaModel: any
): Promise<boolean> {
  try {
    const resource = await prismaModel.findUnique({
      where: { id: resourceId },
      select: { userId: true },
    });
    
    return resource?.userId === userId;
  } catch (error) {
    logger.error('Error verifying resource ownership:', {
      component: 'auth-utils',
      data: { resourceId, userId, error }
    });
    return false;
  }
} 