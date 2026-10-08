import React from 'react';
import { CROP_CLASSES } from '../../utils/constants';
import { CropClassType } from '../../types';

interface CropLegendProps {
  onToggleClass?: (cropClass: CropClassType) => void;
  activeClasses?: Record<CropClassType, boolean>;
  showDescription?: boolean;
  compact?: boolean;
  vertical?: boolean;
}

export const CropLegend: React.FC<CropLegendProps> = ({
  onToggleClass,
  activeClasses,
  showDescription = true,
  compact = false,
  vertical = true,
}) => {
  const classesList = Object.values(CROP_CLASSES);

  if (!vertical) {
    return (
      <div className="flex items-center gap-3 flex-wrap text-xs">
        {classesList.map((item) => (
          <div key={item.code} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-300 font-medium text-xs">{item.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-4 text-xs shadow-lg">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
        <h4 className="font-semibold text-slate-200 tracking-wide uppercase text-[11px]">
          Target Crop Classification
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">Mapathon PS1</span>
      </div>

      <div className={`space-y-2.5 ${compact ? 'text-xs' : ''}`}>
        {classesList.map((item) => {
          const isActive = activeClasses ? activeClasses[item.code] : true;
          return (
            <div
              key={item.code}
              onClick={() => onToggleClass && onToggleClass(item.code)}
              className={`flex items-start gap-2.5 rounded-lg p-1.5 transition-colors ${
                onToggleClass ? 'cursor-pointer hover:bg-slate-800/60' : ''
              } ${!isActive ? 'opacity-40' : 'opacity-100'}`}
            >
              <span
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded shadow-sm border border-black/20"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Code {item.code}</span>
                </div>
                {showDescription && (
                  <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1 leading-snug">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] text-slate-500 leading-tight">
        <span className="text-amber-400/80 font-medium">Notice:</span> Delineated boundaries represent satellite-derived field-like segments, not legal cadastral records.
      </div>
    </div>
  );
};
