import React from 'react';
import { Database, Sprout, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
  fullHeight?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No analysis data available yet',
  description = 'Run a Sentinel-2 satellite analysis pipeline or wait for the backend worker to finish parcel extraction.',
  icon,
  actionText,
  actionHref,
  onActionClick,
  fullHeight = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 backdrop-blur-sm ${
        fullHeight ? 'min-h-[350px] h-full' : 'py-12'
      }`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
        {icon || <Database className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">{description}</p>

      {actionText && actionHref && (
        <Link
          to={actionHref}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors shadow-sm"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}

      {actionText && onActionClick && !actionHref && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors shadow-sm"
        >
          <Sprout className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};
