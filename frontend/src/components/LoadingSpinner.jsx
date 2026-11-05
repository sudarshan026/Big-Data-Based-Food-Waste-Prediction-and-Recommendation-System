import { Loader2 } from 'lucide-react';

function LoadingSpinner({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
      <p className="text-sm text-gray-500 font-medium">{message}</p>
    </div>
  );
}

export default LoadingSpinner;
