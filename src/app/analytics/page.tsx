'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Task, Category } from '@prisma/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { EmotionAnalytics } from '@/components/analytics/EmotionAnalytics';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export default function AnalyticsPage() {
  const tasks = useStore((state) => state.tasks);
  const categories = useStore((state) => state.categories);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'quarter'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading delay - in a real app this would be actual data fetching
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real implementation, you would fetch any additional analytics data here
        // For now we'll just simulate a loading delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  const getTimeFrameDays = () => {
    const today = new Date();
    switch (timeFrame) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'quarter':
        return 90;
      default:
        return 7;
    }
  };

  const getTimeFrameStart = () => {
    const today = new Date();
    const days = getTimeFrameDays();
    return subDays(today, days);
  };

  // Completion data by day
  const getCompletionDataByDay = () => {
    const startDate = getTimeFrameStart();
    const endDate = new Date();
    
    // Get all days in the interval
    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Create a map of completed tasks per day
    const completedTasksMap = daysInRange.reduce<Record<string, { date: string; completed: number; created: number }>>((acc, date) => {
      const dateString = format(date, 'yyyy-MM-dd');
      acc[dateString] = { date: format(date, 'MMM dd'), completed: 0, created: 0 };
      return acc;
    }, {});
    
    // Count completed and created tasks for each day
    tasks.forEach(task => {
      if (!task.createdAt) return;
      
      // Count created tasks
      const createdDate = format(new Date(task.createdAt), 'yyyy-MM-dd');
      if (completedTasksMap[createdDate]) {
        completedTasksMap[createdDate].created += 1;
      }
      
      // Count completed tasks
      if (task.completedAt) {
        const completedDate = format(new Date(task.completedAt), 'yyyy-MM-dd');
        if (completedTasksMap[completedDate]) {
          completedTasksMap[completedDate].completed += 1;
        }
      }
    });
    
    // Convert map to array and sort by date
    return Object.values(completedTasksMap).sort((a, b) => 
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );
  };

  // Task distribution by priority
  const getTasksByPriority = () => {
    const priorityCounts = { 'None': 0, 'Low': 0, 'Medium': 0, 'High': 0, 'Urgent': 0 };
    
    tasks.forEach(task => {
      const priorityLabel = ['None', 'Low', 'Medium', 'High', 'Urgent'][task.priority || 0];
      priorityCounts[priorityLabel as keyof typeof priorityCounts] += 1;
    });
    
    return Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));
  };

  // Task distribution by category
  const getTasksByCategory = () => {
    const categoryMap = new Map<string, number>();
    let uncategorizedCount = 0;
    
    tasks.forEach(task => {
      if (task.categories && task.categories.length > 0) {
        task.categories.forEach(category => {
          const count = categoryMap.get(category.name) || 0;
          categoryMap.set(category.name, count + 1);
        });
      } else {
        uncategorizedCount += 1;
      }
    });
    
    const result = [...categoryMap.entries()].map(([name, value]) => ({ name, value }));
    
    if (uncategorizedCount > 0) {
      result.push({ name: 'Uncategorized', value: uncategorizedCount });
    }
    
    return result;
  };

  // Calculate completion rate
  const getCompletionRate = () => {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  // Average completion time
  const getAverageCompletionTime = () => {
    const completedTasks = tasks.filter(task => task.completedAt && task.createdAt);
    if (completedTasks.length === 0) return 0;
    
    const totalTime = completedTasks.reduce((total, task) => {
      const createdDate = new Date(task.createdAt);
      const completedDate = new Date(task.completedAt!);
      const diffInHours = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      return total + diffInHours;
    }, 0);
    
    return Math.round((totalTime / completedTasks.length) * 10) / 10; // Round to 1 decimal
  };

  // Tasks by due date status
  const getTasksByDueStatus = () => {
    const now = new Date();
    const overdue = tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < now).length;
    const dueSoon = tasks.filter(task => !task.completed && task.dueDate && 
      new Date(task.dueDate) >= now && 
      new Date(task.dueDate) <= new Date(now.getTime() + 24 * 60 * 60 * 1000)).length;
    const upcoming = tasks.filter(task => !task.completed && task.dueDate && 
      new Date(task.dueDate) > new Date(now.getTime() + 24 * 60 * 60 * 1000)).length;
    const noDueDate = tasks.filter(task => !task.completed && !task.dueDate).length;
    
    return [
      { name: 'Overdue', value: overdue, color: '#EF4444' },
      { name: 'Due Today', value: dueSoon, color: '#F59E0B' },
      { name: 'Upcoming', value: upcoming, color: '#3B82F6' },
      { name: 'No Due Date', value: noDueDate, color: '#6B7280' },
    ];
  };

  // Prepare color map for categories
  const getCategoryColorMap = () => {
    const colorMap: Record<string, string> = {};
    
    categories.forEach(category => {
      colorMap[category.name] = category.color;
    });
    
    colorMap['Uncategorized'] = '#6B7280';
    
    return colorMap;
  };

  // Priority colors
  const PRIORITY_COLORS = {
    'None': '#9CA3AF',
    'Low': '#60A5FA',
    'Medium': '#FBBF24',
    'High': '#F97316',
    'Urgent': '#EF4444',
  };

  // Create dynamic colors for pie charts
  const categoryColorMap = getCategoryColorMap();
  
  // For skeleton loading state
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-8 w-1/4"></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-72"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-72"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-72"></div>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-72"></div>
      </div>
    </div>
  );

  // For empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Data Available</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        Start creating and completing tasks to see analytics data and track your productivity.
      </p>
    </div>
  );

  // For error state
  const ErrorState = () => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
            Error Loading Analytics
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            <p>{error || 'Failed to load analytics data'}</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if we have data to display
  const hasData = tasks.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Task Analytics</h1>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingIndicator size="lg" text="Loading analytics data..." />
        </div>
      ) : error ? (
        <ErrorState />
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Time Frame Selector */}
          <div className="mb-8">
            <div className="flex space-x-1 rounded-lg p-1 bg-gray-100 dark:bg-gray-800 w-fit">
              {['week', 'month', 'quarter'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFrame(period as 'week' | 'month' | 'quarter')}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    timeFrame === period
                      ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Key metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tasks</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {tasks.filter(t => t.completed).length} completed
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completion Rate</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{getCompletionRate()}%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-3">
                <div 
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                  style={{ width: `${getCompletionRate()}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Avg. Completion Time</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{getAverageCompletionTime()}</p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">hours per task</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Overdue Tasks</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {getTasksByDueStatus()[1].value} due today
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Task Completion Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Task Activity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getCompletionDataByDay()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#E5E7EB',
                      borderRadius: '0.375rem',
                      color: '#111827'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="created" 
                    name="Tasks Created" 
                    stroke="#60A5FA" 
                    fill="#60A5FA" 
                    fillOpacity={0.2}
                    activeDot={{ r: 8 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    name="Tasks Completed" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.2}
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks by Priority */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tasks by Priority</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTasksByPriority()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis type="number" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#E5E7EB',
                      borderRadius: '0.375rem',
                      color: '#111827'
                    }}
                  />
                  <Bar dataKey="value" name="Tasks">
                    {getTasksByPriority().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks by Category */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tasks by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getTasksByCategory()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getTasksByCategory().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={categoryColorMap[entry.name] || '#6B7280'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#E5E7EB',
                      borderRadius: '0.375rem',
                      color: '#111827'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks by Due Status */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tasks by Due Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getTasksByDueStatus()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getTasksByDueStatus().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#E5E7EB',
                      borderRadius: '0.375rem',
                      color: '#111827'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Emotion Analytics Section */}
          <div className="mb-12">
            <EmotionAnalytics tasks={tasks} timeFrame={timeFrame} />
          </div>
        </>
      )}
    </div>
  );
} 