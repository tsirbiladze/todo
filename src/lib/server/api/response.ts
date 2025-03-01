import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(data: T, status: HttpStatus = HttpStatus.OK): NextResponse {
  return NextResponse.json(
    { data, success: true },
    { status }
  );
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  message: string, 
  status: HttpStatus = HttpStatus.BAD_REQUEST,
  errors?: Record<string, string[]>
): NextResponse {
  // Log error for server-side issues
  if (status >= 500) {
    logger.error(`API Error: ${message}`, { status, errors });
  }
  
  return NextResponse.json(
    { 
      error: message, 
      success: false,
      ...(errors && { errors })
    },
    { status }
  );
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(): NextResponse {
  return errorResponse('Forbidden', HttpStatus.FORBIDDEN);
}

/**
 * Standard not found response
 */
export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return errorResponse(`${resource} not found`, HttpStatus.NOT_FOUND);
}

/**
 * Handle common database and server errors
 */
export function handleCommonErrors(error: unknown, source: string): NextResponse {
  logger.error(`Error in ${source}:`, error);
  
  // Handle Prisma errors
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    
    // Prisma not found error
    if (err.code === 'P2025') {
      return notFoundResponse();
    }
    
    // Prisma unique constraint error
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      return errorResponse(`A record with this ${field} already exists`, HttpStatus.CONFLICT);
    }
  }
  
  // Default to internal server error
  return errorResponse(
    'An unexpected error occurred', 
    HttpStatus.INTERNAL_SERVER_ERROR
  );
} 