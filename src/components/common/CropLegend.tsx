import React from 'react';
import { CROP_CONFIG, CROP_COLORS } from '../../utils/constants';
import { CropClassType } from '../../types';

interface CropLegendProps {
  onToggleClass?: (cropClass: CropClassType) => void;
  activeClasses?: Record<CropClassType, boolean>;
  showDescription?: boolean;
  compact?: boolean;
  vertical?: boolean;
  counts?: {
    PADDY?: number;
    BANANA?: number;
    OTHER?: number;
    paddy?: number;
    banana?: number;
    other?: number;
  };
  areasHa?: {
    PADDY?: number;
    BANANA?: number;
    OTHER?: number;
    paddy?: number;
    banana?: number;
    other?: number;
  };
}

export const CropLegend: React.FC<CropLegendProps> = ({
  onToggleClass,
  activeClasses,
  showDescription = true,
  compact = false,
  vertical = true,
  counts,
  areasHa,
}) => {
  const legendItems = [
    {
      key: 'PADDY' as const,
      code: 1 as CropClassType,
      config: CROP_CONFIG.PADDY,
      count: counts?.PADDY ?? counts?.paddy,
      area: areasHa?.PADDY ?? areasHa?.paddy,
    },
    {
      key: 'BANANA' as const,
      code: 2 as CropClassType,
      config: CROP_CONFIG.BANANA,
      count: counts?.BANANA ?? counts?.banana,
      area: areasHa?.BANANA ?? areasHa?.banana,
    },
    {
      key: 'OTHER' as const,
      code: 0 as CropClassType,
      config: CROP_CONFIG.OTHER,
      count: counts?.OTHER ?? counts?.other,
      area: areasHa?.OTHER ?? areasHa?.other,
    },
  ];

  if (!vertical) {
    return (
      <div className="flex items-center gap-3 flex-wrap text-xs">
        {legendItems.map(({ code, config, count, area }) => {
          const isActive = activeClasses ? activeClasses[code] : true;
          return (
            <div
              key={config.key}
              onClick={() => onToggleClass && onToggleClass(code)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                onToggleClass ? 'cursor-pointer hover:bg-slate-800/60' : ''
              } ${!isActive ? 'opacity-40' : 'opacity-100'}`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm border border-black/30"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-slate-200 font-medium text-xs">{config.name}</span>
              {count !== undefined && (
                <span className="text-[10px] text-slate-400 font-mono">({count})</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-3.5 text-xs shadow-2xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <h4 className="font-bold text-slate-200 tracking-wider uppercase text-[10px] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Crop Classification
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">10m OBIA</span>
      </div>

      <div className="space-y-1.5">
        {legendItems.map(({ code, config, count, area }) => {
          const isActive = activeClasses ? activeClasses[code] : true;
          return (
            <div
              key={config.key}
              onClick={() => onToggleClass && onToggleClass(code)}
              className={`flex items-start gap-2.5 rounded-xl p-2 transition-all border ${
                onToggleClass
                  ? 'cursor-pointer hover:bg-slate-800/80 hover:border-slate-700'
                  : ''
              } ${
                isActive
                  ? 'bg-slate-950/40 border-slate-800/80'
                  : 'bg-slate-950/20 border-transparent opacity-40'
              }`}
            >
              <span
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-md shadow-sm border border-black/30"
                style={{ backgroundColor: config.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-slate-200">{config.name}</span>
                  <div className="flex items-center gap-1">
                    {count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {count} fields
                      </span>
                    )}
                    {area !== undefined && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        {area.toFixed(1)} ha
                      </span>
                    )}
                  </div>
                </div>
                {showDescription && !compact && (
                  <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-1 leading-snug">
                    {config.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-tight">
        <span className="text-amber-400 font-medium">Notice:</span> Delineated boundaries represent satellite-derived field-like segments.
      </div>
    </div>
  );
};
