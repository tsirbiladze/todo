import React from 'react';
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface TaskFormFieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  touched?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function TaskFormField({ 
  id, 
  label, 
  icon, 
  rightElement,
  touched = false, 
  error = '', 
  children,
  className = ''
}: TaskFormFieldProps) {
  const hasError = touched && error;
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs font-medium text-gray-300 mb-1">
        <div className="flex items-center">
          {icon}
          <label htmlFor={id}>{label}</label>
        </div>
        
        {rightElement && (
          <div className="ml-auto">
            {rightElement}
          </div>
        )}
      </div>
      
      {children}
      
      {hasError && (
        <div 
          id={`${id}-error`} 
          className="mt-1 text-xs text-red-400 flex items-center gap-1" 
          aria-live="polite"
        >
          <ExclamationCircleIcon className="h-3 w-3" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
} 