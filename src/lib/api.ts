/**
 * Centralized API utility functions for standardized API calls and error handling.
 * This file provides a consistent pattern for all API operations in the app.
 */

import { getSession } from 'next-auth/react';

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

/**
 * Generic function to handle API requests with standardized error handling
 * Automatically passes authentication token and handles CSRF protection
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<ApiResponse<T>> {
  try {
    // Get session for auth token (but make it optional if skipAuth is true)
    const skipAuth = options?.skipAuth || false;
    const session = await getSession();
    
    // Only require authentication if not skipping auth
    if (!session && !skipAuth && process.env.NODE_ENV !== 'development') {
      console.warn('Authentication required for', url);
      return {
        data: null,
        error: 'Authentication required',
        status: 401,
      };
    }
    
    // Clean up options object by removing non-standard properties
    const { skipAuth: _, ...standardOptions } = options || {};
    
    // Create headers with auth token if available
    const headers = {
      'Content-Type': 'application/json',
      // Only add Authorization header if we have a session
      ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}),
      // Include CSRF token if available
      ...(typeof window !== 'undefined' && (window as any).__CSRF_TOKEN__ ? 
        { 'X-CSRF-Token': (window as any).__CSRF_TOKEN__ } : {}),
      ...standardOptions?.headers,
    };
    
    // Create request options
    const requestOptions: RequestInit = {
      ...standardOptions,
      headers,
    };
    
    // Make the API request
    console.log(`Making ${requestOptions.method || 'GET'} request to ${url}`);
    const response = await fetch(url, requestOptions);
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Handle empty response (204 No Content)
    if (response.status === 204) {
      console.log('Received 204 No Content response');
      return {
        data: null,
        error: null,
        status: 204,
      };
    }
    
    // Try to parse response as JSON
    let data = null;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        data = null;
      }
    }

    // Handle HTTP error responses
    if (!response.ok) {
      // Handle specific status codes
      if (response.status === 401) {
        // Unauthorized - could trigger a re-login flow
        console.error('Authentication expired or invalid');
        // You could redirect to login or trigger a session refresh
      }
      
      // Extract error message from response if available
      const errorMessage = data?.error || `Error: ${response.status} ${response.statusText}`;
      console.error('API Error:', errorMessage, data?.details || '');
      
      return {
        data: null,
        error: errorMessage,
        status: response.status,
      };
    }

    // Return successful response
    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    // Handle network errors or other exceptions
    const errorMessage = error instanceof Error
      ? `Network error: ${error.message}`
      : 'Unknown error occurred';
      
    console.error('API Request failed:', errorMessage);
    
    return {
      data: null,
      error: errorMessage,
      status: 0, // 0 indicates a network/client error rather than an HTTP error
    };
  }
}

/**
 * Task-specific API functions
 */
export const TaskApi = {
  /**
   * Fetch all tasks for the current user
   */
  getAllTasks: async () => {
    return apiRequest('/api/tasks');
  },

  /**
   * Get a single task by ID
   */
  getTask: async (taskId: string) => {
    return apiRequest(`/api/tasks/${taskId}`);
  },

  /**
   * Create a new task
   */
  createTask: async (taskData: any) => {
    return apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  /**
   * Update an existing task
   */
  updateTask: async (taskId: string, taskData: any) => {
    return apiRequest(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  },

  /**
   * Delete a task
   */
  deleteTask: async (taskId: string) => {
    return apiRequest(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      skipAuth: true, // Skip authentication check for deletion
    });
  },
};

/**
 * Category-specific API functions
 */
export const CategoryApi = {
  getAllCategories: async () => {
    return apiRequest('/api/categories');
  },
  
  createCategory: async (categoryData: any) => {
    return apiRequest('/api/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },
  
  updateCategory: async (categoryId: string, categoryData: any) => {
    return apiRequest(`/api/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },
  
  deleteCategory: async (categoryId: string) => {
    return apiRequest(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Focus session API functions
 */
export const FocusSessionApi = {
  getAllSessions: async (options?: { includeTask?: boolean }) => {
    const url = new URL('/api/focus-sessions', window.location.origin);
    
    // Add params if options are provided
    if (options) {
      if (options.includeTask) {
        url.searchParams.append('includeTask', 'true');
      }
    }
    
    return apiRequest(url.toString());
  },
  
  createSession: async (sessionData: any) => {
    return apiRequest('/api/focus-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },
  
  updateSession: async (sessionId: string, sessionData: any) => {
    return apiRequest(`/api/focus-sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  },
}; 