import { useState, useMemo } from 'react';
import { 
  CheckCircleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ClockIcon, 
  FlagIcon,
  CalendarIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { Task as TaskType } from '@prisma/client';
import { formatDistanceToNow } from "date-fns";
import { getPriorityColorClass, priorityToLabel, emotionToEmoji, getEmotionColorClass } from "@/lib/type-conversions";
import { useConfirmationDialog } from '@/providers/ConfirmationProvider';
import { formatDate, DATE_FORMATS } from "@/lib/date-utils";

interface TaskProps {
  task: TaskType & {
    categories?: { id: string; name: string; color: string }[];
    subTasks?: TaskType[];
  };
  onComplete?: (taskId: string) => void;
  onUpdate?: (taskId: string, data: Partial<TaskType>) => void;
  onDelete?: (taskId: string) => void;
}

export function Task({ task, onComplete, onUpdate, onDelete }: TaskProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm } = useConfirmationDialog();

  const handleComplete = () => {
    if (onComplete) {
      onComplete(task.id);
    } else if (onUpdate) {
      onUpdate(task.id, { completedAt: task.completedAt ? null : new Date() });
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
        onDelete(task.id);
      }
    }
  };

  const subTaskProgress = useMemo(() => {
    if (!task.subTasks?.length) return null;
    const completed = task.subTasks.filter(t => t.completedAt).length;
    const total = task.subTasks.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  }, [task.subTasks]);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isDueSoon = task.dueDate && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
  
  const isCompleted = !!task.completedAt;

  return (
    <div 
      className={`border rounded-lg p-4 mb-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
        isHovered ? 'scale-[1.01]' : ''
      } ${isDeleting ? 'opacity-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={handleComplete}
          className={`mt-1 rounded-full p-1 transition-colors duration-200 ${
            isCompleted 
              ? 'text-green-600 bg-green-100' 
              : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
          }`}
          role="checkbox"
          aria-checked={isCompleted}
        >
          <CheckCircleIcon className="w-6 h-6" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-medium ${isCompleted ? 'line-through text-gray-500 completed' : 'text-gray-800'}`}>
              {task.title}
            </h3>
            {task.priority && task.priority !== 'NONE' && (
              <span 
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(task.priority)}`}
              >
                {priorityToLabel(task.priority)}
              </span>
            )}
            {task.emotion && (
              <span 
                className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getEmotionColorClass(task.emotion)}`}
                title={task.emotion}
              >
                <span className="text-sm">{emotionToEmoji(task.emotion)}</span>
                <span>{task.emotion.charAt(0) + task.emotion.slice(1).toLowerCase()}</span>
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-gray-600 mt-1">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {task.categories?.map((category) => (
              <span
                key={category.id}
                className="px-2 py-1 rounded-full text-sm font-medium"
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

          <div className="flex items-center gap-4 mt-2 text-sm">
            {task.dueDate && (
              <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                isDueSoon ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                <CalendarIcon className="h-3 w-3" />
                {formatDate(task.dueDate, DATE_FORMATS.DISPLAY_WITH_TIME)}
              </div>
            )}
            {task.estimatedDuration && (
              <div className="flex items-center gap-1 text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>{task.estimatedDuration} min</span>
              </div>
            )}
          </div>

          {subTaskProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{subTaskProgress.completed}/{subTaskProgress.total} completed</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className={`rounded-full h-2.5 transition-all duration-300 ${
                    subTaskProgress.percentage === 100 
                      ? 'bg-green-500' 
                      : subTaskProgress.percentage > 50 
                        ? 'bg-blue-500' 
                        : 'bg-blue-400'
                  }`}
                  style={{ width: `${subTaskProgress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isHovered && (
            <>
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-600 hover:bg-red-100 p-1 rounded-full transition-colors duration-200"
                title="Delete task"
                disabled={isDeleting}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button
                aria-label="Task menu"
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors duration-200"
              >
                <EllipsisVerticalIcon className="w-5 h-5" />
              </button>
            </>
          )}
          
          {task.subTasks && task.subTasks.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors duration-200"
            >
              {expanded ? (
                <ChevronUpIcon className="w-5 h-5" />
              ) : (
                <ChevronDownIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && task.subTasks && (
        <div className="ml-8 mt-4 space-y-2 border-l-2 border-gray-100 pl-4">
          {task.subTasks.map((subTask) => (
            <Task
              key={subTask.id}
              task={subTask}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 