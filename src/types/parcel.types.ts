import { CropClassType } from './analysis.types';

export interface ParcelProperties {
  field_id?: string;
  segment_id: string;
  id?: string;
  crop_code?: CropClassType;
  crop_name: 'Other' | 'Paddy' | 'Banana' | string;
  crop_class?: string;
  predicted_crop?: 'PADDY' | 'BANANA' | 'OTHER' | string;
  area_ha: number;
  area_m2?: number;
  confidence?: number;
  analysis_date?: string;
  model_version?: string;
  satellite_analysis_id?: string;
  mean_ndvi?: number;
  mean_lswi?: number;
  mean_ndwi?: number;
  mean_ndvi_amplitude?: number;
  mean_vh_dB?: number;
  mean_vh_minus_vv_dB?: number;
  taluk?: string;
  village?: string;
  study_area_id?: string;
  study_area_name?: string;
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
    pilotAreaKm2?: number;
    segmentationMethod?: string;
    generatedAt?: string;
  };
}

export interface ParcelFilters {
  cropClass?: CropClassType | 'ALL';
  crop?: 'all' | 'PADDY' | 'BANANA' | 'OTHER' | 'paddy' | 'banana' | 'other';
  confidence?: 'all' | 'high' | 'medium' | 'low';
  studyAreaId?: string;
  minAreaHa?: number;
  maxAreaHa?: number;
  minNdvi?: number;
  searchQuery?: string;
  taluk?: string;
  sortBy?: 'area_ha' | 'mean_ndvi' | 'segment_id';
  sortOrder?: 'asc' | 'desc';
}
