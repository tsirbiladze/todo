import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FocusMode } from '@/components/FocusMode';
import { useStore } from '@/lib/store';

// Mock the Zustand store
jest.mock('@/lib/store', () => ({
  useStore: jest.fn(),
}));

// Mock PomodoroTimer component
jest.mock('@/components/PomodoroTimer', () => ({
  PomodoroTimer: () => <div data-testid="pomodoro-timer">Pomodoro Timer</div>,
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('FocusMode Component', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      priority: 'HIGH',
      completedAt: null,
      estimatedDuration: 60,
      dueDate: new Date('2023-12-31'),
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      priority: 'MEDIUM',
      completedAt: null,
      estimatedDuration: 30,
      dueDate: new Date('2023-12-30'),
    },
  ];

  const mockUpdateTask = jest.fn();
  const mockAddFocusSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ focusSession: { id: 'new-session' } }),
      })
    ) as jest.Mock;
    
    // Mock the store implementation
    (useStore as jest.Mock).mockImplementation((selector) => {
      const store = {
        tasks: mockTasks,
        updateTask: mockUpdateTask,
        addFocusSession: mockAddFocusSession,
      };
      return selector(store);
    });
  });

  it('renders focus mode with task selection', () => {
    render(<FocusMode />);
    
    expect(screen.getByText('Focus Mode')).toBeInTheDocument();
    expect(screen.getByText('Select a task to focus on')).toBeInTheDocument();
    
    // Task options should be available
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('selects a task and starts focus session', async () => {
    const user = userEvent.setup();
    render(<FocusMode />);
    
    // Select first task
    await user.click(screen.getByText('Task 1'));
    
    // Task should be selected
    expect(screen.getByTestId('selected-task')).toHaveTextContent('Task 1');
    
    // Start focus session
    await user.click(screen.getByText('Start Focus Session'));
    
    // Should show the pomodoro timer
    expect(screen.getByTestId('pomodoro-timer')).toBeInTheDocument();
    
    // Should create a focus session
    expect(global.fetch).toHaveBeenCalled();
    expect(mockAddFocusSession).toHaveBeenCalled();
  });

  it('marks task as completed after focus session', async () => {
    const user = userEvent.setup();
    render(<FocusMode />);
    
    // Select first task
    await user.click(screen.getByText('Task 1'));
    
    // Start focus session
    await user.click(screen.getByText('Start Focus Session'));
    
    // Complete focus session
    await user.click(screen.getByText('Complete Session'));
    
    // Should mark task as completed
    expect(mockUpdateTask).toHaveBeenCalledWith('1', { 
      completedAt: expect.any(Date),
      actualDuration: expect.any(Number)
    });
    
    // Should show completion UI
    expect(screen.getByText(/session completed/i)).toBeInTheDocument();
  });

  it('shows stats after completing a focus session', async () => {
    const user = userEvent.setup();
    render(<FocusMode />);
    
    // Mock local storage to simulate previous sessions
    localStorageMock.getItem.mockReturnValue(JSON.stringify([
      { date: '2023-12-01', duration: 25, taskId: '1' },
      { date: '2023-12-02', duration: 30, taskId: '2' },
    ]));
    
    // Select first task
    await user.click(screen.getByText('Task 1'));
    
    // Start focus session
    await user.click(screen.getByText('Start Focus Session'));
    
    // Complete focus session
    await user.click(screen.getByText('Complete Session'));
    
    // Should show focus stats
    await waitFor(() => {
      expect(screen.getByText(/focus statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/total focus time/i)).toBeInTheDocument();
    });
  });

  it('handles cancelling a focus session', async () => {
    const user = userEvent.setup();
    render(<FocusMode />);
    
    // Select first task
    await user.click(screen.getByText('Task 1'));
    
    // Start focus session
    await user.click(screen.getByText('Start Focus Session'));
    
    // Cancel focus session
    await user.click(screen.getByText('Cancel Session'));
    
    // Should not mark task as completed
    expect(mockUpdateTask).not.toHaveBeenCalled();
    
    // Should return to task selection
    expect(screen.getByText('Select a task to focus on')).toBeInTheDocument();
  });
}); 