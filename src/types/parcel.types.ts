import { CropClassType } from './analysis.types';

export interface ParcelProperties {
  segment_id: string;
  crop_code: CropClassType;
  crop_name: 'Other' | 'Paddy' | 'Banana';
  area_ha: number;
  area_m2: number;
  mean_ndvi?: number;
  mean_lswi?: number;
  mean_ndwi?: number;
  mean_ndvi_amplitude?: number;
  mean_vh_dB?: number;
  confidence?: number;
  taluk?: string;
  village?: string;
}

export interface ParcelFeature {
  type: 'Feature';
  id: string | number;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: ParcelProperties;
}

export interface ParcelGeoJSON {
  type: 'FeatureCollection';
  features: ParcelFeature[];
  totalFeatures: number;
  metadata?: {
    pilotAreaKm2: number;
    segmentationMethod: string;
    generatedAt: string;
  };
}

export interface ParcelFilters {
  cropClass?: CropClassType | 'ALL';
  minAreaHa?: number;
  maxAreaHa?: number;
  minNdvi?: number;
  searchQuery?: string;
  taluk?: string;
  sortBy?: 'area_ha' | 'mean_ndvi' | 'segment_id';
  sortOrder?: 'asc' | 'desc';
}
