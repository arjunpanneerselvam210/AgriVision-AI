import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number | null | undefined;
  subtitle?: string;
  icon: React.ReactNode | React.ElementType;
  variant?: 'emerald' | 'amber' | 'slate' | 'blue' | 'indigo' | 'purple';
  badge?: string;
  badgeText?: string;
  badgeColor?: 'emerald' | 'amber' | 'slate' | 'blue' | 'indigo' | 'purple';
  trend?: string | {
    value: string;
    isPositive?: boolean;
  };
  trendType?: 'positive' | 'negative' | 'neutral';
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'emerald',
  badge,
  badgeText,
  badgeColor,
  trend,
  trendType,
  isLoading = false,
}) => {
  const activeVariant = badgeColor || variant;
  const variantStyles = {
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(34,197,94,0.1)]',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(234,179,8,0.1)]',
    },
    slate: {
      border: 'border-slate-700/60 hover:border-slate-600',
      iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      glow: 'group-hover:shadow-[0_0_25px_rgba(100,116,139,0.1)]',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(59,130,246,0.1)]',
    },
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(99,102,241,0.1)]',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.1)]',
    },
  }[activeVariant];

  const displayValue =
    value === null || value === undefined ? (
      <span className="text-slate-500 text-sm italic font-normal">No analysis data available yet</span>
    ) : (
      value
    );

  const renderedIcon = React.isValidElement(icon)
    ? icon
    : typeof icon === 'function'
    ? React.createElement(icon as any, { className: 'w-5 h-5' })
    : null;

  const effectiveBadge = badgeText || badge;
  const trendText = typeof trend === 'string' ? trend : trend?.value;
  const isPositiveTrend = typeof trend === 'object' ? trend.isPositive : trendType === 'positive';

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-slate-900/70 backdrop-blur-md border ${variantStyles.border} p-5 transition-all duration-300 hover:-translate-y-0.5 ${variantStyles.glow}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white flex items-baseline gap-2">
            {isLoading ? (
              <div className="h-7 w-24 bg-slate-800 animate-pulse rounded"></div>
            ) : (
              displayValue
            )}
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${variantStyles.iconBg} shadow-sm shrink-0`}
        >
          {renderedIcon}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        {subtitle && <span className="truncate">{subtitle}</span>}
        {effectiveBadge && (
          <span
            className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium border ${variantStyles.badge}`}
          >
            {effectiveBadge}
          </span>
        )}
        {trendText && !effectiveBadge && (
          <span
            className={`ml-auto font-medium ${
              isPositiveTrend ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {trendText}
          </span>
        )}
      </div>
    </div>
  );
};
