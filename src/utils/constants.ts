import { CropClassType, CropClassInfo } from '../types';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'AgriVision AI';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';


// Study Region Geography: Ambasamudram & Cheranmahadevi, Tirunelveli District, Tamil Nadu
export const DEFAULT_MAP_CENTER: [number, number] = [
  Number(import.meta.env.VITE_DEFAULT_MAP_LAT) || 8.6983,
  Number(import.meta.env.VITE_DEFAULT_MAP_LNG) || 77.4526,
];
export const DEFAULT_MAP_ZOOM = Number(import.meta.env.VITE_DEFAULT_MAP_ZOOM) || 12;

export const STUDY_REGION_METADATA = {
  state: 'Tamil Nadu',
  district: 'Tirunelveli',
  taluks: ['Ambasamudram', 'Cheranmahadevi'],
  riverBasin: 'Thamirabarani River Basin',
  agriculturalSeason: 'Pishanam (September – April)',
  minAreaKm2: 20.0,
};

export const DEFAULT_AOI = {
  state: STUDY_REGION_METADATA.state,
  district: STUDY_REGION_METADATA.district,
  taluks: STUDY_REGION_METADATA.taluks,
  targetMinAreaKm2: STUDY_REGION_METADATA.minAreaKm2,
};

export const CROP_COLORS = {
  other: '#64748b',
  paddy: '#22c55e',
  banana: '#eab308',
};

export const CROP_CLASSES: Record<CropClassType, CropClassInfo> = {
  0: {
    code: 0,
    name: 'Other',
    color: '#64748b', // Slate 500
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    description: 'Water bodies, settlements, barren terrain, fallow scrub',
  },
  1: {
    code: 1,
    name: 'Paddy',
    color: '#22c55e', // Emerald 500
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    description: 'Irrigated lowland rice with dynamic inundation-vegetative cycles',
  },
  2: {
    code: 2,
    name: 'Banana',
    color: '#eab308', // Amber 500
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    description: 'Perennial broadleaf crop with sustained year-round canopy moisture',
  },
};

export const SATELLITE_BANDS_INFO = [
  { name: 'B2', label: 'Blue (490 nm)', resolution: '10m', role: 'Atmosphere / Water penetration' },
  { name: 'B3', label: 'Green (560 nm)', resolution: '10m', role: 'Vegetation peak reflectance' },
  { name: 'B4', label: 'Red (665 nm)', resolution: '10m', role: 'Chlorophyll absorption' },
  { name: 'B8', label: 'NIR (842 nm)', resolution: '10m', role: 'Cellular canopy structure' },
  { name: 'B11', label: 'SWIR1 (1610 nm)', resolution: '20m', role: 'Canopy moisture & soil background' },
  { name: 'B12', label: 'SWIR2 (2190 nm)', resolution: '20m', role: 'Mineralogy & drought stress' },
  { name: 'VV', label: 'SAR VV (5.4 GHz)', resolution: '10m', role: 'Surface roughness & stem double-bounce' },
  { name: 'VH', label: 'SAR VH (5.4 GHz)', resolution: '10m', role: 'Volumetric canopy depolarization' },
];
