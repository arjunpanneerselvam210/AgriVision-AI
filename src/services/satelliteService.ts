import { apiClient } from './api';
import {
  ApiResponse,
  PageResponse,
  SatelliteAnalysisDto,
} from '../types';

export const satelliteService = {
  /**
   * Retrieves paginated satellite analysis ingestion and processing logs
   */
  async getAnalyses(
    page: number = 0,
    size: number = 20,
    sort: string = 'acquisitionDate,desc',
    signal?: AbortSignal
  ): Promise<PageResponse<SatelliteAnalysisDto>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort,
    });

    const response = await apiClient.get<ApiResponse<PageResponse<SatelliteAnalysisDto>>>(
      `/satellite/analyses?${params.toString()}`,
      { signal }
    );

    return (
      response.data.data || {
        content: [],
        pageNumber: 0,
        pageSize: size,
        totalElements: 0,
        totalPages: 0,
        last: true,
      }
    );
  },

  /**
   * Retrieves detailed satellite analysis information by UUID
   */
  async getAnalysisById(id: string, signal?: AbortSignal): Promise<SatelliteAnalysisDto> {
    const response = await apiClient.get<ApiResponse<SatelliteAnalysisDto>>(`/satellite/analyses/${id}`, { signal });
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || `Satellite analysis not found: ${id}`);
  },
};

export default satelliteService;
