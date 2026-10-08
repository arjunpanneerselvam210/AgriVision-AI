import React, { useEffect, useState } from 'react';
import {
  Satellite,
  Radio,
  Layers,
  Calendar,
  RefreshCw,
  Info,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchSatelliteLayers, setActiveLayerId } from '../store/slices/satelliteSlice';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { SATELLITE_BANDS_INFO } from '../utils/constants';

export const SatelliteAnalysisPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { layers, activeLayerId, isLoadingLayers } = useAppSelector((state) => state.satellite);

  const [sensorFilter, setSensorFilter] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchSatelliteLayers());
  }, [dispatch]);

  const filteredLayers = layers.filter((item) => {
    if (sensorFilter === 'all') return true;
    return item.sensor.toLowerCase() === sensorFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Satellite className="w-6 h-6 text-emerald-400" />
            Satellite Earth Observation Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Multisensor fusion: Sentinel-2 Multispectral Optical (MSI) & Sentinel-1 C-Band SAR (GRD)
          </p>
        </div>

        <button
          onClick={() => dispatch(fetchSatelliteLayers())}
          disabled={isLoadingLayers}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLayers ? 'animate-spin text-emerald-400' : ''}`} />
          Refresh Layers
        </button>
      </div>

      {/* Sensor Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentinel-2 MSI Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Sentinel-2 (MSI)</h3>
                <span className="text-xs text-emerald-400 font-medium">Optical Multi-Spectral</span>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              Level-2A (BOA)
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Spatial Resolution</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">10m / 20m Native</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Revisit Frequency</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">5 Days (2A + 2B)</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Utilized Spectral Bands
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                <div>• B2 (Blue - 490 nm)</div>
                <div>• B3 (Green - 560 nm)</div>
                <div>• B4 (Red - 665 nm)</div>
                <div>• B8 (NIR - 842 nm, 10m)</div>
                <div>• B11 (SWIR-1 - 1610 nm)</div>
                <div>• B12 (SWIR-2 - 2190 nm)</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
              Filtered for cloud cover &lt; 20% with SCL / QA60 cirrus and opaque cloud masking.
            </div>
          </div>
        </div>

        {/* Sentinel-1 SAR Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Sentinel-1 (C-SAR)</h3>
                <span className="text-xs text-blue-400 font-medium">Active Microwave Radar</span>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              GRD / IW Mode
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Polarization Channels</span>
                <span className="text-sm font-semibold text-white mt-0.5 block">Dual-Pol (VV + VH)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">All-Weather Capability</span>
                <span className="text-sm font-semibold text-blue-400 mt-0.5 block">100% Cloud-Penetrating</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Utilized Polarimetric Features
              </h4>
              <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                <div>• VV Backscatter (dB): Soil moisture & direct surface return</div>
                <div>• VH Backscatter (dB): Crop volume scattering & canopy biomass</div>
                <div>• Cross-Pol Difference (<code className="text-blue-300">VH_minus_VV_dB</code>): Structure metric</div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
              Speckle-filtered using Refined Lee / temporal multi-temporal composite filter.
            </div>
          </div>
        </div>
      </div>

      {/* Earth Observation Sensor Layers Catalog */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Available Earth Observation Pipeline Layers
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrated sensor bands & indices available for classification ingestion
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Filter Sensor:</span>
            <select
              value={sensorFilter}
              onChange={(e) => setSensorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Sensors</option>
              <option value="sentinel-2">Sentinel-2 (MSI)</option>
              <option value="sentinel-1">Sentinel-1 (SAR)</option>
            </select>
          </div>
        </div>

        {isLoadingLayers ? (
          <LoadingState message="Loading satellite sensor layer records..." />
        ) : filteredLayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => dispatch(setActiveLayerId(layer.id))}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  layer.id === activeLayerId
                    ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {layer.id === activeLayerId && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {layer.name}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      layer.sensor === 'Sentinel-2'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {layer.sensor}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{layer.description}</p>
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {layer.bands.map((b) => (
                    <span
                      key={b}
                      className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No analysis data available yet"
            description="Satellite layer configurations will be populated when connected to backend."
          />
        )}
      </div>

      {/* Sensor Band Specifications Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Sensor Band Matrix & Radiometric Roles
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Band / Polarimetric Channel</th>
                <th className="py-2.5 px-3">Wavelength / Frequency</th>
                <th className="py-2.5 px-3">Spatial Resolution</th>
                <th className="py-2.5 px-3">Role in Crop Discrimination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {SATELLITE_BANDS_INFO.map((b) => (
                <tr key={b.name} className="hover:bg-slate-800/30 font-sans">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{b.name}</td>
                  <td className="py-2.5 px-3 text-slate-300">{b.label}</td>
                  <td className="py-2.5 px-3 text-slate-400">{b.resolution}</td>
                  <td className="py-2.5 px-3 text-slate-300">{b.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
