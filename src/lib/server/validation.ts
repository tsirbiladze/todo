import { z } from 'zod';
import { Priority, Emotion } from '@prisma/client';

// Define the ValidationResult interface
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Define validation schemas using Zod for type safety and validation
export const taskSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority, {
    errorMap: () => ({ message: 'Invalid priority value' }),
  }),
  // Virtual field that is not actually in the database schema
  // Used for API compatibility but maps to completedAt in the database
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "CANCELED"], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  emotion: z.nativeEnum(Emotion, {
    errorMap: () => ({ message: 'Invalid emotion value' }),
  }).optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  categories: z.array(z.any()).optional(),  // Support both array of ids and array of objects
});

export const updateTaskSchema = taskSchema.partial();

export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters'),
  color: z.string()
    .min(1, 'Color is required')
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code'),
});

// Add Project schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters'),
  description: z.string().optional(),
});

export const updateProjectSchema = projectSchema.partial();

// Add Goal schema
export const goalSchema = z.object({
  name: z.string()
    .min(1, 'Goal name is required')
    .max(100, 'Goal name must be less than 100 characters'),
  description: z.string().optional(),
  projectId: z.string({
    required_error: 'Project ID is required',
    invalid_type_error: 'Project ID must be a string'
  }),
  taskIds: z.array(z.string()).optional(),
  tasks: z.array(z.any()).optional(), // Support both array of ids and array of objects
});

export const updateGoalSchema = goalSchema.partial();

export const focusSessionSchema = z.object({
  taskId: z.string().optional(),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }).optional(),
  duration: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// Generic data validation function
export async function validateData<T extends z.ZodType>(
  schema: T,
  data: any
): Promise<ValidationResult<z.infer<T>>> {
  try {
    console.log('Validating data with schema:', schema.description || 'Schema without description');
    console.log('Input data:', JSON.stringify(data, null, 2));
    
    // Log specific fields for debugging enum validation
    if (data.emotion) {
      console.log('Emotion value type:', typeof data.emotion);
      console.log('Emotion value:', data.emotion);
    }
    
    if (data.priority) {
      console.log('Priority value type:', typeof data.priority);
      console.log('Priority value:', data.priority);
    }
    
    const parsed = await schema.parseAsync(data);
    console.log('Validation succeeded');
    
    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      
      // Format error messages for better readability
      const errorMessages = error.errors.map(err => {
        // Add extra detail for enum validation errors
        if (err.code === 'invalid_enum_value') {
          return `${err.path.join('.')}: Invalid value '${err.received}'. Expected one of: ${(err.options as string[]).join(', ')}`;
        }
        return `${err.path.join('.')}: ${err.message}`;
      }).join(', ');
      
      return {
        success: false,
        error: errorMessages,
      };
    }
    
    console.error('Unknown validation error:', error);
    return {
      success: false,
      error: 'Unknown validation error',
    };
  }
} 