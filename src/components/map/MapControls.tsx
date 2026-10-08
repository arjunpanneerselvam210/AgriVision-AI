import React, { useState } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  setBaseMap,
  toggleLayer,
  setPolygonOpacity,
  setMapZoom,
  resetMapView,
  BaseMapType,
} from '../../store/slices/mapSlice';
import { CROP_CONFIG } from '../../utils/constants';

interface MapControlsProps {
  onResetView?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({ onResetView }) => {
  const dispatch = useAppDispatch();
  const { baseMap, layers, zoom } = useAppSelector((state) => state.map);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleZoomIn = () => {
    dispatch(setMapZoom(Math.min(zoom + 1, 18)));
  };

  const handleZoomOut = () => {
    dispatch(setMapZoom(Math.max(zoom - 1, 6)));
  };

  const handleReset = () => {
    if (onResetView) {
      onResetView();
    } else {
      dispatch(resetMapView());
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 max-w-[270px] text-xs font-sans">
      {/* Zoom and Fit Controls */}
      <div className="flex items-center gap-1.5 self-end bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          title="Fit to Study Area (Reset View)"
          aria-label="Reset map view"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Layers Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all">
        {/* Card Header with Collapsible Toggle */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/40 border-b border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors select-none"
        >
          <div className="flex items-center gap-2 text-slate-200 font-bold text-[11px] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Map & Layer Controls</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {isExpanded && (
          <div className="p-3 space-y-3">
            {/* 1. Basemap Switcher */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Base Map
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'satellite', label: 'Satellite' },
                    { id: 'streets', label: 'Streets' },
                    { id: 'dark', label: 'Dark EO' },
                    { id: 'topo', label: 'Topographic' },
                  ] as const
                ).map((bm) => (
                  <button
                    key={bm.id}
                    onClick={() => dispatch(setBaseMap(bm.id as BaseMapType))}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left ${
                      baseMap === bm.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Boundary Layers */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Boundary Overlays
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => dispatch(toggleLayer('showStudyAreaBoundary'))}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors border ${
                    layers.showStudyAreaBoundary
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : 'bg-slate-950/40 text-slate-500 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded border border-blue-400 bg-blue-400/30" />
                    <span className="font-medium text-[11px]">Study Area Boundary</span>
                  </div>
                  {layers.showStudyAreaBoundary ? (
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                <button
                  onClick={() => dispatch(toggleLayer('showBoundaries'))}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors border ${
                    layers.showBoundaries
                      ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                      : 'bg-slate-950/40 text-slate-500 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded border border-yellow-400 bg-yellow-400/20" />
                    <span className="font-medium text-[11px]">Field Boundaries</span>
                  </div>
                  {layers.showBoundaries ? (
                    <Eye className="w-3.5 h-3.5 text-yellow-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>
              </div>
            </div>

            {/* 3. Crop Classification Overlays */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Crop Classification Polygons
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => dispatch(toggleLayer('showPaddy'))}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors border ${
                    layers.showPaddy
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-950/40 text-slate-500 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: CROP_CONFIG.PADDY.color }}
                    />
                    <span className="font-medium text-[11px]">{CROP_CONFIG.PADDY.label}</span>
                  </div>
                  {layers.showPaddy ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                <button
                  onClick={() => dispatch(toggleLayer('showBanana'))}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors border ${
                    layers.showBanana
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-slate-950/40 text-slate-500 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: CROP_CONFIG.BANANA.color }}
                    />
                    <span className="font-medium text-[11px]">{CROP_CONFIG.BANANA.label}</span>
                  </div>
                  {layers.showBanana ? (
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>

                <button
                  onClick={() => dispatch(toggleLayer('showOther'))}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors border ${
                    layers.showOther
                      ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                      : 'bg-slate-950/40 text-slate-500 border-transparent hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{ backgroundColor: CROP_CONFIG.OTHER.color }}
                    />
                    <span className="font-medium text-[11px]">{CROP_CONFIG.OTHER.label}</span>
                  </div>
                  {layers.showOther ? (
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>
              </div>
            </div>

            {/* 4. Polygon Opacity Slider */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  <span>Fill Opacity</span>
                </span>
                <span className="font-mono text-slate-200">
                  {Math.round(layers.polygonOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={layers.polygonOpacity}
                onChange={(e) => dispatch(setPolygonOpacity(parseFloat(e.target.value)))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
