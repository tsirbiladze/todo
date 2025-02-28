import { useEffect } from 'react';
import { useStore } from './store';

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  group: 'general' | 'tasks' | 'navigation' | 'focus';
}

export const useKeyboardShortcuts = () => {
  const {
    preferences,
    toggleFocusMode,
    setTaskFilters,
    setTaskSort,
    setTaskGroup,
    selectedTaskIds,
    tasks,
    duplicateTask,
    deleteTask,
    bulkUpdateTasks,
  } = useStore();

  const shortcuts: Shortcut[] = [
    // General
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        // TODO: Implement shortcuts modal
      },
      group: 'general',
    },
    {
      key: 'f',
      description: 'Toggle focus mode',
      action: toggleFocusMode,
      group: 'general',
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        document.querySelector<HTMLInputElement>('#search-input')?.focus();
      },
      group: 'general',
    },

    // Tasks
    {
      key: 'n',
      description: 'New task',
      action: () => {
        document.querySelector<HTMLElement>('#new-task-button')?.click();
      },
      group: 'tasks',
    },
    {
      key: 'd',
      description: 'Duplicate selected task(s)',
      action: () => {
        selectedTaskIds.forEach(duplicateTask);
      },
      group: 'tasks',
    },
    {
      key: 'Backspace',
      description: 'Delete selected task(s)',
      action: () => {
        if (confirm('Are you sure you want to delete the selected task(s)?')) {
          selectedTaskIds.forEach(deleteTask);
        }
      },
      group: 'tasks',
    },
    {
      key: 'e',
      description: 'Edit selected task',
      action: () => {
        if (selectedTaskIds.length === 1) {
          document.querySelector<HTMLElement>(`#edit-task-${selectedTaskIds[0]}`)?.click();
        }
      },
      group: 'tasks',
    },
    {
      key: 'space',
      description: 'Toggle selected task(s) completion',
      action: async () => {
        const firstTask = tasks.find(t => t.id === selectedTaskIds[0]);
        if (firstTask) {
          try {
            await bulkUpdateTasks(selectedTaskIds, { completed: !firstTask.completed });
          } catch (error) {
            console.error('Error toggling task completion:', error);
            // Could show a notification here
          }
        }
      },
      group: 'tasks',
    },

    // Navigation
    {
      key: '1',
      description: 'Show all tasks',
      action: () => setTaskFilters({ status: 'all' }),
      group: 'navigation',
    },
    {
      key: '2',
      description: 'Show active tasks',
      action: () => setTaskFilters({ status: 'active' }),
      group: 'navigation',
    },
    {
      key: '3',
      description: 'Show completed tasks',
      action: () => setTaskFilters({ status: 'completed' }),
      group: 'navigation',
    },
    {
      key: 'g c',
      description: 'Group by category',
      action: () => setTaskGroup('category'),
      group: 'navigation',
    },
    {
      key: 'g p',
      description: 'Group by priority',
      action: () => setTaskGroup('priority'),
      group: 'navigation',
    },
    {
      key: 'g d',
      description: 'Group by due date',
      action: () => setTaskGroup('dueDate'),
      group: 'navigation',
    },
    {
      key: 's d',
      description: 'Sort by due date',
      action: () => setTaskSort({ field: 'dueDate', direction: 'asc' }),
      group: 'navigation',
    },
    {
      key: 's p',
      description: 'Sort by priority',
      action: () => setTaskSort({ field: 'priority', direction: 'desc' }),
      group: 'navigation',
    },
  ];

  useEffect(() => {
    if (!preferences.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const shortcut = shortcuts.find(s => s.key === e.key.toLowerCase());
      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.enableKeyboardShortcuts, shortcuts]);

  return shortcuts;
}; 