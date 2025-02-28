import React, { ReactNode } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface TaskFormFieldProps {
  id?: string;
  label: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  touched?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
  description?: string;
}

export function TaskFormField({
  id,
  label,
  icon,
  rightElement,
  touched,
  error,
  children,
  className = '',
  description
}: TaskFormFieldProps) {
  const hasError = touched && error;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1"
        >
          {icon && (
            <span className="text-gray-500 dark:text-gray-400">
              {icon}
            </span>
          )}
          {label}
        </label>
        
        {rightElement && (
          <div className="flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-0.5">
          {description}
        </p>
      )}
      
      <div className="relative">
        {children}
      </div>
      
      {hasError && (
        <div className="flex items-start mt-1">
          <ExclamationCircleIcon 
            className="h-3.5 w-3.5 text-red-500 dark:text-red-400 mr-1 flex-shrink-0 mt-0.5" 
            aria-hidden="true" 
          />
          <p 
            className="text-xs text-red-600 dark:text-red-400" 
            id={id ? `${id}-error` : undefined}
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
} 