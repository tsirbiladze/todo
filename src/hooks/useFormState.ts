import { useState, useCallback } from 'react';

interface FormOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => void | Promise<void>;
  validate?: (values: T) => Record<string, string>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * Custom hook for managing form state in a standardized way
 * This centralizes form handling logic to reduce component size and complexity
 */
export function useFormState<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  validateOnChange = false,
  validateOnBlur = true,
}: FormOptions<T>) {
  const [formState, setFormState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isDirty: false,
  });
  
  // Set a specific field value
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setFormState(prevState => {
      const newValues = { ...prevState.values, [field]: value };
      
      // Validate the field on change if specified
      let newErrors = prevState.errors;
      if (validateOnChange && validate) {
        const validationResult = validate(newValues);
        newErrors = { ...newErrors, [field]: validationResult[field as string] || '' };
      }
      
      return {
        ...prevState,
        values: newValues,
        errors: newErrors,
        isDirty: true,
      };
    });
  }, [validateOnChange, validate]);
  
  // Handle field blur
  const handleBlur = useCallback((field: keyof T) => {
    setFormState(prevState => {
      const newTouched = { ...prevState.touched, [field]: true };
      
      // Validate the field on blur if specified
      let newErrors = prevState.errors;
      if (validateOnBlur && validate) {
        const validationResult = validate(prevState.values);
        newErrors = { ...newErrors, [field as string]: validationResult[field as string] || '' };
      }
      
      return {
        ...prevState,
        touched: newTouched,
        errors: newErrors,
      };
    });
  }, [validateOnBlur, validate]);
  
  // Reset the form to initial values
  const resetForm = useCallback(() => {
    setFormState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isDirty: false,
    });
  }, [initialValues]);
  
  // Validate the entire form
  const validateForm = useCallback(() => {
    if (!validate) return true;
    
    const validationErrors = validate(formState.values);
    const hasErrors = Object.keys(validationErrors).length > 0;
    
    // Mark all fields as touched
    const allTouched = Object.keys(formState.values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setFormState(prevState => ({
      ...prevState,
      errors: validationErrors,
      touched: allTouched,
    }));
    
    return !hasErrors;
  }, [formState.values, validate]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate the form before submitting
    const isValid = validateForm();
    if (!isValid) return;
    
    setFormState(prevState => ({
      ...prevState,
      isSubmitting: true,
    }));
    
    try {
      if (onSubmit) {
        await onSubmit(formState.values);
      }
    } finally {
      setFormState(prevState => ({
        ...prevState,
        isSubmitting: false,
      }));
    }
  }, [formState.values, onSubmit, validateForm]);
  
  return {
    ...formState,
    setFieldValue,
    handleBlur,
    handleSubmit,
    resetForm,
    validateForm,
  };
} 