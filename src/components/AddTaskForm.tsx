import React, { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { ClockIcon, TagIcon, FaceSmileIcon, MicrophoneIcon, StopIcon, PlusCircleIcon, XMarkIcon, ExclamationCircleIcon, PencilIcon, SparklesIcon, DocumentDuplicateIcon, } from "@heroicons/react/24/outline";
import { debounce } from "lodash";
import { ArrowsPointingOutIcon, PauseIcon, PlayIcon, TrashIcon, } from "@heroicons/react/24/solid";
import { emotionOptions } from "@/data/emotions";
import { colorOptions } from "@/data/colors";
import { priorityOptions } from "@/data/priorities";
import { validateTaskField, validateTaskForm } from "@/lib/validations";
import { numberToPriority, stringToEmotion } from "@/lib/type-conversions";
import { formatDateForInput } from "@/lib/date-utils";
import { AIEnhancedInput } from './ui/AIEnhancedInput';
import { TaskFormField } from './form-components/TaskFormField';
export function AddTaskForm({ onClose }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState(0);
    const [dueDate, setDueDate] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [emotion, setEmotion] = useState("");
    const [estimatedDuration, setEstimatedDuration] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0]);
    const [categoryError, setCategoryError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [touched, setTouched] = useState({});
    const categories = useStore((state) => state.categories);
    const addTask = useStore((state) => state.addTask);
    const addCategory = useStore((state) => state.addCategory);
    const formRef = useRef(null);
    // Add new state for draft
    const [draftStatus, setDraftStatus] = useState("none");
    const [hasDraft, setHasDraft] = useState(false);
    const [useAI, setUseAI] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
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
            setHasDraft(true);
        }
    }, []);
    // Auto-save draft (debounced)
    const saveDraft = useCallback(debounce((formData) => {
        localStorage.setItem("taskDraft", JSON.stringify(formData));
        setDraftStatus("saved");
        setHasDraft(true);
        // Auto-hide the "saved" message after 3 seconds
        setTimeout(() => {
            setDraftStatus("none");
        }, 3000);
    }, 1000), []);
    useEffect(() => {
        // Only save if there's actually content
        if (title || description || priority > 0 || dueDate || selectedCategories.length > 0 || emotion || estimatedDuration > 0) {
            const formData = {
                title,
                description,
                priority,
                dueDate,
                selectedCategories,
                emotion,
                estimatedDuration,
            };
            setDraftStatus("saving");
            saveDraft(formData);
        }
    }, [
        title,
        description,
        priority,
        dueDate,
        selectedCategories,
        emotion,
        estimatedDuration,
        saveDraft,
    ]);
    // Function to discard draft
    const discardDraft = () => {
        localStorage.removeItem("taskDraft");
        setTitle("");
        setDescription("");
        setPriority(0);
        setDueDate("");
        setSelectedCategories([]);
        setEmotion("");
        setEstimatedDuration(0);
        setHasDraft(false);
        setDraftStatus("none");
    };
    // Validate fields on blur
    const handleBlur = (field) => {
        setTouched((prev) => (Object.assign(Object.assign({}, prev), { [field]: true })));
        const fieldValues = { title, description, estimatedDuration, dueDate };
        const newErrors = validateTaskField(field, fieldValues, touched, validationErrors);
        setValidationErrors(newErrors);
    };
    // Validate entire form
    const validateForm = () => {
        const fieldValues = { title, description, estimatedDuration, dueDate };
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            // Scroll to first error if needed
            const firstErrorField = Object.keys(validationErrors)[0];
            if (firstErrorField) {
                const errorElement = document.getElementById(firstErrorField);
                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
                    errorElement.focus();
                }
            }
            return;
        }
        setIsSubmitting(true);
        setError("");
        const newTask = {
            title: title.trim(),
            description: description ? description.trim() : null,
            priority: numberToPriority(priority),
            dueDate: dueDate ? new Date(dueDate) : null,
            completedAt: null,
            emotion: emotion ? stringToEmotion(emotion) : undefined,
            estimatedDuration: estimatedDuration || null,
            categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        };
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTask),
            });
            // Attempt JSON parse if possible
            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }
            if (!response.ok) {
                throw new Error(data.error || "Failed to create task");
            }
            // Might be empty or 204
            let taskData = data.task;
            if (!taskData && response.ok) {
                // Create a temporary local object that matches TaskWithRelations
                // We need to cast this to TaskWithRelations since it's a temporary object
                const tempTaskData = Object.assign(Object.assign({}, newTask), { id: `temp-${Date.now()}`, title: title.trim(), description: description ? description.trim() : null, priority: numberToPriority(priority), dueDate: dueDate ? new Date(dueDate) : null, completedAt: null, emotion: emotion ? stringToEmotion(emotion) : null, estimatedDuration: estimatedDuration || null, createdAt: new Date(), updatedAt: new Date(), userId: "temp-user", recurring: null, recurringTaskId: null, goal: undefined, categories: selectedCategories.length > 0
                        ? selectedCategories.map(id => {
                            var _a, _b;
                            return ({
                                id,
                                name: ((_a = categories.find(cat => cat.id === id)) === null || _a === void 0 ? void 0 : _a.name) || "",
                                color: ((_b = categories.find(cat => cat.id === id)) === null || _b === void 0 ? void 0 : _b.color) || "",
                                userId: "temp-user",
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                        })
                        : [] });
                // First convert to unknown, then to TaskWithRelations to avoid type errors
                taskData = tempTaskData;
            }
            if (taskData) {
                addTask(taskData);
            }
            localStorage.removeItem("taskDraft");
            setHasDraft(false);
            // Reset
            setTitle("");
            setDescription("");
            setPriority(0);
            setDueDate("");
            setSelectedCategories([]);
            setEmotion("");
            setEstimatedDuration(0);
            setValidationErrors({});
            setTouched({});
            if (onClose)
                onClose();
        }
        catch (err) {
            console.error("Error creating task:", err);
            setError(err instanceof Error
                ? err.message
                : "Failed to create task. Please try again.");
            const errorElement = document.getElementById("form-error-message");
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // Audio
    const playAudio = () => {
        if (audioRef.current && audioURL) {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };
    const pauseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };
    const clearAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setAudioURL(null);
        setIsPlaying(false);
    };
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.onended = () => setIsPlaying(false);
        }
    }, [audioURL]);
    // Voice Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];
            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };
            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                setTitle((old) => old + " [Voice Note]");
            };
            mediaRecorder.current.start();
            setIsRecording(true);
        }
        catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };
    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };
    // Create Category
    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setCategoryError("Category name is required");
            return;
        }
        if (newCategoryName.length > 30) {
            setCategoryError("Category name is too long (max 30 characters)");
            return;
        }
        if (categories.some((cat) => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
            setCategoryError("A category with this name already exists");
            return;
        }
        setCategoryError("");
        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    color: newCategoryColor,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to create category");
            }
            addCategory(data.category);
            setSelectedCategories((prev) => [...prev, data.category.id]);
            setNewCategoryName("");
            setIsAddingCategory(false);
        }
        catch (err) {
            console.error("Error creating category:", err);
            setCategoryError(err instanceof Error ? err.message : "Failed to create category");
        }
    };
    // Add useEffect to fetch templates when the component mounts
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoadingTemplates(true);
            try {
                const response = await fetch('/api/templates');
                if (response.ok) {
                    const data = await response.json();
                    console.log('Templates loaded:', data.length);
                    setTemplates(data);
                }
            }
            catch (error) {
                console.error('Error fetching templates:', error);
            }
            finally {
                setIsLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);
    // Add a function to apply the selected template
    const applyTemplate = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (!template)
            return;
        // Set basic fields
        setTitle(template.name);
        setDescription(template.description || '');
        // Set priority - handle mapping between template priority and UI priority value
        const priorityMapping = {
            'NONE': 0,
            'LOW': 1,
            'MEDIUM': 2,
            'HIGH': 3
        };
        setPriority(priorityMapping[template.priority] || 0);
        // Set categories
        if (template.categoryIds && template.categoryIds.length > 0) {
            // Verify categoryIds exist in the current categories list
            const validCategoryIds = template.categoryIds.filter((id) => categories.some(cat => cat.id === id));
            setSelectedCategories(validCategoryIds);
        }
        else {
            setSelectedCategories([]);
        }
        // Set emotion
        if (template.emotion) {
            // Log the emotion for debugging
            console.log('Setting emotion from template:', template.emotion);
            setEmotion(template.emotion);
            // Verify if the emotion is one of the valid options
            const validEmotion = emotionOptions.some(opt => opt.value === template.emotion);
            if (!validEmotion) {
                console.warn('Template emotion not found in options:', template.emotion);
            }
        }
        else {
            setEmotion("");
        }
        // Set duration
        setEstimatedDuration(template.estimatedDuration || 0);
        // Handle recurring tasks
        if (template.isRecurring && template.recurrence) {
            // Calculate due date based on recurrence settings
            const now = new Date();
            const nextDueDate = new Date();
            const { frequency, interval, daysOfWeek, dayOfMonth } = template.recurrence;
            switch (frequency) {
                case 'daily':
                    nextDueDate.setDate(nextDueDate.getDate() + interval);
                    break;
                case 'weekly':
                    if (daysOfWeek && daysOfWeek.length > 0) {
                        // Find next occurrence of specified day(s)
                        const currentDay = nextDueDate.getDay();
                        const nextDay = daysOfWeek.find((day) => day > currentDay) || daysOfWeek[0];
                        const daysToAdd = nextDay > currentDay
                            ? nextDay - currentDay
                            : 7 - currentDay + nextDay;
                        nextDueDate.setDate(nextDueDate.getDate() + daysToAdd);
                    }
                    else {
                        nextDueDate.setDate(nextDueDate.getDate() + (7 * interval));
                    }
                    break;
                case 'monthly':
                    if (dayOfMonth) {
                        nextDueDate.setDate(dayOfMonth);
                        if (nextDueDate < now) {
                            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                        }
                    }
                    else {
                        nextDueDate.setMonth(nextDueDate.getMonth() + interval);
                    }
                    break;
            }
            // Set the calculated due date
            setDueDate(formatDateForInput(nextDueDate));
        }
        // Update the selected template state
        setSelectedTemplate(templateId);
        // Mark all fields as touched to show validation if needed
        setTouched({
            title: true,
            description: true,
            estimatedDuration: true,
            dueDate: true,
        });
        // Validate form after applying template
        validateForm();
        // Show confirmation
        console.log('Template applied:', template.name);
    };
    return (<div 
    // Now *just* the modal container; no second backdrop
    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                 max-w-md w-[calc(100%-2rem)] max-h-[90vh]">
      <div className="flex flex-col bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700/70 w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700/70 bg-gray-800 sticky top-0 z-20">
          <h2 className="text-base font-medium text-gray-100">Add New Task</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-700 
                       focus:outline-none focus:ring-2 focus:ring-gray-500 
                       transition-colors duration-200" aria-label="Close form">
            <XMarkIcon className="h-5 w-5" aria-hidden="true"/>
          </button>
        </div>

        {/* Form */}
        <form id="task-form" ref={formRef} className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(90vh-130px)]" onSubmit={handleSubmit}>
          {/* Draft Status Indicator */}
          {draftStatus !== "none" && (<div className="absolute top-2 right-2 text-xs bg-gray-700 px-2 py-1 rounded-full flex items-center">
              {draftStatus === "saving" ? (<>
                  <svg className="animate-spin h-3 w-3 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving draft...
                </>) : (<>
                  <svg className="h-3 w-3 mr-1 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  Draft saved
                </>)}
            </div>)}
          
          {/* Draft Recovery Notice */}
          {hasDraft && (<div className="flex items-center justify-between bg-gray-700 p-2 rounded-md text-sm mb-4">
              <span className="text-gray-300">You have a saved draft.</span>
              <button type="button" onClick={discardDraft} className="text-red-400 hover:text-red-300 text-xs ml-2">
                Discard draft
              </button>
            </div>)}
          
          {/* Error Message */}
          {error && (<div id="form-error-message" className="bg-red-900/50 text-red-200 p-3 rounded-md text-sm mb-4 flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5"/>
              <span>{error}</span>
            </div>)}

          {/* Template Selector */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="flex items-center text-sm font-medium text-gray-300 gap-1.5">
                <DocumentDuplicateIcon className="h-3.5 w-3.5 text-gray-400"/>
                Use Template
              </label>
              {selectedTemplate && (<button type="button" onClick={() => {
                setSelectedTemplate(null);
                // Reset form to default values
                setTitle("");
                setDescription("");
                setPriority(0);
                setDueDate("");
                setSelectedCategories([]);
                setEmotion("");
                setEstimatedDuration(0);
            }} className="text-xs text-gray-400 hover:text-red-300 transition-colors">
                  Clear template
                </button>)}
            </div>
            <select
            className="block w-full border border-gray-600 rounded-md p-2 
                text-white bg-gray-700 focus:border-primary-500 focus:ring-primary-500 
                focus:outline-none focus:ring-1 text-sm transition-all duration-200"
            value={selectedTemplate?.id || ""}
            onChange={(e) => {
                const selectedTemplateId = e.target.value;
                const template = templates.find(t => t.id === selectedTemplateId);
                if (template) {
                    setSelectedTemplate(template);
                }
                else {
                    setSelectedTemplate(null);
                }
            }}>
              <option value="">Select a template</option>
              {Array.isArray(templates) && templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {selectedTemplate && (<div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                <SparklesIcon className="h-3 w-3"/>
                Template applied! Priority, categories and other settings have been updated.
              </div>)}
            {isLoadingTemplates && (<div className="mt-1 text-xs text-gray-400">Loading templates...</div>)}
            {templates.length === 0 && !isLoadingTemplates && (<div className="mt-1 text-xs text-gray-400">
                No templates available. You can create templates in the Templates section.
              </div>)}
          </div>

          {/* Title */}
          <TaskFormField id="title" label="Title" icon={<PencilIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>} touched={touched.title} error={validationErrors.title} rightElement={<button type="button" onClick={() => setUseAI(!useAI)} className={`p-1 rounded-md text-xs flex items-center gap-1 ${useAI
                ? 'text-teal-400 bg-teal-900/20'
                : 'text-gray-400 hover:text-gray-300'}`} title={useAI ? "Disable Gemini assistance" : "Enable Gemini assistance"}>
                <SparklesIcon className="h-3 w-3"/>
                <span>{useAI ? 'Gemini On' : 'Gemini Off'}</span>
              </button>}>
            {useAI ? (<AIEnhancedInput id="title" value={title} onChange={setTitle} onBlur={() => handleBlur("title")} placeholder="Task title" fieldType="title" touched={touched.title} error={validationErrors.title}/>) : (<input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => handleBlur("title")} className={`block w-full border ${touched.title && validationErrors.title
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-600 focus:border-primary-500 focus:ring-primary-500"} rounded-md p-2 text-white bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1
                  transition-all duration-200 text-sm`} placeholder="Task title" autoFocus/>)}
          </TaskFormField>

          {/* Description */}
          <TaskFormField id="description" label="Description" icon={<PencilIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>} touched={touched.description} error={validationErrors.description}>
            {useAI ? (<AIEnhancedInput id="description" value={description || ""} onChange={setDescription} onBlur={() => handleBlur("description")} placeholder="Description (optional)" fieldType="description" type="textarea" rows={2} touched={touched.description} error={validationErrors.description}/>) : (<textarea id="description" value={description || ""} onChange={(e) => setDescription(e.target.value)} onBlur={() => handleBlur("description")} rows={2} placeholder="Description (optional)" className={`block w-full border ${touched.description && validationErrors.description
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-600 focus:border-primary-500 focus:ring-primary-500"} rounded-md p-2 text-white bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1
                  transition-all duration-200 text-sm`}/>)}
          </TaskFormField>

          {/* Voice Input */}
          <div>
            <div className="flex items-center text-xs font-medium text-gray-300 mb-1">
              <MicrophoneIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>
              <label>Voice Input</label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`flex items-center justify-center px-2.5 py-1.5 rounded-md text-xs font-medium 
                ${isRecording
            ? "bg-red-900/30 text-red-400 border border-red-800/50"
            : "bg-primary-900/30 text-primary-400 border border-primary-800/50"} flex-1 transition-colors duration-200`}>
                {isRecording ? (<>
                    <StopIcon className="h-3.5 w-3.5 mr-1"/>
                    Stop Recording
                  </>) : (<>
                    <MicrophoneIcon className="h-3.5 w-3.5 mr-1"/>
                    Record Voice
                  </>)}
              </button>
              {audioURL && !isRecording && (<>
                  <button type="button" onClick={isPlaying ? pauseAudio : playAudio} className="flex items-center justify-center px-2 py-1.5 bg-gray-700 text-gray-200 
                               rounded-md text-xs font-medium border border-gray-600">
                    {isPlaying ? (<PauseIcon className="h-3.5 w-3.5"/>) : (<PlayIcon className="h-3.5 w-3.5"/>)}
                  </button>
                  <button type="button" onClick={clearAudio} className="flex items-center justify-center px-2 py-1.5 bg-gray-700 text-gray-200 
                               rounded-md text-xs font-medium border border-gray-600">
                    <TrashIcon className="h-3.5 w-3.5"/>
                  </button>
                </>)}
            </div>
            {audioURL && (<div className="mt-2 p-2 bg-gray-700/50 border border-gray-600 rounded-md">
                <audio ref={audioRef} src={audioURL} className="w-full" controls/>
              </div>)}
          </div>

          {/* Priority */}
          <div>
            <div className="flex items-center text-xs font-medium text-gray-300 mb-1">
              <ArrowsPointingOutIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>
              <label htmlFor="priority-buttons">Priority</label>
            </div>
            <div id="priority-buttons" className="flex flex-wrap gap-2">
              {priorityOptions.map((option) => (<button key={option.value} type="button" onClick={() => setPriority(option.value)} className={`px-2.5 py-1 rounded-md text-xs font-medium border 
                  transition-all duration-200 ${priority === option.value
                ? `${option.color
                    .replace("bg-", "bg-")
                    .replace("-100", "-900/30")} 
                         ${option.textColor.replace("text-", "text-")} 
                         border-${option.color.split("-")[1]}-600`
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"}`}>
                  {option.label}
                </button>))}
            </div>
          </div>

          {/* Due Date & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            {/* Due Date */}
            <div>
              <div className="flex items-center text-xs font-medium text-gray-300 mb-1">
                <ClockIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>
                <label htmlFor="due-date">Due Date & Time</label>
              </div>
              <input id="due-date" type="datetime-local" value={dueDate || ""} min={formatDateForInput(new Date(), true)} onChange={(e) => setDueDate(e.target.value)} onBlur={() => handleBlur("dueDate")} className={`block w-full border ${touched.dueDate && validationErrors.dueDate
            ? "border-red-500"
            : "border-gray-600"} rounded-md p-2 text-white bg-gray-700 placeholder-gray-400 
                focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm
                dark:[color-scheme:dark]`}/>
              {touched.dueDate && validationErrors.dueDate && (<div className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3"/>
                  {validationErrors.dueDate}
                </div>)}
            </div>

            {/* Estimated Duration */}
            <div>
              <div className="flex items-center text-xs font-medium text-gray-300 mb-1">
                <ClockIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>
                <label htmlFor="estimated-duration">Estimated Duration</label>
              </div>
              <input id="estimated-duration" type="number" min="0" max="1440" value={estimatedDuration || ""} onChange={(e) => setEstimatedDuration(Number(e.target.value))} onBlur={() => handleBlur("estimatedDuration")} className={`block w-full border ${touched.estimatedDuration && validationErrors.estimatedDuration
            ? "border-red-500"
            : "border-gray-600"} rounded-md p-2 text-white bg-gray-700 placeholder-gray-400 
                focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm`} placeholder="30"/>
              {touched.estimatedDuration && validationErrors.estimatedDuration && (<div className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <ExclamationCircleIcon className="h-3 w-3"/>
                  {validationErrors.estimatedDuration}
                </div>)}
            </div>
          </div>

          {/* Emotional State */}
          <div>
            <div className="flex items-center text-xs font-medium text-gray-300 mb-1">
              <FaceSmileIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>
              <label htmlFor="emotion-section">
                How do you feel about this task?
              </label>
            </div>
            <div id="emotion-section" className="flex flex-wrap gap-2">
              {emotionOptions.map((option) => (<button key={option.value} type="button" onClick={() => setEmotion(option.value)} className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 
                  transition-all duration-200 ${emotion === option.value
                ? `bg-${option.color.split("-")[1]}-900/30 text-${option.color.split("-")[1]}-400 border border-${option.color.split("-")[1]}-600`
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"}`}>
                  <span role="img" aria-label={option.label}>
                    {option.emoji}
                  </span>
                  <span>{option.label}</span>
                </button>))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center text-xs font-medium text-gray-300 mb-1">
              <TagIcon className="h-3.5 w-3.5 text-gray-400 mr-1.5"/>
              <label htmlFor="categories-section">Categories</label>
            </div>
            <div id="categories-section" className="flex flex-wrap gap-2 mb-2">
              {categories.map((category) => (<button key={category.id} type="button" onClick={() => {
                if (selectedCategories.includes(category.id)) {
                    setSelectedCategories((prev) => prev.filter((id) => id !== category.id));
                }
                else {
                    setSelectedCategories((prev) => [...prev, category.id]);
                }
            }} className={`px-2.5 py-1 rounded text-xs font-medium 
                  transition-all duration-200 ${selectedCategories.includes(category.id)
                ? "shadow-sm border"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"}`} style={{
                backgroundColor: selectedCategories.includes(category.id)
                    ? `${category.color}25`
                    : "",
                color: selectedCategories.includes(category.id)
                    ? category.color
                    : "",
                borderColor: selectedCategories.includes(category.id)
                    ? category.color
                    : "",
            }}>
                  {category.name}
                </button>))}
            </div>

            {!isAddingCategory && (<button type="button" onClick={() => setIsAddingCategory(true)} className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium 
                           bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600
                           transition-colors duration-200">
                <PlusCircleIcon className="w-3.5 h-3.5"/>
                <span>Add Category</span>
              </button>)}

            {isAddingCategory && (<div className="mt-2 p-2 border border-gray-700 rounded-md bg-gray-800/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-300">
                    Add New Category
                  </div>
                  <button type="button" onClick={() => {
                setIsAddingCategory(false);
                setCategoryError("");
            }} className="text-gray-500 hover:text-gray-300 transition-colors duration-200">
                    <XMarkIcon className="h-3.5 w-3.5"/>
                  </button>
                </div>

                <div>
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="block w-full border border-gray-600 rounded-md p-1.5 mb-1.5 
                               text-white bg-gray-700 placeholder-gray-400 text-xs 
                               focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="Category name"/>
                  {categoryError && (<div className="text-xs text-red-400 mb-1.5">
                      {categoryError}
                    </div>)}

                  <div className="mb-1.5">
                    <div className="text-xs text-gray-300 mb-1">Color</div>
                    <div className="flex flex-wrap gap-1.5">
                      {colorOptions.map((color) => (<button key={color} type="button" onClick={() => setNewCategoryColor(color)} className={`w-4 h-4 rounded-full ${newCategoryColor === color
                    ? "ring-2 ring-offset-1 ring-gray-300 ring-offset-gray-800"
                    : ""} transition-all duration-200`} style={{ backgroundColor: color }} aria-label={`Select color: ${color}`}/>))}
                    </div>
                  </div>

                  <button type="button" onClick={handleCreateCategory} className="w-full px-2.5 py-1 rounded text-xs font-medium 
                               bg-primary-600 text-white hover:bg-primary-700 
                               transition-colors duration-200">
                    Create Category
                  </button>
                </div>
              </div>)}
          </div>
        </form>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700/70 bg-gray-800 sticky bottom-0 z-20">
          <button type="submit" form="task-form" disabled={isSubmitting} onClick={(e) => {
            e.preventDefault();
            const formEl = document.getElementById("task-form");
            if (formEl) {
                formEl.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
            }
            else {
                // Fallback
                handleSubmit(e);
            }
        }} className="w-full px-3 py-2 bg-blue-500 text-white font-medium rounded-md 
                       hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 
                       focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-blue-700/70
                       disabled:cursor-not-allowed transition-all duration-200 text-sm">
            {isSubmitting ? "Adding Task..." : "Save Task"}
          </button>
        </div>
      </div>
    </div>);
}
