import React, { useEffect } from 'react';
import {
  MapContainer as LeafletMap,
  TileLayer,
  GeoJSON,
  Circle,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setInspectedCoords, setMapCenter, setMapZoom } from '../../store/slices/mapSlice';
import { setSelectedParcel } from '../../store/slices/parcelSlice';
import { MapControls } from './MapControls';
import { CropLegend } from '../common/CropLegend';
import { ParcelFeature, ParcelGeoJSON } from '../../types';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../utils/constants';

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

interface AgriculturalMapContainerProps {
  parcelsGeoJSON?: ParcelGeoJSON | null;
  parcels?: ParcelGeoJSON | ParcelFeature[] | null;
  height?: string;
  showLegend?: boolean;
  showControls?: boolean;
  interactive?: boolean;
}

export const MapContainer: React.FC<AgriculturalMapContainerProps> = ({
  parcelsGeoJSON,
  parcels,
  height = 'h-[600px]',
  showLegend = true,
  showControls = true,
  interactive = true,
}) => {
  const dispatch = useAppDispatch();
  const { center, zoom, baseMap, layers, inspectorMode, inspectedCoords } = useAppSelector(
    (state) => state.map
  );
  const parcelsFromStore = useAppSelector((state) => state.parcels.parcels);

  const passed = parcelsGeoJSON || (Array.isArray(parcels) ? { type: 'FeatureCollection' as const, features: parcels, totalFeatures: parcels.length } : parcels);
  const activeGeoJSON = passed || parcelsFromStore;
  const hasParcels = Boolean(activeGeoJSON && activeGeoJSON.features && activeGeoJSON.features.length > 0);

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

  // Polygon styling function
  const getParcelStyle = (feature?: any) => {
    if (!feature || !feature.properties) {
      return { fillOpacity: 0, opacity: 0 };
    }

    const cropCode = feature.properties.crop_code;

    // Visibility filters
    if (cropCode === 1 && !layers.showPaddy) return { fillOpacity: 0, opacity: 0 };
    if (cropCode === 2 && !layers.showBanana) return { fillOpacity: 0, opacity: 0 };
    if (cropCode === 0 && !layers.showOther) return { fillOpacity: 0, opacity: 0 };

    let fillColor = '#64748b';
    let borderColor = '#334155';

    if (cropCode === 1) {
      fillColor = '#22c55e'; // Paddy Green
      borderColor = '#15803d';
    } else if (cropCode === 2) {
      fillColor = '#eab308'; // Banana Amber
      borderColor = '#a16207';
    }

    return {
      fillColor: fillColor,
      fillOpacity: 0.55,
      color: layers.showBoundaries ? (cropCode === 1 ? '#86efac' : cropCode === 2 ? '#fef08a' : '#cbd5e1') : borderColor,
      weight: layers.showBoundaries ? 1.5 : 0.8,
      opacity: 0.9,
    };
  };

  // Feature interactions
  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        dispatch(setSelectedParcel(feature));
      },
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.8,
          weight: 2.5,
          color: '#ffffff',
        });
      },
      mouseout: (e: any) => {
        const target = e.target;
        target.setStyle(getParcelStyle(feature));
      },
    });

    const props = feature.properties;
    layer.bindPopup(`
      <div class="text-xs space-y-1">
        <div class="font-bold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1">
          <span>Field ID: ${props.segment_id}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded ${
            props.crop_code === 1 ? 'bg-emerald-500/20 text-emerald-400' :
            props.crop_code === 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
          }">${props.crop_name}</span>
        </div>
        <div class="grid grid-cols-2 gap-x-2 pt-1 text-slate-300">
          <div>Area: <strong>${props.area_ha?.toFixed(2) || '—'} ha</strong></div>
          <div>Mean NDVI: <strong>${props.mean_ndvi?.toFixed(3) || '—'}</strong></div>
          ${props.mean_lswi !== undefined ? `<div>Mean LSWI: <strong>${props.mean_lswi.toFixed(3)}</strong></div>` : ''}
          ${props.taluk ? `<div>Taluk: <strong>${props.taluk}</strong></div>` : ''}
        </div>
      </div>
    `);
  };

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950`}>
      <LeafletMap
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <MapViewUpdater center={center} zoom={zoom} />
        <MapClickHandler />

        {/* Selected Basemap TileLayer */}
        <TileLayer
          key={baseMap}
          url={tileUrls[baseMap]}
          attribution={tileAttributions[baseMap]}
          maxZoom={19}
        />

        {/* Pilot Sector Boundary Buffer (>= 20 km² around Ambasamudram-Cheranmahadevi) */}
        {layers.showPilotSector && (
          <Circle
            center={DEFAULT_MAP_CENTER}
            radius={4000} // 4km radius = ~50.2 km²
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              dashArray: '6, 6',
              fillColor: '#3b82f6',
              fillOpacity: 0.05,
            }}
          />
        )}

        {/* GeoJSON Field Parcels Layer */}
        {hasParcels && (
          <GeoJSON
            key={`parcels-${activeGeoJSON?.features.length}-${JSON.stringify(layers)}`}
            data={activeGeoJSON as any}
            style={getParcelStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </LeafletMap>

      {/* Floating Map Controls */}
      {showControls && <MapControls />}

      {/* Floating Crop Legend */}
      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[1000] max-w-xs">
          <CropLegend compact={true} />
        </div>
      )}

      {/* Notice Banner when Parcel Data is Waiting */}
      {!hasParcels && (
        <div className="absolute top-4 left-4 z-[1000] max-w-sm rounded-xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md p-3 text-xs text-slate-300 shadow-xl flex items-start gap-2.5">
          <div className="h-2 w-2 rounded-full bg-amber-400 mt-1.5 shrink-0 animate-ping" />
          <div>
            <p className="font-semibold text-slate-100">Satellite Map Canvas Ready</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Target study region centered at <strong>Ambasamudram & Cheranmahadevi</strong>.
              Field parcel polygons will stream onto the map once backend extraction completes.
            </p>
          </div>
        </div>
      )}

      {/* Inspector Mode Banner */}
      {inspectorMode && (
        <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-emerald-500/30 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 text-xs text-emerald-300 shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Inspector Tool Active: Click anywhere to extract spectral coordinates</span>
          {inspectedCoords && (
            <span className="font-mono text-slate-400 text-[10px] ml-2">
              [{inspectedCoords[0].toFixed(4)}, {inspectedCoords[1].toFixed(4)}]
            </span>
          )}
        </div>
      )}
    </div>
  );
};
