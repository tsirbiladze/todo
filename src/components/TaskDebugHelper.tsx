import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { TaskApi } from '@/lib/api';

/**
 * A simple debug helper component to diagnose task-related issues
 * This can be temporarily added to any page or component to check task state
 */
export default function TaskDebugHelper() {
  const [debugActive, setDebugActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  // Get tasks from store
  const tasks = useStore((state) => state.tasks);
  
  // Function to check store tasks
  const checkStoreTasks = () => {
    // Get current tasks directly from store
    const store = useStore.getState();
    
    console.log('🧪 Debug: Current store tasks:', store.tasks);
    console.log('🧪 Debug: Store tasks length:', store.tasks ? store.tasks.length : 'undefined');
    console.log('🧪 Debug: Is tasks array?', Array.isArray(store.tasks));
    
    // Check for proper array
    if (!Array.isArray(store.tasks)) {
      console.error('❌ Debug: Store tasks is not an array!');
      // Fix by setting to empty array
      store.setTasks([]);
    }
  };
  
  // Function to fetch tasks from API directly
  const fetchTasksDirectly = async () => {
    try {
      setLoading(true);
      
      // Direct API call
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(data);
      
      console.log('🧪 Debug: API response:', data);
      console.log('🧪 Debug: Tasks in response:', data.tasks);
      console.log('🧪 Debug: Tasks is array?', Array.isArray(data.tasks));
      
      return data;
    } catch (error) {
      console.error('❌ Debug: Error fetching tasks:', error);
      setApiResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to update store with API data
  const updateStoreFromApi = async () => {
    try {
      setLoading(true);
      
      // Use TaskApi utility
      const response = await TaskApi.getAllTasks();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Make sure we have valid data
      const tasksData = Array.isArray(response.data?.tasks) 
        ? response.data.tasks 
        : [];
      
      // Update store
      const store = useStore.getState();
      store.setTasks(tasksData);
      
      console.log('✅ Debug: Store updated with', tasksData.length, 'tasks');
      
    } catch (error) {
      console.error('❌ Debug: Error updating store:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!debugActive) {
    return (
      <button 
        onClick={() => setDebugActive(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 text-xs rounded-md shadow-md z-50"
      >
        Debug Tasks
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-md shadow-md z-50 max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Task Debug Helper</h3>
        <button 
          onClick={() => setDebugActive(false)}
          className="text-gray-500"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 mb-3">
        <button
          onClick={checkStoreTasks}
          className="bg-blue-500 text-white px-2 py-1 text-xs rounded w-full"
        >
          Check Store Tasks
        </button>
        
        <button
          onClick={fetchTasksDirectly}
          className="bg-green-500 text-white px-2 py-1 text-xs rounded w-full"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch API Tasks'}
        </button>
        
        <button
          onClick={updateStoreFromApi}
          className="bg-purple-500 text-white px-2 py-1 text-xs rounded w-full"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Store from API'}
        </button>
      </div>
      
      <div className="text-xs">
        <div className="font-medium">Store Tasks ({tasks?.length || 0})</div>
        <div className="mt-1 mb-2">
          {!Array.isArray(tasks) ? (
            <span className="text-red-500">⚠️ Not an array!</span>
          ) : tasks.length === 0 ? (
            <span className="text-orange-500">No tasks found in store</span>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded">
              <div>First task: {tasks[0]?.title || 'Unnamed'}</div>
              <div>ID: {tasks[0]?.id?.substring(0, 8) || 'No ID'}</div>
            </div>
          )}
        </div>
        
        {apiResponse && (
          <div>
            <div className="font-medium mt-2">API Response</div>
            <pre className="bg-gray-100 dark:bg-gray-700 p-1 rounded mt-1 overflow-auto max-h-40">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 