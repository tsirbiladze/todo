/**
 * Shared validation functions for task forms
 */

interface ValidationErrors {
  [key: string]: string;
}

interface ValidationFieldValues {
  title?: string;
  description?: string;
  estimatedDuration?: number;
  dueDate?: string;
  [key: string]: any;
}

/**
 * Validates a specific field in a task form
 * 
 * @param field The field name to validate
 * @param values The current form values
 * @param touched Map of which fields have been touched/edited
 * @param errors Current validation errors
 * @returns Whether the field is valid
 */
export const validateTaskField = (
  field: string,
  values: ValidationFieldValues,
  touched: Record<string, boolean>,
  errors: ValidationErrors
): ValidationErrors => {
  if (!touched[field]) {
    return errors;
  }
  
  const newErrors = { ...errors };

  switch (field) {
    case "title":
      if (!values.title?.trim()) {
        newErrors.title = "Title is required";
      } else if (values.title.length > 255) {
        newErrors.title = "Title is too long (max 255 characters)";
      } else {
        delete newErrors.title;
      }
      break;
      
    case "description":
      if (values.description && values.description.length > 1000) {
        newErrors.description = "Description is too long (max 1000 characters)";
      } else {
        delete newErrors.description;
      }
      break;
      
    case "estimatedDuration":
      if (values.estimatedDuration !== undefined) {
        if (values.estimatedDuration < 0) {
          newErrors.estimatedDuration = "Duration cannot be negative";
        } else if (values.estimatedDuration > 1440) {
          newErrors.estimatedDuration = "Duration cannot exceed 24 hours (1440 minutes)";
        } else {
          delete newErrors.estimatedDuration;
        }
      }
      break;
      
    case "dueDate":
      if (values.dueDate) {
        const dueDateTime = new Date(values.dueDate);
        const now = new Date();
        
        // For datetime-local inputs, we need to check the actual time as well
        if (dueDateTime < now) {
          newErrors.dueDate = "Due date and time cannot be in the past";
        } else {
          delete newErrors.dueDate;
        }
      } else {
        delete newErrors.dueDate;
      }
      break;
      
    default:
      break;
  }

  return newErrors;
};

/**
 * Validates all fields in a task form
 * 
 * @param values The current form values
 * @param errors Current validation errors
 * @returns Whether the form is valid and updated errors
 */
export const validateTaskForm = (
  values: ValidationFieldValues,
  errors: ValidationErrors = {}
): { isValid: boolean; errors: ValidationErrors } => {
  const allTouched = {
    title: true,
    description: true,
    estimatedDuration: true,
    dueDate: true,
  };
  
  let newErrors = { ...errors };
  
  // Validate each field
  Object.keys(allTouched).forEach(field => {
    newErrors = validateTaskField(field, values, allTouched, newErrors);
  });
  
  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors
  };
}; 