import { create } from 'zustand';
import { Task, Category, Project, Goal, FocusSession } from '@prisma/client';
import { persist } from 'zustand/middleware';
import { TaskApi, CategoryApi, FocusSessionApi } from './api';

interface TaskWithRelations extends Task {
  categories?: Category[];
  subTasks?: TaskWithRelations[];
  goal?: Goal;
}

interface KeyboardShortcut {
  key: string;
  description: string;
  modifier?: 'alt' | 'ctrl' | 'shift' | 'meta';
  action: () => void;
}

interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardMode: boolean;
  screenReaderOptimized: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  taskViewMode: 'list' | 'board' | 'calendar';
  defaultTaskTemplate: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  focusModeSettings: {
    pomodoroLength: number;
    shortBreakLength: number;
    longBreakLength: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    ambientSoundVolume: number;
    selectedAmbientSound: string | null;
  };
  accessibility: AccessibilityPreferences;
  keyboardShortcuts: {
    enabled: boolean;
    customShortcuts: Record<string, KeyboardShortcut>;
  };
}

interface TaskFilters {
  status: 'all' | 'active' | 'completed';
  priority: number | null;
  categories: string[];
  search: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface TaskSort {
  field: 'created' | 'dueDate' | 'priority' | 'title';
  direction: 'asc' | 'desc';
}

interface TodoStore {
  // Task Management
  tasks: TaskWithRelations[];
  categories: Category[];
  projects: Project[];
  goals: Goal[];
  selectedTaskIds: string[];
  taskFilters: TaskFilters;
  taskSort: TaskSort;
  taskGroup: 'none' | 'category' | 'priority' | 'dueDate';

  // Focus Mode
  focusMode: boolean;
  currentFocusSession: FocusSession | null;
  focusSessions: FocusSession[];
  
  // User Preferences
  preferences: UserPreferences;

  // Task Actions
  setTasks: (tasks: TaskWithRelations[]) => void;
  addTask: (task: TaskWithRelations) => void;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  duplicateTask: (taskId: string) => Promise<void>;
  convertToSubtask: (taskId: string, parentId: string) => Promise<void>;
  toggleTaskSelection: (taskId: string) => void;
  clearTaskSelection: () => void;
  bulkUpdateTasks: (taskIds: string[], data: Partial<Task>) => Promise<void>;
  reorderTasks: (taskId: string, newIndex: number) => void;
  moveTask: (taskId: string, destinationId: string | null, position: 'before' | 'after' | 'inside') => Promise<void>;

  // Category Actions
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (categoryId: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Project & Goal Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;

  // Focus Mode Actions
  toggleFocusMode: () => void;
  startFocusSession: (sessionData: Partial<FocusSession>) => void;
  endFocusSession: (sessionId: string) => void;
  updateFocusSession: (sessionId: string, data: Partial<FocusSession>) => void;

  // Filter & Sort Actions
  setTaskFilters: (filters: Partial<TaskFilters>) => void;
  setTaskSort: (sort: TaskSort) => void;
  setTaskGroup: (group: TodoStore['taskGroup']) => void;

  // Preference Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Accessibility Actions
  updateAccessibilityPreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleLargeText: () => void;
  toggleKeyboardMode: () => void;
  toggleScreenReaderMode: () => void;

  // Keyboard Shortcuts
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  removeShortcut: (key: string) => void;
  toggleKeyboardShortcuts: () => void;

  // Pagination
  page: number;
  itemsPerPage: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  taskViewMode: 'list',
  defaultTaskTemplate: 0,
  notificationsEnabled: true,
  soundEnabled: true,
  focusModeSettings: {
    pomodoroLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    ambientSoundVolume: 0.5,
    selectedAmbientSound: null,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    keyboardMode: false,
    screenReaderOptimized: false,
  },
  keyboardShortcuts: {
    enabled: true,
    customShortcuts: {
      'q': {
        key: 'q',
        modifier: 'alt',
        description: 'Quick capture new task',
        action: () => {},
      },
      'f': {
        key: 'f',
        modifier: 'alt',
        description: 'Toggle focus mode',
        action: () => {},
      },
      'c': {
        key: 'c',
        modifier: 'alt',
        description: 'Toggle crisis mode',
        action: () => {},
      },
      '/': {
        key: '/',
        description: 'Focus search',
        action: () => {},
      },
      'escape': {
        key: 'escape',
        description: 'Clear selection/Close modal',
        action: () => {},
      },
    },
  },
};

export const useStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      // Initial State
      tasks: [] as TaskWithRelations[],
      categories: [] as Category[],
      projects: [] as Project[],
      goals: [] as Goal[],
      selectedTaskIds: [] as string[],
      taskFilters: {
        status: 'all',
        priority: null,
        categories: [],
        search: '',
        dateRange: { start: null, end: null },
      },
      taskSort: {
        field: 'created',
        direction: 'desc',
      },
      taskGroup: 'none',
      focusMode: false,
      currentFocusSession: null,
      focusSessions: [],
      preferences: defaultPreferences,
      page: 1,
      itemsPerPage: 10,
      searchQuery: '',

