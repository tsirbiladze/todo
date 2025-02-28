'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowPathIcon, 
  CalendarIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { RecurrencePattern, RecurrencePatternSelector, formatRecurrencePattern, parseRecurrencePattern } from './RecurrencePatternSelector';
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";

interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  priority: string;
  estimatedDuration?: number;
  categories?: { id: string; name: string; color: string }[];
}

interface RecurringTask {
  id: string;
  templateId: string;
  nextDueDate: string | Date;
  frequency: string;
  interval: number;
  daysOfWeek?: string;
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  count?: number;
  template?: TaskTemplate;
  previewOccurrences?: string[];
}

interface RecurringTaskManagerProps {
  onClose?: () => void;
}

export function RecurringTaskManager({ onClose }: RecurringTaskManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state for creating/editing a recurring task
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [nextDueDate, setNextDueDate] = useState<string>('');
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    frequency: 'DAILY',
    interval: 1
  });
  
  // Update fetchData function
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch task templates
      const templatesRes = await fetch('/api/task-templates');
      if (!templatesRes.ok) throw new Error('Failed to fetch templates');
      const templatesData = await templatesRes.json();
      
      // Fetch recurring tasks with preview
      const tasksRes = await fetch('/api/recurring-tasks?preview=true');
      if (!tasksRes.ok) throw new Error('Failed to fetch recurring tasks');
      const tasksData = await tasksRes.json();
      
      setTemplates(templatesData.templates);
      setRecurringTasks(tasksData.recurringTasks);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Replace useEffect with the new fetchData function
  useEffect(() => {
    fetchData();
  }, []);
  
  // Create a new recurring task
  const handleCreateRecurringTask = async () => {
    if (!selectedTemplate || !nextDueDate) {
      setError('Please select a template and a start date.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const formattedPattern = formatRecurrencePattern(recurrencePattern);
      
      const response = await fetch('/api/recurring-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          nextDueDate,
          ...formattedPattern
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create recurring task');
      }
      
      const data = await response.json();
      
      // Add the new recurring task to the state
      setRecurringTasks(prev => [...prev, data.recurringTask]);
      
      // Reset form and close creation panel
      setSelectedTemplate('');
      setNextDueDate('');
      setRecurrencePattern({
        frequency: 'DAILY',
        interval: 1
      });
      setIsCreating(false);
      
    } catch (err) {
      setError('Failed to create recurring task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update an existing recurring task
  const handleUpdateRecurringTask = async (taskId: string) => {
    if (!selectedTemplate || !nextDueDate) {
      setError('Please select a template and a start date.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const formattedPattern = formatRecurrencePattern(recurrencePattern);
      
      const response = await fetch(`/api/recurring-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          nextDueDate,
          ...formattedPattern
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update recurring task');
      }
      
      const data = await response.json();
      
      // Update the recurring task in the state
      setRecurringTasks(prev => prev.map(task => 
        task.id === taskId ? data.recurringTask : task
      ));
      
      // Reset form and close editing panel
      setSelectedTemplate('');
      setNextDueDate('');
      setRecurrencePattern({
        frequency: 'DAILY',
        interval: 1
      });
      setIsEditing(null);
      
    } catch (err) {
      setError('Failed to update recurring task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a recurring task
  const handleDeleteRecurringTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this recurring task? This will not delete any tasks that have already been created.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/recurring-tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recurring task');
      }
      
      // Remove the deleted task from the state
      setRecurringTasks(prev => prev.filter(task => task.id !== taskId));
      
    } catch (err) {
      setError('Failed to delete recurring task. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start editing a recurring task
  const handleStartEditing = (task: RecurringTask) => {
    setSelectedTemplate(task.templateId);
    setNextDueDate(typeof task.nextDueDate === 'string' 
      ? task.nextDueDate 
      : formatDate(task.nextDueDate, DATE_FORMATS.ISO));
    setRecurrencePattern(parseRecurrencePattern({
      frequency: task.frequency,
      interval: task.interval,
      daysOfWeek: task.daysOfWeek,
      dayOfMonth: task.dayOfMonth,
      monthOfYear: task.monthOfYear,
      endDate: task.endDate,
      count: task.count
    }));
    setIsEditing(task.id);
  };
  
  // Get template name by ID
  const getTemplateName = (templateId: string): string => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Unknown Template';
  };
  
  // Format pattern description
  const getPatternDescription = (task: RecurringTask): string => {
    if (!task) return '';
    
    try {
      const pattern = parseRecurrencePattern({
        frequency: task.frequency,
        interval: task.interval,
        daysOfWeek: task.daysOfWeek,
        dayOfMonth: task.dayOfMonth,
        monthOfYear: task.monthOfYear
      });
      
      const { frequency, interval, daysOfWeek, dayOfMonth, monthOfYear } = pattern;
      
      switch (frequency) {
        case 'DAILY':
          return interval === 1 ? 'Daily' : `Every ${interval} days`;
          
        case 'WEEKLY':
          if (daysOfWeek && daysOfWeek.length > 0) {
            const dayNames = daysOfWeek.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ');
            return interval === 1 
              ? `Weekly on ${dayNames}` 
              : `Every ${interval} weeks on ${dayNames}`;
          }
          return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
          
        case 'MONTHLY':
          if (dayOfMonth) {
            return interval === 1 
              ? `Monthly on day ${dayOfMonth}` 
              : `Every ${interval} months on day ${dayOfMonth}`;
          }
          return interval === 1 ? 'Monthly' : `Every ${interval} months`;
          
        case 'YEARLY':
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          if (monthOfYear && dayOfMonth) {
            return interval === 1 
              ? `Yearly on ${monthNames[monthOfYear - 1]} ${dayOfMonth}` 
              : `Every ${interval} years on ${monthNames[monthOfYear - 1]} ${dayOfMonth}`;
          }
          return interval === 1 ? 'Yearly' : `Every ${interval} years`;
          
        default:
          return 'Custom recurrence';
      }
    } catch (error) {
      console.error('Error parsing recurrence pattern:', error);
      return 'Error parsing pattern';
    }
  };
  
  // Add function to manually generate tasks
  const handleGenerateTasks = async (taskIds?: string[]) => {
    try {
      setIsGenerating(true);
      setError(null);
      
      const response = await fetch('/api/recurring-tasks/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: taskIds || selectedTaskIds,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }
      
      const data = await response.json();
      
      // Show success message
      setSuccessMessage(data.message);
      
      // Clear selected task IDs
      setSelectedTaskIds([]);
      
      // Refresh recurring tasks list
      fetchData();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (err) {
      setError('Failed to generate tasks. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Add a function to toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Recurring Tasks</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-3 mb-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
          {successMessage}
        </div>
      )}
      
      {/* Actions toolbar */}
      {!isCreating && !isEditing && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            disabled={isLoading}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create New Recurring Task
          </button>
          
          <button
            onClick={() => handleGenerateTasks()}
            className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            disabled={isLoading || isGenerating || selectedTaskIds.length === 0}
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Generate Selected Tasks ({selectedTaskIds.length})
          </button>
          
          <button
            onClick={() => handleGenerateTasks(recurringTasks.filter(task => 
              new Date(task.nextDueDate) <= new Date()
            ).map(task => task.id))}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            disabled={isLoading || isGenerating || recurringTasks.filter(task => 
              new Date(task.nextDueDate) <= new Date()
            ).length === 0}
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Generate All Due Tasks
          </button>
        </div>
      )}
      
      {/* Create/Edit form */}
      {(isCreating || isEditing) && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">
            {isEditing ? 'Edit Recurring Task' : 'Create New Recurring Task'}
          </h3>
          
          <div className="space-y-4">
            {/* Template selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Template</label>
              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Next due date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Recurrence pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurrence Pattern</label>
              <RecurrencePatternSelector
                value={recurrencePattern}
                onChange={setRecurrencePattern}
                showPreview={true}
              />
            </div>
            
            {/* Form controls */}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(null);
                  setSelectedTemplate('');
                  setNextDueDate('');
                  setRecurrencePattern({ frequency: 'DAILY', interval: 1 });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 flex items-center"
                onClick={() => isEditing ? handleUpdateRecurringTask(isEditing) : handleCreateRecurringTask()}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* List of existing recurring tasks */}
      <div>
        <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">Your Recurring Tasks</h3>
        
        {isLoading && !isCreating && !isEditing ? (
          <p className="text-gray-500 dark:text-gray-400">Loading recurring tasks...</p>
        ) : recurringTasks.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">You don't have any recurring tasks yet.</p>
        ) : (
          <div className="space-y-3">
            {recurringTasks.map((task) => {
              const isDue = new Date(task.nextDueDate) <= new Date();
              
              return (
                <div 
                  key={task.id} 
                  className={`p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isDue ? 'border-orange-300 bg-orange-50 dark:border-orange-500/30 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
                  } ${selectedTaskIds.includes(task.id) ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      {!isCreating && !isEditing && (
                        <input
                          type="checkbox"
                          className="mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-500"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => toggleTaskSelection(task.id)}
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{getTemplateName(task.templateId)}</h4>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <ArrowPathIcon className="w-4 h-4 mr-1" />
                          <span>{getPatternDescription(task)}</span>
                        </div>
                        <div className="flex items-center text-sm mt-1">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          <span className={isDue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                            Next occurrence: {formatDate(task.nextDueDate, DATE_FORMATS.DISPLAY)}
                            {isDue && ' (Due now)'}
                          </span>
                        </div>
                        
                        {/* Preview upcoming occurrences */}
                        {task.previewOccurrences && task.previewOccurrences.length > 0 && (
                          <div className="mt-2 pl-5 text-xs text-gray-500 dark:text-gray-400">
                            <p className="mb-1">Upcoming:</p>
                            <ul className="space-y-1">
                              {task.previewOccurrences.map((date, index) => (
                                <li key={index} className="flex items-center">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {formatDate(date, DATE_FORMATS.DISPLAY)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!isCreating && !isEditing && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleGenerateTasks([task.id])}
                          className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            isDue ? 'text-orange-500 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
                          }`}
                          title="Generate task now"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStartEditing(task)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecurringTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 