import { useStore } from '@/lib/store';
import { act } from '@testing-library/react';
import { Priority, Emotion } from '@prisma/client';

// Mock API calls 
jest.mock('@/lib/api', () => ({
  TaskApi: {
    updateTask: jest.fn().mockResolvedValue({}),
    deleteTask: jest.fn().mockResolvedValue({}),
    createTask: jest.fn().mockResolvedValue({
      id: 'new-task',
      title: 'New Task',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  CategoryApi: {
    updateCategory: jest.fn().mockResolvedValue({}),
    deleteCategory: jest.fn().mockResolvedValue({}),
    createCategory: jest.fn().mockResolvedValue({
      id: 'new-category',
      name: 'New Category',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  FocusSessionApi: {
    createSession: jest.fn().mockResolvedValue({}),
    updateSession: jest.fn().mockResolvedValue({}),
    endSession: jest.fn().mockResolvedValue({}),
  },
}));

describe('Todo Store', () => {
  // Reset the store before each test
  beforeEach(() => {
    // Clear all tasks and categories
    act(() => {
      useStore.setState({
        tasks: [],
        categories: [],
        projects: [],
        goals: [],
        selectedTaskIds: [],
        focusSessions: [],
        currentFocusSession: null,
      });
    });
  });

  describe('Task Actions', () => {
    it('adds a task correctly', () => {
      const newTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'HIGH' as Priority,
        emotion: 'CONFIDENT' as Emotion,
        dueDate: new Date('2023-12-31'),
        completedAt: null,
        estimatedDuration: 60,
        actualDuration: null,
        userId: 'user1',
        goalId: null,
        parentId: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      act(() => {
        useStore.getState().addTask(newTask);
      });

      // Check if the task was added
      const tasks = useStore.getState().tasks;
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('task1');
      expect(tasks[0].title).toBe('Test Task');
    });

    it('updates a task correctly', async () => {
      // Add a task first
      const task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'HIGH' as Priority,
        emotion: 'CONFIDENT' as Emotion,
        dueDate: new Date('2023-12-31'),
        completedAt: null,
        estimatedDuration: 60,
        actualDuration: null,
        userId: 'user1',
        goalId: null,
        parentId: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      act(() => {
        useStore.getState().addTask(task);
      });

      // Update the task
      await act(async () => {
        await useStore.getState().updateTask('task1', { title: 'Updated Task' });
      });

      // Check if the task was updated
      const tasks = useStore.getState().tasks;
      expect(tasks[0].title).toBe('Updated Task');
    });

    it('deletes a task correctly', async () => {
      // Add a task first
      const task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'HIGH' as Priority,
        emotion: 'CONFIDENT' as Emotion,
        dueDate: new Date('2023-12-31'),
        completedAt: null,
        estimatedDuration: 60,
        actualDuration: null,
        userId: 'user1',
        goalId: null,
        parentId: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      act(() => {
        useStore.getState().addTask(task);
      });

      // Delete the task
      await act(async () => {
        await useStore.getState().deleteTask('task1');
      });

      // Check if the task was deleted
      const tasks = useStore.getState().tasks;
      expect(tasks.length).toBe(0);
    });

    it('toggles task selection correctly', () => {
      // Add a task first
      const task = {
        id: 'task1',
        title: 'Test Task',
        description: 'Test Description',
        priority: 'HIGH' as Priority,
        emotion: 'CONFIDENT' as Emotion,
        dueDate: new Date('2023-12-31'),
        completedAt: null,
        estimatedDuration: 60,
        actualDuration: null,
        userId: 'user1',
        goalId: null,
        parentId: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      act(() => {
        useStore.getState().addTask(task);
      });

      // Toggle task selection
      act(() => {
        useStore.getState().toggleTaskSelection('task1');
      });

      // Check if the task is selected
      expect(useStore.getState().selectedTaskIds).toContain('task1');

      // Toggle again to deselect
      act(() => {
        useStore.getState().toggleTaskSelection('task1');
      });

      // Check if the task is deselected
      expect(useStore.getState().selectedTaskIds).not.toContain('task1');
    });
  });

  describe('Category Actions', () => {
    it('adds a category correctly', () => {
      const newCategory = {
        id: 'cat1',
        name: 'Work',
        color: '#ff0000',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        useStore.getState().addCategory(newCategory);
      });

      // Check if the category was added
      const categories = useStore.getState().categories;
      expect(categories.length).toBe(1);
      expect(categories[0].id).toBe('cat1');
      expect(categories[0].name).toBe('Work');
    });

    it('updates a category correctly', async () => {
      // Add a category first
      const category = {
        id: 'cat1',
        name: 'Work',
        color: '#ff0000',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        useStore.getState().addCategory(category);
      });

      // Update the category
      await act(async () => {
        await useStore.getState().updateCategory('cat1', { name: 'Updated Category' });
      });

      // Check if the category was updated
      const categories = useStore.getState().categories;
      expect(categories[0].name).toBe('Updated Category');
    });

    it('deletes a category correctly', async () => {
      // Add a category first
      const category = {
        id: 'cat1',
        name: 'Work',
        color: '#ff0000',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        useStore.getState().addCategory(category);
      });

      // Delete the category
      await act(async () => {
        await useStore.getState().deleteCategory('cat1');
      });

      // Check if the category was deleted
      const categories = useStore.getState().categories;
      expect(categories.length).toBe(0);
    });
  });

  describe('Focus Mode Actions', () => {
    it('toggles focus mode correctly', () => {
      // Initially focus mode should be false
      expect(useStore.getState().focusMode).toBe(false);

      // Toggle focus mode on
      act(() => {
        useStore.getState().toggleFocusMode();
      });

      // Should be true now
      expect(useStore.getState().focusMode).toBe(true);

      // Toggle focus mode off
      act(() => {
        useStore.getState().toggleFocusMode();
      });

      // Should be false again
      expect(useStore.getState().focusMode).toBe(false);
    });

    it('starts a focus session correctly', () => {
      const sessionData = {
        id: 'session1',
        startTime: new Date(),
        taskId: 'task1',
        userId: 'user1',
        pomodoroCount: 0,
        isActive: true,
      };

      act(() => {
        useStore.getState().startFocusSession(sessionData);
      });

      // Current focus session should be set
      const currentSession = useStore.getState().currentFocusSession;
      expect(currentSession).not.toBeNull();
      expect(currentSession!.id).toBe('session1');
      expect(currentSession!.isActive).toBe(true);
    });
  });

  describe('Preference Actions', () => {
    it('updates preferences correctly', () => {
      // Get the initial preferences
      const initialPreferences = useStore.getState().preferences;

      // Update the theme preference
      act(() => {
        useStore.getState().updatePreferences({ theme: 'dark' });
      });

      // Check if the preference was updated
      const updatedPreferences = useStore.getState().preferences;
      expect(updatedPreferences.theme).toBe('dark');

      // Other preferences should remain unchanged
      expect(updatedPreferences.sidebarCollapsed).toBe(initialPreferences.sidebarCollapsed);
    });

    it('updates accessibility preferences correctly', () => {
      // Update high contrast mode
      act(() => {
        useStore.getState().toggleHighContrast();
      });

      // Check if high contrast mode is enabled
      expect(useStore.getState().preferences.accessibility.highContrast).toBe(true);

      // Update large text mode
      act(() => {
        useStore.getState().toggleLargeText();
      });

      // Check if large text mode is enabled
      expect(useStore.getState().preferences.accessibility.largeText).toBe(true);
    });
  });
}); 