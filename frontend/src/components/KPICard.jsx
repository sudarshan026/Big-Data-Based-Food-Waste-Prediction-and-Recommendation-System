import React from 'react';

function KPICard({ title, value, subtitle, icon: Icon, color = 'border-green-500', trend }) {
  const colorMap = {
    'border-green-500': { bg: 'bg-green-50', text: 'text-green-600' },
    'border-blue-500': { bg: 'bg-blue-50', text: 'text-blue-600' },
    'border-red-500': { bg: 'bg-red-50', text: 'text-red-600' },
    'border-orange-500': { bg: 'bg-orange-50', text: 'text-orange-600' },
    'border-purple-500': { bg: 'bg-purple-50', text: 'text-purple-600' },
    'border-teal-500': { bg: 'bg-teal-50', text: 'text-teal-600' },
    'border-yellow-500': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    'border-indigo-500': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  };

  const colors = colorMap[color] || { bg: 'bg-green-50', text: 'text-green-600' };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${color} p-5 hover:shadow-md transition-shadow duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && trend !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              <span>{trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%</span>
              <span className="text-gray-400">vs prev</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
        )}
      </div>
    </div>
  );
}

export default KPICard;
