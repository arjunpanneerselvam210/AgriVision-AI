import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Calendar,
  Layers,
  Sprout,
  Activity,
  Info,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchTemporalProfile } from '../store/slices/satelliteSlice';
import { ChartCard } from '../components/common/ChartCard';
import { EmptyState } from '../components/common/EmptyState';
import { CROP_COLORS } from '../utils/constants';

export const TemporalAnalysisPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { temporalProfile, isLoadingTemporal } = useAppSelector((state) => state.satellite);
  const [selectedCropProfile, setSelectedCropProfile] = useState<'both' | 'paddy' | 'banana'>('both');

  useEffect(() => {
    // Optionally trigger temporal profile fetch for default coordinates/sample
    dispatch(fetchTemporalProfile({}));
  }, [dispatch]);

  const series = temporalProfile?.series || [];
  const hasData = series.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <LineChartIcon className="w-6 h-6 text-emerald-400" />
            Temporal & Phenological Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Multi-temporal trajectory analysis across 30-day Sentinel-2 & Sentinel-1 composite intervals
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Crop Trajectory:</span>
          <select
            value={selectedCropProfile}
            onChange={(e) => setSelectedCropProfile(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="both">Both Paddy & Banana</option>
            <option value="paddy">Paddy Only (Transplanting Cycle)</option>
            <option value="banana">Banana Only (Perennial Profile)</option>
          </select>
        </div>
      </div>

      {/* Phenology Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paddy Phenology */}
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Sprout className="w-4 h-4" />
            Paddy Phenological Trajectory (Kar / Pishanam Season)
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <p>
                <strong>Flooding & Transplanting:</strong> Low/negative NDVI, high NDWI/LSWI due to standing water in puddled fields; sharp drop in SAR backscatter.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <p>
                <strong>Vegetative Tillering & Heading:</strong> Steep upward NDVI trajectory reaching peak values (0.75 - 0.85); SAR VH rises strongly.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <p>
                <strong>Maturity & Harvest:</strong> Rapid drop in NDVI and water indices, transitioning to bare soil or stubble.
              </p>
            </div>
          </div>
        </div>

        {/* Banana Phenology */}
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <Layers className="w-4 h-4" />
            Banana Phenological Trajectory (Perennial Canopy)
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <p>
                <strong>Continuous Dense Canopy:</strong> No sudden inundation/puddling drop. NDVI remains steadily elevated (0.65 - 0.85) throughout all quarters.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <p>
                <strong>Persistent High Moisture:</strong> Stable positive LSWI due to high internal water content in pseudostems and broad leaves.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <p>
                <strong>Volumetric SAR Signature:</strong> High and stable VH backscatter (&gt; -14 dB) without seasonal plunge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Multi-Temporal Chart */}
      <ChartCard
        title="Phenological Profile (NDVI & LSWI Time-Series)"
        subtitle="30-day composite interval progression"
        hasData={hasData}
        isLoading={isLoadingTemporal}
        emptyMessage="No analysis data available yet"
      >
        <div className="h-[360px] w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[-0.2, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ndvi"
                  name="Mean NDVI"
                  stroke={CROP_COLORS.paddy}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="ndwi"
                  name="Mean NDWI"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="lswi"
                  name="Mean LSWI"
                  stroke={CROP_COLORS.banana}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                title="No analysis data available yet"
                description="Temporal phenology profiles will be generated when the multi-temporal Sentinel-2 collection is analyzed by the backend pipeline."
              />
            </div>
          )}
        </div>
      </ChartCard>
    </div>
  );
};
