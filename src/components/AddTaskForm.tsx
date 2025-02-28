import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { TagIcon, FaceSmileIcon, PencilIcon, SparklesIcon, PlusIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { validateTaskField, validateTaskForm } from "@/lib/validations";
import { numberToPriority, stringToEmotion } from "@/lib/type-conversions";
import { formatDateForInput } from "@/lib/date-utils";
import { AIEnhancedInput } from './ui/AIEnhancedInput';
import { TaskFormField } from './form-components/TaskFormField';
import { CategorySelector } from './form-components/CategorySelector';
import { PrioritySelector } from './form-components/PrioritySelector';
import { EmotionSelector } from './form-components/EmotionSelector';
import { DurationSelector } from './form-components/DurationSelector';
import { AudioRecorder } from './form-components/AudioRecorder';
import { TemplateSelector } from './form-components/TemplateSelector';
import { DraftManager } from './form-components/DraftManager';
import { useTranslation } from '@/lib/i18n';

interface FormData {
  title: string;
  description: string;
  priority: number;
  dueDate: string;
  selectedCategories: string[];
  emotion: string;
  estimatedDuration: number;
  audioURL?: string | null;
}

/**
 * Task creation form component with AI assistance, template support, and draft saving
 * Refactored to use smaller, more focused component extractions
 */
export function AddTaskForm({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    
    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(0);
    const [dueDate, setDueDate] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [emotion, setEmotion] = useState("");
    const [estimatedDuration, setEstimatedDuration] = useState(0);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    
    // Form handling state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [hasDraft, setHasDraft] = useState(false);
    const [useAI, setUseAI] = useState(true);
    
    // Global state from Zustand store
    const categories = useStore((state) => state.categories);
    const addTask = useStore((state) => state.addTask);
    const addCategory = useStore((state) => state.addCategory);
    
    // Other refs and state
    const formRef = useRef<HTMLFormElement>(null);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6"); // Default blue color
    const [categoryError, setCategoryError] = useState("");

    // Get the current form data for draft saving
    const getFormData = (): FormData => ({
        title,
        description,
        priority,
        dueDate,
        selectedCategories,
        emotion,
        estimatedDuration,
        audioURL
    });
    
    // Check if form is empty
    const isFormEmpty = () => {
        return !title && !description && priority === 0 && !dueDate && 
               selectedCategories.length === 0 && !emotion && estimatedDuration === 0 && !audioURL;
    };
    
    // Load draft from localStorage
    useEffect(() => {
        const draft = localStorage.getItem("taskDraft");
        if (draft) {
            const parsedDraft = JSON.parse(draft);
            setTitle(parsedDraft.title || "");
            setDescription(parsedDraft.description || "");
            setPriority(parsedDraft.priority || 0);
            setDueDate(parsedDraft.dueDate || "");
            setSelectedCategories(parsedDraft.selectedCategories || []);
            setEmotion(parsedDraft.emotion || "");
            setEstimatedDuration(parsedDraft.estimatedDuration || 0);
            setAudioURL(parsedDraft.audioURL || null);
            setHasDraft(true);
        }
    }, []);
    
    // Discard the current draft
    const discardDraft = () => {
        localStorage.removeItem("taskDraft");
        setTitle("");
        setDescription("");
        setPriority(0);
        setDueDate("");
        setSelectedCategories([]);
        setEmotion("");
        setEstimatedDuration(0);
        setAudioURL(null);
        setHasDraft(false);
    };
    
    // Handle field blur for validation
    const handleBlur = (field: string) => {
        setTouched({ ...touched, [field]: true });
        
        const error = validateTaskField(field, { 
            title, description, priority, dueDate, selectedCategories, estimatedDuration
        });
        
        setValidationErrors(prev => ({ ...prev, [field]: error }));
    };
    
    // Validate the entire form
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
    
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            setError("Please fix the errors in the form.");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            // Create the task data
            const taskData = {
                title,
                description,
                priority: numberToPriority(priority),
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                emotion: stringToEmotion(emotion),
                estimatedDuration: estimatedDuration || 0,
                categories: selectedCategories.map(id => ({ id })),
                // If you're storing audio, you'd need to handle this differently
                // This is simplified for this refactoring example
                audioNote: audioURL || undefined,
            };
            
            // Call the API to create the task
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create task");
            }
            
            const newTask = await response.json();
            
            // Update local state with the new task
            addTask(newTask.task);
            
            // Clear the form and draft
            discardDraft();
            
            // Close the form
            if (onClose) onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            console.error("Error creating task:", err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Handle creation of a new category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setCategoryError("Category name is required");
            return;
        }
        
        if (!newCategoryColor) {
            setCategoryError("Please select a color");
            return;
        }
        
        setCategoryError("");
        
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    color: newCategoryColor,
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create category");
            }
            
            const newCategory = await response.json();
            
            // Update local state with the new category
            addCategory(newCategory);
            
            // Select the new category
            setSelectedCategories([...selectedCategories, newCategory.id]);
            
            // Reset the form
            setNewCategoryName("");
            setIsAddingCategory(false);
        } catch (err) {
            setCategoryError(err instanceof Error ? err.message : "An error occurred");
            console.error("Error creating category:", err);
        }
    };
    
    // Handle template selection
    const applyTemplate = (template: any) => {
        if (!template || !template.id) {
            // Clear the form if template is null or has empty ID
            setTitle("");
            setDescription("");
            setPriority(0);
            setEstimatedDuration(0);
            setEmotion("");
            setSelectedCategories([]);
            return;
        }
        
        // Apply template data to form
        setTitle(template.name || "");
        setDescription(template.description || "");
        setPriority(template.priority ? 
            ["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"].indexOf(template.priority) : 0);
        setEstimatedDuration(template.estimatedDuration || 0);
        setEmotion(template.emotion || "");
        
        // Set categories if available
        if (template.categoryIds && template.categoryIds.length > 0) {
            setSelectedCategories(template.categoryIds);
        } else {
            setSelectedCategories([]);
        }
    };
    
    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-2 overflow-hidden pb-2">
            <div className="flex justify-between items-center mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <PlusIcon className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Create Task
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
            
            {/* Template Selector */}
            <TemplateSelector onTemplateSelect={applyTemplate} />
            
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
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={() => handleBlur("description")}
                        rows={1}
                        placeholder="Enter description"
                        className="form-input py-1.5 text-sm min-h-[40px]"
                    />
                    
                    {/* Voice note recorder */}
                    <div className="mt-1">
                        <AudioRecorder onAudioChange={setAudioURL} />
                    </div>
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
                            value={dueDate}
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
                    onAddNew={() => setIsAddingCategory(true)}
                    isAddingNew={isAddingCategory}
                    newCategoryName={newCategoryName}
                    onNewCategoryNameChange={setNewCategoryName}
                    newCategoryColor={newCategoryColor}
                    onNewCategoryColorChange={setNewCategoryColor}
                    onCreateCategory={handleCreateCategory}
                    onCancelAddNew={() => setIsAddingCategory(false)}
                    categoryError={categoryError}
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
            <div className="pt-2 mt-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
                <DraftManager
                    formData={getFormData()}
                    isFormEmpty={isFormEmpty()}
                    hasDraft={hasDraft}
                    setHasDraft={setHasDraft}
                    discardDraft={discardDraft}
                />
                
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
                        ) : "Save"}
                    </button>
                </div>
            </div>
        </form>
    );
}
