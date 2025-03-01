import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Validates relation IDs in a request body
 * @param body The request body
 * @param idField The field name containing the IDs
 * @param modelField The model field name
 * @returns Object with success status, validated data, and error message if any
 */
export async function validateRelationIds(
  body: any,
  idField: string,
  modelField: string
): Promise<{
  success: boolean;
  data: string[] | null;
  error: string | null;
}> {
  try {
    // Handle different ways relations might be passed in the request
    let relationIds: string[] = [];
    
    // Check if idField exists (e.g., categoryIds)
    if (body[idField] && Array.isArray(body[idField])) {
      relationIds = body[idField].filter(id => typeof id === 'string');
    } 
    // Check if modelField exists (e.g., categories)
    else if (body[modelField] && Array.isArray(body[modelField])) {
      // Handle array of objects with id property
      if (body[modelField].length > 0 && typeof body[modelField][0] === 'object') {
        relationIds = body[modelField]
          .filter(item => item && typeof item.id === 'string')
          .map(item => item.id);
      } 
      // Handle array of strings (already IDs)
      else if (body[modelField].every(item => typeof item === 'string')) {
        relationIds = body[modelField];
      }
    }
    
    // If no IDs found, return empty array as success
    if (relationIds.length === 0) {
      return { 
        success: true, 
        data: [],
        error: null 
      };
    }

    return {
      success: true,
      data: relationIds,
      error: null
    };
  } catch (error) {
    logger.error(`Error validating ${idField}:`, { error });
    return {
      success: false,
      data: null,
      error: `Failed to validate ${idField}`
    };
  }
}

/**
 * Processes relation data for Prisma operations
 * @param ids Array of relation IDs
 * @returns Prisma-compatible relation object
 */
export function processRelation(ids: string[] | undefined | null) {
  if (!ids || ids.length === 0) {
    return undefined;
  }
  
  return {
    connect: ids.map(id => ({ id }))
  };
} 