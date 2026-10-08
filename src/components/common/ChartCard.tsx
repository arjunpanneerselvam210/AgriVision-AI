import React from 'react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  hasData?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  headerAction,
  isLoading = false,
  isEmpty = false,
  hasData,
  emptyTitle = 'No chart data available yet',
  emptyMessage,
  emptyDescription = 'Awaiting model inference or satellite time-series observations from the backend.',
  className = '',
}) => {
  const effectiveEmpty = hasData !== undefined ? !hasData : isEmpty;
  const effectiveTitle = emptyMessage || emptyTitle;
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md p-5 shadow-sm transition-all duration-200 flex flex-col ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
      </div>

      <div className="flex-1 min-h-[260px] flex flex-col justify-center">
        {isLoading ? (
          <LoadingState message="Computing spectral statistics..." />
        ) : effectiveEmpty ? (
          <EmptyState title={effectiveTitle} description={emptyDescription} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
