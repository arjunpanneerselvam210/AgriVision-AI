import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { triggerAnalysis } from '../store/slices/analysisSlice';
import { EmptyState } from '../components/common/EmptyState';
import { formatHectares, formatSquareKm, formatDate } from '../utils/formatters';
import { DEFAULT_AOI } from '../utils/constants';

export const ReportsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { summary, isTriggering } = useAppSelector((state) => state.analysis);
  const { parcels } = useAppSelector((state) => state.parcels);

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const hasSummary = summary !== null && summary !== undefined;
  const featureList = parcels?.features || [];

  const handleTriggerAnalysis = async () => {
    try {
      await dispatch(
        triggerAnalysis({
          season: 'Pishanam (September – April)',
          notes: 'Standard Mapathon PS-1 run',
        })
      ).unwrap();
    } catch {
      // Handled in redux
    }
  };

  const handleExportGeoJson = () => {
    if (featureList.length === 0) return;
    setDownloadingFormat('geojson');
    const geojson = {
      type: 'FeatureCollection',
      name: 'AgriVision_Parcels_Tirunelveli',
      features: featureList,
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgriVision_Parcels_${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadingFormat(null);
  };

  const handleExportCsv = () => {
    if (featureList.length === 0) return;
    setDownloadingFormat('csv');
    const header = 'Segment_ID,Crop_Class,Area_ha,Mean_NDVI,Mean_LSWI,VH_dB,Confidence\n';
    const rows = featureList
      .map(
        (p) =>
          `"${p.properties.segment_id}","${p.properties.crop_name}",${p.properties.area_ha},${p.properties.mean_ndvi ?? ''},${p.properties.mean_lswi ?? ''},${p.properties.mean_vh_dB ?? ''},${p.properties.confidence ?? ''}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgriVision_Summary_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadingFormat(null);
  };

  const paddyHa = summary?.cropAcreage?.paddy?.hectares ?? null;
  const bananaHa = summary?.cropAcreage?.banana?.hectares ?? null;
  const otherHa = summary?.cropAcreage?.other?.hectares ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            Agricultural Intelligence Reports & Data Exports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Produce scientifically verifiable geospatial reports for Tirunelveli District administration
          </p>
        </div>

        <button
          onClick={handleTriggerAnalysis}
          disabled={isTriggering}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isTriggering ? 'animate-spin' : ''}`} />
          {isTriggering ? 'Triggering Pipeline...' : 'Run Pipeline Analysis'}
        </button>
      </div>

      {/* Available Export Formats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* GeoJSON Export */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">GeoJSON Parcel Polygons</h3>
            <p className="text-xs text-slate-400 mt-1">
              Full spatial vector boundaries with crop attributes, NDVI, and area metadata.
            </p>
          </div>
          <button
            onClick={handleExportGeoJson}
            disabled={featureList.length === 0}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Download GeoJSON ({featureList.length})
          </button>
        </div>

        {/* CSV Statistics Export */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Tabular Statistics CSV</h3>
            <p className="text-xs text-slate-400 mt-1">
              Parcel attributes, crop classifications, areas in hectares, and model confidences.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={featureList.length === 0}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Download CSV ({featureList.length})
          </button>
        </div>

        {/* GeoTIFF Classified Raster */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Classified Cloud-Optimized GeoTIFF</h3>
            <p className="text-xs text-slate-400 mt-1">
              Direct GEE export of 10m classified raster for GIS analysis (QGIS / ArcGIS).
            </p>
          </div>
          <a
            href="https://earthengine.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            Export via GEE Assets
          </a>
        </div>
      </div>

      {/* Zonal Analysis Summary Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          Zonal Crop Statistics Report
        </h3>

        {hasSummary ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Administrative Zone</th>
                  <th className="py-2.5 px-3">Total Extent</th>
                  <th className="py-2.5 px-3 text-emerald-400">Paddy Area</th>
                  <th className="py-2.5 px-3 text-amber-400">Banana Area</th>
                  <th className="py-2.5 px-3 text-slate-400">Other Agriculture</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans font-semibold text-white">
                    {DEFAULT_AOI.taluks.join(' & ')} ({DEFAULT_AOI.district})
                  </td>
                  <td className="py-3 px-3 text-slate-200">{formatSquareKm(summary.studyRegion.totalAreaKm2)}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">
                    {paddyHa !== null ? formatHectares(paddyHa) : '—'}
                  </td>
                  <td className="py-3 px-3 text-amber-400 font-bold">
                    {bananaHa !== null ? formatHectares(bananaHa) : '—'}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {otherHa !== null ? formatHectares(otherHa) : '—'}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No analysis data available yet"
            description="Run the pipeline or connect backend data to view zonal crop breakdown."
          />
        )}
      </div>
    </div>
  );
};
