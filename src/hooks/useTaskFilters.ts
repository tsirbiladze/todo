import { useMemo } from 'react';
import { Task } from '@prisma/client';
import { priorityToNumber } from '@/lib/type-conversions';

type SortOption = 'dueDate' | 'priority' | 'created' | 'category';
type FilterOption = 'all' | 'completed' | 'active';

interface UseTaskFiltersOptions {
  tasks: Task[];
  filter: FilterOption;
  sortBy: SortOption;
  searchQuery: string;
}

/**
 * Hook for filtering and sorting tasks
 * Extracted from TaskList to separate concerns
 */
export function useTaskFilters({
  tasks,
  filter,
  sortBy,
  searchQuery,
}: UseTaskFiltersOptions) {
  const filteredAndSortedTasks = useMemo(() => {
    // Ensure tasks is an array before spreading
    if (!Array.isArray(tasks)) {
      return [];
    }

    let result = [...tasks];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply completion filter
    result = result.filter((task) => {
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

    // Apply sorting
    result.sort((a, b) => {
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

    return result;
  }, [tasks, filter, sortBy, searchQuery]);

  return { filteredAndSortedTasks };
} 