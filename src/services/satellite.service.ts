import { apiClient } from './api';
import { ApiResponse, SatelliteLayerOption, TemporalProfileData } from '../types';

export const satelliteService = {
  async getSatelliteLayers(): Promise<SatelliteLayerOption[]> {
    const response = await apiClient.get<ApiResponse<SatelliteLayerOption[]>>('/satellite/layers');
    return response.data.data || [];
  },

  async getTemporalProfile(parcelId?: string, lat?: number, lng?: number): Promise<TemporalProfileData | null> {
    const params = new URLSearchParams();
    if (parcelId) params.append('parcel_id', parcelId);
    if (lat !== undefined && lng !== undefined) {
      params.append('lat', String(lat));
      params.append('lng', String(lng));
    }
    const response = await apiClient.get<ApiResponse<TemporalProfileData>>(`/satellite/temporal?${params.toString()}`);
    return response.data.data;
  },
};
