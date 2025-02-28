import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskList } from '@/components/TaskList';
import { useStore } from '@/lib/store';
import { Priority, Emotion } from '@prisma/client';

// Mock the Zustand store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { 
      user: { 
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com' 
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
    },
    status: 'authenticated',
  })),
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock the api module
jest.mock('@/lib/api', () => ({
  fetchWithAuth: jest.fn().mockImplementation((url) => {
    if (url === '/api/tasks') {
      return Promise.resolve({
        data: [
          {
            id: 'task1',
            title: 'Task 1',
            description: 'Description for task 1',
            priority: 'HIGH',
            dueDate: new Date().toISOString(),
            estimatedDuration: 60,
            emotion: 'CONFIDENT',
            status: 'TODO',
            userId: 'user1',
            categories: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'task2',
            title: 'Task 2',
            description: 'Description for task 2',
            priority: 'MEDIUM',
            dueDate: new Date().toISOString(),
            estimatedDuration: 30,
            emotion: 'NEUTRAL',
            status: 'TODO',
            userId: 'user1',
            categories: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        error: null,
      });
    }
    
    return Promise.resolve({ data: null, error: 'Not found' });
  }),
}));

// Mock the child components
jest.mock('@/components/TaskCard', () => ({
  TaskCard: ({ task }: any) => (
    <div data-testid={`task-card-${task.id}`}>{task.title}</div>
  ),
}));

jest.mock('@/components/TaskSearch', () => ({
  TaskSearch: ({ onSearch }: any) => (
    <input 
      data-testid="search-input" 
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search tasks"
    />
  ),
}));

jest.mock('@/components/TaskCalendarView', () => ({
  TaskCalendarView: () => <div data-testid="calendar-view">Calendar View</div>,
}));

describe('TaskList Component', () => {
  const mockTasks = [
    {
      id: 'task1',
      title: 'Task 1',
      description: 'Description for task 1',
      priority: 'HIGH',
      dueDate: new Date(),
      estimatedDuration: 60,
      emotion: 'CONFIDENT',
      status: 'TODO',
      userId: 'user1',
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'task2',
      title: 'Task 2',
      description: 'Description for task 2',
      priority: 'MEDIUM',
      dueDate: new Date(),
      estimatedDuration: 30,
      emotion: 'NEUTRAL',
      status: 'TODO',
      userId: 'user1',
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Work',
      color: '#ff0000',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'cat2',
      name: 'Personal',
      color: '#00ff00',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockSetTasks = jest.fn();
  const mockUpdateTask = jest.fn();
  const mockDeleteTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the store implementation
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const store = {
        tasks: mockTasks,
        setTasks: mockSetTasks,
        categories: mockCategories,
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
      };
      return selector(store);
    });
  });

  it('renders task list and fetches tasks on mount', async () => {
    const { fetchWithAuth } = require('@/lib/api');
    
    render(<TaskList />);
    
    // Verify that the loading state is shown
    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    
    // Wait for the tasks to load
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/tasks');
      expect(mockSetTasks).toHaveBeenCalled();
    });
  });

  it('renders empty state when no tasks are available', async () => {
    // Mock empty tasks
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const store = {
        tasks: [],
        setTasks: mockSetTasks,
        categories: mockCategories,
      };
      return selector(store);
    });
    
    const { fetchWithAuth } = require('@/lib/api');
    fetchWithAuth.mockResolvedValueOnce({ data: [], error: null });
    
    render(<TaskList />);
    
    // Wait for the tasks to load
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/tasks');
    });
    
    // Expect empty state message
    expect(screen.getByText(/No tasks found/i)).toBeInTheDocument();
  });

  it('renders error state when fetching tasks fails', async () => {
    const { fetchWithAuth } = require('@/lib/api');
    fetchWithAuth.mockResolvedValueOnce({ data: null, error: 'Failed to fetch tasks' });
    
    render(<TaskList />);
    
    // Wait for the error to show
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/tasks');
    });
    
    // Expect error message
    expect(screen.getByText(/Failed to fetch tasks/i)).toBeInTheDocument();
  });

  it('filters tasks based on search query', async () => {
    render(<TaskList />);
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Task 1' } });
    
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });
  });

  it('changes view mode correctly', async () => {
    render(<TaskList />);
    
    // Default should be list view
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Find and click the calendar view button
    const calendarViewButton = screen.getByTitle('Calendar View');
    fireEvent.click(calendarViewButton);
    
    // Should show calendar view
    await waitFor(() => {
      expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    });
  });

  it('filters tasks by completion status', async () => {
    render(<TaskList />);
    
    // Default should show all tasks
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
    
    // Click the Completed filter
    const completedFilter = screen.getByText('Completed');
    fireEvent.click(completedFilter);
    
    // Should only show Task 2 (which is completed)
    await waitFor(() => {
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
    
    // Click the Active filter
    const activeFilter = screen.getByText('Active');
    fireEvent.click(activeFilter);
    
    // Should only show Task 1 (which is active)
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });
  });
}); 