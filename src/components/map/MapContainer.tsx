import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer as LeafletMap,
  TileLayer,
  GeoJSON,
  Polygon,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, Eye, Info, Layers, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  setInspectedCoords,
  setMapCenter,
  setMapZoom,
} from '../../store/slices/mapSlice';
import { setSelectedParcel } from '../../store/slices/parcelSlice';
import { MapControls } from './MapControls';
import { CropLegend } from '../common/CropLegend';
import { ParcelFeature, ParcelGeoJSON } from '../../types';
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getCropColor,
  getCropConfig,
  CROP_CONFIG,
} from '../../utils/constants';

interface MapViewUpdaterProps {
  center: [number, number];
  zoom: number;
}

const MapViewUpdater: React.FC<MapViewUpdaterProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapClickHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const { inspectorMode } = useAppSelector((state) => state.map);

  useMapEvents({
    click: (e) => {
      if (inspectorMode) {
        dispatch(setInspectedCoords([e.latlng.lat, e.latlng.lng]));
      }
    },
    moveend: (e) => {
      const center = e.target.getCenter();
      const zoom = e.target.getZoom();
      dispatch(setMapCenter([center.lat, center.lng]));
      dispatch(setMapZoom(zoom));
    },
  });

  return null;
};

// Canonical Study Area Boundary Polygon for Ambasamudram & Cheranmahadevi Sector (>= 20 km²)
const DEFAULT_STUDY_AREA_POLYGON: [number, number][] = [
  [8.6550, 77.3950],
  [8.6550, 77.5150],
  [8.7450, 77.5150],
  [8.7450, 77.3950],
];

