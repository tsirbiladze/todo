import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

// Standardized HTTP status codes with descriptions
export const HttpStatus = {
  OK: 200, // The request succeeded
  CREATED: 201, // The request succeeded and a new resource was created
  NO_CONTENT: 204, // The request succeeded but there is no content to send
  BAD_REQUEST: 400, // The server cannot process the request due to client error
  UNAUTHORIZED: 401, // Authentication is required and has failed or not been provided
  FORBIDDEN: 403, // The server understood the request but refuses to authorize it
  NOT_FOUND: 404, // The requested resource could not be found
  CONFLICT: 409, // The request conflicts with the current state of the server
  UNPROCESSABLE_ENTITY: 422, // The request was well-formed but semantically invalid
  INTERNAL_SERVER_ERROR: 500, // The server encountered an unexpected condition
};

// Prisma error codes to meaningful error messages
export const PrismaErrorMessages = {
  P2000: 'The provided value is too long for this field',
  P2001: 'The record does not exist',
  P2002: 'A unique constraint would be violated',
  P2003: 'Foreign key constraint failed',
  P2004: 'A constraint failed on the database',
  P2005: 'The value is invalid for this field type',
  P2006: 'The provided value is not valid',
  P2007: 'Data validation error',
  P2008: 'Failed to parse the query',
  P2009: 'Failed to validate the query',
  P2010: 'Raw query failed',
  P2011: 'Null constraint violation',
  P2012: 'Missing required field',
  P2013: 'Missing required argument',
  P2014: 'Relation violation',
  P2015: 'Related record not found',
  P2016: 'Query interpretation error',
  P2017: 'Record not connected',
  P2018: 'Required connected record not found',
  P2019: 'Input error',
  P2020: 'Value out of range for the type',
  P2021: 'Table not found',
  P2022: 'Column not found',
  P2023: 'Inconsistent column data',
  P2024: 'Connection timed out',
  P2025: 'Record not found',
  P2026: 'The provided value is not valid',
  P2027: 'Multiple errors occurred',
  P2030: 'Full-text search not supported',
};

/**
 * Standard error response builder for API routes
 * 
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param details - Optional additional error details
 * @returns NextResponse with error message and status code
 */
export function errorResponse(message: string, statusCode: number = HttpStatus.BAD_REQUEST, details?: any): NextResponse {
  // Log the error
  logger.error(`API Error (${statusCode}): ${message}`, {
    details
  });
  
  return NextResponse.json(
    { error: message, details },
    { status: statusCode }
  );
}

/**
 * Process and provide appropriate response for common errors
 * 
 * @param error - The caught error
 * @param component - Component name for logging
 * @returns NextResponse with appropriate error details
 */
export function handleCommonErrors(error: any, component: string): NextResponse {
  logger.error(`Error in ${component}:`, { error });

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorCode = error.code;
    const errorMessage = PrismaErrorMessages[errorCode as keyof typeof PrismaErrorMessages] || 'Database error';
    
    // Handle specific error codes with custom status codes
    if (errorCode === 'P2025') { // Record not found
      return errorResponse(`${errorMessage}: ${error.meta?.cause || 'Requested record not found'}`, HttpStatus.NOT_FOUND);
    } else if (errorCode === 'P2002') { // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'unknown field';
      return errorResponse(`${errorMessage} on ${field}`, HttpStatus.CONFLICT);
    } else if (errorCode === 'P2003' || errorCode === 'P2014') { // Foreign key constraint
      return errorResponse(errorMessage, HttpStatus.BAD_REQUEST);
    }
    
    // Default database error handling
    return errorResponse(`${errorMessage}: ${error.message}`, HttpStatus.BAD_REQUEST);
  }
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    
    return errorResponse(
      'Validation error', 
      HttpStatus.UNPROCESSABLE_ENTITY, 
      { validationErrors: formattedErrors }
    );
  }
  
  // Generic error handling
  return errorResponse(
    error.message || 'An unexpected error occurred',
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}

/**
 * Standard success response builder for API routes
 * 
 * @param data - Response data
 * @param statusCode - HTTP status code (defaults to 200)
 * @returns NextResponse with data and status code
 */
export function successResponse(data: any, statusCode: number = HttpStatus.OK): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}

/**
 * Creates a response for resource not found errors
 * 
 * @param resourceType - Type of resource (e.g., 'Task', 'Category')
 * @param resourceId - ID of the resource that was not found
 * @returns NextResponse with 404 status code
 */
export function notFoundResponse(resourceType: string, resourceId?: string): NextResponse {
  const message = resourceId 
    ? `${resourceType} with ID ${resourceId} not found` 
    : `${resourceType} not found`;
  
  return errorResponse(message, HttpStatus.NOT_FOUND);
}

/**
 * Creates a response for unauthorized access
 * 
 * @param details - Optional details about the unauthorized access
 * @returns NextResponse with 401 status code
 */
export function unauthorizedResponse(details?: string): NextResponse {
  return errorResponse(details || 'Unauthorized', HttpStatus.UNAUTHORIZED);
}

/**
 * Creates a response for forbidden access (authenticated but not authorized)
 * 
 * @param details - Optional details about the forbidden access
 * @returns NextResponse with 403 status code
 */
export function forbiddenResponse(details?: string): NextResponse {
  return errorResponse(details || 'Forbidden', HttpStatus.FORBIDDEN);
}

/**
 * Helper to get authenticated user ID with type safety
 * 
 * @returns User ID from session or null if not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch (error) {
    logger.error('Error getting user session:', {
      data: error
    });
    return null;
  }
}

/**
 * Validates that a resource belongs to the authenticated user
 * 
 * @param model - Prisma model name (e.g., 'task', 'category')
 * @param resourceId - ID of the resource to check
 * @param userId - ID of the authenticated user
 * @returns True if the resource belongs to the user, false otherwise
 */
export async function verifyResourceOwnership(
  model: 'task' | 'category' | 'focusSession' | 'recurringTask' | 'template' | 'project' | 'goal',
  resourceId: string, 
  userId: string
): Promise<boolean> {
  try {
    // @ts-ignore - Dynamic model access
    const resource = await prisma[model].findUnique({
      where: { id: resourceId },
      select: { userId: true },
    });
    
    return resource?.userId === userId;
  } catch (error) {
    logger.error(`Error verifying ${model} ownership:`, {
      resourceId,
      userId,
      error
    });
    return false;
  }
}

/**
 * Creates a standard validation result object for consistent validation handling
 * 
 * @param success - Whether validation succeeded
 * @param data - Validated data (if successful)
 * @param error - Error message (if validation failed)
 * @returns A standard validation result object
 */
export type ValidationResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

/**
 * Standard response transformer for 204 No Content responses
 * 
 * @returns NextResponse with 204 status code and no content
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: HttpStatus.NO_CONTENT });
} 