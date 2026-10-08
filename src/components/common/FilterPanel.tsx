import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { ParcelFilters, CropClassType } from '../../types';

interface FilterPanelProps {
  filters: ParcelFilters;
  onChange: (filters: Partial<ParcelFilters>) => void;
  onReset: () => void;
  totalCount?: number;
  filteredCount?: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-4 text-xs shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search parcel ID, village or taluk..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Crop Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-950/60 border border-slate-800 shrink-0">
          {(
            [
              { label: 'All', value: 'ALL' },
              { label: 'Paddy', value: 1 },
              { label: 'Banana', value: 2 },
              { label: 'Other', value: 0 },
            ] as const
          ).map((item) => {
            const isSelected = filters.cropClass === item.value;
            return (
              <button
                key={item.label}
                onClick={() => onChange({ cropClass: item.value as CropClassType | 'ALL' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-colors text-[11px]"
          title="Reset filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {totalCount !== undefined && filteredCount !== undefined && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
          <span>
            Showing <strong className="text-slate-300 font-semibold">{filteredCount}</strong> of{' '}
            <strong className="text-slate-300 font-semibold">{totalCount}</strong> field parcels
          </span>
          <span className="text-slate-500 font-mono">Tirunelveli Study Area</span>
        </div>
      )}
    </div>
  );
};
