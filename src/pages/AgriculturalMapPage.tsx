import React, { useEffect, useState } from 'react';
import {
  Layers,
  Filter,
  Info,
  Maximize2,
  RefreshCw,
  Compass,
  Sprout,
  X,
  ChevronRight,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchParcels, setSelectedParcel } from '../store/slices/parcelSlice';
import { MapContainer } from '../components/map/MapContainer';
import { CropLegend } from '../components/common/CropLegend';
import { EmptyState } from '../components/common/EmptyState';
import { formatHectares, formatCropName } from '../utils/formatters';
import { DEFAULT_AOI, CROP_COLORS } from '../utils/constants';
import { ParcelFeature } from '../types';

export const AgriculturalMapPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { parcels, selectedParcel, isLoading, error } = useAppSelector((state) => state.parcels);

  const [filterCrop, setFilterCrop] = useState<string>('all');
  const [minNdvi, setMinNdvi] = useState<number>(0);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);

  useEffect(() => {
    if (!parcels) {
      dispatch(fetchParcels(undefined));
    }
  }, [dispatch, parcels]);

  const featureList: ParcelFeature[] = parcels?.features || [];

  // Apply frontend filters
  const filteredParcels = featureList.filter((p) => {
    const cropName = p.properties.crop_name.toLowerCase();
    if (filterCrop !== 'all' && cropName !== filterCrop.toLowerCase()) return false;
    if (minNdvi > 0 && (p.properties.mean_ndvi || 0) < minNdvi) return false;
    return true;
  });

  const handleRefresh = () => {
    dispatch(fetchParcels(undefined));
  };

  const selectedCropClass = selectedParcel?.properties.crop_name.toLowerCase();
  const selectedCropColor =
    selectedCropClass === 'paddy'
      ? CROP_COLORS.paddy
      : selectedCropClass === 'banana'
      ? CROP_COLORS.banana
      : CROP_COLORS.other;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            Agricultural Land Parcel Map
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Delineated boundaries & classification for{' '}
            <span className="text-slate-200">{DEFAULT_AOI.taluks.join(' & ')}</span>, Tirunelveli (10m Resolution)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              showFilterPanel
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {filterCrop !== 'all' || minNdvi > 0 ? '(Active)' : ''}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Reload parcels from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter drawer if expanded */}
      {showFilterPanel && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl flex flex-wrap items-center gap-6 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">
              Crop Filter
            </label>
            <select
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Crops (Paddy, Banana, Other)</option>
              <option value="paddy">Paddy Only</option>
              <option value="banana">Banana Only</option>
              <option value="other">Other Agriculture Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase tracking-wider text-[10px]">
              Minimum NDVI: {minNdvi.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={minNdvi}
              onChange={(e) => setMinNdvi(parseFloat(e.target.value))}
              className="w-36 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 sm:pt-0 sm:ml-auto">
            <button
              onClick={() => {
                setFilterCrop('all');
                setMinNdvi(0);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Map Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map View */}
        <div className={`${selectedParcel ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300`}>
          <div className="h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-950">
            <MapContainer
              parcels={filteredParcels}
              height="100%"
              showLegend={true}
              showControls={true}
              interactive={true}
            />

            {/* Quick Status Pill */}
            <div className="absolute top-4 right-4 z-[999] bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300">
                Displaying <strong className="text-white">{filteredParcels.length}</strong> segments
              </span>
            </div>
          </div>
        </div>

        {/* Selected Parcel Inspector Panel */}
        {selectedParcel && (
          <div className="lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: selectedCropColor }}
                  />
                  <h3 className="text-sm font-bold text-white">
                    Parcel Segment #{selectedParcel.properties.segment_id}
                  </h3>
                </div>
                <button
                  onClick={() => dispatch(setSelectedParcel(null))}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Classified Crop:</span>
                  <span
                    className="font-bold px-2.5 py-0.5 rounded-full text-xs uppercase"
                    style={{
                      backgroundColor: `${selectedCropColor}20`,
                      color: selectedCropColor,
                    }}
                  >
                    {selectedParcel.properties.crop_name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Delineated Area</span>
                    <span className="text-sm font-semibold text-white mt-1 block">
                      {formatHectares(selectedParcel.properties.area_ha)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Prediction Confidence</span>
                    <span className="text-sm font-semibold text-emerald-400 mt-1 block">
                      {selectedParcel.properties.confidence !== undefined
                        ? `${(selectedParcel.properties.confidence * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Spectral & Polarimetric Signatures
                  </h4>

                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Mean Sentinel-2 NDVI:</span>
                    <span className="font-mono text-slate-200">
                      {selectedParcel.properties.mean_ndvi !== undefined
                        ? selectedParcel.properties.mean_ndvi.toFixed(3)
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Mean LSWI (Water Index):</span>
                    <span className="font-mono text-slate-200">
                      {selectedParcel.properties.mean_lswi !== undefined
                        ? selectedParcel.properties.mean_lswi.toFixed(3)
                        : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800/50">
                    <span className="text-slate-400">Sentinel-1 VH Backscatter:</span>
                    <span className="font-mono text-slate-200">
                      {selectedParcel.properties.mean_vh_dB !== undefined
                        ? `${selectedParcel.properties.mean_vh_dB.toFixed(1)} dB`
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                  OBIA SNIC Segmentation seed: 15px spatial compactness.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => dispatch(setSelectedParcel(null))}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