      // Task Actions
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [...(state.tasks || []), task] })),
      updateTask: async (taskId, data) => {
        // Store the original task for potential rollback
        const originalTasks = get().tasks;
        const originalTask = originalTasks.find(task => task.id === taskId);
        
        if (!originalTask) {
          console.error(`Task with id ${taskId} not found`);
          return Promise.reject(new Error(`Task with id ${taskId} not found`));
        }
        
        // Optimistic update - update UI immediately
        set((state) => ({
          tasks: (state.tasks || []).map((task) =>
            task.id === taskId ? { ...task, ...data } : task
          ),
        }));
        
        // Then update the database
        try {
          const response = await TaskApi.updateTask(taskId, data);
          
          if (response.error) {
            // If server update fails, rollback to the original state
            set({ tasks: originalTasks });
            
            // Display user feedback (could be connected to a UI toast system)
            if (typeof window !== 'undefined') {
              // This could be replaced with your toast/notification system
              console.error(response.error);
              // Example: toast.error(errorMessage);
            }
            
            return Promise.reject(new Error(response.error));
          }
          
          // If we get here, update was successful
          if (response.data?.task) {
            // Update local state with the server response to ensure consistency
            set((state) => ({
              tasks: (state.tasks || []).map((task) =>
                task.id === taskId ? { ...task, ...response.data.task } : task
              ),
            }));
            
            // Optional: Show success feedback
            // toast.success('Task updated successfully');
            
            return Promise.resolve(response.data.task);
          }
        } catch (error) {
          // If network error, rollback to the original state
          set({ tasks: originalTasks });
          
          const errorMessage = error instanceof Error 
            ? `Error updating task: ${error.message}` 
            : 'Unknown error updating task';
          
          console.error(errorMessage);
          
          // Display user feedback (could be connected to a UI toast system)
          if (typeof window !== 'undefined') {
            // Example: toast.error(errorMessage);
          }
          
          return Promise.reject(error);
        }
      },
      deleteTask: async (taskId) => {
        // Store original state for potential rollback
        const originalTasks = get().tasks;
        
        try {
          // Optimistically update the UI first
          set((state) => ({
            tasks: (state.tasks || []).filter((task) => task.id !== taskId),
          }));
          
          // Then call the API to persist the change
          const response = await TaskApi.deleteTask(taskId);
          
          if (response.error) {
            // Rollback to original state
            set({ tasks: originalTasks });
            throw new Error(response.error);
          }
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error deleting task:', error);
          
          // Rollback the optimistic update if the API call failed
          set({ tasks: originalTasks });
          
          return Promise.reject(error);
        }
      },
      duplicateTask: async (taskId) => {
        const state = get();
        const task = (state.tasks || []).find((t) => t.id === taskId);
        if (!task) return;

        try {
          const taskData = {
            ...task,
            id: undefined,
            title: `${task.title} (Copy)`,
            completed: false,
            completedAt: null,
            createdAt: undefined,
            updatedAt: undefined,
          };
          
          const response = await TaskApi.createTask(taskData);

          if (response.error) {
            throw new Error(response.error);
          }

          if (response.data?.task) {
            set((state) => ({ tasks: [...(state.tasks || []), response.data.task] }));
            return Promise.resolve(response.data.task);
          }
        } catch (error) {
          console.error('Error duplicating task:', error);
          return Promise.reject(error);
        }
      },
      convertToSubtask: async (taskId, parentId) => {
        const state = get();
        const task = (state.tasks || []).find((t) => t.id === taskId);
        if (!task) return;
        
        // Store original state for potential rollback
        const originalTasks = get().tasks;

        try {
          // Optimistic update
          set((state) => ({
            tasks: (state.tasks || []).map((t) =>
              t.id === taskId ? { ...t, parentId } : t
            ),
          }));
          
          const response = await TaskApi.updateTask(taskId, { parentTaskId: parentId });

          if (response.error) {
            // Rollback if there's an error
            set({ tasks: originalTasks });
            throw new Error(response.error);
          }

          if (response.data?.task) {
            set((state) => ({
              tasks: (state.tasks || []).map((t) =>
                t.id === taskId ? response.data.task : t
              ),
            }));
            return Promise.resolve(response.data.task);
          }
        } catch (error) {
          // Rollback to original state
          set({ tasks: originalTasks });
          console.error('Error converting task to subtask:', error);
          return Promise.reject(error);
        }
      },
      reorderTasks: (taskId, newIndex) =>
        set((state) => {
          const tasks = [...(state.tasks || [])];
          const oldIndex = tasks.findIndex((task) => task.id === taskId);
          const [task] = tasks.splice(oldIndex, 1);
          tasks.splice(newIndex, 0, task);
          return { tasks };
        }),
      moveTask: async (_taskId: string, _destinationId: string | null, _position: 'before' | 'after' | 'inside') => {
        console.log('Task movement not yet implemented');
        // Implementation would go here in a production app
      },
      toggleTaskSelection: (taskId) =>
        set((state) => ({
          selectedTaskIds: state.selectedTaskIds.includes(taskId)
            ? state.selectedTaskIds.filter((id) => id !== taskId)
            : [...state.selectedTaskIds, taskId],
        })),
      clearTaskSelection: () => set({ selectedTaskIds: [] }),
      bulkUpdateTasks: async (taskIds, data) => {
        // Store original tasks for potential rollback
        const originalTasks = get().tasks;
        
        // Optimistically update UI immediately
        set((state) => ({
          tasks: state.tasks.map((task) =>
            taskIds.includes(task.id) ? { ...task, ...data } : task
          ),
        }));
        
        // Update each task on the server
        try {
          // Process tasks in parallel with Promise.all
          const results = await Promise.all(
            taskIds.map(async (taskId) => {
              const response = await TaskApi.updateTask(taskId, data);
              
              if (response.error) {
                throw new Error(`Failed to update task ${taskId}: ${response.error}`);
              }
              
              return response.data;
            })
          );
          
          // Success - could show a notification here
          // toast.success(`${taskIds.length} tasks updated successfully`);
          return Promise.resolve(results);
          
        } catch (error) {
          // If any update fails, rollback to original state
          set({ tasks: originalTasks });
          
          const errorMessage = error instanceof Error 
            ? `Error updating tasks: ${error.message}` 
            : 'Unknown error updating tasks';
          
          console.error(errorMessage);
          
          // Display user feedback (could be connected to a UI toast system)
          if (typeof window !== 'undefined') {
            // Example: toast.error(errorMessage);
          }
          
          return Promise.reject(error);
        }
      },

      // Filter & Sort Actions
      setTaskFilters: (filters) =>
        set((state) => ({
          taskFilters: { ...state.taskFilters, ...filters },
          page: 1, // Reset pagination when filters change
        })),
      setTaskSort: (sort) => set({ taskSort: sort, page: 1 }),
      setTaskGroup: (group) => set({ taskGroup: group }),
      setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
      setPage: (page: number) => {
        set(() => ({
          page,
        }));
      },

      // Focus Mode Actions
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      startFocusSession: (sessionData) =>
        set((state) => ({
          currentFocusSession: {
            id: Date.now().toString(),
            startTime: new Date(),
            ...sessionData,
          } as FocusSession,
        })),
      endFocusSession: (_sessionId: string) => {
        set((state) => ({
          ...state,
          currentFocusSession: null,
        }));
      },
      updateFocusSession: (sessionId, data) =>
        set((state) => ({
          currentFocusSession: state.currentFocusSession?.id === sessionId
            ? { ...state.currentFocusSession, ...data }
            : state.currentFocusSession,
        })),

      // Preference Actions
      updatePreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        })),

      // Category Actions
      setCategories: (categories) => set({ categories }),
      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: async (categoryId, data) => {
        // Store original state for potential rollback
        const originalCategories = get().categories;
        
        // Optimistically update the UI
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === categoryId ? { ...category, ...data } : category
          ),
        }));
        
        try {
          // Call the API
          const response = await CategoryApi.updateCategory(categoryId, data);
          
          if (response.error) {
            // Rollback if error
            set({ categories: originalCategories });
            throw new Error(response.error);
          }
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error updating category:', error);
          // Rollback the optimistic update
          set({ categories: originalCategories });
          return Promise.reject(error);
        }
      },
      deleteCategory: async (categoryId) => {
        // Store original state for potential rollback
        const originalCategories = get().categories;
        const originalTasks = get().tasks;
        const originalFilters = get().taskFilters;
        
        // Optimistically update UI
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== categoryId),
          // Also remove the category from any tasks that have it
          tasks: state.tasks.map((task) => {
            if (task.categories?.some((cat) => cat.id === categoryId)) {
              return {
                ...task,
                categories: task.categories.filter((cat) => cat.id !== categoryId),
              };
            }
            return task;
          }),
          // Remove the category from task filters if it's there
          taskFilters: {
            ...state.taskFilters,
            categories: state.taskFilters.categories.filter((id) => id !== categoryId),
          },
        }));
        
        try {
          // Call the API
          const response = await CategoryApi.deleteCategory(categoryId);
          
          if (response.error) {
            // Rollback if error
            set({ 
              categories: originalCategories,
              tasks: originalTasks,
              taskFilters: originalFilters 
            });
            throw new Error(response.error);
          }
          
          return Promise.resolve();
        } catch (error) {
          console.error('Error deleting category:', error);
          // Rollback the optimistic update
          set({ 
            categories: originalCategories,
            tasks: originalTasks,
            taskFilters: originalFilters 
          });
          return Promise.reject(error);
        }
      },

      // Accessibility Actions
      updateAccessibilityPreferences: (prefs) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: {
              ...state.preferences.accessibility,
              ...prefs,
            },
          },
        })),

      toggleHighContrast: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: {
              ...state.preferences.accessibility,
              highContrast: !state.preferences.accessibility.highContrast,
            },
          },
        })),

      toggleReducedMotion: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: {
              ...state.preferences.accessibility,
              reducedMotion: !state.preferences.accessibility.reducedMotion,
            },
          },
        })),

      toggleLargeText: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: {
              ...state.preferences.accessibility,
              largeText: !state.preferences.accessibility.largeText,
            },
          },
        })),

      toggleKeyboardMode: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: {
              ...state.preferences.accessibility,
              keyboardMode: !state.preferences.accessibility.keyboardMode,
            },
          },
        })),

      toggleScreenReaderMode: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            accessibility: {
              ...state.preferences.accessibility,
              screenReaderOptimized: !state.preferences.accessibility.screenReaderOptimized,
            },
          },
        })),

      // Keyboard Shortcuts
      registerShortcut: (shortcut) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            keyboardShortcuts: {
              ...state.preferences.keyboardShortcuts,
              customShortcuts: {
                ...state.preferences.keyboardShortcuts.customShortcuts,
                [shortcut.key]: shortcut,
              },
            },
          },
        })),

      removeShortcut: (key) =>
        set((state) => {
          const { [key]: _, ...remainingShortcuts } =
            state.preferences.keyboardShortcuts.customShortcuts;
          return {
            preferences: {
              ...state.preferences,
              keyboardShortcuts: {
                ...state.preferences.keyboardShortcuts,
                customShortcuts: remainingShortcuts,
              },
            },
          };
        }),

      toggleKeyboardShortcuts: () =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            keyboardShortcuts: {
              ...state.preferences.keyboardShortcuts,
              enabled: !state.preferences.keyboardShortcuts.enabled,
            },
          },
        })),
    }),
    {
      name: 'todo-storage',
      partialize: (state) => ({
        tasks: state.tasks,
        preferences: state.preferences,
        taskFilters: state.taskFilters,
        taskSort: state.taskSort,
        taskGroup: state.taskGroup,
      }),
    }
  )
); 