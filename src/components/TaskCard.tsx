import { useState, useCallback, useMemo } from 'react';
import { Task as TaskType } from '@prisma/client';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  FlagIcon,
  CalendarIcon,
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowUturnLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from "date-fns";
import { Check, Trash, Edit, Calendar, Clock } from "lucide-react";
import { getPriorityColorClass, priorityToLabel, emotionToEmoji } from "@/lib/type-conversions";
import { useConfirmationDialog } from '@/providers/ConfirmationProvider';
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";

interface TaskCardProps {
  task: TaskType & {
    categories?: { id: string; name: string; color: string }[];
    subTasks?: TaskType[];
  };
  onComplete?: (taskId: string) => void;
  onUpdate?: (taskId: string, data: Partial<TaskType>) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: TaskType) => void;
}

export function TaskCard({ task, onComplete, onUpdate, onDelete, onEdit }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { confirm } = useConfirmationDialog();

  const handleComplete = async () => {
    if (onComplete) {
      setIsCompleting(true);
      try {
        await onComplete(task.id);
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      const confirmed = await confirm({
        title: 'Delete Task',
        message: (
          <div>
            <p>Are you sure you want to delete <strong>"{task.title}"</strong>?</p>
            <p className="mt-2 text-sm">This action cannot be undone.</p>
          </div>
        ),
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      });
      
      if (confirmed) {
        setIsDeleting(true);
        try {
          await onDelete(task.id);
        } catch (error) {
          // Reset deleting state if there's an error
          setIsDeleting(false);
          // Error is handled by the parent component or store
        }
      }
    }
  };

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(task);
    }
  }, [onEdit, task]);

  const hasSubtasks = useMemo(() => task.subTasks && task.subTasks.length > 0, [task.subTasks]);
  
  const isOverdue = useMemo(() => 
    task.dueDate && new Date(task.dueDate) < new Date() && !task.completedAt,
    [task.dueDate, task.completedAt]
  );
  
  const isDueSoon = useMemo(() => 
    task.dueDate && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 &&
    !task.completedAt,
    [task.dueDate, task.completedAt]
  );

  // Calculate completion percentage of subtasks
  const subtaskProgress = useMemo(() => {
    if (!hasSubtasks) return null;
    
    const completed = task.subTasks!.filter(t => !!t.completedAt).length;
    const total = task.subTasks!.length;
    const percentage = (completed / total) * 100;
    
    return { completed, total, percentage };
  }, [hasSubtasks, task.subTasks]);

  // Memoize card background class to prevent recalculation on every render
  const cardBackgroundClass = useMemo(() => {
    if (isOverdue) return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50';
    if (isDueSoon) return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/50';
    if (task.completedAt) return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200';
    return 'bg-white dark:bg-gray-800';
  }, [isOverdue, isDueSoon, task.completedAt]);

  return (
    <div
      className={`border dark:border-gray-700 rounded-lg p-4 mb-3 
        ${cardBackgroundClass} 
        shadow-sm hover:shadow-md transition-all duration-200
        ${isDeleting ? 'opacity-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-busy={isDeleting || isCompleting}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleComplete}
          className={`mt-0.5 p-1 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isCompleting ? 'animate-pulse' : ''}`}
          aria-label={task.completedAt ? "Mark as incomplete" : "Mark as complete"}
          disabled={isCompleting || isDeleting}
          aria-busy={isCompleting}
          role="checkbox"
          aria-checked={!!task.completedAt}
        >
          {isCompleting ? (
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : task.completedAt ? (
            <CheckCircleIconSolid className="w-6 h-6 text-green-600 dark:text-green-500" />
          ) : (
            <CheckCircleIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 
              className={`text-lg font-medium break-words ${
                task.completedAt ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100'
              }`}
            >
              {task.title}
            </h3>
            
            {task.priority && task.priority !== 'NONE' && (
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium ${getPriorityColorClass(task.priority)}`}
                aria-label={`Priority: ${priorityToLabel(task.priority)}`}
              >
                {priorityToLabel(task.priority)}
              </span>
            )}

            {task.emotion && (
              <span className="text-xl" title={task.emotion} aria-label={`Feeling: ${task.emotion}`}>
                {emotionToEmoji(task.emotion)}
              </span>
            )}
          </div>

          {task.description && (
            <p
              className="text-gray-600 dark:text-gray-400 mt-1 text-sm overflow-hidden"
            >
              {task.description}
            </p>
          )}

          {task.categories && task.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2" aria-label="Categories">
              {task.categories.map((category) => (
                <span
                  key={category.id}
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${category.color}15`, 
                    color: category.color,
                    border: `1px solid ${category.color}30`
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center flex-wrap gap-4 mt-2 text-xs">
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 
                isDueSoon ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 
                'text-gray-600 dark:text-gray-400'
              }`}
              aria-label={`Due date: ${formatDate(task.dueDate, DATE_FORMATS.DISPLAY_WITH_TIME)}${isOverdue ? ' (Overdue)' : isDueSoon ? ' (Due Soon)' : ''}`}
              >
                <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {formatDate(task.dueDate, DATE_FORMATS.DISPLAY_WITH_TIME)} 
                  {isOverdue && ' (Overdue)'}
                  {!isOverdue && isDueSoon && ' (Due Soon)'}
                </span>
              </div>
            )}
            
            {task.estimatedDuration && (
              <div 
                className="flex items-center gap-1 text-gray-600 dark:text-gray-400"
                aria-label={`Estimated duration: ${task.estimatedDuration} minutes`}
              >
                <ClockIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{task.estimatedDuration} min</span>
              </div>
            )}
          </div>

          {subtaskProgress && (
            <div className="mt-3" aria-label={`Subtask progress: ${subtaskProgress.completed} of ${subtaskProgress.total} completed`}>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{subtaskProgress.completed}/{subtaskProgress.total} completed</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`rounded-full h-1.5 ${
                    subtaskProgress.percentage === 100 
                      ? 'bg-green-500 dark:bg-green-400' 
                      : subtaskProgress.percentage > 50 
                        ? 'bg-blue-500 dark:bg-blue-400' 
                        : 'bg-blue-400 dark:bg-blue-500'
                  }`}
                  style={{ width: `${subtaskProgress.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={subtaskProgress.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}
        </div>

        {isHovered && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDelete}
              className={`text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 ${isDeleting ? 'animate-pulse bg-red-100' : ''}`}
              title="Delete task"
              aria-label="Delete task"
              disabled={isDeleting || isCompleting}
              aria-busy={isDeleting}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <TrashIcon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
            
            <button
              onClick={handleEdit}
              className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Edit task"
              aria-label="Edit task"
              disabled={isDeleting || isCompleting}
            >
              <PencilIcon className="w-4 h-4" aria-hidden="true" />
            </button>
            
            {hasSubtasks && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                title={expanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={expanded}
                aria-controls={`subtasks-${task.id}`}
                disabled={isDeleting || isCompleting}
              >
                {expanded ? (
                  <ChevronUpIcon className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {expanded && hasSubtasks && (
        <div
          id={`subtasks-${task.id}`}
          className="ml-8 mt-4 space-y-2 border-l-2 border-gray-100 dark:border-gray-700 pl-4"
          aria-label="Subtasks"
        >
          {task.subTasks!.map((subTask) => (
            <TaskCard
              key={subTask.id}
              task={subTask}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
} 