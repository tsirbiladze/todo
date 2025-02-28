import { useMemo } from 'react';
import { Task } from '@prisma/client';
import { priorityToLabel } from '@/lib/type-conversions';
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";

type GroupOption = 'none' | 'category' | 'priority' | 'dueDate';

interface UseTaskGroupsOptions {
  tasks: Task[];
  groupBy: GroupOption;
}

/**
 * Hook for grouping tasks by various criteria
 * Extracted from TaskList to separate concerns
 */
export function useTaskGroups({ tasks, groupBy }: UseTaskGroupsOptions) {
  const groupedTasks = useMemo(() => {
    // Ensure tasks is an array
    if (!Array.isArray(tasks)) {
      return { 'All Tasks': [] };
    }

    if (groupBy === 'none') return { 'All Tasks': tasks };

    return tasks.reduce((groups: Record<string, Task[]>, task) => {
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
  }, [tasks, groupBy]);

  return { groupedTasks };
} 