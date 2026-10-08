export interface SpectralBands {
  b2: number; // Blue
  b3: number; // Green
  b4: number; // Red
  b8: number; // NIR
  b11: number; // SWIR1
  b12: number; // SWIR2
}

export interface SpectralIndices {
  ndvi: number;
  ndwi: number;
  lswi: number;
}

export interface PeriodicCompositePoint {
  date: string;
  timestamp: number;
  ndvi: number | null;
  ndwi: number | null;
  lswi: number | null;
  sceneCount?: number;
  periodLabel?: string;
}

export interface TemporalProfileData {
  parcelId?: string;
  coordinates?: [number, number];
  cropType?: string;
  series: PeriodicCompositePoint[];
  metrics?: {
    ndviMean: number;
    ndviMin: number;
    ndviMax: number;
    ndviAmplitude: number;
    ndviStdDev: number;
  };
}

export interface SatelliteLayerOption {
  id: string;
  name: string;
  sensor: 'Sentinel-2' | 'Sentinel-1';
  type: 'RGB' | 'CIR' | 'Phenology' | 'SAR' | 'Indices';
  description: string;
  bands: string[];
  active: boolean;
}
