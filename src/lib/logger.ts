/**
 * Centralized logger utility for consistent logging across the application.
 * Provides standardized methods for different log levels.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogOptions {
  component?: string;
  data?: any;
  requestId?: string;
}

/**
 * Check if we're in a development environment
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Format a log message with additional context
 */
function formatLogMessage(message: string, options?: LogOptions): string {
  const parts = [];
  
  if (options?.component) {
    parts.push(`[${options.component}]`);
  }
  
  if (options?.requestId) {
    parts.push(`(${options.requestId})`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
}

/**
 * Log an error message
 */
export function logError(message: string | Error, options?: LogOptions): void {
  const errorMessage = message instanceof Error ? message.message : message;
  const stack = message instanceof Error ? message.stack : undefined;
  
  console.error(formatLogMessage(errorMessage, options));
  
  if (stack && isDev) {
    console.error(stack);
  }
  
  if (options?.data) {
    console.error('Additional data:', options.data);
  }
}

/**
 * Log a warning message
 */
export function logWarn(message: string, options?: LogOptions): void {
  console.warn(formatLogMessage(message, options));
  
  if (options?.data && isDev) {
    console.warn('Additional data:', options.data);
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, options?: LogOptions): void {
  if (isDev) {
    console.info(formatLogMessage(message, options));
    
    if (options?.data) {
      console.info('Additional data:', options.data);
    }
  }
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(message: string, options?: LogOptions): void {
  if (isDev) {
    console.debug(formatLogMessage(message, options));
    
    if (options?.data) {
      console.debug('Additional data:', options.data);
    }
  }
}

/**
 * Main logger object to export
 */
export const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
}; 