import { useState } from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onRangeChange: (start: Date | null, end: Date | null) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
}: DateRangePickerProps) {
  // Remove unused variables or use them
  // const [showCalendar, setShowCalendar] = useState(false);
  
  // Helper function to format dates consistently
  // const formatDate = (date: Date | null) => {
  //   return date ? format(date, 'MMM d, yyyy') : '';
  // };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value ? new Date(e.target.value) : null;
    onRangeChange(newStartDate, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value ? new Date(e.target.value) : null;
    onRangeChange(startDate, newEndDate);
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() + days);
    onRangeChange(start, end);
    // setShowCalendar(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="date"
            value={startDate?.toISOString().split('T')[0] || ''}
            onChange={handleStartDateChange}
            className="w-full border rounded-lg px-3 py-2 pr-8"
          />
          <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <span className="text-gray-500">to</span>
        <div className="relative flex-1">
          <input
            type="date"
            value={endDate?.toISOString().split('T')[0] || ''}
            onChange={handleEndDateChange}
            min={startDate?.toISOString().split('T')[0]}
            className="w-full border rounded-lg px-3 py-2 pr-8"
          />
          <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Quick Select Options */}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => onRangeChange(null, null)}
          className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear
        </button>
        <button
          onClick={() => handleQuickSelect(7)}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Next 7 days
        </button>
        <button
          onClick={() => handleQuickSelect(30)}
          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700"
        >
          Next 30 days
        </button>
      </div>
    </div>
  );
} 