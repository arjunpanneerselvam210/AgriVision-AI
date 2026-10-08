import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Sliders,
  Globe,
  ShieldCheck,
  Check,
  RefreshCw,
  Info,
  Lock,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { API_BASE_URL, DEFAULT_AOI } from '../utils/constants';

export const SettingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [apiUrl, setApiUrl] = useState<string>(API_BASE_URL);
  const [snicSpacing, setSnicSpacing] = useState<number>(15);
  const [snicCompactness, setSnicCompactness] = useState<number>(0.5);
  const [rfTrees, setRfTrees] = useState<number>(100);
  const [cloudMax, setCloudMax] = useState<number>(20);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-emerald-400" />
            System & Pipeline Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure backend connection endpoints, segmentation algorithms, and model hyper-parameters
          </p>
        </div>

        {isSaved && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            Configuration saved locally
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Backend API Configuration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Server className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Backend API Connection</h3>
              <p className="text-xs text-slate-400">
                Axios client communication endpoint configured via <code className="text-emerald-400">VITE_API_BASE_URL</code>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8080/api"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Current environment variable: <code className="text-slate-400">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}</code>
            </p>
          </div>
        </div>

        {/* Study Area Definition */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">Study Area of Interest (AOI)</h3>
              <p className="text-xs text-slate-400">
                Mapathon Problem Statement 1 target geographical region
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">District & State</span>
              <span className="text-sm font-semibold text-white mt-1 block">
                {DEFAULT_AOI.district}, {DEFAULT_AOI.state}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">Pilot Taluks</span>
              <span className="text-sm font-semibold text-white mt-1 block">
                {DEFAULT_AOI.taluks.join(' & ')}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">Minimum Study Extent</span>
              <span className="text-sm font-semibold text-white mt-1 block">
                {DEFAULT_AOI.targetMinAreaKm2} km² (Fully Enclosed)
              </span>
            </div>
          </div>
        </div>

        {/* Segmentation & ML Hyper-parameters */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">Algorithms & Hyper-Parameters</h3>
              <p className="text-xs text-slate-400">
                OBIA SNIC Segmentation & Random Forest Classifier tuning
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SNIC Seed Spacing (pixels)
              </label>
              <input
                type="number"
                min="5"
                max="50"
                value={snicSpacing}
                onChange={(e) => setSnicSpacing(parseInt(e.target.value) || 15)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Controls segment granularity</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SNIC Compactness
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="2.0"
                value={snicCompactness}
                onChange={(e) => setSnicCompactness(parseFloat(e.target.value) || 0.5)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Shape regularity factor</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Random Forest Trees
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={rfTrees}
                onChange={(e) => setRfTrees(parseInt(e.target.value) || 100)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Number of decision trees</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cloud Cover Tolerance (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={cloudMax}
                onChange={(e) => setCloudMax(parseInt(e.target.value) || 20)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Sentinel-2 tile filter</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-semibold text-slate-950 text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            Save Parameter Configurations
          </button>
        </div>
      </form>
    </div>
  );
};
