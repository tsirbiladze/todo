'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import {
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  TagIcon,
  MusicalNoteIcon,
  BoltIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface FocusSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  taskId?: string;
  metadata?: string;
  task?: {
    id: string;
    title: string;
    description?: string;
  };
}

interface DailyStats {
  date: string;
  totalDuration: number;
  sessionCount: number;
}

interface Stats {
  totalDuration: number;
  dailyStats: DailyStats[];
}

interface FocusSessionHistoryProps {
  initialSessions: FocusSession[];
  initialStats: Stats;
}

export function FocusSessionHistory({ initialSessions, initialStats }: FocusSessionHistoryProps) {
  const [sessions, setSessions] = useState<FocusSession[]>(initialSessions);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('30days');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterTask, setFilterTask] = useState<string | null>(null);
  
  // Fetch sessions with filters
  const fetchSessions = async () => {
    setIsLoading(true);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      
      // Date range
      const today = new Date();
      if (dateRange === '7days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        params.append('startDate', sevenDaysAgo.toISOString());
      } else if (dateRange === '30days') {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        params.append('startDate', thirtyDaysAgo.toISOString());
      }
      
      // Type filter
      if (filterType) {
        params.append('type', filterType);
      }
      
      // Task filter
      if (filterTask) {
        params.append('taskId', filterTask);
      }
      
      // Include task data
      params.append('includeTask', 'true');
      
      // Fetch data
      const response = await fetch(`/api/focus-sessions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch focus sessions');
      }
      
      const data = await response.json();
      setSessions(data.focusSessions);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching focus sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters when they change
  useEffect(() => {
    fetchSessions();
  }, [dateRange, filterType, filterTask]);
  
  // Parse metadata from session
  const parseMetadata = (session: FocusSession) => {
    if (!session.metadata) return null;
    
    try {
      return JSON.parse(session.metadata);
    } catch (error) {
      console.error('Error parsing session metadata:', error);
      return null;
    }
  };
  
  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  // Get unique tasks from sessions
  const getUniqueTasks = () => {
    const taskMap = new Map();
    
    sessions.forEach(session => {
      if (session.task) {
        taskMap.set(session.task.id, session.task);
      }
    });
    
    return Array.from(taskMap.values());
  };
  
  // Get unique session types
  const getSessionTypes = () => {
    const types = new Set<string>();
    
    sessions.forEach(session => {
      if (session.type) {
        types.add(session.type);
      }
    });
    
    return Array.from(types);
  };
  
  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Focus Time</h3>
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500 mr-3" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatDuration(stats.totalDuration)}
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Total Sessions</h3>
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-green-500 mr-3" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {sessions.length}
            </span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Daily Average</h3>
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-purple-500 mr-3" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.dailyStats.length > 0
                ? formatDuration(Math.round(stats.totalDuration / stats.dailyStats.length))
                : '0 min'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7days' | '30days' | 'all')}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Type
            </label>
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              {getSessionTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task
            </label>
            <select
              value={filterTask || ''}
              onChange={(e) => setFilterTask(e.target.value || null)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Tasks</option>
              {getUniqueTasks().map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Daily Stats Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily Focus Time</h3>
        
        <div className="h-64">
          {stats.dailyStats.length > 0 ? (
            <div className="flex h-full items-end space-x-2">
              {stats.dailyStats.map((day) => {
                const maxDuration = Math.max(...stats.dailyStats.map(d => d.totalDuration));
                const height = day.totalDuration > 0 
                  ? Math.max(10, (day.totalDuration / maxDuration) * 100) 
                  : 0;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 dark:bg-blue-600 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${formatDuration(day.totalDuration)} (${day.sessionCount} sessions)`}
                    ></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
                      {format(new Date(day.date), 'MMM d')}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              No data available for the selected period
            </div>
          )}
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 p-6 border-b border-gray-200 dark:border-gray-700">
          Focus Sessions
        </h3>
        
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No focus sessions found for the selected filters
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => {
              const metadata = parseMetadata(session);
              
              return (
                <div key={session.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                    <div className="flex items-center mb-2 md:mb-0">
                      <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatDuration(session.duration)}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        session.type === 'pomodoro' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {session.type}
                      </span>
                    </div>
                  </div>
                  
                  {session.task && (
                    <div className="flex items-start mt-3">
                      <TagIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {session.task.title}
                        </div>
                        {session.task.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {session.task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {metadata && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                      {metadata.ambientSound && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <MusicalNoteIcon className="h-4 w-4 mr-1" />
                          <span>Sound: {metadata.ambientSound}</span>
                        </div>
                      )}
                      
                      {metadata.brainwaveType && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <BoltIcon className="h-4 w-4 mr-1" />
                          <span>Brainwave: {metadata.brainwaveType}</span>
                        </div>
                      )}
                      
                      {metadata.notes && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          <span>Notes: {metadata.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 