import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  Shapes,
  Sprout,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Info,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Database,
  Satellite,
  CheckCircle2,
  Inbox,
  Filter,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { ChartCard } from '../components/common/ChartCard';
import { CropLegend } from '../components/common/CropLegend';
import { MapContainer } from '../components/map/MapContainer';
import {
  studyAreaService,
  fieldService,
  classificationService,
  satelliteService,
  modelService,
  reportService,
} from '../services';
import {
  StudyAreaDto,
  FieldParcelDto,
  CropAcreageSummaryDto,
  SatelliteAnalysisDto,
  MlModelDto,
  ModelMetricsDto,
  StudyAreaReportDto,
  PageResponse,
  ParcelGeoJSON,
} from '../types';
import { formatHectares, formatSquareKm, formatPercentage, formatDate } from '../utils/formatters';
import { CROP_COLORS } from '../utils/constants';

export const DashboardPage: React.FC = () => {
  // State for all 6 Connected Backend APIs
  const [studyAreas, setStudyAreas] = useState<StudyAreaDto[]>([]);
  const [selectedStudyArea, setSelectedStudyArea] = useState<StudyAreaDto | null>(null);

  const [cropSummary, setCropSummary] = useState<CropAcreageSummaryDto | null>(null);
  const [fieldsPage, setFieldsPage] = useState<PageResponse<FieldParcelDto> | null>(null);
  const [satelliteAnalyses, setSatelliteAnalyses] = useState<SatelliteAnalysisDto[]>([]);
  const [models, setModels] = useState<MlModelDto[]>([]);
  const [activeModelMetrics, setActiveModelMetrics] = useState<ModelMetricsDto | null>(null);
  const [report, setReport] = useState<StudyAreaReportDto | null>(null);

  // Pagination & Filter States
  const [fieldPageNumber, setFieldPageNumber] = useState<number>(0);
  const [fieldCropFilter, setFieldCropFilter] = useState<string>('ALL');

  // Loading & Error States
  const [isLoadingAll, setIsLoadingAll] = useState<boolean>(true);
  const [isLoadingFields, setIsLoadingFields] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  /**
   * Main Data Fetcher with AbortSignal cancellation
   */
  const loadDashboardData = useCallback(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    setIsLoadingAll(true);
    setErrorMessage(null);

    async function executeFetch() {
      try {
        // 1. Fetch Registered Study Areas
        const studyAreaResponse = await studyAreaService.getStudyAreas(0, 10, 'createdAt,desc', signal);
        const areas = studyAreaResponse.content || [];
        setStudyAreas(areas);

        const currentArea = selectedStudyArea || (areas.length > 0 ? areas[0] : null);
        if (currentArea && (!selectedStudyArea || selectedStudyArea.id !== currentArea.id)) {
          setSelectedStudyArea(currentArea);
        }

        // 2. Fetch ML Models & Best Model Metrics
        try {
          const mlModels = await modelService.getModels(signal);
          setModels(mlModels);
          if (mlModels.length > 0) {
            const bestModel = mlModels[0];
            const metrics = await modelService.getModelMetrics(bestModel.id, signal);
            setActiveModelMetrics(metrics);
          } else {
            setActiveModelMetrics(null);
          }
        } catch {
          // Model metrics will remain null to trigger professional empty state
          setModels([]);
          setActiveModelMetrics(null);
        }

        // 3. Fetch Recent Satellite Analyses
        try {
          const satResponse = await satelliteService.getAnalyses(0, 5, 'acquisitionDate,desc', signal);
          setSatelliteAnalyses(satResponse.content || []);
        } catch {
          setSatelliteAnalyses([]);
        }

        // If an active study area exists, load study-area specific data
        if (currentArea) {
          // 4. Fetch Classification Summary (Dynamic Acreages)
          try {
            const summary = await classificationService.getCropAcreageSummary(currentArea.id, signal);
            setCropSummary(summary);
          } catch {
            setCropSummary(null);
          }

          // 5. Fetch Field Parcels with pagination
          try {
            const fieldsRes = await fieldService.getFields(
              {
                studyAreaId: currentArea.id,
                page: fieldPageNumber,
                size: 8,
                sort: 'areaHa,desc',
              },
              signal
            );
            setFieldsPage(fieldsRes);
          } catch {
            setFieldsPage(null);
          }

          // 6. Fetch Comprehensive Study Area Report
          try {
            const rpt = await reportService.getReportByStudyArea(currentArea.id, signal);
            setReport(rpt);
          } catch {
            setReport(null);
          }
        } else {
          setCropSummary(null);
          setFieldsPage(null);
          setReport(null);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          setErrorMessage(err.message || 'Failed to communicate with AgriVision AI backend server.');
        }
      } finally {
        setIsLoadingAll(false);
      }
    }

    executeFetch();

    return () => {
      abortController.abort();
    };
  }, [selectedStudyArea, fieldPageNumber, retryTrigger]);

  useEffect(() => {
    const cancel = loadDashboardData();
    return cancel;
  }, [loadDashboardData]);

  // Handle Field Pagination separately for fast responsive UI
  const handlePageChange = async (newPage: number) => {
    if (!selectedStudyArea || newPage < 0 || (fieldsPage && newPage >= fieldsPage.totalPages)) return;
    setIsLoadingFields(true);
    try {
      const res = await fieldService.getFields({
        studyAreaId: selectedStudyArea.id,
        cropClass: fieldCropFilter === 'ALL' ? undefined : (fieldCropFilter as any),
        page: newPage,
        size: 8,
        sort: 'areaHa,desc',
      });
      setFieldsPage(res);
      setFieldPageNumber(newPage);
    } catch (err: any) {
      // Keep existing page
    } finally {
      setIsLoadingFields(false);
    }
  };

  const handleStudyAreaSelect = (area: StudyAreaDto) => {
    setSelectedStudyArea(area);
    setFieldPageNumber(0);
  };

  const handleManualRetry = () => {
    setRetryTrigger((prev) => prev + 1);
  };

  // Convert field parcel geometries into GeoJSON for the interactive Leaflet preview
  const mapGeoJSON = useMemo<ParcelGeoJSON | null>(() => {
    if (!fieldsPage?.content || fieldsPage.content.length === 0) return null;

    const features = fieldsPage.content
      .map((field) => {
        if (!field.geojsonGeometry) return null;
        try {
          const geometry = JSON.parse(field.geojsonGeometry);
          return {
            type: 'Feature' as const,
            geometry,
            properties: {
              id: field.id,
              parcel_id: field.segmentId,
              area_ha: field.areaHa,
              crop_class: field.cropClass.toLowerCase(),
              crop_code: field.cropClass === 'PADDY' ? 1 : field.cropClass === 'BANANA' ? 2 : 0,
              confidence: field.confidence ?? 0.85,
              mean_ndvi: field.meanNdvi,
              mean_lswi: field.meanLswi,
              mean_ndwi: field.meanNdwi,
              mean_vh_db: field.meanVhDb,
              mean_vh_minus_vv_db: field.meanVhMinusVvDb,
              taluk: field.taluk,
              village: field.village,
            },
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (features.length === 0) return null;

    return {
      type: 'FeatureCollection' as const,
      features: features as any[],
      totalFeatures: features.length,
    };
  }, [fieldsPage]);

  // Crop Distribution Data prepared dynamically ONLY from backend summary
  const cropDistributionData = useMemo(() => {
    if (!cropSummary) return [];

    const items = [
      {
        name: 'Paddy',
        value: cropSummary.paddyAreaHa,
        percentage: cropSummary.paddyPercentage,
        count: cropSummary.paddyFieldCount,
        color: CROP_COLORS.paddy,
      },
      {
        name: 'Banana',
        value: cropSummary.bananaAreaHa,
        percentage: cropSummary.bananaPercentage,
        count: cropSummary.bananaFieldCount,
        color: CROP_COLORS.banana,
      },
      {
        name: 'Other',
        value: cropSummary.otherAreaHa,
        percentage: cropSummary.otherPercentage,
        count: cropSummary.otherFieldCount,
        color: CROP_COLORS.other,
      },
    ].filter((item) => item.value !== undefined && item.value !== null && item.value > 0);

    return items;
  }, [cropSummary]);

  // Derived Metric Values — NEVER hardcoded; null if not in backend response
  const totalStudyAreaKm2 = selectedStudyArea?.totalAreaKm2 ?? report?.totalAreaKm2 ?? null;
  const totalStudyAreaHa = selectedStudyArea?.totalAreaKm2
    ? selectedStudyArea.totalAreaKm2 * 100
    : report?.totalAreaHa ?? null;

  const totalFieldsDetected =
    cropSummary?.totalFieldsDetected ?? fieldsPage?.totalElements ?? report?.fieldCount ?? null;

  const paddyHa = cropSummary?.paddyAreaHa ?? report?.acreageSummary?.paddyAreaHa ?? null;
  const paddyPct = cropSummary?.paddyPercentage ?? report?.acreageSummary?.paddyPercentage ?? null;

  const bananaHa = cropSummary?.bananaAreaHa ?? report?.acreageSummary?.bananaAreaHa ?? null;
  const bananaPct = cropSummary?.bananaPercentage ?? report?.acreageSummary?.bananaPercentage ?? null;

  const otherHa = cropSummary?.otherAreaHa ?? report?.acreageSummary?.otherAreaHa ?? null;
  const otherPct = cropSummary?.otherPercentage ?? report?.acreageSummary?.otherPercentage ?? null;

  const latestSatDate =
    satelliteAnalyses.length > 0
      ? satelliteAnalyses[0].acquisitionDate
      : report?.latestSatelliteAcquisitionDate ?? null;

  const modelAccuracy = activeModelMetrics?.overallAccuracy
    ? activeModelMetrics.overallAccuracy * 100
    : report?.bestModelAccuracy
    ? report.bestModelAccuracy * 100
    : null;

  const modelKappa = activeModelMetrics?.kappa ?? null;
  const modelAlgorithm = activeModelMetrics?.algorithm ?? report?.bestModelAlgorithm ?? null;

  return (
    <div className="space-y-6">
      {/* Top Header & Study Area Selection */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Agricultural Intelligence Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Backend API
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Connected to Spring Boot API &bull; PostGIS Agricultural Parcels &bull; Earth Observation Engine
          </p>
        </div>

        {/* Study Area Dropdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {studyAreas.length > 0 && (
            <div className="relative">
              <select
                value={selectedStudyArea?.id || ''}
                onChange={(e) => {
                  const match = studyAreas.find((a) => a.id === e.target.value);
                  if (match) handleStudyAreaSelect(match);
                }}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none pr-8 cursor-pointer shadow-sm"
              >
                {studyAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} ({area.district})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          <button
            onClick={handleManualRetry}
            disabled={isLoadingAll}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Fetch latest updates from backend APIs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAll ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Data
          </button>

          <Link
            to="/map"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            Open Map View
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Error Banner with Retry Button */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-rose-200">Backend Communication Issue</p>
              <p className="text-xs text-rose-300/90">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={handleManualRetry}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Scientific Notice Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3 shadow-inner">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-white">Observation Standard:</span> Agricultural boundaries represent{' '}
          <strong className="text-emerald-300">satellite-derived field/parcel-like segments</strong> generated from
          Sentinel-2 (10m) multi-temporal optical imagery and Sentinel-1 SAR GRD dual-polarization data (IW mode).
          Classification and acreage values are dynamically computed by the Spring Boot backend with PostGIS.
        </div>
      </div>

      {/* 8 Primary Dashboard Metric Cards (NO hardcoded fake numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Study Area */}
        <StatCard
          title="Total Study Area"
          value={totalStudyAreaKm2 !== null ? formatSquareKm(totalStudyAreaKm2) : null}
          subtitle={
            totalStudyAreaHa !== null
              ? `Equivalent to ${formatHectares(totalStudyAreaHa)}`
              : selectedStudyArea
              ? `${selectedStudyArea.taluks}`
              : undefined
          }
          icon={Globe}
          trend={totalStudyAreaKm2 !== null && totalStudyAreaKm2 >= 20 ? '>= 20 km² target met' : undefined}
          trendType={totalStudyAreaKm2 !== null && totalStudyAreaKm2 >= 20 ? 'positive' : 'neutral'}
          isLoading={isLoadingAll}
        />

        {/* 2. Detected Fields / Parcels */}
        <StatCard
          title="Detected Fields / Parcels"
          value={totalFieldsDetected !== null ? totalFieldsDetected.toLocaleString() : null}
          subtitle={totalFieldsDetected !== null ? 'OBIA-segmented agricultural units' : undefined}
          icon={Shapes}
          trend={
            fieldsPage && fieldsPage.totalElements > 0
              ? `${fieldsPage.content.length} in current view`
              : undefined
          }
          trendType="neutral"
          isLoading={isLoadingAll}
        />

        {/* 3. Paddy Cultivation Area */}
        <StatCard
          title="Paddy Cultivation Area"
          value={paddyHa !== null ? formatHectares(paddyHa) : null}
          subtitle={paddyPct !== null ? `${formatPercentage(paddyPct)} of study area` : undefined}
          icon={Sprout}
          badgeText="Class 1"
          badgeColor="emerald"
          isLoading={isLoadingAll}
        />

        {/* 4. Banana Cultivation Area */}
        <StatCard
          title="Banana Cultivation Area"
          value={bananaHa !== null ? formatHectares(bananaHa) : null}
          subtitle={bananaPct !== null ? `${formatPercentage(bananaPct)} of study area` : undefined}
          icon={TrendingUp}
          badgeText="Class 2"
          badgeColor="amber"
          isLoading={isLoadingAll}
        />

        {/* 5. Other Agricultural Area */}
        <StatCard
          title="Other Agricultural Area"
          value={otherHa !== null ? formatHectares(otherHa) : null}
          subtitle={otherPct !== null ? `${formatPercentage(otherPct)} of study area` : undefined}
          icon={Layers}
          badgeText="Class 0"
          badgeColor="slate"
          isLoading={isLoadingAll}
        />

        {/* 6. Latest Satellite Analysis Acquisition */}
        <StatCard
          title="Latest Satellite Acquisition"
          value={latestSatDate ? formatDate(latestSatDate) : null}
          subtitle={
            satelliteAnalyses.length > 0
              ? `${satelliteAnalyses[0].sensor} (${satelliteAnalyses[0].processingLevel || 'L2A'})`
              : undefined
          }
          icon={Calendar}
          badgeText={
            satelliteAnalyses.length > 0 && satelliteAnalyses[0].cloudCover !== undefined
              ? `Cloud ${satelliteAnalyses[0].cloudCover.toFixed(1)}%`
              : undefined
          }
          badgeColor="blue"
          isLoading={isLoadingAll}
        />

        {/* 7. Model Validation Accuracy */}
        <StatCard
          title="Model Validation Accuracy"
          value={modelAccuracy !== null ? formatPercentage(modelAccuracy) : null}
          subtitle={modelKappa !== null ? `Validation Kappa: ${modelKappa.toFixed(3)}` : undefined}
          icon={Cpu}
          badgeText={modelAlgorithm ? `Model: ${modelAlgorithm}` : undefined}
          badgeColor="purple"
          isLoading={isLoadingAll}
        />

        {/* 8. Pipeline Analysis Status */}
        <StatCard
          title="Pipeline Analysis Status"
          value={
            satelliteAnalyses.length > 0
              ? satelliteAnalyses[0].status
              : selectedStudyArea
              ? 'ACTIVE'
              : null
          }
          subtitle={
            satelliteAnalyses.length > 0
              ? `Scene ID: ${satelliteAnalyses[0].sceneId.slice(0, 18)}...`
              : selectedStudyArea
              ? 'Monitoring Region Registered'
              : undefined
          }
          icon={Activity}
          badgeText={satelliteAnalyses.length > 0 ? 'Verified EO' : undefined}
          badgeColor="emerald"
          isLoading={isLoadingAll}
        />
      </div>

      {/* Main Grid: Interactive Map Preview + Crop Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map Preview (7 columns) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Agricultural Land Parcel Preview
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStudyArea
                  ? `${selectedStudyArea.name} &bull; ${selectedStudyArea.taluks}`
                  : 'Pilot Sector: Ambasamudram & Cheranmahadevi'}
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              Full Screen Map <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-[420px] w-full relative">
            {mapGeoJSON && mapGeoJSON.features.length > 0 ? (
              <MapContainer
                parcels={mapGeoJSON}
                height="100%"
                showLegend={false}
                showControls={true}
                interactive={true}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/40">
                <Shapes className="w-12 h-12 text-slate-600 mb-3 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-300">
                  No field boundaries loaded in preview
                </p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No parcel geometries currently returned for this viewport. Execute OBIA SNIC parcel segmentation or select another study area.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <CropLegend />
            <span className="text-slate-400">
              Active parcel vectors:{' '}
              <strong className="text-white">
                {mapGeoJSON ? mapGeoJSON.features.length : 0}
              </strong>
            </span>
          </div>
        </div>

        {/* Right: Crop Distribution & Summary Charts (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Crop Distribution Pie Chart */}
          <ChartCard
            title="Crop Area Distribution"
            subtitle="Relative coverage across delineated parcels"
            hasData={cropDistributionData.length > 0}
            isLoading={isLoadingAll}
            headerAction={cropDistributionData.length > 0 ? <CropLegend vertical={false} /> : undefined}
          >
            {cropDistributionData.length > 0 ? (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cropDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {cropDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any, name: any) => [`${Number(value).toFixed(2)} ha`, `${name}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[220px] flex flex-col items-center justify-center p-6 text-center">
                <Sprout className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300">
                  No crop classification available yet.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Run an analysis to generate Paddy, Banana, and Other crop acreage results.
                </p>
              </div>
            )}
          </ChartCard>

          {/* Hectares Breakdown Bar Chart */}
          <ChartCard
            title="Cultivation Extent (Hectares)"
            subtitle="Comparative area calculated dynamically"
            hasData={cropDistributionData.length > 0}
            isLoading={isLoadingAll}
          >
            {cropDistributionData.length > 0 ? (
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cropDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val} ha`} />
                    <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={12} width={60} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} ha`, 'Area']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {cropDistributionData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex flex-col items-center justify-center p-6 text-center">
                <Inbox className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300">
                  No crop classification available yet.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Run an analysis to generate results.
                </p>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Bottom Section: Paginated Field Parcels Table & Satellite Acquisition Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Paginated Field Parcels (7 columns) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  Delineated Agricultural Parcels
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Segment-level optical and SAR spectral features
                </p>
              </div>

              {/* Crop Filter Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Class:</span>
                <select
                  value={fieldCropFilter}
                  onChange={(e) => {
                    setFieldCropFilter(e.target.value);
                    setFieldPageNumber(0);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Crops</option>
                  <option value="PADDY">Paddy</option>
                  <option value="BANANA">Banana</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Table or Empty State */}
            {isLoadingFields ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mb-2" />
                <span>Loading parcel records from database...</span>
              </div>
            ) : fieldsPage && fieldsPage.content.length > 0 ? (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Segment ID</th>
                      <th className="py-2.5 px-3">Crop Class</th>
                      <th className="py-2.5 px-3">Area (ha)</th>
                      <th className="py-2.5 px-3">Mean NDVI</th>
                      <th className="py-2.5 px-3">VH SAR (dB)</th>
                      <th className="py-2.5 px-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {fieldsPage.content.map((field) => {
                      const isPaddy = field.cropClass === 'PADDY';
                      const isBanana = field.cropClass === 'BANANA';
                      const badgeClass = isPaddy
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isBanana
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700';

                      return (
                        <tr key={field.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 font-mono font-medium text-white">
                            {field.segmentId || field.id.slice(0, 8)}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}>
                              {field.cropClass}
                            </span>
                          </td>
                          <td className="py-2 px-3">{field.areaHa.toFixed(2)}</td>
                          <td className="py-2 px-3 font-mono">
                            {field.meanNdvi !== undefined && field.meanNdvi !== null
                              ? field.meanNdvi.toFixed(3)
                              : '—'}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {field.meanVhDb !== undefined && field.meanVhDb !== null
                              ? `${field.meanVhDb.toFixed(1)} dB`
                              : '—'}
                          </td>
                          <td className="py-2 px-3">
                            {field.confidence !== undefined && field.confidence !== null
                              ? `${(field.confidence * 100).toFixed(0)}%`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Inbox className="w-10 h-10 text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300">
                  No field parcels found in database.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Run an analysis or OBIA segmentation pipeline to generate agricultural parcels.
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {fieldsPage && fieldsPage.totalPages > 1 && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 mt-4">
              <span>
                Showing page <strong className="text-white">{fieldPageNumber + 1}</strong> of{' '}
                <strong className="text-white">{fieldsPage.totalPages}</strong> ({fieldsPage.totalElements} total parcels)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(fieldPageNumber - 1)}
                  disabled={fieldPageNumber === 0 || isLoadingFields}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(fieldPageNumber + 1)}
                  disabled={fieldPageNumber >= fieldsPage.totalPages - 1 || isLoadingFields}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Recent Satellite Analysis & Model Performance (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Satellite Analysis Pipeline Ingestion Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-emerald-400" />
                  Recent Satellite Acquisitions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sentinel-1 & Sentinel-2 Earth Observation Stream
                </p>
              </div>
              <Link to="/satellite" className="text-xs text-emerald-400 hover:underline">
                View All
              </Link>
            </div>

            {satelliteAnalyses.length > 0 ? (
              <div className="space-y-3 mt-3">
                {satelliteAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{analysis.sensor}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {analysis.processingLevel || 'L2A'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {analysis.sceneId}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Acquired: {formatDate(analysis.acquisitionDate)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {analysis.status}
                      </span>
                      {analysis.cloudCover !== undefined && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          Cloud: {analysis.cloudCover.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Satellite className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300">
                  No satellite analysis available yet.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Run an analysis to generate results.
                </p>
              </div>
            )}
          </div>

          {/* Machine Learning Model Performance Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  Crop ML Model Architecture
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Optical & SAR Fusion Random Forest Pipeline
                </p>
              </div>
              <Link to="/model" className="text-xs text-purple-400 hover:underline">
                Evaluation
              </Link>
            </div>

            {activeModelMetrics ? (
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {activeModelMetrics.modelName}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {activeModelMetrics.algorithm}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {activeModelMetrics.overallAccuracy
                          ? formatPercentage(activeModelMetrics.overallAccuracy * 100)
                          : '—'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Kappa</p>
                      <p className="text-sm font-bold text-purple-300">
                        {activeModelMetrics.kappa ? activeModelMetrics.kappa.toFixed(3) : '—'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Weighted F1</p>
                      <p className="text-sm font-bold text-sky-400">
                        {activeModelMetrics.weightedF1
                          ? activeModelMetrics.weightedF1.toFixed(3)
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {activeModelMetrics.ablation && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>SAR Fusion Delta:</span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        {activeModelMetrics.ablation.accuracyDelta !== undefined
                          ? `${activeModelMetrics.ablation.accuracyDelta >= 0 ? '+' : ''}${(activeModelMetrics.ablation.accuracyDelta * 100).toFixed(2)}% OA`
                          : 'Ablation Evaluated'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <Cpu className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-300">
                  No validated model found.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                  Train and validate a Random Forest model with optical + radar features to view accuracy metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
