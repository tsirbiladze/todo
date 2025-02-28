/**
 * Shared validation functions for task forms
 */

interface ValidationErrors {
  [key: string]: string;
}

interface ValidationFieldValues {
  title?: string;
  description?: string;
  priority?: number;
  estimatedDuration?: number;
  dueDate?: string;
  selectedCategories?: string[];
  [key: string]: any;
}

/**
 * Validates a specific field in a task form
 * 
 * @param field The field name to validate
 * @param values The current form values
 * @returns The validation error message if any
 */
export const validateTaskField = (
  field: string,
  values: ValidationFieldValues
): string => {
  // Safety check for undefined values
  if (!values) {
    return "";
  }

  switch (field) {
    case "title":
      if (!values.title?.trim()) {
        return "Title is required";
      } else if (values.title.length > 255) {
        return "Title is too long (max 255 characters)";
      }
      break;
      
    case "description":
      if (values.description && values.description.length > 1000) {
        return "Description is too long (max 1000 characters)";
      }
      break;
      
    case "priority":
      // Validate priority is defined and within valid range
      if (values.priority === undefined || values.priority < 0 || values.priority > 4) {
        return "Please select a valid priority level";
      }
      break;
      
    case "estimatedDuration":
      if (values.estimatedDuration !== undefined) {
        if (values.estimatedDuration < 0) {
          return "Duration cannot be negative";
        } else if (values.estimatedDuration > 1440) {
          return "Duration cannot exceed 24 hours (1440 minutes)";
        }
      }
      break;
      
    case "dueDate":
      if (values.dueDate) {
        const dueDateTime = new Date(values.dueDate);
        const now = new Date();
        
        // For datetime-local inputs, we need to check the actual time as well
        if (dueDateTime < now) {
          return "Due date and time cannot be in the past";
        }
      }
      break;
      
    case "categories":
      if (values.selectedCategories && values.selectedCategories.length > 5) {
        return "You can select up to 5 categories";
      }
      break;
      
    default:
      break;
  }

  return ""; // No error
};

/**
 * Validates all fields in a task form
 * 
 * @param values The current form values
 * @returns Validation errors object
 */
export const validateTaskForm = (
  values: ValidationFieldValues
): ValidationErrors => {
  let errors: ValidationErrors = {};
  
  // Fields to validate
  const fields = ["title", "description", "priority", "estimatedDuration", "dueDate", "categories"];
  
  // Validate each field
  fields.forEach(field => {
    const error = validateTaskField(field, values);
    if (error) {
      errors[field] = error;
    }
  });
  
  return errors;
}; 