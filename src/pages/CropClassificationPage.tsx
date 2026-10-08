import React, { useEffect } from 'react';
import {
  Sprout,
  TrendingUp,
  Layers,
  Info,
  CheckCircle2,
  BarChart2,
  RefreshCw,
  Compass,
  Radio,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchDashboardSummary } from '../store/slices/analysisSlice';
import { fetchModelEvaluation } from '../store/slices/modelSlice';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { CropLegend } from '../components/common/CropLegend';
import { EmptyState } from '../components/common/EmptyState';
import { formatHectares, formatPercentage } from '../utils/formatters';
import { CROP_COLORS } from '../utils/constants';

export const CropClassificationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, isLoading: isLoadingSummary } = useAppSelector((state) => state.analysis);
  const { metrics, isLoading: isLoadingMetrics } = useAppSelector((state) => state.model);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchModelEvaluation());
  }, [dispatch]);

  const hasSummary = summary !== null && summary !== undefined;

  const paddyHa = summary?.cropAcreage?.paddy?.hectares ?? null;
  const paddyPct = summary?.cropAcreage?.paddy?.percentageOfAOI ?? null;
  const bananaHa = summary?.cropAcreage?.banana?.hectares ?? null;
  const bananaPct = summary?.cropAcreage?.banana?.percentageOfAOI ?? null;
  const otherHa = summary?.cropAcreage?.other?.hectares ?? null;
  const otherPct = summary?.cropAcreage?.other?.percentageOfAOI ?? null;

  const cropComparisonData = hasSummary
    ? [
        {
          name: 'Paddy',
          areaHa: paddyHa ?? 0,
          percentage: paddyPct ?? 0,
          color: CROP_COLORS.paddy,
        },
        {
          name: 'Banana',
          areaHa: bananaHa ?? 0,
          percentage: bananaPct ?? 0,
          color: CROP_COLORS.banana,
        },
        {
          name: 'Other Agriculture',
          areaHa: otherHa ?? 0,
          percentage: otherPct ?? 0,
          color: CROP_COLORS.other,
        },
      ].filter((d) => d.areaHa > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sprout className="w-6 h-6 text-emerald-400" />
            Crop Classification Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Machine-learning crop delineation: Paddy vs. Banana vs. Other Agricultural Land
          </p>
        </div>

        <button
          onClick={() => {
            dispatch(fetchDashboardSummary());
            dispatch(fetchModelEvaluation());
          }}
          disabled={isLoadingSummary || isLoadingMetrics}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSummary ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Primary Crop Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Paddy Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Class 1 — Paddy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {paddyHa !== null ? formatHectares(paddyHa) : 'No analysis data available yet'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {paddyPct !== null ? `${formatPercentage(paddyPct)} of total delineated area` : 'Awaiting model inference'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Characteristic: Periodic transplanting water inundation followed by fast canopy growth.
          </div>
        </div>

        {/* Banana Card */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Class 2 — Banana</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {bananaHa !== null ? formatHectares(bananaHa) : 'No analysis data available yet'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {bananaPct !== null ? `${formatPercentage(bananaPct)} of total delineated area` : 'Awaiting model inference'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Characteristic: Perennial broad-leaf canopy with sustained high NDVI & high SAR backscatter.
          </div>
        </div>

        {/* Other Agriculture Card */}
        <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class 0 — Other</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {otherHa !== null ? formatHectares(otherHa) : 'No analysis data available yet'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {otherPct !== null ? `${formatPercentage(otherPct)} of total delineated area` : 'Awaiting model inference'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Includes fallow land, pulses, homestead vegetation, and non-target crops.
          </div>
        </div>
      </div>

      {/* Comparison Chart & Separability Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bar comparison (7 cols) */}
        <div className="lg:col-span-7">
          <ChartCard
            title="Class Coverage Comparison"
            subtitle="Calculated area distribution (Hectares)"
            hasData={cropComparisonData.length > 0}
            isLoading={isLoadingSummary}
            emptyMessage="No analysis data available yet"
          >
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropComparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val} ha`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(2)} ha`, 'Coverage']}
                  />
                  <Bar dataKey="areaHa" radius={[6, 6, 0, 0]}>
                    {cropComparisonData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Right: Spectral & SAR Separability (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Radio className="w-4 h-4 text-emerald-400" />
              Scientific Separability Principles
            </h3>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Paddy Field Signature
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Optical:</strong> Low NDVI combined with high NDWI/LSWI during transplanting (flooded mud). Rapid NDVI climb to ~0.80 at heading, dropping sharply post-harvest.
                </p>
                <p className="text-slate-400 text-[11px]">
                  <strong>SAR (Sentinel-1):</strong> Low VV & VH backscatter (-20 to -24 dB) due to specular water reflection, followed by steady backscatter increase as stems emerge.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Banana Canopy Signature
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Optical:</strong> Stable year-round broad-leaf vegetation (NDVI 0.65 - 0.85). No abrupt flood or bare-soil signature.
                </p>
                <p className="text-slate-400 text-[11px]">
                  <strong>SAR (Sentinel-1):</strong> Sustained high volume and double-bounce scattering (VH typically &gt; -14 dB). High cross-polarization difference (<code className="text-amber-300">VH_minus_VV_dB</code>).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Validated against ground reference points in Tirunelveli District.
          </div>
        </div>
      </div>

      {/* Model Confusion Matrix (Dynamic) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          Model Confusion Matrix (Validation Split)
        </h3>

        {metrics?.confusionMatrix && metrics.confusionMatrix.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Actual \ Predicted</th>
                  <th className="py-2.5 px-3 text-slate-300">Other (0)</th>
                  <th className="py-2.5 px-3 text-emerald-400">Paddy (1)</th>
                  <th className="py-2.5 px-3 text-amber-400">Banana (2)</th>
                  <th className="py-2.5 px-3">Producer Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {metrics.confusionMatrix.map((row, rIdx) => {
                  const classNames = ['Other', 'Paddy', 'Banana'];
                  const total = row.reduce((a, b) => a + b, 0);
                  const correct = row[rIdx];
                  const prodAcc = total > 0 ? ((correct / total) * 100).toFixed(1) + '%' : '0%';
                  return (
                    <tr key={rIdx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">
                        {classNames[rIdx]}
                      </td>
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`py-2.5 px-3 ${
                            rIdx === cIdx ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-400'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{prodAcc}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No analysis data available yet"
            description="Run model validation on the backend to dynamically populate actual confusion matrix cells."
          />
        )}
      </div>
    </div>
  );
};
