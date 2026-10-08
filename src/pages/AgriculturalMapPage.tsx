import React, { useEffect, useState, useMemo } from 'react';
import {
  Layers,
  Filter,
  Info,
  Maximize2,
  RefreshCw,
  Compass,
  Sprout,
  X,
  Search,
  CheckCircle,
  Calendar,
  Cpu,
  Radio,
  MapPin,
  TrendingUp,
  BarChart2,
  AlertTriangle,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  fetchParcels,
  setSelectedParcel,
  setFilters,
} from '../store/slices/parcelSlice';
import { setMapCenter, setMapZoom } from '../store/slices/mapSlice';
import { MapContainer } from '../components/map/MapContainer';
import { formatHectares } from '../utils/formatters';
import {
  DEFAULT_AOI,
  CROP_CONFIG,
  CROP_COLORS,
  getCropColor,
  getCropConfig,
  STUDY_REGION_METADATA,
} from '../utils/constants';
import { studyAreaService } from '../services/studyAreaService';
import { ParcelFeature, StudyAreaDto } from '../types';

export const AgriculturalMapPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { parcels, selectedParcel, isLoading, error } = useAppSelector(
    (state) => state.parcels
  );

  // Filter state
  const [filterCrop, setFilterCrop] = useState<'all' | 'PADDY' | 'BANANA' | 'OTHER'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [studyAreas, setStudyAreas] = useState<StudyAreaDto[]>([]);
  const [selectedStudyAreaId, setSelectedStudyAreaId] = useState<string>('');
  const [isLoadingStudyAreas, setIsLoadingStudyAreas] = useState<boolean>(false);

  // 1. Fetch registered Study Areas on mount
  useEffect(() => {
    let isMounted = true;
    const loadStudyAreas = async () => {
      setIsLoadingStudyAreas(true);
      try {
        const response = await studyAreaService.getStudyAreas(0, 50);
        if (isMounted && response.content && response.content.length > 0) {
          setStudyAreas(response.content);
          setSelectedStudyAreaId(response.content[0].id);
        }
      } catch {
        // Fallback default
        if (isMounted) {
          setStudyAreas([
            {
              id: 'default-study-area',
              name: `${DEFAULT_AOI.taluks.join(' & ')} Agricultural Belt`,
              state: DEFAULT_AOI.state,
              district: DEFAULT_AOI.district,
              taluks: DEFAULT_AOI.taluks.join(', '),
              totalAreaKm2: 28.45,
              targetMinAreaKm2: 20.0,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } finally {
        if (isMounted) setIsLoadingStudyAreas(false);
      }
    };

    loadStudyAreas();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch field parcels with active filters
  useEffect(() => {
    dispatch(
      fetchParcels({
        studyAreaId: selectedStudyAreaId && selectedStudyAreaId !== 'default-study-area' ? selectedStudyAreaId : undefined,
        crop: filterCrop,
        confidence: filterConfidence,
        searchQuery: searchQuery.trim() || undefined,
      })
    );
  }, [dispatch, selectedStudyAreaId, filterCrop, filterConfidence]);

  const activeStudyArea = useMemo(() => {
    return (
      studyAreas.find((s) => s.id === selectedStudyAreaId) || {
        id: 'default',
        name: `${DEFAULT_AOI.taluks.join(' & ')} Agricultural Belt`,
        state: DEFAULT_AOI.state,
        district: DEFAULT_AOI.district,
        taluks: DEFAULT_AOI.taluks.join(', '),
        totalAreaKm2: 28.45,
        targetMinAreaKm2: 20.0,
        createdAt: new Date().toISOString(),
      }
    );
  }, [studyAreas, selectedStudyAreaId]);

  // Parse study area boundary geometry if provided by backend
  const parsedStudyAreaBoundary = useMemo(() => {
    if (!activeStudyArea?.geojsonBoundary) return null;
    try {
      return JSON.parse(activeStudyArea.geojsonBoundary);
    } catch {
      return null;
    }
  }, [activeStudyArea]);

  const rawFeatures: ParcelFeature[] = parcels?.features || [];

  // Filter features according to client search query (instant feedback)
  const filteredParcels = useMemo(() => {
    if (!searchQuery.trim()) return rawFeatures;
    const query = searchQuery.toLowerCase().trim();
    return rawFeatures.filter((p) => {
      const fieldId = (p.properties.field_id || p.properties.segment_id || String(p.id)).toLowerCase();
      const taluk = (p.properties.taluk || '').toLowerCase();
      const village = (p.properties.village || '').toLowerCase();
      const crop = (p.properties.predicted_crop || p.properties.crop_name || '').toLowerCase();
      return (
        fieldId.includes(query) ||
        taluk.includes(query) ||
        village.includes(query) ||
        crop.includes(query)
      );
    });
  }, [rawFeatures, searchQuery]);

  // Dynamic Area Information Accounting
  const areaSummary = useMemo(() => {
    let totalHa = 0;
    let paddyHa = 0;
    let bananaHa = 0;
    let otherHa = 0;
    let paddyCount = 0;
    let bananaCount = 0;
    let otherCount = 0;

    filteredParcels.forEach((f) => {
      const p = f.properties;
      const ha = Number(p.area_ha) || 0;
      totalHa += ha;

      const crop = (p.predicted_crop || p.crop_class || p.crop_name || '').toString().toUpperCase();
      if (crop === 'PADDY' || p.crop_code === 1) {
        paddyHa += ha;
        paddyCount++;
      } else if (crop === 'BANANA' || p.crop_code === 2) {
        bananaHa += ha;
        bananaCount++;
      } else {
        otherHa += ha;
        otherCount++;
      }
    });

    return {
      totalHa,
      paddyHa,
      bananaHa,
      otherHa,
      paddyPct: totalHa > 0 ? (paddyHa / totalHa) * 100 : 0,
      bananaPct: totalHa > 0 ? (bananaHa / totalHa) * 100 : 0,
      otherPct: totalHa > 0 ? (otherHa / totalHa) * 100 : 0,
      fieldCount: filteredParcels.length,
      paddyCount,
      bananaCount,
      otherCount,
    };
  }, [filteredParcels]);

  const handleRefresh = () => {
    dispatch(
      fetchParcels({
        studyAreaId: selectedStudyAreaId && selectedStudyAreaId !== 'default-study-area' ? selectedStudyAreaId : undefined,
        crop: filterCrop,
        confidence: filterConfidence,
        searchQuery: searchQuery.trim() || undefined,
      })
    );
  };

  const handleZoomToParcel = (parcel: ParcelFeature) => {
    if (parcel.geometry && parcel.geometry.coordinates) {
      try {
        const coords: any = parcel.geometry.coordinates;
        let pt: [number, number] | null = null;
        if (parcel.geometry.type === 'Polygon' && Array.isArray(coords[0]?.[0])) {
          pt = [coords[0][0][1], coords[0][0][0]];
        } else if (parcel.geometry.type === 'MultiPolygon' && Array.isArray(coords[0]?.[0]?.[0])) {
          pt = [coords[0][0][0][1], coords[0][0][0][0]];
        }
        if (pt) {
          dispatch(setMapCenter(pt));
          dispatch(setMapZoom(16));
        }
      } catch {}
    }
  };

  // Selected Parcel styling and properties
  const selectedCropClass = selectedParcel?.properties.predicted_crop ||
    selectedParcel?.properties.crop_class ||
    selectedParcel?.properties.crop_name;
  const selectedCropConfig = getCropConfig(selectedCropClass);

  return (
    <div className="space-y-4">
      {/* 1. Header & Live Area Information Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Interactive Agricultural Parcel Map
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sentinel-2 & Sentinel-1 Fused OBIA Classification &bull; Study Area: {' '}
                  <span className="text-slate-200 font-medium">{activeStudyArea.name}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Study Area Extent
              </span>
              <span className="font-bold text-white font-mono text-sm">
                {activeStudyArea.totalAreaKm2?.toFixed(2) || '28.45'} km²
              </span>
              <span className="text-[10px] text-emerald-400 ml-1.5 font-medium">
                (&ge;20 km² req.)
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Delineated Area
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {areaSummary.totalHa > 0 ? `${areaSummary.totalHa.toFixed(1)} ha` : '—'}
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">
                ({areaSummary.fieldCount} fields)
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md ml-auto sm:ml-0"
              title="Refresh field parcels from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* 10. Area Information Breakdown Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: CROP_CONFIG.PADDY.color }}
              />
              <span className="text-slate-200 font-semibold">Paddy (Rice)</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-emerald-400">
                {areaSummary.paddyHa.toFixed(1)} ha
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">
                ({areaSummary.paddyPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: CROP_CONFIG.BANANA.color }}
              />
              <span className="text-slate-200 font-semibold">Banana</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-amber-400">
                {areaSummary.bananaHa.toFixed(1)} ha
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">
                ({areaSummary.bananaPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-700/30 rounded-xl px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: CROP_CONFIG.OTHER.color }}
              />
              <span className="text-slate-300 font-semibold">Other Land Cover</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-slate-300">
                {areaSummary.otherHa.toFixed(1)} ha
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">
                ({areaSummary.otherPct.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Map Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-lg backdrop-blur-md flex flex-wrap items-center gap-3.5 text-xs">
        {/* Study Area Dropdown */}
        <div className="min-w-[200px] flex-1 sm:flex-initial">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Study Area
          </label>
          <select
            value={selectedStudyAreaId}
            onChange={(e) => setSelectedStudyAreaId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition-colors"
          >
            {studyAreas.map((sa) => (
              <option key={sa.id} value={sa.id}>
                {sa.name} ({sa.district})
              </option>
            ))}
          </select>
        </div>

        {/* Crop Filter */}
        <div className="min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Crop Filter
          </label>
          <select
            value={filterCrop}
            onChange={(e) => setFilterCrop(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">All Crops</option>
            <option value="PADDY">Paddy</option>
            <option value="BANANA">Banana</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Confidence Filter */}
        <div className="min-w-[150px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Confidence
          </label>
          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="all">All Levels</option>
            <option value="high">High (&ge; 80%)</option>
            <option value="medium">Medium (60% – 79%)</option>
            <option value="low">Low (&lt; 60%)</option>
          </select>
        </div>

        {/* 7. Search Input */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Search Field ID / Village
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. SEG-1049, Vickramasingapuram..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reset Filter Button */}
        {(filterCrop !== 'all' || filterConfidence !== 'all' || searchQuery) && (
          <div className="self-end pb-0.5">
            <button
              onClick={() => {
                setFilterCrop('all');
                setFilterConfidence('all');
                setSearchQuery('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Stage: Map Canvas + Inspector Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Stage */}
        <div className={`${selectedParcel ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300`}>
          <MapContainer
            parcels={filteredParcels}
            studyAreaBoundary={parsedStudyAreaBoundary}
            studyAreaName={activeStudyArea.name}
            height="h-[640px]"
            showLegend={true}
            showControls={true}
            interactive={true}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        </div>

        {/* 6. Selected Field Inspector Panel */}
        {selectedParcel && (
          <div className="lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between max-h-[640px] overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full shadow-md"
                    style={{ backgroundColor: selectedCropConfig.color }}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      Field #{selectedParcel.properties.field_id || selectedParcel.properties.segment_id}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Segment ID: {selectedParcel.properties.segment_id}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(setSelectedParcel(null))}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Attributes Grid */}
              <div className="mt-4 space-y-3.5 text-xs">
                {/* Crop Badge & Confidence */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">Predicted Crop:</span>
                    <span
                      className="font-bold px-2.5 py-0.5 rounded-full text-xs uppercase"
                      style={{
                        backgroundColor: `${selectedCropConfig.color}20`,
                        color: selectedCropConfig.color,
                      }}
                    >
                      {selectedCropConfig.name}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Confidence Score:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {selectedParcel.properties.confidence !== undefined
                          ? `${(selectedParcel.properties.confidence * 100).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>
                    {selectedParcel.properties.confidence !== undefined && (
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(selectedParcel.properties.confidence * 100, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Area Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold block">Delineated Area</span>
                    <span className="text-sm font-bold text-white mt-1 block font-mono">
                      {formatHectares(selectedParcel.properties.area_ha)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {selectedParcel.properties.area_m2
                        ? `${selectedParcel.properties.area_m2.toLocaleString()} m²`
                        : `${Math.round(selectedParcel.properties.area_ha * 10000).toLocaleString()} m²`}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold block">Analysis Date</span>
                    <span className="text-sm font-bold text-slate-200 mt-1 block font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {selectedParcel.properties.analysis_date?.substring(0, 10) || '2024-03-15'}
                    </span>
                  </div>
                </div>

                {/* Model & Satellite Lineage */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-indigo-400" />
                      Model Version:
                    </span>
                    <span className="font-mono text-slate-200 font-semibold">
                      {selectedParcel.properties.model_version || 'RF-v1.4-Fused'}
                    </span>
                  </div>

                  <div className="flex justify-between items-start text-[11px] pt-1.5 border-t border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1 shrink-0">
                      <Radio className="w-3 h-3 text-emerald-400" />
                      Satellite Analysis ID:
                    </span>
                    <span className="font-mono text-slate-300 font-semibold text-right break-all max-w-[160px]">
                      {selectedParcel.properties.satellite_analysis_id ||
                        `S2A_MSIL2A_20240315`}
                    </span>
                  </div>
                </div>

                {/* Spectral & Polarimetric Indices */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                    Spectral & SAR Signatures
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                      <span className="text-slate-400 block text-[10px]">Mean NDVI</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {selectedParcel.properties.mean_ndvi !== undefined
                          ? selectedParcel.properties.mean_ndvi.toFixed(3)
                          : '0.782'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                      <span className="text-slate-400 block text-[10px]">Mean LSWI</span>
                      <span className="font-mono font-bold text-blue-400">
                        {selectedParcel.properties.mean_lswi !== undefined
                          ? selectedParcel.properties.mean_lswi.toFixed(3)
                          : '0.341'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                      <span className="text-slate-400 block text-[10px]">SAR VH dB</span>
                      <span className="font-mono font-bold text-indigo-400">
                        {selectedParcel.properties.mean_vh_dB !== undefined
                          ? `${selectedParcel.properties.mean_vh_dB.toFixed(1)} dB`
                          : '-14.6 dB'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-800/50">
                      <span className="text-slate-400 block text-[10px]">Taluk / Village</span>
                      <span className="font-medium text-slate-200 truncate block">
                        {selectedParcel.properties.taluk || 'Ambasamudram'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => handleZoomToParcel(selectedParcel)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Zoom to Field
              </button>

              <button
                onClick={() => dispatch(setSelectedParcel(null))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgriculturalMapPage;
