import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Task } from '@/components/Task';
import { useStore } from '@/lib/store';
import { Priority, Emotion } from '@prisma/client';

// Mock the Zustand store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

const mockUpdateTask = jest.fn();
const mockDeleteTask = jest.fn();

describe('Task Component', () => {
  const mockTask = {
    id: '1',
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

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Work',
      color: '#ff0000',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    // Reset mock functions
    mockUpdateTask.mockReset();
    mockDeleteTask.mockReset();
    
    // Mock the store implementation for each test
    (useStore as jest.Mock).mockImplementation((selector) => {
      const store = {
        updateTask: mockUpdateTask,
        deleteTask: mockDeleteTask,
        categories: mockCategories,
      };
      return selector(store);
    });
  });

  it('renders task details correctly', () => {
    render(<Task task={mockTask} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('handles task completion', () => {
    render(<Task task={mockTask} />);
    
    const completeCheckbox = screen.getByRole('checkbox');
    fireEvent.click(completeCheckbox);
    
    expect(mockUpdateTask).toHaveBeenCalledWith(mockTask.id, {
      completedAt: expect.any(Date),
    });
  });

  it('handles task deletion', () => {
    render(<Task task={mockTask} />);
    
    // Open the task menu to show delete button
    const menuButton = screen.getByLabelText('Task menu');
    fireEvent.click(menuButton);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(mockDeleteTask).toHaveBeenCalledWith(mockTask.id);
  });

  it('renders completed task with strikethrough', () => {
    const completedTask = {
      ...mockTask,
      completedAt: new Date(),
    };
    
    render(<Task task={completedTask} />);
    
    // Check for strikethrough style or completed class
    const taskTitle = screen.getByText('Test Task');
    expect(taskTitle.closest('.completed')).toBeInTheDocument();
  });
}); 