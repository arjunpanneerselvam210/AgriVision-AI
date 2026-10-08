import React, { useState, useEffect } from 'react';
import {
  Shapes,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Info,
  Maximize2,
  TrendingUp,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchParcels, setSelectedParcel } from '../store/slices/parcelSlice';
import { DataTable, Column } from '../components/common/DataTable';
import { StatCard } from '../components/common/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { ParcelFeature } from '../types';
import { formatHectares, formatCropName } from '../utils/formatters';
import { CROP_COLORS } from '../utils/constants';

export const FieldAnalysisPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { parcels, isLoading, error } = useAppSelector((state) => state.parcels);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    if (!parcels) {
      dispatch(fetchParcels(undefined));
    }
  }, [dispatch, parcels]);

  const featureList: ParcelFeature[] = parcels?.features || [];

  // Dynamic calculations based strictly on real loaded parcels
  const hasParcels = featureList.length > 0;
  const totalParcelsCount = featureList.length;
  const totalAreaHa = featureList.reduce((sum, p) => sum + (p.properties.area_ha || 0), 0);
  const meanParcelArea = hasParcels ? totalAreaHa / totalParcelsCount : 0;
  const meanNdvi = hasParcels
    ? featureList.reduce((sum, p) => sum + (p.properties.mean_ndvi || 0), 0) / totalParcelsCount
    : 0;

  // Filtered parcels
  const filtered = featureList.filter((p) => {
    const cropName = p.properties.crop_name.toLowerCase();
    const matchesCrop = selectedCrop === 'all' || cropName === selectedCrop.toLowerCase();
    const matchesSearch =
      searchTerm.trim() === '' ||
      String(p.properties.segment_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      cropName.includes(searchTerm.toLowerCase());
    return matchesCrop && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedParcels = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    if (!hasParcels) return;
    const header = 'Segment_ID,Crop_Class,Area_ha,Mean_NDVI,Mean_LSWI,VH_dB,Confidence\n';
    const rows = filtered
      .map(
        (p) =>
          `"${p.properties.segment_id}","${p.properties.crop_name}",${p.properties.area_ha},${p.properties.mean_ndvi ?? ''},${p.properties.mean_lswi ?? ''},${p.properties.mean_vh_dB ?? ''},${p.properties.confidence ?? ''}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AgriVision_Parcels_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<ParcelFeature>[] = [
    {
      key: 'segment_id',
      header: 'Segment ID',
      render: (_, row) => (
        <span className="font-mono text-emerald-400 font-medium">#{String(row.properties.segment_id).slice(-8)}</span>
      ),
    },
    {
      key: 'crop_name',
      header: 'Identified Crop',
      render: (_, row) => {
        const crop = row.properties.crop_name.toLowerCase();
        const color =
          crop === 'paddy'
            ? CROP_COLORS.paddy
            : crop === 'banana'
            ? CROP_COLORS.banana
            : CROP_COLORS.other;
        return (
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {row.properties.crop_name}
          </span>
        );
      },
    },
    {
      key: 'area_ha',
      header: 'Delineated Area',
      sortable: true,
      render: (_, row) => (
        <span className="font-medium text-white">{formatHectares(row.properties.area_ha)}</span>
      ),
    },
    {
      key: 'mean_ndvi',
      header: 'Mean NDVI',
      sortable: true,
      render: (_, row) => (
        <span className="font-mono text-slate-300">
          {row.properties.mean_ndvi !== undefined ? row.properties.mean_ndvi.toFixed(3) : '—'}
        </span>
      ),
    },
    {
      key: 'mean_lswi',
      header: 'Mean LSWI',
      render: (_, row) => (
        <span className="font-mono text-slate-400">
          {row.properties.mean_lswi !== undefined ? row.properties.mean_lswi.toFixed(3) : '—'}
        </span>
      ),
    },
    {
      key: 'mean_vh_dB',
      header: 'SAR VH (dB)',
      render: (_, row) => (
        <span className="font-mono text-slate-400">
          {row.properties.mean_vh_dB !== undefined ? `${row.properties.mean_vh_dB.toFixed(1)} dB` : '—'}
        </span>
      ),
    },
    {
      key: 'confidence',
      header: 'ML Confidence',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(row.properties.confidence || 0) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-emerald-300">
            {((row.properties.confidence || 0) * 100).toFixed(0)}%
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Shapes className="w-6 h-6 text-emerald-400" />
            Field & Parcel-Like Segment Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Object-Based Image Analysis (OBIA) agricultural segments derived via Sentinel-2 SNIC clustering
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={!hasParcels}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={() => dispatch(fetchParcels(undefined))}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Parcels
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Segment Count"
          value={hasParcels ? totalParcelsCount.toLocaleString() : null}
          subtitle="Extracted OBIA clusters"
          icon={Shapes}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Extent Sampled"
          value={hasParcels ? formatHectares(totalAreaHa) : null}
          subtitle="Sum of delineated parcels"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title="Mean Field Size"
          value={hasParcels ? formatHectares(meanParcelArea) : null}
          subtitle="Average field parcel area"
          icon={Maximize2}
          isLoading={isLoading}
        />
        <StatCard
          title="Overall Mean NDVI"
          value={hasParcels ? meanNdvi.toFixed(3) : null}
          subtitle="Canopy vigor index across fields"
          icon={TrendingUp}
          isLoading={isLoading}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID or crop..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Crop Class:
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Classes</option>
            <option value="paddy">Paddy Only</option>
            <option value="banana">Banana Only</option>
            <option value="other">Other Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <DataTable
          columns={columns}
          data={paginatedParcels}
          keyExtractor={(row) => row.id}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(row) => dispatch(setSelectedParcel(row))}
          emptyMessage="No analysis data available yet"
        />
      </div>

      {/* Scientific Methodology Note */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Info className="w-4 h-4 text-emerald-400" />
          OBIA SNIC Segmentation Methodology
        </div>
        <p className="leading-relaxed">
          Agricultural field/parcel-like segments are delineated using Simple Non-Iterative Clustering (SNIC) seeded across high-resolution Sentinel-2 optical bands (Red, Green, Blue, NIR) and multi-temporal normalized difference vegetation indices. Segments group spectrally contiguous agricultural pixels, mitigating speckle noise and salt-and-pepper effects inherent to pixel-level classification.
        </p>
      </div>
    </div>
  );
};
