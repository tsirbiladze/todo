import { useState, useEffect, Fragment } from 'react';
import { useStore } from '@/lib/store';
import { Task, Priority, Emotion } from '@prisma/client';
import {
  DocumentDuplicateIcon,
  ClockIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { CategoryManager } from './CategoryManager';

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  estimatedDuration: number;
  emotion?: Emotion;
  categoryIds: string[];
  isRecurring?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    id: 'quick-task',
    name: 'Quick Task',
    description: '',
    priority: 'NONE' as Priority,
    estimatedDuration: 15,
    categoryIds: [],
  },
  {
    id: 'important-project',
    name: 'Important Project Task',
    description: '',
    priority: 'HIGH' as Priority,
    estimatedDuration: 60,
    categoryIds: [],
  },
  {
    id: 'daily-routine',
    name: 'Daily Routine',
    description: '',
    priority: 'LOW' as Priority,
    estimatedDuration: 30,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'daily',
      interval: 1,
    },
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Review progress and plan next week',
    priority: 'MEDIUM' as Priority,
    estimatedDuration: 60,
    categoryIds: [],
    isRecurring: true,
    recurrence: {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [5], // Friday
    },
  },
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_TEMPLATE: TaskTemplate = {
  id: '',
  name: '',
  description: '',
  priority: 'NONE',
  estimatedDuration: 30,
  categoryIds: [],
  isRecurring: false,
};

