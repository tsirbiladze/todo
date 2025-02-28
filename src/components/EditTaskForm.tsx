import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Task } from "@prisma/client";
import {
  PencilIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { validateTaskField, validateTaskForm } from "@/lib/validations";
import { 
  priorityToNumber, 
  emotionToString, 
  numberToPriority, 
  stringToEmotion 
} from "@/lib/type-conversions";
import { TaskFormField } from "./form-components/TaskFormField";
import { PrioritySelector } from "./form-components/PrioritySelector";
import { EmotionSelector } from "./form-components/EmotionSelector";
import { CategorySelector } from "./form-components/CategorySelector";
import { DurationSelector } from "./form-components/DurationSelector";
import { formatDateForInput } from "@/lib/date-utils";
import { AIEnhancedInput } from './ui/AIEnhancedInput';

interface EditTaskFormProps {
  task: Task & { categories?: { id: string; name: string; color: string }[] };
  onClose?: () => void;
}

export function EditTaskForm({ task, onClose }: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState(
    priorityToNumber(task.priority)
  );
  const [dueDate, setDueDate] = useState(
    task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-ddTHH:mm") : ""
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    task.categories?.map(cat => cat.id) || []
  );
  const [emotion, setEmotion] = useState<string>(
    emotionToString(task.emotion)
  );
  const [estimatedDuration, setEstimatedDuration] = useState<number>(
    task.estimatedDuration || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [useAI, setUseAI] = useState(true);

  const categories = useStore((state) => state.categories);
  const updateTask = useStore((state) => state.updateTask);

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    
    const error = validateTaskField(field, { 
      title, description, priority, dueDate, selectedCategories, estimatedDuration
    });
    
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  // Validate all fields
  const validateForm = () => {
    const errors = validateTaskForm({
      title, description, priority, dueDate, selectedCategories, estimatedDuration
    });
    
    setValidationErrors(errors);
    setTouched({
      title: true,
      description: true,
      priority: true,
      dueDate: true,
      categories: true,
      estimatedDuration: true,
    });
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    // Only include fields that need to be updated
    const updatedTask: Partial<Task> = {
      title: title.trim(),
      description: description?.trim() || null,
      priority: numberToPriority(priority),
      dueDate: dueDate ? new Date(dueDate) : null,
      emotion: emotion ? stringToEmotion(emotion) : null,
      estimatedDuration: estimatedDuration || null,
      // Preserve the original goalId (we don't modify it in this form)
      goalId: task.goalId,
    };

    try {
      // Make sure the API endpoint matches [taskId] route parameter
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updatedTask,
          categoryIds: selectedCategories,
        }),
      });

      if (!response.ok) {
        // Read the error message from the response if possible
        let errorMsg = 'Failed to update task';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
          if (errorData.details) {
            console.error('Error details:', errorData.details);
            errorMsg += ` - ${errorData.details}`;
          }
        } catch {
          // If we can't parse the error, just use the default
          console.log('Could not parse error response');
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Update local state with the returned task from the API
      if (data && data.task) {
        // Use await to ensure the promise completes before closing the form
        await updateTask(task.id, data.task);
        console.log('Task updated successfully:', data.task);
      } else {
        // Fallback to the local update if the API doesn't return the updated task
        await updateTask(task.id, updatedTask);
        console.log('Updated task with local data (API returned no task)');
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update task. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 overflow-hidden">
      <div className="flex justify-between items-center mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <PencilIcon className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
          </span>
          Edit Task
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 mb-2">
          <div className="flex">
            <ExclamationCircleIcon className="h-3.5 w-3.5 text-red-500 dark:text-red-400 mr-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {/* Title Input */}
        <TaskFormField
          id="title"
          label="Title"
          icon={<PencilIcon className="h-4 w-4" />}
          error={touched.title ? validationErrors.title : undefined}
        >
          {useAI ? (
            <AIEnhancedInput
              id="title"
              value={title}
              onChange={setTitle}
              onBlur={() => handleBlur("title")}
              placeholder="Enter title"
              error={touched.title ? validationErrors.title : undefined}
              fieldType="title"
            />
          ) : (
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleBlur("title")}
              placeholder="Enter title"
              className="form-input py-1.5 text-sm"
            />
          )}
          
          <div className="mt-1 flex items-center">
            <button
              type="button"
              onClick={() => setUseAI(!useAI)}
              className={`text-xs flex items-center ${
                useAI ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <SparklesIcon className="h-3 w-3 mr-0.5" />
              <span>{useAI ? "AI Assist" : "AI Assist Off"}</span>
            </button>
          </div>
        </TaskFormField>
        
        {/* Description TextArea */}
        <TaskFormField
          id="description"
          label="Description"
          error={touched.description ? validationErrors.description : undefined}
        >
          <textarea
            id="description"
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => handleBlur("description")}
            rows={1}
            placeholder="Enter description"
            className="form-input py-1.5 text-sm min-h-[40px]"
          />
        </TaskFormField>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Priority Selector */}
          <PrioritySelector
            value={priority}
            onChange={setPriority}
            onBlur={() => handleBlur("priority")}
            error={touched.priority ? validationErrors.priority : undefined}
          />
          
          {/* Due Date Input */}
          <TaskFormField
            id="dueDate"
            label="Due Date"
            error={touched.dueDate ? validationErrors.dueDate : undefined}
          >
            <input
              type="datetime-local"
              id="dueDate"
              value={dueDate || ""}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={() => handleBlur("dueDate")}
              className="form-input py-1 text-sm dark:bg-gray-800 dark:[color-scheme:dark]"
            />
          </TaskFormField>
        </div>
        
        {/* Category Selector - Keep full width for better UX */}
        <CategorySelector
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
          onBlur={() => handleBlur("categories")}
          error={touched.categories ? validationErrors.categories : undefined}
        />
        
        <div className="grid grid-cols-2 gap-2">
          {/* Emotion Selector */}
          <EmotionSelector
            value={emotion}
            onChange={setEmotion}
            onBlur={() => handleBlur("emotion")}
            error={touched.emotion ? validationErrors.emotion : undefined}
          />
          
          {/* Duration Selector */}
          <DurationSelector
            value={estimatedDuration}
            onChange={setEstimatedDuration}
            onBlur={() => handleBlur("estimatedDuration")}
            error={touched.estimatedDuration ? validationErrors.estimatedDuration : undefined}
          />
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="pt-2 mt-2 flex justify-end items-center border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary py-1 px-3 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary py-1 px-3 text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}