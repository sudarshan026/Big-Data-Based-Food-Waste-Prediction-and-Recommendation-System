import React from 'react';
import { Calendar } from 'lucide-react';

const DateFilter = ({ period, onPeriodChange, startDate, endDate, onDateChange }) => {
  const options = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 90 Days', value: '90days' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom Range', value: 'custom' }
  ];

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center space-x-2">
        <Calendar className="w-5 h-5 text-emerald-600" />
        <span className="text-sm font-semibold text-gray-700">Time Range:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              period === opt.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;

