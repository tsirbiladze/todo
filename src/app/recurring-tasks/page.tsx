import { RecurringTaskManager } from '@/components/RecurringTaskManager';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Manage Recurring Tasks',
  description: 'Create and manage recurring tasks for your ADHD-friendly todo app.',
};

export default async function RecurringTasksPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect if user is not authenticated
  if (!session) {
    redirect('/auth/signin');
  }
  
  return (
    <div className="container mx-auto py-8 px-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Recurring Tasks</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-400">
        Create and manage recurring tasks to automate your routine activities and reduce cognitive load.
      </p>
      <RecurringTaskManager />
    </div>
  );
} 