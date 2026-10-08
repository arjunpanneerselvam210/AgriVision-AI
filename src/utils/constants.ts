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

// =============================================================================
// CENTRALIZED CROP CONFIGURATION (Single Source of Truth)
// Classes: PADDY, BANANA, OTHER
// =============================================================================
export const CROP_COLORS = {
  PADDY: '#22c55e',  // Emerald Green
  BANANA: '#eab308', // Amber Gold
  OTHER: '#64748b',  // Slate 500
  // Lowercase aliases for backward compatibility
  paddy: '#22c55e',
  banana: '#eab308',
  other: '#64748b',
} as const;

export const CROP_CONFIG = {
  PADDY: {
    code: 1,
    key: 'PADDY' as const,
    name: 'Paddy',
    label: 'Paddy (Rice)',
    color: CROP_COLORS.PADDY,
    borderColor: '#15803d',
    fillColor: CROP_COLORS.PADDY,
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    description: 'Irrigated lowland rice with dynamic inundation-vegetative cycles',
  },
  BANANA: {
    code: 2,
    key: 'BANANA' as const,
    name: 'Banana',
    label: 'Banana Plantations',
    color: CROP_COLORS.BANANA,
    borderColor: '#a16207',
    fillColor: CROP_COLORS.BANANA,
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400',
    description: 'Perennial broadleaf crop with sustained year-round canopy moisture',
  },
  OTHER: {
    code: 0,
    key: 'OTHER' as const,
    name: 'Other',
    label: 'Other Land Cover',
    color: CROP_COLORS.OTHER,
    borderColor: '#334155',
    fillColor: CROP_COLORS.OTHER,
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    description: 'Water bodies, settlements, barren terrain, fallow scrub',
  },
} as const;

export const CROP_CLASSES: Record<CropClassType, CropClassInfo> = {
  0: {
    code: 0,
    name: 'Other',
    color: CROP_COLORS.OTHER,
    badgeBg: CROP_CONFIG.OTHER.badgeBg,
    badgeText: CROP_CONFIG.OTHER.badgeText,
    description: CROP_CONFIG.OTHER.description,
  },
  1: {
    code: 1,
    name: 'Paddy',
    color: CROP_COLORS.PADDY,
    badgeBg: CROP_CONFIG.PADDY.badgeBg,
    badgeText: CROP_CONFIG.PADDY.badgeText,
    description: CROP_CONFIG.PADDY.description,
  },
  2: {
    code: 2,
    name: 'Banana',
    color: CROP_COLORS.BANANA,
    badgeBg: CROP_CONFIG.BANANA.badgeBg,
    badgeText: CROP_CONFIG.BANANA.badgeText,
    description: CROP_CONFIG.BANANA.description,
  },
};

/**
 * Returns the centralized hex color for any crop identifier (string or code)
 */
export function getCropColor(crop?: string | number | null): string {
  if (crop === null || crop === undefined) return CROP_COLORS.OTHER;
  if (typeof crop === 'number') {
    if (crop === 1) return CROP_COLORS.PADDY;
    if (crop === 2) return CROP_COLORS.BANANA;
    return CROP_COLORS.OTHER;
  }
  const normalized = crop.toUpperCase().trim();
  if (normalized === 'PADDY' || normalized === 'RICE') return CROP_COLORS.PADDY;
  if (normalized === 'BANANA') return CROP_COLORS.BANANA;
  return CROP_COLORS.OTHER;
}

/**
 * Returns full centralized crop configuration object
 */
export function getCropConfig(crop?: string | number | null) {
  if (crop === null || crop === undefined) return CROP_CONFIG.OTHER;
  if (typeof crop === 'number') {
    if (crop === 1) return CROP_CONFIG.PADDY;
    if (crop === 2) return CROP_CONFIG.BANANA;
    return CROP_CONFIG.OTHER;
  }
  const normalized = crop.toUpperCase().trim();
  if (normalized === 'PADDY' || normalized === 'RICE') return CROP_CONFIG.PADDY;
  if (normalized === 'BANANA') return CROP_CONFIG.BANANA;
  return CROP_CONFIG.OTHER;
}

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