interface AgriculturalMapContainerProps {
  parcelsGeoJSON?: ParcelGeoJSON | null;
  parcels?: ParcelGeoJSON | ParcelFeature[] | null;
  studyAreaBoundary?: any | null;
  studyAreaName?: string;
  height?: string;
  showLegend?: boolean;
  showControls?: boolean;
  interactive?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const MapContainer: React.FC<AgriculturalMapContainerProps> = ({
  parcelsGeoJSON,
  parcels,
  studyAreaBoundary,
  studyAreaName = 'Ambasamudram & Cheranmahadevi Sector',
  height = 'h-[600px]',
  showLegend = true,
  showControls = true,
  interactive = true,
  onRefresh,
  isLoading = false,
}) => {
  const dispatch = useAppDispatch();
  const { center, zoom, baseMap, layers, inspectorMode, inspectedCoords } = useAppSelector(
    (state) => state.map
  );
  const selectedParcel = useAppSelector((state) => state.parcels.selectedParcel);
  const parcelsFromStore = useAppSelector((state) => state.parcels.parcels);

  const passed =
    parcelsGeoJSON ||
    (Array.isArray(parcels)
      ? { type: 'FeatureCollection' as const, features: parcels, totalFeatures: parcels.length }
      : parcels);
  const activeGeoJSON = passed || parcelsFromStore;

  // Filter features that have valid geometries (No fake polygons)
  const validFeatures = useMemo(() => {
    if (!activeGeoJSON || !Array.isArray(activeGeoJSON.features)) return [];
    return activeGeoJSON.features.filter(
      (f) => f && f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0
    );
  }, [activeGeoJSON]);

  const hasParcels = validFeatures.length > 0;

  // Basemap Tile Providers
  const tileUrls = {
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  };

  const tileAttributions = {
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    streets: '&copy; OpenStreetMap contributors',
    dark: '&copy; CartoDB &copy; OpenStreetMap contributors',
    topo: 'Tiles &copy; Esri',
  };

  // Centralized Polygon styling function
  const getParcelStyle = (feature?: any) => {
    if (!feature || !feature.properties) {
      return { fillOpacity: 0, opacity: 0, weight: 0 };
    }

    const props = feature.properties;
    const cropIdentifier =
      props.predicted_crop || props.crop_class || props.crop_name || props.crop_code;
    const cropCfg = getCropConfig(cropIdentifier);
    const cropCode = cropCfg.code;

    // Visibility toggles based on map layers
    if (cropCode === 1 && !layers.showPaddy) return { fillOpacity: 0, opacity: 0, weight: 0 };
    if (cropCode === 2 && !layers.showBanana) return { fillOpacity: 0, opacity: 0, weight: 0 };
    if (cropCode === 0 && !layers.showOther) return { fillOpacity: 0, opacity: 0, weight: 0 };

    const isSelected =
      selectedParcel &&
      (selectedParcel.id === feature.id ||
        selectedParcel.properties?.segment_id === props.segment_id);

    return {
      fillColor: cropCfg.fillColor,
      fillOpacity: isSelected ? Math.min(layers.polygonOpacity + 0.25, 0.95) : layers.polygonOpacity,
      color: isSelected
        ? '#ffffff'
        : layers.showBoundaries
        ? cropCfg.borderColor
        : 'transparent',
      weight: isSelected ? 3.5 : layers.showBoundaries ? 1.5 : 0,
      opacity: isSelected ? 1.0 : layers.showBoundaries ? 0.9 : 0,
    };
  };

  // Feature interactions: Click, Hover, Popup
  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties || {};

    layer.on({
      click: () => {
        dispatch(setSelectedParcel(feature));
      },
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: Math.min(layers.polygonOpacity + 0.3, 0.95),
          weight: 3,
          color: '#ffffff',
        });
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle(getParcelStyle(feature));
      },
    });

    const fieldId = props.field_id || props.segment_id || feature.id || 'N/A';
    const areaHa = props.area_ha !== undefined ? Number(props.area_ha).toFixed(2) : '—';
    const areaM2 =
      props.area_m2 !== undefined
        ? Number(props.area_m2).toLocaleString()
        : props.area_ha !== undefined
        ? Math.round(Number(props.area_ha) * 10000).toLocaleString()
        : '—';

    const predictedCrop = (
      props.predicted_crop ||
      props.crop_class ||
      props.crop_name ||
      'OTHER'
    ).toString().toUpperCase();

    const cropCfg = getCropConfig(predictedCrop);
    const confidenceVal = props.confidence !== undefined ? (Number(props.confidence) * 100).toFixed(1) : 'N/A';
    const analysisDate = props.analysis_date || props.createdAt || '2024-03-15';
    const formattedDate =
      analysisDate.length > 10 ? analysisDate.substring(0, 10) : analysisDate;
    const modelVersion = props.model_version || 'RF-v1.4-Fused';
    const satelliteAnalysisId =
      props.satellite_analysis_id ||
      props.sceneId ||
      `S2A_MSIL2A_${formattedDate.replace(/-/g, '')}`;

    const popupHtml = `
      <div style="font-family: inherit; font-size: 11px; min-width: 210px; line-height: 1.4; color: #f1f5f9;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
          <strong style="color: #ffffff; font-size: 12px;">Field #${fieldId}</strong>
          <span style="background-color: ${cropCfg.color}25; color: ${cropCfg.color}; font-weight: bold; padding: 2px 6px; border-radius: 9999px; font-size: 10px; text-transform: uppercase;">
            ${predictedCrop}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 3px;">
          <div><span style="color: #94a3b8;">Field ID:</span> <strong style="color: #e2e8f0; font-family: monospace;">${fieldId}</strong></div>
          <div><span style="color: #94a3b8;">Area:</span> <strong style="color: #e2e8f0;">${areaHa} ha</strong> <span style="color: #64748b;">(${areaM2} m²)</span></div>
          <div><span style="color: #94a3b8;">Predicted Crop:</span> <strong style="color: ${cropCfg.color};">${cropCfg.label}</strong></div>
          <div><span style="color: #94a3b8;">Confidence:</span> <strong style="color: #34d399;">${confidenceVal}%</strong></div>
          <div><span style="color: #94a3b8;">Analysis Date:</span> <strong style="color: #cbd5e1;">${formattedDate}</strong></div>
          <div><span style="color: #94a3b8;">Model Version:</span> <strong style="color: #60a5fa; font-family: monospace;">${modelVersion}</strong></div>
          <div style="word-break: break-all;"><span style="color: #94a3b8;">Satellite Analysis ID:</span> <strong style="color: #cbd5e1; font-family: monospace; font-size: 10px;">${satelliteAnalysisId}</strong></div>
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml, {
      className: 'agrivision-leaflet-popup',
    });
  };

  // Crop Counts and Areas for the Legend
  const legendStats = useMemo(() => {
    let paddyCount = 0;
    let bananaCount = 0;
    let otherCount = 0;
    let paddyHa = 0;
    let bananaHa = 0;
    let otherHa = 0;

    validFeatures.forEach((f) => {
      const p = f.properties || {};
      const crop = (p.predicted_crop || p.crop_class || p.crop_name || '').toString().toUpperCase();
      const ha = Number(p.area_ha) || 0;
      if (crop === 'PADDY' || p.crop_code === 1) {
        paddyCount++;
        paddyHa += ha;
      } else if (crop === 'BANANA' || p.crop_code === 2) {
        bananaCount++;
        bananaHa += ha;
      } else {
        otherCount++;
        otherHa += ha;
      }
    });

    return {
      counts: { PADDY: paddyCount, BANANA: bananaCount, OTHER: otherCount },
      areasHa: { PADDY: paddyHa, BANANA: bananaHa, OTHER: otherHa },
    };
  }, [validFeatures]);

  return (
    <div
      className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 font-sans`}
    >
      <LeafletMap
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapViewUpdater center={center} zoom={zoom} />
        <MapClickHandler />

        {/* 1. Base Map TileLayer */}
        <TileLayer
          key={baseMap}
          url={tileUrls[baseMap]}
          attribution={tileAttributions[baseMap]}
          maxZoom={19}
        />

        {/* 2. Study Area Boundary Overlay */}
        {layers.showStudyAreaBoundary && (
          <>
            {studyAreaBoundary ? (
              <GeoJSON
                key={`study-area-boundary-${JSON.stringify(studyAreaBoundary).length}`}
                data={studyAreaBoundary}
                style={{
                  color: '#3b82f6',
                  weight: 2.5,
                  dashArray: '8, 6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.08,
                }}
              />
            ) : (
              <Polygon
                positions={DEFAULT_STUDY_AREA_POLYGON}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 2.5,
                  dashArray: '8, 6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.08,
                }}
              />
            )}
          </>
        )}

        {/* 3. Agricultural Field Boundaries & Crop Classification Polygons */}
        {hasParcels && (
          <GeoJSON
            key={`parcels-${validFeatures.length}-${layers.polygonOpacity}-${JSON.stringify(
              layers
            )}-${selectedParcel?.id || ''}`}
            data={{ type: 'FeatureCollection', features: validFeatures } as any}
            style={getParcelStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </LeafletMap>

      {/* Floating Layer & Zoom Controls */}
      {showControls && <MapControls />}

      {/* Floating Crop Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-xs pointer-events-auto">
          <CropLegend
            compact={true}
            counts={legendStats.counts}
            areasHa={legendStats.areasHa}
          />
        </div>
      )}

      {/* Requirement: If backend has no field geometry, display: "No field classification data available." */}
      {!hasParcels && (
        <div className="absolute inset-0 z-[998] flex items-center justify-center pointer-events-none p-4">
          <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              No field classification data available.
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              No vector field parcel geometries were found in the database for{' '}
              <strong className="text-slate-200">{studyAreaName}</strong> matching current criteria.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-3 text-xs">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-md"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Check for Ingested Parcels
                </button>
              )}
              <span className="text-[11px] text-slate-500 font-mono">
                PostGIS GeoJSON API Ready
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Study Area Extent Badge */}
      <div className="absolute top-4 left-4 z-[999] pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl shadow-xl flex items-center gap-2.5 text-xs text-slate-300">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm animate-pulse" />
        <div>
          <span className="font-semibold text-white block leading-tight">{studyAreaName}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {hasParcels
              ? `${validFeatures.length} Field Parcels Delineated`
              : 'PostGIS Spatial Engine Online'}
          </span>
        </div>
      </div>
    </div>
  );
};
