import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading satellite analysis data...',
  size = 'md',
  fullHeight = false,
}) => {
  const iconSize = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center text-slate-400 ${
        fullHeight ? 'min-h-[400px] h-full' : 'py-12'
      }`}
    >
      <Loader2 className={`${iconSize} animate-spin text-emerald-500 mb-3`} />
      <p className="text-sm font-medium text-slate-300">{message}</p>
      <p className="text-xs text-slate-500 mt-1">Connecting to Earth Observation server...</p>
    </div>
  );
};
