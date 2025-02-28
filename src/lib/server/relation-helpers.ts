/**
 * Helper functions for handling relations in API routes
 */
import { ValidationResult } from './api-helpers';

/**
 * Extracts IDs from an array of either strings or objects with 'id' properties
 * This helps handle inconsistent relation input formats from clients
 * 
 * @param value - Array of relation IDs or objects with IDs
 * @returns Array of extracted IDs or undefined if input is invalid
 */
export function extractRelationIds(value: any): string[] | undefined {
  // If value is undefined or null, return undefined
  if (value === undefined || value === null) {
    return undefined;
  }

  // If value is already an array of strings, return it
  if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'string')) {
    return value;
  }

  // If value is an array of objects with an id property, extract just the IDs
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0]?.id) {
    return value.map((item: any) => item.id);
  }

  // If we have an empty array, return it
  if (Array.isArray(value) && value.length === 0) {
    return [];
  }

  // Invalid format
  return undefined;
}

/**
 * Creates a Prisma relation update object for many-to-many relationships
 * 
 * @param relationIds - Array of relation IDs or undefined
 * @param updateType - Type of update (set, connect, disconnect)
 * @returns Prisma relation object or undefined if no IDs provided
 */
export function createRelationObject(
  relationIds: string[] | undefined, 
  updateType: 'set' | 'connect' | 'disconnect' = 'set'
): any {
  if (relationIds === undefined) {
    return undefined;
  }

  // For disconnecting, we use the disconnect action
  if (updateType === 'disconnect') {
    return {
      disconnect: relationIds.map(id => ({ id }))
    };
  }
  
  // For connecting, we use the connect action
  if (updateType === 'connect') {
    return {
      connect: relationIds.map(id => ({ id }))
    };
  }

  // Default is 'set' which replaces the entire relation list
  return {
    set: relationIds.map(id => ({ id }))
  };
}

/**
 * Unified function to extract and process relation IDs from request body
 * 
 * @param body - Request body
 * @param mainField - Primary field name for relation IDs (e.g., 'categoryIds')
 * @param objectField - Secondary field name for relation objects (e.g., 'categories')
 * @param updateType - Type of update operation (set, connect, disconnect)
 * @returns Processed relation object for Prisma or undefined
 */
export function processRelation(
  body: Record<string, any>, 
  mainField: string, 
  objectField: string,
  updateType: 'set' | 'connect' | 'disconnect' = 'set'
): any {
  // First try the main field (e.g., categoryIds)
  let ids = body[mainField];
  
  // If not present, try the object field (e.g., categories)
  if (ids === undefined && body[objectField] !== undefined) {
    ids = extractRelationIds(body[objectField]);
  }
  
  // If ids were extracted, return a properly formatted relation object
  if (ids !== undefined) {
    return createRelationObject(ids, updateType);
  }
  
  return undefined;
}

/**
 * Type-safe function to validate and process relation IDs
 * 
 * @param data - The data object containing relation information
 * @param idField - The field name for IDs array (e.g., 'categoryIds')
 * @param objectField - The field name for objects array (e.g., 'categories')
 * @param required - Whether the relation is required
 * @returns A validation result with extracted IDs or error message
 */
export function validateRelationIds<T extends Record<string, any>>(
  data: T,
  idField: keyof T,
  objectField: keyof T,
  required = false
): ValidationResult<string[]> {
  // First check the ID field
  if (data[idField] !== undefined) {
    const ids = data[idField];
    
    // Validate that it's an array of strings
    if (!Array.isArray(ids)) {
      return {
        success: false,
        data: null,
        error: `${String(idField)} must be an array`
      };
    }
    
    // Validate non-empty if required
    if (required && ids.length === 0) {
      return {
        success: false,
        data: null,
        error: `${String(idField)} cannot be empty`
      };
    }
    
    // Validate all items are strings
    if (ids.length > 0 && ids.some(id => typeof id !== 'string')) {
      return {
        success: false,
        data: null,
        error: `All ${String(idField)} must be strings`
      };
    }
    
    return {
      success: true,
      data: ids,
      error: null
    };
  }
  
  // If ID field is not present, check the object field
  if (data[objectField] !== undefined) {
    const objects = data[objectField];
    
    // Validate that it's an array
    if (!Array.isArray(objects)) {
      return {
        success: false,
        data: null,
        error: `${String(objectField)} must be an array`
      };
    }
    
    // Validate non-empty if required
    if (required && objects.length === 0) {
      return {
        success: false,
        data: null,
        error: `${String(objectField)} cannot be empty`
      };
    }
    
    // Handle empty array case
    if (objects.length === 0) {
      return {
        success: true,
        data: [],
        error: null
      };
    }
    
    // Extract IDs based on the format
    if (typeof objects[0] === 'string') {
      // Array of strings
      return {
        success: true,
        data: objects as unknown as string[],
        error: null
      };
    } else if (typeof objects[0] === 'object' && objects[0]?.id) {
      // Array of objects with ID
      const ids = objects.map((obj: any) => obj.id);
      
      // Validate all IDs are strings
      if (ids.some(id => typeof id !== 'string')) {
        return {
          success: false,
          data: null,
          error: `All ${String(objectField)} must have string IDs`
        };
      }
      
      return {
        success: true,
        data: ids,
        error: null
      };
    }
    
    // Invalid format
    return {
      success: false,
      data: null,
      error: `Invalid format for ${String(objectField)}`
    };
  }
  
  // Neither field is present
  if (required) {
    return {
      success: false,
      data: null,
      error: `${String(idField)} or ${String(objectField)} is required`
    };
  }
  
  // Not required and not present, return empty array
  return {
    success: true,
    data: [],
    error: null
  };
} 