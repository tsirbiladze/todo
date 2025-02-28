import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { FocusSessionHistory } from '@/components/FocusSessionHistory';

export const metadata = {
  title: 'Focus Session History',
  description: 'View your focus session history and analytics',
};

async function getFocusSessions(userId: string) {
  try {
    // Get last 30 days of focus sessions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startTime: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        startTime: 'desc',
      },
      // Include task relation only if it exists in the schema
      include: {
        user: false, // Don't include user data
      },
    });

    // Calculate total duration
    const totalDuration = await prisma.focusSession.aggregate({
      where: {
        userId,
        startTime: {
          gte: thirtyDaysAgo,
        },
      },
      _sum: {
        duration: true,
      },
    });

    // Get daily stats
    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(startTime) as date,
        SUM(duration) as totalDuration,
        COUNT(*) as sessionCount
      FROM FocusSession
      WHERE userId = ${userId}
        AND startTime >= ${thirtyDaysAgo}
      GROUP BY DATE(startTime)
      ORDER BY date DESC
    `;

    return {
      focusSessions,
      totalDuration: totalDuration._sum.duration || 0,
      dailyStats,
    };
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return {
      focusSessions: [],
      totalDuration: 0,
      dailyStats: [],
    };
  }
}

export default async function FocusHistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/auth/signin');
  }
  
  const { focusSessions, totalDuration, dailyStats } = await getFocusSessions(session.user.id);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Focus Session History</h1>
      
      <FocusSessionHistory 
        initialSessions={focusSessions}
        initialStats={{
          totalDuration,
          dailyStats,
        }}
      />
    </div>
  );
} 