export function TaskTemplates() {
  const { addTask, categories } = useStore();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<TaskTemplate>(EMPTY_TEMPLATE);
  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Fetch templates when component mounts
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
    };
    
    fetchTemplates();
  }, []);

  const createTaskFromTemplate = async (template: TaskTemplate) => {
    const now = new Date();
    let dueDate: Date | null = null;

    if (template.isRecurring && template.recurrence) {
      const { frequency, interval, daysOfWeek, dayOfMonth } = template.recurrence;
      dueDate = new Date();

      switch (frequency) {
        case 'daily':
          dueDate.setDate(dueDate.getDate() + interval);
          break;
        case 'weekly':
          if (daysOfWeek && daysOfWeek.length > 0) {
            // Find next occurrence of specified day(s)
            const currentDay = dueDate.getDay();
            const nextDay = daysOfWeek.find(day => day > currentDay) || daysOfWeek[0];
            const daysToAdd = nextDay > currentDay
              ? nextDay - currentDay
              : 7 - currentDay + nextDay;
            dueDate.setDate(dueDate.getDate() + daysToAdd);
          } else {
            dueDate.setDate(dueDate.getDate() + (7 * interval));
          }
          break;
        case 'monthly':
          if (dayOfMonth) {
            dueDate.setDate(dayOfMonth);
            if (dueDate < now) {
              dueDate.setMonth(dueDate.getMonth() + 1);
            }
          } else {
            dueDate.setMonth(dueDate.getMonth() + interval);
          }
          break;
      }
    }

    const newTask: Partial<Task> = {
      title: template.name,
      description: template.description,
      priority: template.priority,
      estimatedDuration: template.estimatedDuration,
      emotion: template.emotion,
      dueDate,
      completed: false,
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          categories: template.categoryIds.map(id => ({ id })),
        }),
      });

      if (!response.ok) throw new Error('Failed to create task from template');

      const { task } = await response.json();
      addTask(task);

      // If recurring, schedule next occurrence
      if (template.isRecurring && dueDate) {
        await fetch('/api/recurring-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: template.id,
            nextDueDate: dueDate,
          }),
        });
      }
    } catch (error) {
      console.error('Error creating task from template:', error);
    }
  };

  const openCreateTemplate = () => {
    setCurrentTemplate(EMPTY_TEMPLATE);
    setIsEdit(false);
    setIsModalOpen(true);
  };

  const openEditTemplate = (template: TaskTemplate) => {
    setCurrentTemplate(template);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const confirmDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setIsConfirmDeleteOpen(true);
  };

  const deleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/templates?id=${templateToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateToDelete));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setIsConfirmDeleteOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = isEdit ? '/api/templates' : '/api/templates';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate),
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        
        if (isEdit) {
          setTemplates(templates.map(t => t.id === savedTemplate.id ? savedTemplate : t));
        } else {
          setTemplates([...templates, savedTemplate]);
        }
        
        setIsModalOpen(false);
        setCurrentTemplate(EMPTY_TEMPLATE);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Templates</h3>
        <button
          onClick={openCreateTemplate}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-150"
          >
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openEditTemplate(template)}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => confirmDeleteTemplate(template.id)}
                    className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {template.description && (
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              )}
              
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                {template.estimatedDuration > 0 && (
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {template.estimatedDuration}m
                  </span>
                )}
                {template.isRecurring && (
                  <span className="flex items-center gap-1">
                    <ArrowPathIcon className="h-4 w-4" />
                    {template.recurrence?.frequency}
                  </span>
                )}
              </div>
              
              {template.categoryIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.categoryIds.map(catId => {
                    const category = categories.find(c => c.id === catId);
                    return category ? (
                      <span 
                        key={catId} 
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                      >
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            
            <button
              onClick={() => createTaskFromTemplate(template)}
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 border-t"
            >
              Create Task
            </button>
          </div>
        ))}
      </div>

      {/* Template Form Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {isEdit ? 'Edit Template' : 'Create Template'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmitTemplate} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={currentTemplate.name}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={currentTemplate.description || ''}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, description: e.target.value})}
                        rows={2}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        id="priority"
                        value={currentTemplate.priority}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, priority: e.target.value as Priority})}
                        className="form-select w-full"
                      >
                        <option value="NONE">None</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        Estimated Duration (minutes)
                      </label>
                      <input
                        type="number"
                        id="duration"
                        min="1"
                        value={currentTemplate.estimatedDuration || ''}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, estimatedDuration: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="emotion" className="block text-sm font-medium text-gray-700">
                        Emotion
                      </label>
                      <select
                        id="emotion"
                        value={currentTemplate.emotion || 'NEUTRAL'}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, emotion: e.target.value as Emotion})}
                        className="form-select w-full"
                      >
                        <option value="NEUTRAL">Neutral</option>
                        <option value="HAPPY">Happy</option>
                        <option value="EXCITED">Excited</option>
                        <option value="ANXIOUS">Anxious</option>
                        <option value="DREADING">Dreading</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        checked={currentTemplate.isRecurring || false}
                        onChange={(e) => setCurrentTemplate({...currentTemplate, isRecurring: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                        Recurring Task
                      </label>
                    </div>
                    
                    {currentTemplate.isRecurring && (
                      <div className="ml-6 space-y-4 border-l-2 border-gray-100 pl-4">
                        <div>
                          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                            Frequency
                          </label>
                          <select
                            id="frequency"
                            value={currentTemplate.recurrence?.frequency || 'daily'}
                            onChange={(e) => setCurrentTemplate({
                              ...currentTemplate, 
                              recurrence: {
                                ...currentTemplate.recurrence,
                                frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                              }
                            })}
                            className="form-select w-full"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="interval" className="block text-sm font-medium text-gray-700">
                            Interval
                          </label>
                          <input
                            type="number"
                            id="interval"
                            min="1"
                            value={currentTemplate.recurrence?.interval || 1}
                            onChange={(e) => setCurrentTemplate({
                              ...currentTemplate, 
                              recurrence: {
                                ...(currentTemplate.recurrence || { frequency: 'daily' }),
                                interval: parseInt(e.target.value) || 1
                              }
                            })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        
                        {currentTemplate.recurrence?.frequency === 'weekly' && (
                          <div>
                            <span className="block text-sm font-medium text-gray-700 mb-2">
                              Days of Week
                            </span>
                            <div className="grid grid-cols-4 gap-2">
                              {WEEKDAYS.map((day, index) => (
                                <div key={index} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`day-${index}`}
                                    checked={(currentTemplate.recurrence?.daysOfWeek || []).includes(index)}
                                    onChange={(e) => {
                                      const currentDays = currentTemplate.recurrence?.daysOfWeek || [];
                                      const newDays = e.target.checked
                                        ? [...currentDays, index]
                                        : currentDays.filter(d => d !== index);
                                      
                                      setCurrentTemplate({
                                        ...currentTemplate,
                                        recurrence: {
                                          ...(currentTemplate.recurrence || { frequency: 'weekly', interval: 1 }),
                                          daysOfWeek: newDays
                                        }
                                      });
                                    }}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`day-${index}`} className="ml-2 block text-sm text-gray-700">
                                    {day.slice(0, 3)}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {currentTemplate.recurrence?.frequency === 'monthly' && (
                          <div>
                            <label htmlFor="dayOfMonth" className="block text-sm font-medium text-gray-700">
                              Day of Month
                            </label>
                            <input
                              type="number"
                              id="dayOfMonth"
                              min="1"
                              max="31"
                              value={currentTemplate.recurrence?.dayOfMonth || 1}
                              onChange={(e) => setCurrentTemplate({
                                ...currentTemplate, 
                                recurrence: {
                                  ...(currentTemplate.recurrence || { frequency: 'monthly', interval: 1 }),
                                  dayOfMonth: parseInt(e.target.value) || 1
                                }
                              })}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <CategoryManager
                      selectedCategories={currentTemplate.categoryIds}
                      onChange={(categoryIds) => setCurrentTemplate({...currentTemplate, categoryIds})}
                    />
                    
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {isEdit ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* Delete Confirmation Dialog */}
      <Transition appear show={isConfirmDeleteOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsConfirmDeleteOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Delete Template
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this template? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      onClick={() => setIsConfirmDeleteOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                      onClick={deleteTemplate}
                    >
                      Delete
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
} 