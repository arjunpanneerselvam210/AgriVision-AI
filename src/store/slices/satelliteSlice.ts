import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SatelliteLayerOption, TemporalProfileData } from '../../types';
import { satelliteService } from '../../services/satellite.service';

interface SatelliteState {
  layers: SatelliteLayerOption[];
  activeLayerId: string;
  temporalProfile: TemporalProfileData | null;
  isLoadingLayers: boolean;
  isLoadingTemporal: boolean;
  error: string | null;
}

const initialState: SatelliteState = {
  layers: [
    {
      id: 's2_rgb',
      name: 'Sentinel-2 True Color (B4/B3/B2)',
      sensor: 'Sentinel-2',
      type: 'RGB',
      description: 'Surface reflectance visual spectrum at 10m spatial resolution',
      bands: ['B4', 'B3', 'B2'],
      active: true,
    },
    {
      id: 's2_cir',
      name: 'Sentinel-2 Color Infrared (B8/B4/B3)',
      sensor: 'Sentinel-2',
      type: 'CIR',
      description: 'Near-infrared false color highlighting vegetative photosynthetic vigor',
      bands: ['B8', 'B4', 'B3'],
      active: false,
    },
    {
      id: 's2_phenology',
      name: 'Phenological False Color (Max/Amp/Min)',
      sensor: 'Sentinel-2',
      type: 'Phenology',
      description: 'Red: NDVI Max, Green: NDVI Amplitude, Blue: NDVI Min (Paddy vs Banana discriminator)',
      bands: ['NDVI_max', 'NDVI_amplitude', 'NDVI_min'],
      active: false,
    },
    {
      id: 's1_sar',
      name: 'Sentinel-1 C-Band SAR (VV/VH/Diff)',
      sensor: 'Sentinel-1',
      type: 'SAR',
      description: 'Dual-polarization surface roughness and broadleaf volumetric canopy scattering',
      bands: ['VV_mean', 'VH_mean', 'VH_minus_VV_dB'],
      active: false,
    },
  ],
  activeLayerId: 's2_rgb',
  temporalProfile: null,
  isLoadingLayers: false,
  isLoadingTemporal: false,
  error: null,
};

export const fetchSatelliteLayers = createAsyncThunk(
  'satellite/fetchLayers',
  async (_, { rejectWithValue }) => {
    try {
      const data = await satelliteService.getSatelliteLayers();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch satellite layers');
    }
  }
);

export const fetchTemporalProfile = createAsyncThunk(
  'satellite/fetchTemporalProfile',
  async (params: { parcelId?: string; lat?: number; lng?: number }, { rejectWithValue }) => {
    try {
      const data = await satelliteService.getTemporalProfile(params.parcelId, params.lat, params.lng);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch temporal phenology profile');
    }
  }
);

export const satelliteSlice = createSlice({
  name: 'satellite',
  initialState,
  reducers: {
    setActiveLayerId: (state, action: PayloadAction<string>) => {
      state.activeLayerId = action.payload;
      state.layers.forEach((l) => {
        l.active = l.id === action.payload;
      });
    },
    clearTemporalProfile: (state) => {
      state.temporalProfile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSatelliteLayers.fulfilled, (state, action) => {
        if (action.payload && action.payload.length > 0) {
          state.layers = action.payload;
        }
      })
      .addCase(fetchTemporalProfile.pending, (state) => {
        state.isLoadingTemporal = true;
        state.error = null;
      })
      .addCase(fetchTemporalProfile.fulfilled, (state, action) => {
        state.isLoadingTemporal = false;
        state.temporalProfile = action.payload;
      })
      .addCase(fetchTemporalProfile.rejected, (state, action) => {
        state.isLoadingTemporal = false;
        state.error = action.payload as string;
      });
  },
});

export const { setActiveLayerId, clearTemporalProfile } = satelliteSlice.actions;
export default satelliteSlice.reducer;
