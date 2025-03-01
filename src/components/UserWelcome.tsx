"use client";

import { useStore } from "@/lib/store";
import { formatGreeting } from "@/lib/utils";

export function UserWelcome() {
  const user = useStore((state) => state.user);
  const tasks = useStore((state) => state.tasks);
  
  const completedTasksToday = tasks?.filter(
    (task) => 
      task.completed && 
      new Date(task.completedAt || Date.now()).toDateString() === new Date().toDateString()
  ).length || 0;
  
  const pendingTasksToday = tasks?.filter(
    (task) => 
      !task.completed && 
      new Date(task.dueDate || Date.now()).toDateString() === new Date().toDateString()
  ).length || 0;
  
  const greeting = formatGreeting();
  const userName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="mb-8 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-6 dark:from-primary/20 dark:to-primary/10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        {greeting}, {userName}!
      </h1>
      
      <p className="text-gray-600 dark:text-gray-300">
        {completedTasksToday > 0 
          ? `You've completed ${completedTasksToday} ${completedTasksToday === 1 ? 'task' : 'tasks'} today. `
          : 'No tasks completed yet today. '}
        {pendingTasksToday > 0 
          ? `You have ${pendingTasksToday} ${pendingTasksToday === 1 ? 'task' : 'tasks'} remaining for today.`
          : 'No pending tasks for today.'}
      </p>
    </div>
  );
} 