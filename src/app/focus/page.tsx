'use client';

import { useState, useEffect } from 'react';
import { FocusMode } from '@/components/FocusMode';
import { useSession } from 'next-auth/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PomodoroTimer } from '@/components/PomodoroTimer';
import { getFocusText } from '@/lib/focus-utils';
import { TaskApi, FocusSessionApi } from '@/lib/api';
import { formatDate, DATE_FORMATS } from '@/lib/date-utils';
import { Task } from '@prisma/client';

interface FocusSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
}

export default function FocusPage() {
  const { data: session } = useSession();
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [nextTask, setNextTask] = useState<Task | undefined>(undefined);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [remainingTasks, setRemainingTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchFocusSessions = async () => {
      try {
        const result = await FocusSessionApi.getAllSessions();
        if (result.error) {
          throw new Error(result.error);
        }
        setFocusSessions(result.data.focusSessions);
      } catch (error) {
        console.error('Error fetching focus sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        setTasks(data.tasks || []);
        
        // Filter tasks
        const completed = data.tasks?.filter((task: Task) => task.status === 'COMPLETED') || [];
        const incomplete = data.tasks?.filter((task: Task) => task.status !== 'COMPLETED') || [];
        
        // Sort incomplete tasks by priority
        const sortedIncomplete = [...incomplete].sort((a, b) => {
          // First by due date (null dates at the end)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } else if (a.dueDate) {
            return -1;
          } else if (b.dueDate) {
            return 1;
          }
          
          // Then by priority
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999);
        });
        
        setCompletedTasks(completed);
        setRemainingTasks(sortedIncomplete);
        
        // Set current and next task
        if (sortedIncomplete.length > 0) {
          setCurrentTask(sortedIncomplete[0]);
          if (sortedIncomplete.length > 1) {
            setNextTask(sortedIncomplete[1]);
          }
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    if (session?.user) {
      fetchFocusSessions();
      fetchTasks();
    }
  }, [session]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatSessionDate = (dateString: string) => {
    return formatDate(dateString, DATE_FORMATS.DAY_MONTH);
  };

  const chartData = focusSessions
    .reduce((acc, session) => {
      const date = formatSessionDate(session.startTime);
      const existing = acc.find((item) => item.date === date);
      if (existing) {
        existing.duration += session.duration;
      } else {
        acc.push({ date, duration: session.duration });
      }
      return acc;
    }, [] as { date: string; duration: number }[])
    .slice(-7)
    .reverse();

  const totalFocusTime = focusSessions.reduce(
    (total, session) => total + session.duration,
    0
  );

  const averageDailyFocusTime =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((total, day) => total + day.duration, 0) /
            chartData.length
        )
      : 0;

  return (
    <div className="space-y-8">
      <FocusMode 
        currentTask={currentTask}
        nextTask={nextTask}
        completedTasks={completedTasks}
        remainingTasks={remainingTasks}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Focus Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
              Total Focus Time
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
              {formatDuration(totalFocusTime)}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
              Average Daily Focus
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-300">
              {formatDuration(averageDailyFocusTime)}
            </p>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis
                tickFormatter={(value) => `${Math.round(value / 60)}h`}
                stroke="#9CA3AF"
              />
              <Tooltip
                formatter={(value: number) => [
                  formatDuration(value),
                  'Focus Time',
                ]}
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#E5E7EB' }}
                labelStyle={{ color: '#E5E7EB' }}
              />
              <Bar
                dataKey="duration"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Recent Sessions
        </h2>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : focusSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No focus sessions yet. Start your first session above!
          </div>
        ) : (
          <div className="space-y-4">
            {focusSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between py-4 border-b dark:border-gray-700 last:border-0"
              >
                <div>
                  <div className="flex items-center mb-2">
                    <div className="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-300">
                      {formatDate(session.startTime, DATE_FORMATS.DISPLAY_WITH_TIME)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(session.duration)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {session.type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 