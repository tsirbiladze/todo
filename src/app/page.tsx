"use client";

import { useEffect, useState } from "react";
import { TaskList } from "@/components/TaskList";
import { AddTaskForm } from "@/components/AddTaskForm";
import { useStore } from "@/lib/store";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/EmptyState";

export default function Home() {
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const setTasks = useStore((state) => state.setTasks);
  const tasks = useStore((state) => state.tasks);
  const focusMode = useStore((state) => state.focusMode);
  const toggleFocusMode = useStore((state) => state.toggleFocusMode);
  const setCategories = useStore((state) => state.setCategories);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isAddTaskOpen) {
      document.body.classList.add("modal-open");
      return () => {
        document.body.classList.remove("modal-open");
      };
    }
  }, [isAddTaskOpen]);

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsTasksLoading(true);
        setError(null);
        const response = await fetch("/api/tasks");
        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }
        const data = await response.json();
        setTasks(data.tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setIsTasksLoading(false);
      }
    };

    fetchTasks();
  }, [setTasks, retryCount]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const response = await fetch("/api/categories");
        if (!response.ok) {
          if (response.status === 401) {
            // User is not logged in, set empty categories and don't show error
            setCategories([]);
            console.log("User not authenticated, showing empty categories");
            return;
          }
          throw new Error("Failed to fetch categories");
        }
        const categories = await response.json();
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // We don't set error here as tasks are more critical than categories
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [setCategories, retryCount]);

  // Check if data is still loading
  const isLoading = isTasksLoading || isCategoriesLoading;

  // Handle retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <main className="min-h-screen pt-4">
      {/* Initial Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center h-60 mt-8">
          <LoadingIndicator size="lg" variant="dots" text="Loading your tasks..." />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="max-w-4xl mx-auto mt-12 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                  Oops! Something went wrong
                </h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <>
          <div className="max-w-4xl mx-auto px-4 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {focusMode ? "Focus Mode" : "Tasks"}
              </h1>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => toggleFocusMode()}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    focusMode
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  }`}
                >
                  {focusMode ? "Exit Focus" : "Focus Mode"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-700 dark:hover:bg-indigo-600"
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  New Task
                </button>
              </div>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <EmptyState 
                type="tasks"
                onAction={() => setIsAddTaskOpen(true)}
              />
            </div>
          ) : (
            <TaskList />
          )}

          {isAddTaskOpen && (
            <AddTaskForm
              onClose={() => {
                setIsAddTaskOpen(false);
                document.body.classList.remove("modal-open");
              }}
            />
          )}
        </>
      )}
    </main>
  );
}
