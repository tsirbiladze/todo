'use client';

import { useState } from 'react';
import { 
  SparklesIcon, 
  ClockIcon, 
  ListBulletIcon,
  ArrowPathIcon,
  LightBulbIcon 
} from '@heroicons/react/24/outline';
import { 
  prioritizeTasks, 
  estimateTaskDuration, 
  breakdownTask,
  TaskWithCategories,
  TaskPrioritizationResult,
  DurationEstimationResult,
  TaskBreakdownResult
} from '@/lib/ai-service';
import { isAIServiceAvailable } from '@/lib/ai-service';
import { Task, Category } from '@prisma/client';
import toast from 'react-hot-toast';

interface AiTaskAssistantProps {
  tasks?: TaskWithCategories[];
  selectedTask?: Task;
  historicalTasks?: Task[];
  categories?: Category[];
  onBreakdownApply?: (subtasks: { title: string; description?: string; estimatedDuration?: number }[]) => void;
  onPriorityApply?: (taskIds: string[]) => void;
  onEstimateApply?: (estimatedDuration: number) => void;
}

export function AiTaskAssistant({
  tasks = [],
  selectedTask,
  historicalTasks = [],
  categories = [],
  onBreakdownApply,
  onPriorityApply,
  onEstimateApply
}: AiTaskAssistantProps) {
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [prioritizationResult, setPrioritizationResult] = useState<TaskPrioritizationResult | null>(null);
  const [durationEstimation, setDurationEstimation] = useState<DurationEstimationResult | null>(null);
  const [breakdownResult, setBreakdownResult] = useState<TaskBreakdownResult | null>(null);
  const [activeTab, setActiveTab] = useState<'prioritize' | 'estimate' | 'breakdown'>('prioritize');

  const aiAvailable = isAIServiceAvailable();

  // Request task prioritization
  const handlePrioritizeTasks = async () => {
    if (!tasks.length) {
      toast.error('You need at least one task to prioritize');
      return;
    }

    setIsPrioritizing(true);
    setPrioritizationResult(null);

    try {
      // Call the AI service to prioritize tasks
      const result = await prioritizeTasks(tasks);
      setPrioritizationResult(result);
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
      toast.error('Failed to prioritize tasks. Please try again.');
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Request task duration estimation
  const handleEstimateDuration = async () => {
    if (!selectedTask) {
      toast.error('Please select a task to estimate');
      return;
    }

    setIsEstimating(true);
    setDurationEstimation(null);

    try {
      // Call the AI service to estimate task duration
      const result = await estimateTaskDuration(
        selectedTask, 
        historicalTasks,
        categories.filter(c => 
          selectedTask.categories?.some(tc => tc.id === c.id)
        )
      );
      setDurationEstimation(result);
    } catch (error) {
      console.error('Error estimating duration:', error);
      toast.error('Failed to estimate task duration. Please try again.');
    } finally {
      setIsEstimating(false);
    }
  };

  // Request task breakdown
  const handleBreakdownTask = async () => {
    if (!selectedTask) {
      toast.error('Please select a task to break down');
      return;
    }

    setIsBreakingDown(true);
    setBreakdownResult(null);

    try {
      // Call the AI service to break down the task
      const result = await breakdownTask(selectedTask);
      setBreakdownResult(result);
    } catch (error) {
      console.error('Error breaking down task:', error);
      toast.error('Failed to break down task. Please try again.');
    } finally {
      setIsBreakingDown(false);
    }
  };

  // Apply the prioritization result
  const handleApplyPrioritization = () => {
    if (!prioritizationResult || !onPriorityApply) return;
    onPriorityApply(prioritizationResult.suggestedOrder);
    toast.success('Applied AI task prioritization');
  };

  // Apply the duration estimation
  const handleApplyEstimation = () => {
    if (!durationEstimation || !onEstimateApply) return;
    onEstimateApply(durationEstimation.estimatedMinutes);
    toast.success('Applied AI duration estimation');
  };

  // Apply the task breakdown
  const handleApplyBreakdown = () => {
    if (!breakdownResult || !onBreakdownApply) return;
    onBreakdownApply(breakdownResult.subtasks);
    toast.success('Applied AI task breakdown');
  };

  if (!aiAvailable) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center mb-3">
          <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="text-md font-semibold">AI Task Assistant</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          AI features are not available. Please check your environment configuration.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
        <h3 className="text-lg font-semibold">AI Task Assistant</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-600 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'prioritize'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('prioritize')}
        >
          <div className="flex items-center">
            <ListBulletIcon className="h-4 w-4 mr-1" />
            Prioritize
          </div>
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'estimate'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('estimate')}
          disabled={!selectedTask}
        >
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            Estimate Time
          </div>
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'breakdown'
              ? 'text-purple-600 border-b-2 border-purple-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('breakdown')}
          disabled={!selectedTask}
        >
          <div className="flex items-center">
            <LightBulbIcon className="h-4 w-4 mr-1" />
            Break Down
          </div>
        </button>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'prioritize' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Let AI analyze your tasks and suggest the optimal order based on deadlines, priorities, and task relationships.
            </p>
            <button
              onClick={handlePrioritizeTasks}
              disabled={isPrioritizing || tasks.length === 0}
              className="mb-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrioritizing ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Prioritize {tasks.length} Tasks
                </>
              )}
            </button>

            {/* Show prioritization results */}
            {prioritizationResult && (
              <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm">
                <h4 className="font-medium text-sm mb-2">Suggested Task Order:</h4>
                <ol className="list-decimal list-inside mb-3 text-sm">
                  {prioritizationResult.suggestedOrder.map((taskId) => {
                    const task = tasks.find((t) => t.id === taskId);
                    return task ? (
                      <li key={taskId} className="py-1">
                        {task.title}
                      </li>
                    ) : null;
                  })}
                </ol>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <h5 className="font-medium">Reasoning:</h5>
                  <p>{prioritizationResult.reasoning}</p>
                </div>
                {onPriorityApply && (
                  <button
                    onClick={handleApplyPrioritization}
                    className="inline-flex items-center px-3 py-1 text-xs bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
                  >
                    Apply This Order
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'estimate' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Use AI to estimate how long this task will take based on historical task data.
            </p>
            {selectedTask ? (
              <>
                <div className="mb-3 px-3 py-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-sm">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {selectedTask.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleEstimateDuration}
                  disabled={isEstimating}
                  className="mb-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEstimating ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Estimate Duration
                    </>
                  )}
                </button>

                {/* Show duration estimation results */}
                {durationEstimation && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-sm">Estimated Duration:</h4>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${
                        durationEstimation.confidence === 'high' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : durationEstimation.confidence === 'medium'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {durationEstimation.confidence.charAt(0).toUpperCase() + durationEstimation.confidence.slice(1)} confidence
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-center my-3 text-purple-600 dark:text-purple-400">
                      {durationEstimation.estimatedMinutes} minutes
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <h5 className="font-medium">Reasoning:</h5>
                      <p>{durationEstimation.reasoning}</p>
                    </div>
                    {onEstimateApply && (
                      <button
                        onClick={handleApplyEstimation}
                        className="inline-flex items-center px-3 py-1 text-xs bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
                      >
                        Apply Estimation
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Select a task first to estimate its duration</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Break down vague tasks into concrete, actionable subtasks with AI assistance.
            </p>
            {selectedTask ? (
              <>
                <div className="mb-3 px-3 py-2 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-sm">{selectedTask.title}</h4>
                  {selectedTask.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {selectedTask.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleBreakdownTask}
                  disabled={isBreakingDown}
                  className="mb-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBreakingDown ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <LightBulbIcon className="h-4 w-4 mr-2" />
                      Break Down Task
                    </>
                  )}
                </button>

                {/* Show task breakdown results */}
                {breakdownResult && (
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-md shadow-sm">
                    <h4 className="font-medium text-sm mb-2">Suggested Subtasks:</h4>
                    <ul className="space-y-2 mb-3">
                      {breakdownResult.subtasks.map((subtask, index) => (
                        <li key={index} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{subtask.title}</span>
                            {subtask.estimatedDuration && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ~{subtask.estimatedDuration} min
                              </span>
                            )}
                          </div>
                          {subtask.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {subtask.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <h5 className="font-medium">Approach:</h5>
                      <p>{breakdownResult.reasoning}</p>
                    </div>
                    {onBreakdownApply && (
                      <button
                        onClick={handleApplyBreakdown}
                        className="inline-flex items-center px-3 py-1 text-xs bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
                      >
                        Add as Subtasks
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <LightBulbIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Select a task first to break it down</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 