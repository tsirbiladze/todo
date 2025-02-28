import { Task } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';

export type ReminderType = 
  | 'encouragement' 
  | 'check_in' 
  | 'task_reminder' 
  | 'break_reminder' 
  | 'next_task' 
  | 'progress_update'
  | 'greeting';

/**
 * Service for generating contextual AI reminders and messages
 */
export class AiReminderService {
  private static timeMessages = [
    "Time check: You've been focused for {{time}}.",
    "You're {{time}} into your focus session. Keep it up!",
    "Just checking in - you've been working for {{time}}.",
    "Quick update: {{time}} of focused work so far.",
  ];

  private static encouragementMessages = [
    "You're making great progress! Keep going!",
    "You've got this! Each step forward matters.",
    "Your focus right now is building better habits.",
    "Remember why this task matters to you.",
    "Small steps lead to big accomplishments.",
    "I believe in you - you can do this!",
    "The hardest part is starting, and you've already begun!",
    "Stay in the present moment with this task.",
    "Even imperfect progress moves you forward.",
  ];

  private static checkInMessages = [
    "How's it going with your current task?",
    "Are you still working on the task, or have you finished?",
    "Is everything going smoothly with what you're working on?",
    "Do you need any help breaking down your current task?",
    "How's your focus level right now?",
    "Are you feeling productive with this task?",
    "Just checking in - making progress?",
    "Is this task more challenging than you expected?",
    "Would it help to take a different approach to this task?",
  ];

  private static breakReminderMessages = [
    "You've been working for a while. Consider taking a short break soon.",
    "Your brain needs rest periods to maintain focus. Maybe stretch in a few minutes?",
    "Remember to give your eyes a break from the screen occasionally.",
    "When you reach a good stopping point, a 5-minute break would be refreshing.",
    "Scheduled breaks improve overall productivity. Think about taking one soon.",
    "Consider a quick break in the next few minutes to stay fresh.",
    "It might be a good time for a short break after you finish this section.",
    "Taking microbreaks has been shown to improve focus. Just a thought!",
  ];

  private static greetingMessages = [
    "Welcome to Focus Mode! I'm here to help you stay on track.",
    "Ready for a productive session? I'll be here if you need anything.",
    "Let's make this focus session a great one!",
    "Focus Mode activated! I'll check in occasionally to help you stay on track.",
    "I'm here to support your focus session. Let's accomplish something together!",
    "Great to see you in Focus Mode! I'll provide gentle reminders along the way.",
  ];

  private static taskReminderMessages = [
    "Just a reminder: You're working on '{{taskTitle}}'.",
    "Current task: '{{taskTitle}}' - staying on track?",
    "Don't forget your current focus: '{{taskTitle}}'.",
    "You selected '{{taskTitle}}' as your focus. How's it coming along?",
    "Re-centering: Your current task is '{{taskTitle}}'.",
  ];

  private static nextTaskMessages = [
    "When you finish this task, '{{nextTaskTitle}}' is up next.",
    "Looking ahead: '{{nextTaskTitle}}' is your next priority.",
    "After this, remember you planned to work on '{{nextTaskTitle}}'.",
    "Your next task in the queue is '{{nextTaskTitle}}'.",
    "Once you're done here, '{{nextTaskTitle}}' is waiting for your attention.",
  ];

  private static progressUpdateMessages = [
    "You've completed {{completedCount}} tasks today. Making good progress!",
    "Today's progress: {{completedCount}} tasks completed, {{remainingCount}} to go.",
    "You're {{percentComplete}}% through your tasks for today!",
    "Progress update: {{completedCount}} down, {{remainingCount}} to go.",
    "You've already finished {{completedCount}} tasks today - that's something to be proud of!",
  ];

