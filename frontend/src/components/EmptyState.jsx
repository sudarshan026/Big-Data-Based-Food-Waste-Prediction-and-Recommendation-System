import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data available', description = 'Try adjusting your filters or search criteria.', icon: Icon = Inbox }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-sm">{description}</p>
    </div>
  );
};

export default EmptyState;

