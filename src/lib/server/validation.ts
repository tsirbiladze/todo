import { z } from 'zod';
import { Priority, TaskStatus } from '@prisma/client';

// Define validation schemas using Zod for type safety and validation
export const taskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority, {
    errorMap: () => ({ message: 'Invalid priority value' }),
  }),
  status: z.nativeEnum(TaskStatus, {
    errorMap: () => ({ message: 'Invalid status value' }),
  }).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  emotion: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  categories: z.array(z.any()).optional(),  // Support both array of ids and array of objects
});

export const updateTaskSchema = taskSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().min(1, 'Color is required'),
});

export const focusSessionSchema = z.object({
  taskId: z.string().optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }).optional(),
  duration: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Helper function to validate data against a schema
export async function validateData<T>(schema: z.ZodSchema<T>, data: unknown): Promise<{
  success: boolean;
  data: T | null;
  error: string | null;
}> {
  try {
    const validatedData = await schema.parseAsync(data);
    return {
      success: true,
      data: validatedData,
      error: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      
      return {
        success: false,
        data: null,
        error: errorMessages,
      };
    }
    
    return {
      success: false,
      data: null,
      error: 'Invalid data format',
    };
  }
} 