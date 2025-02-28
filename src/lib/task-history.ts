import { prisma } from '@/lib/prisma';
import { Task, ChangeType } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * Records a change to a task in the task history
 */
export async function recordTaskChange(
  taskId: string,
  userId: string,
  changeType: ChangeType,
  changeData: Record<string, any>,
  previousData?: Record<string, any>
): Promise<void> {
  try {
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        changeType,
        changeData: JSON.stringify(changeData),
        previousData: previousData ? JSON.stringify(previousData) : null,
      },
    });
  } catch (error) {
    logger.error(`Failed to record task history for task ${taskId}`, {
      component: 'task-history',
      data: { taskId, changeType, error }
    });
  }
}

/**
 * Extracts relevant changes from a task update operation
 */
export function extractTaskChanges(
  oldTask: Task,
  newTaskData: Partial<Task>
): Record<string, any> {
  const changes: Record<string, any> = {};
  
  // Only include fields that have changed
  for (const [key, value] of Object.entries(newTaskData)) {
    if (key in oldTask && oldTask[key as keyof Task] !== value) {
      changes[key] = value;
    }
  }
  
  return changes;
}

/**
 * Gets history for a specific task
 */
export async function getTaskHistory(taskId: string): Promise<any[]> {
  try {
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Parse the JSON strings
    return history.map(entry => ({
      ...entry,
      changeData: JSON.parse(entry.changeData),
      previousData: entry.previousData ? JSON.parse(entry.previousData) : null,
    }));
  } catch (error) {
    logger.error(`Failed to fetch task history for task ${taskId}`, {
      component: 'task-history',
      data: { taskId, error }
    });
    return [];
  }
}

/**
 * Gets a summary of recent task changes for a user
 */
export async function getUserTaskActivitySummary(
  userId: string,
  days: number = 7
): Promise<any> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const history = await prisma.taskHistory.findMany({
      where: { 
        userId,
        createdAt: { gte: startDate } 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            title: true,
          },
        },
      },
    });
    
    // Group by day and change type
    const summaryByDay: Record<string, Record<string, number>> = {};
    
    history.forEach(entry => {
      const day = entry.createdAt.toISOString().split('T')[0];
      if (!summaryByDay[day]) {
        summaryByDay[day] = {
          CREATED: 0,
          UPDATED: 0,
          COMPLETED: 0,
          DELETED: 0,
          RESTORED: 0,
        };
      }
      
      summaryByDay[day][entry.changeType]++;
    });
    
    return {
      totalChanges: history.length,
      summaryByDay,
      recentActivity: history.slice(0, 10).map(entry => ({
        id: entry.id,
        taskId: entry.taskId,
        taskTitle: entry.task.title,
        changeType: entry.changeType,
        timestamp: entry.createdAt,
        changes: JSON.parse(entry.changeData),
      })),
    };
  } catch (error) {
    logger.error(`Failed to fetch user task activity summary`, {
      component: 'task-history',
      data: { userId, days, error }
    });
    return {
      totalChanges: 0,
      summaryByDay: {},
      recentActivity: [],
    };
  }
} 