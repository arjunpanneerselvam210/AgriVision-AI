/**
 * TypeScript definitions mapping directly to Spring Boot AgriVision AI DTOs
 */

export type BackendCropType = 'PADDY' | 'BANANA' | 'OTHER';

// ==========================================
// 1. Study Area Types
// ==========================================
export interface StudyAreaDto {
  id: string;
  name: string;
  state: string;
  district: string;
  taluks: string;
  totalAreaKm2: number;
  targetMinAreaKm2: number;
  geojsonBoundary?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStudyAreaRequest {
  name: string;
  state: string;
  district: string;
  taluks: string;
  totalAreaKm2: number;
  targetMinAreaKm2?: number;
  geojsonBoundary?: string;
}

export interface UpdateStudyAreaRequest {
  name?: string;
  taluks?: string;
  totalAreaKm2?: number;
  targetMinAreaKm2?: number;
  geojsonBoundary?: string;
}

// ==========================================
// 2. Field / Parcel Types
// ==========================================
export interface FieldParcelDto {
  id: string;
  segmentId: string;
  studyAreaId: string;
  studyAreaName?: string;
  areaHa: number;
  areaM2?: number;
  meanNdvi?: number;
  meanLswi?: number;
  meanNdwi?: number;
  meanVhDb?: number;
  meanVhMinusVvDb?: number;
  cropClass: BackendCropType;
  confidence?: number;
  taluk?: string;
  village?: string;
  geojsonGeometry?: string;
  createdAt?: string;
}

export interface FieldQueryParams {
  studyAreaId?: string;
  cropClass?: BackendCropType;
  minAreaHa?: number;
  maxAreaHa?: number;
  minNdvi?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ==========================================
// 3. Crop Classification Types
// ==========================================
export interface CropClassificationDto {
  id: string;
  studyAreaId: string;
  fieldParcelId: string;
  segmentId: string;
  cropClass: BackendCropType;
  confidence: number;
  modelId?: string;
  classificationDate: string;
}

export interface CropAcreageSummaryDto {
  paddyAreaHa: number;
  paddyPercentage: number;
  paddyFieldCount: number;

  bananaAreaHa: number;
  bananaPercentage: number;
  bananaFieldCount: number;

  otherAreaHa: number;
  otherPercentage: number;
  otherFieldCount: number;

  totalAreaHa: number;
  totalFieldsDetected: number;
}

// ==========================================
// 4. Satellite Analysis Types
// ==========================================
export interface SatelliteAnalysisDto {
  id: string;
  studyAreaId: string;
  studyAreaName?: string;
  sensor: string;
  sceneId: string;
  acquisitionDate: string;
  cloudCover?: number;
  processingLevel?: string;
  status: string;
  createdAt?: string;
}

// ==========================================
// 5. Machine Learning Model Types
// ==========================================
export interface MlModelDto {
  id: string;
  name: string;
  algorithm: string;
  version?: string;
  treeCount?: number;
  trainingSamplesCount?: number;
  validationSamplesCount?: number;
  overallAccuracy: number;
  kappa: number;
  weightedF1?: number;
  active: boolean;
  createdAt: string;
}

export interface ModelAblationDto {
  opticalOnlyAccuracy: number;
  opticalOnlyKappa: number;
  fusionAccuracy: number;
  fusionKappa: number;
  accuracyDelta: number;
  kappaDelta: number;
  radarContributionSignificant: boolean;
}

export interface ModelMetricsDto {
  modelId: string;
  modelName: string;
  algorithm: string;
  overallAccuracy: number;
  kappa: number;
  weightedF1: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
  ablation?: ModelAblationDto;
}

// ==========================================
// 6. Reports Types
// ==========================================
export interface StudyAreaReportDto {
  studyAreaId: string;
  studyAreaName: string;
  state: string;
  district: string;
  taluks: string;
  totalAreaKm2: number;
  totalAreaHa: number;
  fieldCount: number;
  acreageSummary?: CropAcreageSummaryDto;
  latestSatelliteAcquisitionDate?: string;
  bestModelAccuracy?: number;
  bestModelAlgorithm?: string;
  generatedAt: string;
}
