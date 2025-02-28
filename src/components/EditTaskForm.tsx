import React, { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Task } from "@prisma/client";
import {
  ClockIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  PencilIcon,
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

  // Memoize icons to prevent recreation on each render
  const pencilIcon = useMemo(() => (
    <PencilIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" aria-hidden="true" />
  ), []);
  
  const clockIcon = useMemo(() => (
    <ClockIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5" aria-hidden="true" />
  ), []);

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    
    // Use shared validation
    const fieldValues = {
      title,
      description,
      estimatedDuration,
      dueDate
    };
    
    const newErrors = validateTaskField(field, fieldValues, touched, validationErrors);
    setValidationErrors(newErrors);
  };

  // Validate all fields
  const validateForm = () => {
    const fieldValues = {
      title,
      description,
      estimatedDuration,
      dueDate
    };
    
    const { isValid, errors } = validateTaskForm(fieldValues);
    setValidationErrors(errors);
    setTouched({
      title: true,
      description: true,
      estimatedDuration: true,
      dueDate: true,
    });
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error element
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField) {
        const errorElement = document.getElementById(firstErrorField);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
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
      
      // Scroll error message into view
      const errorElement = document.getElementById("edit-form-error-message");
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="z-[10001] flex flex-col bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700/70 relative max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700/70 bg-gray-800 sticky top-0 z-20">
          <h2 className="text-base font-medium text-gray-100" id="edit-task-dialog-title">Edit Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            aria-label="Close edit form"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form
          id="edit-task-form"
          onSubmit={handleSubmit}
          className="p-3 space-y-3 overflow-y-auto scrollbar-thin"
          aria-labelledby="edit-task-dialog-title"
          noValidate
          style={{ maxHeight: 'calc(80vh - 120px)' }} // Subtract header and footer heights
        >
          {/* Title */}
          <TaskFormField 
            id="title"
            label="Title"
            icon={pencilIcon}
            touched={touched.title}
            error={validationErrors.title}
            rightElement={
              <button
                type="button"
                onClick={() => setUseAI(!useAI)}
                className={`p-1 rounded-md text-xs flex items-center gap-1 ${
                  useAI 
                    ? 'text-teal-400 bg-teal-900/20' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title={useAI ? "Disable Gemini assistance" : "Enable Gemini assistance"}
              >
                <SparklesIcon className="h-3 w-3" />
                <span>{useAI ? 'Gemini On' : 'Gemini Off'}</span>
              </button>
            }
          >
            {useAI ? (
              <AIEnhancedInput
                id="title"
                value={title}
                onChange={setTitle}
                onBlur={() => handleBlur("title")}
                placeholder="Task title"
                fieldType="title"
                touched={touched.title}
                error={validationErrors.title}
              />
            ) : (
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleBlur("title")}
                className={`block w-full border ${
                  touched.title && validationErrors.title
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                } rounded-md p-2 text-white bg-gray-700 placeholder-gray-400
                  transition-all duration-200 text-sm`}
                placeholder="Task title"
                autoFocus
                aria-required="true"
                aria-invalid={!!(touched.title && validationErrors.title)}
                aria-describedby={validationErrors.title ? "title-error" : undefined}
              />
            )}
          </TaskFormField>

          {/* Description */}
          <TaskFormField 
            id="description"
            label="Description"
            icon={pencilIcon}
            touched={touched.description}
            error={validationErrors.description}
          >
            {useAI ? (
              <AIEnhancedInput
                id="description"
                value={description || ""}
                onChange={setDescription}
                onBlur={() => handleBlur("description")}
                placeholder="Description (optional)"
                fieldType="description"
                type="textarea"
                rows={2}
                touched={touched.description}
                error={validationErrors.description}
              />
            ) : (
              <textarea
                id="description"
                value={description || ""}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleBlur("description")}
                rows={2}
                className={`block w-full border ${
                  touched.description && validationErrors.description
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                } rounded-md p-2 text-white bg-gray-700 placeholder-gray-400
                  transition-all duration-200 text-sm`}
                placeholder="Description (optional)"
                aria-invalid={!!(touched.description && validationErrors.description)}
                aria-describedby={validationErrors.description ? "description-error" : undefined}
              />
            )}
          </TaskFormField>

          {/* Priority */}
          <PrioritySelector 
            selectedPriority={priority} 
            onPriorityChange={setPriority}
          />

          {/* Due Date & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            {/* Due Date */}
            <TaskFormField 
              id="due-date"
              label="Due Date & Time"
              icon={clockIcon}
              touched={touched.dueDate}
              error={validationErrors.dueDate}
            >
              <input
                id="due-date"
                type="datetime-local"
                value={dueDate || ""}
                min={formatDateForInput(new Date(), true)}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={() => handleBlur("dueDate")}
                className={`block w-full border ${
                  touched.dueDate && validationErrors.dueDate
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                } rounded-md p-2 text-white bg-gray-700 placeholder-gray-400
                  transition-all duration-200 text-sm dark:[color-scheme:dark]`}
                aria-invalid={!!(touched.dueDate && validationErrors.dueDate)}
                aria-describedby={validationErrors.dueDate ? "dueDate-error" : undefined}
              />
            </TaskFormField>

            {/* Estimated Duration */}
            <TaskFormField 
              id="estimated-duration"
              label="Estimated Duration"
              icon={clockIcon}
              touched={touched.estimatedDuration}
              error={validationErrors.estimatedDuration}
            >
              <input
                id="estimated-duration"
                type="number"
                min="0"
                max="1440"
                value={estimatedDuration || ""}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                onBlur={() => handleBlur("estimatedDuration")}
                className={`block w-full border ${
                  touched.estimatedDuration &&
                  validationErrors.estimatedDuration
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                } rounded-md p-2 text-white bg-gray-700 placeholder-gray-400
                  transition-all duration-200 text-sm`}
                placeholder="30"
                aria-invalid={!!(touched.estimatedDuration && validationErrors.estimatedDuration)}
                aria-describedby={validationErrors.estimatedDuration ? "estimatedDuration-error" : undefined}
              />
            </TaskFormField>
          </div>

          {/* Emotional State */}
          <EmotionSelector 
            selectedEmotion={emotion} 
            onEmotionChange={setEmotion}
          />

          {/* Categories */}
          <CategorySelector 
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
          />

          {/* Display Error */}
          {error && (
            <div 
              id="edit-form-error-message" 
              className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm flex items-center gap-2"
              role="alert"
              aria-live="assertive"
            >
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-3 border-t border-gray-700/70 bg-gray-800 sticky bottom-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            disabled={isSubmitting}
            aria-label="Cancel edit"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-task-form"
            className="px-3 py-1.5 text-sm text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 inline-flex items-center"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </>
  );
}