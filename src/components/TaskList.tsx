import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { TaskCard } from './TaskCard';
import { useStore } from '@/lib/store';
import { Task as TaskType } from '@prisma/client';
import {
  FunnelIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { TaskCalendarView } from './TaskCalendarView';
import { EditTaskForm } from './EditTaskForm';
import { priorityToNumber, priorityToLabel } from "@/lib/type-conversions";
import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { TaskApi, CategoryApi, FocusSessionApi } from '@/lib/api';
import { EmotionTracker } from './EmotionTracker';
import { MoodSuggestions } from './MoodSuggestions';
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";
import { AiTaskAssistant } from './task-components/AiTaskAssistant';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Spinner } from './ui/Spinner';
import { useDebouncedCallback } from 'use-debounce';

type ViewMode = 'list' | 'board' | 'calendar';
type SortOption = 'dueDate' | 'priority' | 'created' | 'category';
type GroupOption = 'none' | 'category' | 'priority' | 'dueDate';

// Create a memoized TaskCard component to prevent unnecessary re-renders
const MemoizedTaskCard = React.memo(TaskCard);

export function TaskList() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'active'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskType | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [historicalTasks, setHistoricalTasks] = useState<TaskType[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const tasks = useStore((state) => state.tasks);
  const setTasks = useStore((state) => state.setTasks);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  
  // New createTask function that combines API call with store update
  const createTask = useCallback(async (taskData) => {
    try {
      console.log('Creating new task:', taskData);
      const response = await TaskApi.createTask(taskData);
      
      if (response.error) {
        console.error('Error creating task:', response.error);
        toast.error('Failed to create task: ' + response.error);
        return null;
      }
      
      if (response.data?.task) {
        console.log('Task created successfully:', response.data.task);
        addTask(response.data.task);
        toast.success('Task created successfully');
        return response.data.task;
      } else {
        console.error('No task data in response:', response);
        toast.error('Failed to create task: Invalid response');
        return null;
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    }
  }, [addTask]);

  // Fetch tasks function - using the new API utilities
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(null);
      
      console.log('🔍 TaskList: Starting to fetch tasks...');
      const response = await TaskApi.getAllTasks();
      console.log('📡 TaskList: Raw API response:', response);
      
      if (response.error) {
        console.error('❌ TaskList: API response error:', response.error);
        throw new Error(response.error);
      }
      
      // Validate response data
      if (!response.data) {
        console.error('❌ TaskList: No data in API response:', response);
        throw new Error('No data returned from API');
      }
      
      // Extract tasks from the response data with safety check
      const tasksData = response.data.tasks;
      
      // Ensure tasks is always an array
      const validTasksData = Array.isArray(tasksData) ? tasksData : [];
      
      console.log('📋 TaskList: Tasks data fetched:', validTasksData);
      console.log('🔢 TaskList: Tasks data length:', validTasksData.length);
      
      // Check if tasks actually exist in the response
      if (validTasksData.length === 0) {
        console.warn('⚠️ TaskList: No tasks returned from API - checking response format');
        console.log('🔍 TaskList: Full response:', JSON.stringify(response));
      } else {
        console.log('✅ TaskList: First task example:', JSON.stringify(validTasksData[0]));
      }
      
      // Direct store update for most reliable results
      console.log('💾 TaskList: Directly updating store state...');
      const store = useStore.getState();
      store.setTasks(validTasksData);
      
      // Verify state after setting
      setTimeout(() => {
        const storeState = useStore.getState();
        console.log('🧪 TaskList: Store tasks after setting:', storeState.tasks);
        console.log('🔢 TaskList: Store tasks length:', storeState.tasks.length);
        console.log('🔄 TaskList: Component tasks state:', tasks);
        console.log('🔄 TaskList: Component tasks length:', tasks.length);
      }, 100);
    } catch (error) {
      console.error('❌ TaskList: Error fetching tasks:', error);
      setIsError(error instanceof Error ? error.message : 'Failed to fetch tasks');
      
      // Always ensure we have a valid array in the store, even on error
      const store = useStore.getState();
      if (!Array.isArray(store.tasks)) {
        console.log('🛠️ TaskList: Initializing store with empty tasks array after error');
        store.setTasks([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tasks]);

  // Fetch tasks when component mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);  // Added fetchTasks to dependency array since it's now memoized

  // Use the same function for refreshing tasks
  const refreshTasks = fetchTasks;

  const moodOptions = useMemo(() => [
    { value: 'overwhelmed', label: 'Overwhelmed', emoji: '😫' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'focused', label: 'Focused', emoji: '🎯' },
    { value: 'tired', label: 'Tired', emoji: '😴' },
    { value: 'motivated', label: 'Motivated', emoji: '💪' },
  ], []);

  const filteredAndSortedTasks = useMemo(() => {
    // Ensure tasks is an array before spreading
    if (!Array.isArray(tasks)) {
      console.log('Tasks is not an array:', tasks);
      return [];
    }

    console.log('Tasks array in filteredAndSortedTasks:', tasks);
    console.log('Tasks length:', tasks.length);

    // Filter out undefined or null tasks first
    let result = tasks.filter(task => task != null);
    console.log('Tasks after null filtering:', result.length);

    // Apply search filter
    if (searchQuery) {
      result = result.filter(task => 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('Tasks after search filtering:', result.length);
    }

    // Apply completion filter
    result = result.filter((task) => {
      // Check if task exists before accessing properties
      if (!task) return false;
      
      const isCompleted = !!task.completedAt;
      switch (filter) {
        case 'completed':
          return isCompleted;
        case 'active':
          return !isCompleted;
        default:
          return true;
      }
    });
    console.log('Tasks after completion filtering:', result.length);
    console.log('Current filter:', filter);

    // Apply sorting
    result.sort((a, b) => {
      // Safety check for undefined tasks
      if (!a || !b) return 0;
      
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          return priorityToNumber(b.priority) - priorityToNumber(a.priority);
        case 'category':
          const aCategory = a.categories?.[0]?.name || '';
          const bCategory = b.categories?.[0]?.name || '';
          return aCategory.localeCompare(bCategory);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    console.log('Final filtered and sorted tasks:', result.length);
    if (result.length > 0) {
      console.log('Sample first task:', result[0]);
    }
    
    return result;
  }, [tasks, filter, sortBy, searchQuery]);

  const groupedTasks = useMemo(() => {
    // Ensure filteredAndSortedTasks is an array
    if (!Array.isArray(filteredAndSortedTasks)) {
      console.log('filteredAndSortedTasks is not an array:', filteredAndSortedTasks);
      return { 'All Tasks': [] };
    }

    console.log('filteredAndSortedTasks length in groupedTasks:', filteredAndSortedTasks.length);

    if (groupBy === 'none') {
      console.log('Using "none" grouping, task count:', filteredAndSortedTasks.length);
      return { 'All Tasks': filteredAndSortedTasks };
    }

    const groups = filteredAndSortedTasks.reduce((groups: Record<string, TaskType[]>, task) => {
      // Skip if task is null or undefined
      if (!task) return groups;
      
      let groupKey = '';
      switch (groupBy) {
        case 'category':
          groupKey = task.categories?.[0]?.name || 'Uncategorized';
          break;
        case 'priority':
          groupKey = priorityToLabel(task.priority);
          break;
        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'No Due Date';
          } else {
            const date = new Date(task.dueDate);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            if (date < new Date(today.setHours(0, 0, 0, 0))) groupKey = 'Overdue';
            else if (date.toDateString() === today.toDateString()) groupKey = 'Today';
            else if (date.toDateString() === tomorrow.toDateString()) groupKey = 'Tomorrow';
            else groupKey = formatDate(date, DATE_FORMATS.DISPLAY_MEDIUM);
          }
          break;
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
      return groups;
    }, {});

    console.log('Task groups created:', Object.keys(groups));
    console.log('Tasks per group:', Object.keys(groups).map(key => `${key}: ${groups[key].length}`));
    
    return groups;
  }, [filteredAndSortedTasks, groupBy]);

  // Filter tasks based on crisis mode
  const crisisModeTasks = useMemo(() => {
    // Ensure filteredAndSortedTasks is an array
    if (!Array.isArray(filteredAndSortedTasks)) {
      return [];
    }

    if (!isCrisisMode) return filteredAndSortedTasks;

    return filteredAndSortedTasks.filter(task => 
      priorityToNumber(task.priority) >= 3 || // High or Urgent priority
      (task.dueDate && new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000) // Due within 24 hours
    );
  }, [filteredAndSortedTasks, isCrisisMode]);

  // Memoize handlers to prevent recreating functions on every render
  const handleComplete = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const now = new Date();
      // No need to refetch all tasks after completion - the store handles the update
      await updateTask(taskId, { 
        completedAt: task.completedAt ? null : now
      });
    }
  }, [tasks, updateTask]);

  const handleUpdate = useCallback(async (taskId: string, data: Partial<TaskType>) => {
    // No need to refetch all tasks after update - the store handles the update
    await updateTask(taskId, data);
  }, [updateTask]);

  const handleDelete = useCallback(async (taskId: string) => {
    try {
      // No need to refetch all tasks after deletion - the store handles the deletion
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }, [deleteTask]);

  // Get task suggestions based on current mood
  const getTaskSuggestions = useCallback(() => {
    if (!currentMood) return null;

    switch (currentMood) {
      case 'overwhelmed':
        return "Try focusing on small, quick tasks to build momentum.";
      case 'anxious':
        return "Consider tackling some low-pressure, routine tasks.";
      case 'focused':
        return "Great time to work on high-priority or complex tasks!";
      case 'tired':
        return "Start with easy tasks or take a short break.";
      case 'motivated':
        return "Perfect time to tackle challenging tasks!";
      default:
        return null;
    }
  }, [currentMood]);

  const renderTask = useCallback((task: TaskType) => (
    <MemoizedTaskCard
      key={task.id}
      task={task}
      onComplete={handleComplete}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onEdit={(task) => {
        setTaskToEdit(task);
        setIsEditTaskOpen(true);
      }}
    />
  ), [handleComplete, handleDelete, handleUpdate]);

  return (
    <ErrorBoundary onReset={fetchTasks}>
      <div className="space-y-6">
        {/* Mood Tracker and Crisis Mode */}
        <div className="bg-white dark:bg-gray-800 p-5 mt-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <EmotionTracker 
              currentMood={currentMood} 
              onMoodChange={setCurrentMood}
            />
            
            <button
              type="button"
              onClick={() => {
                // Handle crisis mode activation
                alert('Crisis mode activated - in a real app, this would activate focus mode and filter for urgent tasks');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 transition-colors"
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              Enter Crisis Mode
            </button>
          </div>
          
          {/* Mood-based Suggestions */}
          {currentMood && (
            <div className="mt-4">
              <MoodSuggestions mood={currentMood} />
            </div>
          )}
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-500 bg-white dark:bg-gray-800"
              data-testid="search-input"
            />
          </div>
          
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 text-sm ${
                filter === 'all' 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-2 text-sm border-l border-r border-gray-300 dark:border-gray-700 ${
                filter === 'active' 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-2 text-sm ${
                filter === 'completed' 
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              Completed
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg border ${
                showFilters ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Show filters"
            >
              <FunnelIcon className="h-5 w-5" />
            </button>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 flex items-center ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="List view"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-2 flex items-center border-l border-r border-gray-300 dark:border-gray-700 ${
                  viewMode === 'board' 
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Board view"
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 flex items-center ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title="Calendar View"
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="form-select w-full"
                >
                  <option value="created">Created Date</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupOption)}
                  className="form-select w-full"
                >
                  <option value="none">No Grouping</option>
                  <option value="category">Category</option>
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Render the EditTaskForm when isEditTaskOpen is true */}
        <Transition show={isEditTaskOpen} as={Fragment}>
          <Dialog 
            as="div" 
            className="relative z-[10000]" 
            onClose={() => {
              setIsEditTaskOpen(false);
              setTaskToEdit(null);
            }}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                  <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 dark:border dark:border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                    {taskToEdit && (
                      <EditTaskForm
                        task={taskToEdit}
                        onClose={() => {
                          setIsEditTaskOpen(false);
                          setTaskToEdit(null);
                        }}
                      />
                    )}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Error State */}
        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Error loading tasks
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {isError}
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={fetchTasks}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto animate-spin"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading tasks...</p>
          </div>
        ) : (
          <>
            {/* Tasks Groups */}
            <div className="space-y-6">
              {viewMode === 'list' && (
                Object.entries(isCrisisMode ? { 'Crisis Items': crisisModeTasks } : groupedTasks).map(([group, tasks]) => {
                  console.log(`Rendering group "${group}" with ${tasks.length} tasks`);
                  if (tasks.length > 0) {
                    console.log(`First task in group "${group}":`, tasks[0]);
                  }
                  
                  return (
                    <div key={group} className="mb-6">
                      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">{group}</h2>
                      {tasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.map(task => {
                            console.log(`Rendering task: ${task.id} - ${task.title}`);
                            return renderTask(task);
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {viewMode === 'board' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(isCrisisMode ? { 'Crisis Items': crisisModeTasks } : groupedTasks).map(([group, tasks]) => (
                    <div key={group} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300 flex justify-between items-center">
                        <span>{group}</span>
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{tasks.length}</span>
                      </h2>
                      {tasks.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
                      ) : (
                        <div className="space-y-2">
                          {tasks.map(renderTask)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'calendar' && (
                <TaskCalendarView
                  tasks={filteredAndSortedTasks}
                  onComplete={handleComplete}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onRefresh={refreshTasks}
                />
              )}
            </div>

            {/* Empty State */}
            {(isCrisisMode ? crisisModeTasks : filteredAndSortedTasks).length === 0 && !isError && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {isCrisisMode ? (
                  <>
                    <p>No urgent tasks right now. Take a moment to breathe.</p>
                    <button
                      onClick={() => setIsCrisisMode(false)}
                      className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <ArrowPathIcon className="h-5 w-5 inline mr-1" />
                      View all tasks
                    </button>
                  </>
                ) : searchQuery ? (
                  'No tasks found matching your search.'
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">You don&apos;t have any tasks yet.</p>
                    <button
                      className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Add your first task
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add this within the sidebar area of the TaskList component */}
            <div className="mt-6">
              <AiTaskAssistant 
                tasks={tasks}
                selectedTask={selectedTask}
                historicalTasks={historicalTasks}
                categories={categories}
                onBreakdownApply={(subtasks) => {
                  if (selectedTask) {
                    // Create subtasks for the selected task
                    subtasks.forEach(subtask => {
                      const newTask = {
                        title: subtask.title,
                        description: subtask.description || '',
                        priority: selectedTask.priority,
                        estimatedDuration: subtask.estimatedDuration,
                        parentId: selectedTask.id,
                        goalId: selectedTask.goalId
                      };
                      // Call our fixed createTask function
                      createTask(newTask);
                    });
                    toast.success(`Added ${subtasks.length} subtasks`);
                  }
                }}
                onPriorityApply={(taskIds) => {
                  // Update the tasks order in your UI
                  // This might involve changing the sort order or applying some visual indication
                  toast.success('Task priority order applied');
                }}
                onEstimateApply={(estimatedDuration) => {
                  if (selectedTask) {
                    // Update the selected task with the new duration estimate
                    updateTask(selectedTask.id, { 
                      estimatedDuration 
                    });
                    toast.success('Duration estimate applied');
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
} 