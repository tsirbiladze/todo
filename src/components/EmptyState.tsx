import React from 'react';
import { PlusIcon, SparklesIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  type?: 'tasks' | 'categories' | 'templates' | 'analytics' | 'custom';
  icon?: React.ReactNode;
  tips?: string[];
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  type = 'tasks',
  icon,
  tips,
}: EmptyStateProps) {
  // Default content based on type
  const defaultContent = {
    tasks: {
      title: 'No tasks yet',
      description: 'Get started by creating your first task',
      actionLabel: 'Add your first task',
      icon: <SparklesIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />,
      tips: [
        'Break down large projects into smaller, manageable tasks',
        'Use categories to organize related tasks',
        'Set priorities to focus on what matters most',
        'Track your emotions to understand your productivity patterns'
      ]
    },
    categories: {
      title: 'No categories yet',
      description: 'Create categories to organize your tasks',
      actionLabel: 'Create category',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>,
      tips: [
        'Use color-coding for different types of tasks',
        'Create categories for work, personal, and hobby tasks',
        'Keep your category list manageable (5-7 is ideal)',
        'Use categories to filter and focus on specific areas'
      ]
    },
    templates: {
      title: 'No templates yet',
      description: 'Create templates for recurring tasks',
      actionLabel: 'Create template',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>,
      tips: [
        'Create templates for regularly repeated tasks',
        'Include detailed steps in your templates',
        'Use templates for standard processes and workflows',
        'Save time by standardizing recurring work'
      ]
    },
    analytics: {
      title: 'No data to analyze yet',
      description: 'Complete tasks to see your productivity analytics',
      actionLabel: 'Go to tasks',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      tips: [
        'Complete tasks regularly to see meaningful patterns',
        'Track your emotions to understand your productivity',
        'Review your analytics weekly to adapt your workflow',
        'Identify your most productive time periods'
      ]
    },
    custom: {
      title: 'No content yet',
      description: 'Nothing to display at the moment',
      actionLabel: 'Create',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>,
      tips: ['Get started by creating your first item']
    }
  };

  // Use provided values or defaults
  const displayTitle = title || defaultContent[type].title;
  const displayDescription = description || defaultContent[type].description;
  const displayActionLabel = actionLabel || defaultContent[type].actionLabel;
  const displayIcon = icon || defaultContent[type].icon;
  const displayTips = tips || defaultContent[type].tips;

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-8 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
          {displayIcon}
        </div>
        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{displayTitle}</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
          {displayDescription}
        </p>
        
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {displayActionLabel}
          </button>
        )}
      </div>
      
      {/* Tips Section */}
      {displayTips && displayTips.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 px-8 py-6 rounded-b-xl">
          <div className="flex items-center mb-3">
            <LightBulbIcon className="h-5 w-5 text-amber-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tips & Best Practices</h3>
          </div>
          <ul className="space-y-2">
            {displayTips.map((tip, index) => (
              <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 