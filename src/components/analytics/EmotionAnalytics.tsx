import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { emotionOptions } from '@/data/emotions';
import { emotionToString } from '@/lib/type-conversions';
export function EmotionAnalytics({ tasks, timeFrame }) {
    // Create a map of emotion colors
    const emotionColorMap = useMemo(() => {
        const colorMap = {};
        emotionOptions.forEach(emotion => {
            const colorKey = emotion.color.split('-')[1]; // Extract color name from "bg-blue-100"
            colorMap[emotion.value] = `#${getHexForColor(colorKey, 500)}`; // Get a more saturated version
        });
        return colorMap;
    }, []);
    // Get data for emotions distribution
    const getEmotionDistribution = useMemo(() => {
        const emotionCounts = {};
        // Initialize with all possible emotions
        emotionOptions.forEach(emotion => {
            emotionCounts[emotion.value] = 0;
        });
        // Count emotions
        tasks.forEach(task => {
            if (task.emotion) {
                const emotionString = emotionToString(task.emotion);
                if (emotionString) {
                    emotionCounts[emotionString] = (emotionCounts[emotionString] || 0) + 1;
                }
            }
        });
        // Convert to array format for charts
        return Object.entries(emotionCounts)
            .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
            value
        }))
            .filter(item => item.value > 0); // Only include emotions that have tasks
    }, [tasks]);
    // Get emotion trends over time
    const getEmotionTrends = useMemo(() => {
        const daysToGoBack = timeFrame === 'week' ? 7 : timeFrame === 'month' ? 30 : 90;
        const startDate = subDays(new Date(), daysToGoBack);
        const endDate = new Date();
        // Get all days in the interval
        const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
        // Create a map for each day
        const emotionByDay = daysInRange.map(date => {
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);
            // Initialize counts
            const dayCounts = {
                date: format(date, 'MMM dd')
            };
            // Initialize all emotions with 0
            emotionOptions.forEach(emotion => {
                dayCounts[emotion.value] = 0;
            });
            // Count tasks with emotions created on this day
            tasks.forEach(task => {
                if (task.createdAt && task.emotion) {
                    const taskDate = new Date(task.createdAt);
                    if (taskDate >= dayStart && taskDate <= dayEnd) {
                        const emotionString = emotionToString(task.emotion);
                        if (emotionString) {
                            dayCounts[emotionString] += 1;
                        }
                    }
                }
            });
            return dayCounts;
        });
        return emotionByDay;
    }, [tasks, timeFrame]);
    // Get completion rates by emotion
    const getCompletionRatesByEmotion = useMemo(() => {
        const emotionStats = {};
        // Initialize counts
        emotionOptions.forEach(emotion => {
            emotionStats[emotion.value] = { total: 0, completed: 0 };
        });
        // Count tasks by emotion
        tasks.forEach(task => {
            if (task.emotion) {
                const emotionString = emotionToString(task.emotion);
                if (emotionString) {
                    emotionStats[emotionString].total += 1;
                    if (task.completedAt) {
                        emotionStats[emotionString].completed += 1;
                    }
                }
            }
        });
        // Calculate completion percentages
        return Object.entries(emotionStats)
            .map(([emotion, stats]) => ({
            name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
            completionRate: stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0,
            total: stats.total
        }))
            .filter(item => item.total > 0) // Only include emotions that have tasks
            .sort((a, b) => b.completionRate - a.completionRate); // Sort by highest completion rate
    }, [tasks]);
    // Get most productive emotions
    const getMostProductiveEmotions = useMemo(() => {
        return getCompletionRatesByEmotion.slice(0, 3);
    }, [getCompletionRatesByEmotion]);
    // Get emotion insights
    const getEmotionInsights = useMemo(() => {
        const insights = [];
        // Find most common emotion
        const mostCommonEmotion = [...getEmotionDistribution]
            .sort((a, b) => b.value - a.value)
            .shift();
        if (mostCommonEmotion) {
            insights.push({
                type: 'common',
                title: 'Most Common Emotion',
                description: `You most often feel "${mostCommonEmotion.name}" about your tasks.`,
                emotion: mostCommonEmotion.name.toLowerCase()
            });
        }
        // Find most productive emotion
        const mostProductiveEmotion = getMostProductiveEmotions[0];
        if (mostProductiveEmotion && mostProductiveEmotion.completionRate > 60) {
            insights.push({
                type: 'productive',
                title: 'Most Productive Emotion',
                description: `You complete ${mostProductiveEmotion.completionRate}% of tasks when you feel "${mostProductiveEmotion.name}".`,
                emotion: mostProductiveEmotion.name.toLowerCase()
            });
        }
        // Check for negative trends
        const negativeEmotions = ['anxious', 'overwhelmed'];
        const negativeEmotionCounts = negativeEmotions.reduce((total, emotion) => {
            const found = getEmotionDistribution.find(e => e.name.toLowerCase() === emotion);
            return total + (found ? found.value : 0);
        }, 0);
        const totalEmotionTasks = getEmotionDistribution.reduce((sum, item) => sum + item.value, 0);
        if (negativeEmotionCounts > 0 && totalEmotionTasks > 0) {
            const negativePercentage = Math.round((negativeEmotionCounts / totalEmotionTasks) * 100);
            if (negativePercentage > 50) {
                insights.push({
                    type: 'warning',
                    title: 'High Stress Indicator',
                    description: `${negativePercentage}% of your tasks are associated with stress emotions (anxious/overwhelmed).`,
                    emotion: 'overwhelmed'
                });
            }
        }
        return insights;
    }, [getEmotionDistribution, getMostProductiveEmotions]);
    // Helper function for color codes (simple version)
    function getHexForColor(color, shade) {
        let _a;
        const colorMap = {
            'red': {
                100: 'FEE2E2',
                500: 'EF4444',
                900: '7F1D1D',
            },
            'green': {
                100: 'DCFCE7',
                500: '22C55E',
                900: '14532D',
            },
            'blue': {
                100: 'DBEAFE',
                500: '3B82F6',
                900: '1E3A8A',
            },
            'yellow': {
                100: 'FEF9C3',
                500: 'FBBF24',
                900: '713F12',
            },
            'gray': {
                100: 'F3F4F6',
                500: '6B7280',
                900: '111827',
            },
        };
        // Default gray if color not found
        return ((_a = colorMap[color]) === null || _a === void 0 ? void 0 : _a[shade]) || colorMap.gray[shade];
    }
    // Render emotion distribution chart
    const renderEmotionDistribution = () => (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Emotion Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={getEmotionDistribution} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
            {getEmotionDistribution.map((entry) => (<Cell key={`cell-${entry.name}`} fill={emotionColorMap[entry.name.toLowerCase()] || '#6B7280'}/>))}
          </Pie>
          <Tooltip contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#E5E7EB',
            borderRadius: '0.375rem',
            color: '#111827'
        }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>);
    // Render emotion trends chart
    const renderEmotionTrends = () => (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Emotion Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={getEmotionTrends}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1}/>
          <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280' }}/>
          <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }}/>
          <Tooltip contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#E5E7EB',
            borderRadius: '0.375rem',
            color: '#111827'
        }}/>
          <Legend />
          {emotionOptions.map(emotion => (<Area key={emotion.value} type="monotone" dataKey={emotion.value} name={emotion.label} stroke={emotionColorMap[emotion.value]} fill={emotionColorMap[emotion.value]} fillOpacity={0.2} stackId="1"/>))}
        </AreaChart>
      </ResponsiveContainer>
    </div>);
    // Render completion rates by emotion
    const renderCompletionRates = () => (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Completion Rates by Emotion</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={getCompletionRatesByEmotion} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1}/>
          <XAxis type="number" stroke="#6B7280" tick={{ fill: '#6B7280' }} domain={[0, 100]} unit="%"/>
          <YAxis dataKey="name" type="category" stroke="#6B7280" tick={{ fill: '#6B7280' }}/>
          <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#E5E7EB',
            borderRadius: '0.375rem',
            color: '#111827'
        }}/>
          <Bar dataKey="completionRate" name="Completion Rate" radius={[0, 4, 4, 0]}>
            {getCompletionRatesByEmotion.map((entry) => (<Cell key={`cell-${entry.name}`} fill={emotionColorMap[entry.name.toLowerCase()] || '#6B7280'}/>))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>);
    // Render insights
    const renderInsights = () => (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Emotion Insights</h3>
      
      {getEmotionInsights.length === 0 ? (<p className="text-gray-600 dark:text-gray-400">
          Add emotions to more tasks to receive personalized insights about your productivity patterns.
        </p>) : (<div className="space-y-4">
          {getEmotionInsights.map((insight, index) => {
                const emotionOption = emotionOptions.find(e => e.value === insight.emotion);
                return (<div key={`insight-${index}`} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700" style={{
                        backgroundColor: `${emotionColorMap[insight.emotion]}15`,
                        borderColor: `${emotionColorMap[insight.emotion]}30`,
                    }}>
                <div className="flex items-center mb-2">
                  <span className="text-xl mr-2">{(emotionOption === null || emotionOption === void 0 ? void 0 : emotionOption.emoji) || '🔍'}</span>
                  <h4 className="font-medium text-gray-900 dark:text-white">{insight.title}</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{insight.description}</p>
              </div>);
            })}
        </div>)}
      
      {/* Recommendations */}
      {getEmotionInsights.length > 0 && (<div className="mt-6">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommendations</h4>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            {getEmotionInsights.some(i => i.type === 'warning') && (<li>Consider breaking down complex tasks into smaller steps to reduce feelings of being overwhelmed.</li>)}
            {getMostProductiveEmotions.length > 0 && (<li>You&apos;re most productive when you feel {getMostProductiveEmotions[0].name.toLowerCase()}. Try setting up your environment to promote this state.</li>)}
            <li>Regularly track your emotions to better understand your productivity patterns over time.</li>
          </ul>
        </div>)}
    </div>);
    // Check if we have enough data
    const hasEnoughData = getEmotionDistribution.length > 0;
    if (!hasEnoughData) {
        return (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Emotion Analytics</h3>
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 text-3xl">🤔</div>
          <h4 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Emotion Data Yet</h4>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Start adding emotions to your tasks to see analytics about how you feel and how it affects your productivity.
          </p>
        </div>
      </div>);
    }
    return (<div className="space-y-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Emotion Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {renderEmotionDistribution()}
        {renderEmotionTrends()}
        {renderCompletionRates()}
        {renderInsights()}
      </div>
    </div>);
}
