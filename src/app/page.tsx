"use client";

import { useEffect, useState, Fragment } from "react";
import { TaskList } from "@/components/TaskList";
import { AddTaskForm } from "@/components/AddTaskForm";
import { useStore } from "@/lib/store";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
import { EmptyState } from "@/components/EmptyState";
import { Transition, Dialog } from "@headlessui/react";
import { useTranslation } from "@/lib/i18n";
import { TopBar } from "@/components/TopBar";
import { SideNav } from "@/components/SideNav";
import { UserWelcome } from "@/components/UserWelcome";
import { Modal } from "@/components/ui/Modal";
import { Onboarding } from "@/components/Onboarding";
import { QuickCaptureButton } from "@/components/QuickCaptureButton";
import TaskDebugHelper from "@/components/TaskDebugHelper";

export default function Home() {
  const { t } = useTranslation();
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
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    // Check localStorage to see if this is the first visit
    if (typeof window !== 'undefined') {
      return localStorage.getItem("onboardingComplete") !== "true";
    }
    return true;
  });

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
        console.log('🔍 Home: Fetching tasks from API...');
        
        const response = await fetch("/api/tasks");
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('📦 Home: API response:', responseData);
        
        // Check if response has the expected structure
        if (!responseData || typeof responseData !== 'object') {
          console.error('❌ Home: Invalid API response format', responseData);
          throw new Error('Invalid API response format');
        }
        
        // The API returns data in a nested "data" property due to successResponse function
        const data = responseData.data;
        
        if (!data) {
          console.error('❌ Home: No data in API response', responseData);
          // Initialize with empty array
          setTasks([]);
          return;
        }
        
        // Check if tasks exist and are an array
        if (data.tasks && Array.isArray(data.tasks)) {
          console.log(`✅ Home: Successfully fetched ${data.tasks.length} tasks`);
          setTasks(data.tasks);
        } else {
          // If response has a direct array of tasks without the "tasks" property
          if (Array.isArray(data)) {
            console.log(`✅ Home: Successfully fetched ${data.length} tasks`);
            setTasks(data);
          } else {
            console.error('❌ Home: Tasks not found in API response or not an array', data);
            // Initialize with empty array
            setTasks([]);
          }
        }
      } catch (error) {
        console.error("❌ Home: Error fetching tasks:", error);
        setError(error instanceof Error ? error.message : "Failed to load data");
        // Initialize with empty array on error
        setTasks([]);
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
        const responseData = await response.json();
        
        // The API returns data in a nested "data" property
        const categories = responseData.data || [];
        
        setCategories(Array.isArray(categories) ? categories : []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // We don't set error here as tasks are more critical than categories
        setCategories([]);
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

  const handleOnboardingComplete = () => {
    setIsFirstVisit(false);
    localStorage.setItem("onboardingComplete", "true");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <SideNav />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onAddTask={() => setIsAddTaskOpen(true)} />
        
        <main className="flex-1 overflow-auto p-4">
          {isFirstVisit && <Onboarding onComplete={handleOnboardingComplete} />}
          
          {!isFirstVisit && (
            <>
              <UserWelcome />
              
              {error ? (
                <div className="text-center my-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <TaskList />
              )}
            </>
          )}
        </main>
      </div>
      
      <Modal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        title=""
      >
        <AddTaskForm onClose={() => setIsAddTaskOpen(false)} />
      </Modal>
      
      <QuickCaptureButton onClick={() => setIsAddTaskOpen(true)} />
      
      {/* Add the debug helper component */}
      <TaskDebugHelper />
    </div>
  );
}
