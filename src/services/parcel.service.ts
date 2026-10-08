import { apiClient } from './api';
import { ApiResponse, ParcelGeoJSON, ParcelFeature, ParcelFilters } from '../types';

export const parcelService = {
  async getParcelsGeoJSON(filters?: ParcelFilters): Promise<ParcelGeoJSON | null> {
    const params = new URLSearchParams();
    if (filters?.cropClass !== undefined && filters.cropClass !== 'ALL') {
      params.append('crop_class', String(filters.cropClass));
    }
    if (filters?.minAreaHa) {
      params.append('min_area_ha', String(filters.minAreaHa));
    }
    if (filters?.maxAreaHa) {
      params.append('max_area_ha', String(filters.maxAreaHa));
    }
    if (filters?.searchQuery) {
      params.append('q', filters.searchQuery);
    }
    if (filters?.sortBy) {
      params.append('sort_by', filters.sortBy);
      params.append('sort_order', filters.sortOrder || 'desc');
    }

    const response = await apiClient.get<ApiResponse<ParcelGeoJSON>>(`/parcels?${params.toString()}`);
    return response.data.data;
  },

  async getParcelById(id: string): Promise<ParcelFeature | null> {
    const response = await apiClient.get<ApiResponse<ParcelFeature>>(`/parcels/${id}`);
    return response.data.data;
  },
};