  /**
   * Get a random message of the specified type
   */
  private static getRandomMessage(array: string[]): string {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate a greeting message
   */
  static getGreeting(): string {
    return this.getRandomMessage(this.greetingMessages);
  }

  /**
   * Generate a contextual reminder message based on the specified type and context
   */
  static generateReminder(
    type: ReminderType,
    context: {
      currentTask?: Task;
      nextTask?: Task;
      focusStartTime?: Date;
      completedTasks?: Task[];
      remainingTasks?: Task[];
    } = {}
  ): string {
    const { currentTask, nextTask, focusStartTime, completedTasks = [], remainingTasks = [] } = context;
    
    switch (type) {
      case 'greeting':
        return this.getRandomMessage(this.greetingMessages);
      
      case 'encouragement':
        return this.getRandomMessage(this.encouragementMessages);
      
      case 'check_in':
        return this.getRandomMessage(this.checkInMessages);
      
      case 'break_reminder':
        return this.getRandomMessage(this.breakReminderMessages);
      
      case 'task_reminder':
        if (currentTask) {
          let message = this.getRandomMessage(this.taskReminderMessages);
          return message.replace('{{taskTitle}}', currentTask.title);
        }
        return this.getRandomMessage(this.encouragementMessages);
      
      case 'next_task':
        if (nextTask) {
          let message = this.getRandomMessage(this.nextTaskMessages);
          return message.replace('{{nextTaskTitle}}', nextTask.title);
        }
        return this.getRandomMessage(this.encouragementMessages);
      
      case 'progress_update':
        const completedCount = completedTasks.length;
        const remainingCount = remainingTasks.length;
        const totalCount = completedCount + remainingCount;
        const percentComplete = totalCount > 0 
          ? Math.round((completedCount / totalCount) * 100) 
          : 0;
        
        let message = this.getRandomMessage(this.progressUpdateMessages);
        message = message.replace('{{completedCount}}', completedCount.toString());
        message = message.replace('{{remainingCount}}', remainingCount.toString());
        message = message.replace('{{percentComplete}}', percentComplete.toString());
        return message;
      
      default:
        return "Keep up the great work!";
    }
  }

  /**
   * Generate a time-based message based on elapsed focus time
   */
  static generateTimeMessage(focusStartTime: Date): string {
    const elapsedTime = formatDistanceToNow(focusStartTime, { addSuffix: false });
    let message = this.getRandomMessage(this.timeMessages);
    return message.replace('{{time}}', elapsedTime);
  }

  /**
   * Get a smart reminder based on context and elapsed time
   */
  static getSmartReminder(
    elapsedMinutes: number,
    context: {
      currentTask?: Task;
      nextTask?: Task;
      focusStartTime?: Date;
      completedTasks?: Task[];
      remainingTasks?: Task[];
      lastReminderType?: ReminderType;
    }
  ): { message: string; type: ReminderType } {
    const { lastReminderType } = context;
    
    // Choose reminder type based on elapsed time and previous reminder
    let reminderType: ReminderType;
    
    // First message is always a greeting
    if (elapsedMinutes < 1) {
      reminderType = 'greeting';
    }
    // Every 25 minutes, suggest a break
    else if (elapsedMinutes % 25 < 2 && elapsedMinutes > 20) {
      reminderType = 'break_reminder';
    }
    // Every 10 minutes, remind of the current task
    else if (elapsedMinutes % 10 < 2 && context.currentTask) {
      reminderType = 'task_reminder';
    }
    // Every 15 minutes, provide a progress update
    else if (elapsedMinutes % 15 < 2 && context.completedTasks) {
      reminderType = 'progress_update';
    }
    // Otherwise, vary between encouragement and check-ins
    else {
      // Don't repeat the last reminder type
      const options: ReminderType[] = ['encouragement', 'check_in'];
      if (context.nextTask) options.push('next_task');
      
      // Filter out the last reminder type to avoid repetition
      const availableOptions = options.filter(type => type !== lastReminderType);
      reminderType = availableOptions[Math.floor(Math.random() * availableOptions.length)];
    }
    
    const message = this.generateReminder(reminderType, context);
    return { message, type: reminderType };
  }
} 