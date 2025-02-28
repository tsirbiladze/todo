import React, { useState, useEffect } from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { TaskFormField } from './TaskFormField';
import { useTranslation } from '@/lib/i18n';

interface Template {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void;
}

/**
 * Template selector component for selecting task templates
 * Extracted from AddTaskForm to improve component size and maintainability
 */
export function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch templates on component mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/templates');
        
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setError('Failed to load templates');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) {
      // If empty value is selected, pass null to clear the form
      onTemplateSelect({ id: '', name: '' });
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
    }
  };
  
  // Clear the selected template
  const clearTemplate = () => {
    setSelectedTemplate(null);
    onTemplateSelect({ id: '', name: '' });
  };
  
  return (
    <TaskFormField
      id="template"
      label="Apply Template"
      icon={<DocumentDuplicateIcon className="h-4 w-4" />}
    >
      <div className="w-full relative">
        <select
          id="template"
          value={selectedTemplate || ''}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="form-select w-full pr-8 text-sm border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          disabled={isLoading}
        >
          <option value="">Select a template</option>
          {templates.map(template => (
            <option key={template.id} value={template.id} className="dark:bg-gray-800 dark:text-gray-100">
              {template.name}
            </option>
          ))}
        </select>
        
        {selectedTemplate && (
          <button 
            type="button"
            onClick={clearTemplate}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Clear template"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {isLoading && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 flex items-center">
            <svg className="animate-spin mr-1.5 h-3 w-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        )}
        
        {error && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}
        
        {!isLoading && !error && templates.length === 0 && (
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            No templates available
          </div>
        )}
        
        {selectedTemplate && (
          <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 flex items-center">
            <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
            Using template: {templates.find(t => t.id === selectedTemplate)?.name || ''}
          </div>
        )}
      </div>
    </TaskFormField>
  );
} 