import React from 'react';
import { Layers, Eye, EyeOff, Maximize2, MousePointer, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  setBaseMap,
  toggleLayer,
  setInspectorMode,
  resetMapView,
  BaseMapType,
} from '../../store/slices/mapSlice';

export const MapControls: React.FC = () => {
  const dispatch = useAppDispatch();
  const { baseMap, layers, inspectorMode } = useAppSelector((state) => state.map);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 max-w-xs text-xs">
      {/* Basemap Switcher */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-2 shadow-xl">
        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Basemap Layer</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              { id: 'satellite', label: 'Satellite' },
              { id: 'streets', label: 'Streets' },
              { id: 'dark', label: 'Dark EO' },
            ] as const
          ).map((bm) => (
            <button
              key={bm.id}
              onClick={() => dispatch(setBaseMap(bm.id as BaseMapType))}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                baseMap === bm.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {bm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-2.5 shadow-xl space-y-1.5">
        <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span>Active Overlays</span>
          <span className="text-[10px] text-slate-500 font-mono">10m Res</span>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => dispatch(toggleLayer('showPaddy'))}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
              layers.showPaddy ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <span>Paddy Fields</span>
            </div>
            {layers.showPaddy ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-60" />}
          </button>

          <button
            onClick={() => dispatch(toggleLayer('showBanana'))}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
              layers.showBanana ? 'bg-amber-500/15 text-amber-300' : 'text-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
              <span>Banana Plantations</span>
            </div>
            {layers.showBanana ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-60" />}
          </button>

          <button
            onClick={() => dispatch(toggleLayer('showOther'))}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
              layers.showOther ? 'bg-slate-500/20 text-slate-300' : 'text-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-sm" />
              <span>Other Land Cover</span>
            </div>
            {layers.showOther ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-60" />}
          </button>

          <button
            onClick={() => dispatch(toggleLayer('showBoundaries'))}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
              layers.showBoundaries ? 'bg-yellow-500/15 text-yellow-300' : 'text-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded border border-yellow-400 bg-yellow-400/20" />
              <span>Field Boundaries</span>
            </div>
            {layers.showBoundaries ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-60" />}
          </button>

          <button
            onClick={() => dispatch(toggleLayer('showPilotSector'))}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
              layers.showPilotSector ? 'bg-blue-500/15 text-blue-300' : 'text-slate-500 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded border border-blue-400 bg-blue-400/20" />
              <span>Pilot Sector (≥20 km²)</span>
            </div>
            {layers.showPilotSector ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-60" />}
          </button>
        </div>
      </div>

      {/* Quick Action Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(setInspectorMode(!inspectorMode))}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-colors shadow-lg ${
            inspectorMode
              ? 'bg-emerald-500 text-slate-950 font-semibold border-emerald-400'
              : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="Click on any field on the map to inspect its spectral and temporal profile"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>{inspectorMode ? 'Inspector Active' : 'Inspect Field'}</span>
        </button>

        <button
          onClick={() => dispatch(resetMapView())}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shadow-lg"
          title="Reset View to Ambasamudram & Cheranmahadevi"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
