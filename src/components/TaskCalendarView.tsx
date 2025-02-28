import { useState, useMemo } from 'react';
import { Task } from '@prisma/client';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Task as TaskComponent } from './Task';
import { formatDate, DATE_FORMATS, isToday as isDateToday } from "@/lib/date-utils";

interface TaskWithRelations extends Task {
  categories?: { id: string; name: string; color: string }[];
  subTasks?: TaskWithRelations[];
}

interface TaskCalendarViewProps {
  tasks: TaskWithRelations[];
  onComplete: (taskId: string) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
  onDelete: (taskId: string) => Promise<void>;
  onRefresh?: () => void;
}

export function TaskCalendarView({ tasks, onComplete, onUpdate, onDelete, onRefresh }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  // Function to go to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  };

  // Get calendar data
  const { daysInMonth, firstDayOfMonth, currentMonthDays, previousMonthDays, nextMonthDays } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Days from current month
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(year, month, i + 1),
      isCurrentMonth: true,
      isToday: isDateToday(new Date(year, month, i + 1)),
    }));
    
    // Days from previous month to fill the first row
    const daysInPreviousMonth = new Date(year, month, 0).getDate();
    const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
      date: new Date(year, month - 1, daysInPreviousMonth - firstDayOfMonth + i + 1),
      isCurrentMonth: false,
      isToday: false,
    }));
    
    // Days from next month to fill the last row
    const totalDaysDisplayed = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    const nextMonthDays = Array.from(
      { length: totalDaysDisplayed - (firstDayOfMonth + daysInMonth) },
      (_, i) => ({
        date: new Date(year, month + 1, i + 1),
        isCurrentMonth: false,
        isToday: false,
      })
    );
    
    return { 
      daysInMonth,
      firstDayOfMonth,
      currentMonthDays,
      previousMonthDays,
      nextMonthDays,
    };
  }, [currentDate]);

  // Check if a date is today - using new utility function
  function isToday(date: Date): boolean {
    return isDateToday(date);
  }

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, TaskWithRelations[]> = {};
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateStr = new Date(task.dueDate).toDateString();
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  // Get tasks for a specific day
  const getTasksForDay = (date: Date): TaskWithRelations[] => {
    return tasksByDate[date.toDateString()] || [];
  };

  // All days to display (previous month + current month + next month)
  const allDays = [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];
  
  // Calculate week rows
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const handleAddTask = () => {
    if (!selectedDay) return;
    
    setIsAddingTask(true);
    
    // Show task creation dialog with the selected date pre-filled
    const newTask = {
      id: 'temp-' + Date.now(),
      title: '',
      description: '',
      completed: false,
      dueDate: selectedDay,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    } as TaskWithRelations;
    
    // This is placeholder - in a real implementation, you would:
    // 1. Show a modal or form for task creation
    // 2. Pre-fill the due date with the selected date
    // Instead, we'll just show a browser prompt as a simple solution
    const taskTitle = window.prompt('Enter task title:', '');
    if (taskTitle) {
      newTask.title = taskTitle;
      
      // Create a server-friendly version of the task
      const taskToCreate = {
        ...newTask,
        dueDate: selectedDay.toISOString()
      };
      
      // Call your API to create the task
      fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskToCreate)
      })
      .then(response => response.json())
      .then(data => {
        console.log('Task created:', data);
        // Refresh tasks
        if (onRefresh) {
          onRefresh();
        }
      })
      .catch(error => {
        console.error('Error creating task:', error);
      })
      .finally(() => {
        setIsAddingTask(false);
      });
    } else {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {formatDate(currentDate, DATE_FORMATS.MONTH_YEAR)}
            </h2>
            <button 
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                title="Refresh tasks"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
            <button 
              onClick={goToToday}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 text-sm font-medium"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white dark:bg-gray-800">
        {/* Day names */}
        <div className="grid grid-cols-7 text-center border-b border-gray-200 dark:border-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2 font-medium text-sm text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="bg-white dark:bg-gray-800">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              {week.map((day, dayIndex) => {
                const tasksForDay = getTasksForDay(day.date);
                const hasOverdueTasks = tasksForDay.some(
                  task => task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
                );
                const hasDueSoonTasks = tasksForDay.some(
                  task => 
                    task.dueDate && 
                    !task.completed &&
                    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000 &&
                    new Date(task.dueDate) >= new Date()
                );
                
                return (
                  <div 
                    key={dayIndex}
                    className={`min-h-[110px] p-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative ${
                      !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : ''
                    } ${
                      day.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${
                      selectedDay && day.date.toDateString() === selectedDay.toDateString() 
                        ? 'ring-2 ring-blue-500 ring-inset' 
                        : ''
                    }`}
                    onClick={() => setSelectedDay(day.date)}
                  >
                    <div className={`text-sm font-medium p-1 mb-1 rounded-full w-7 h-7 flex items-center justify-center ${
                      day.isToday 
                        ? 'bg-blue-600 text-white' 
                        : !day.isCurrentMonth 
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-gray-700 dark:text-gray-200'
                    }`}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Task indicators */}
                    {tasksForDay.length > 0 && (
                      <div className="space-y-1 overflow-hidden max-h-[70px]">
                        {tasksForDay.slice(0, 2).map(task => (
                          <div 
                            key={task.id}
                            className={`text-xs truncate px-1 py-0.5 rounded ${
                              task.completed
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 line-through'
                                : hasOverdueTasks
                                  ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                                  : hasDueSoonTasks
                                    ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200'
                                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                            }`}
                            title={task.title}
                          >
                            {task.title}
                          </div>
                        ))}
                        
                        {tasksForDay.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                            +{tasksForDay.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected day tasks */}
      {selectedDay && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              Tasks for {formatDate(selectedDay, DATE_FORMATS.DISPLAY_LONG)}
            </h3>
            <button 
              onClick={handleAddTask}
              disabled={isAddingTask}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium
                ${isAddingTask 
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                }`}
            >
              {isAddingTask ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>Quick Add</span>
                </>
              )}
            </button>
          </div>
          
          <div className="space-y-2">
            {getTasksForDay(selectedDay).length > 0 ? (
              getTasksForDay(selectedDay).map(task => (
                <TaskComponent
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No tasks scheduled for this day.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 