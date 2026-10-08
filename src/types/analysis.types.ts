export type CropClassType = 0 | 1 | 2; // 0 = Other, 1 = Paddy, 2 = Banana

export interface CropClassInfo {
  code: CropClassType;
  name: 'Other' | 'Paddy' | 'Banana';
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export interface CropAcreage {
  hectares: number;
  squareKilometers: number;
  percentageOfAOI: number;
  fieldCount: number;
}

export interface StudyRegionSummary {
  regionName: string;
  district: string;
  targetTaluks: string[];
  totalAreaKm2: number;
  totalAreaHa: number;
  pilotSectorAreaKm2: number;
  isValidThreshold: boolean; // >= 20 km²
  boundaryType: string;
}

export interface CropDistributionItem {
  name: 'Paddy' | 'Banana' | 'Other';
  hectares: number;
  squareKm: number;
  percentage: number;
  fieldCount: number;
  fill: string;
}

export interface DashboardSummary {
  studyRegion: StudyRegionSummary;
  totalFieldsDetected: number | null;
  cropAcreage: {
    paddy: CropAcreage | null;
    banana: CropAcreage | null;
    other: CropAcreage | null;
  };
  latestSatelliteDate: string | null;
  modelOverallAccuracy: number | null;
  modelKappa: number | null;
  analysisStatus: 'COMPLETED' | 'RUNNING' | 'FAILED' | 'IDLE';
  lastRunTimestamp: string | null;
  sensorCoverage: {
    sentinel2Scenes: number | null;
    sentinel1Scenes: number | null;
  };
}

export interface AnalysisRun {
  id: string;
  timestamp: string;
  season: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED';
  areaEvaluatedKm2: number;
  totalParcelsDetected: number;
  modelUsed: string;
  overallAccuracy: number;
  notes?: string;
}
