import { apiClient } from './api';
import {
  ApiResponse,
  PageResponse,
  CropClassificationDto,
  CropAcreageSummaryDto,
} from '../types';

export const classificationService = {
  /**
   * Retrieves paginated crop classification records
   */
  async getClassifications(
    page: number = 0,
    size: number = 20,
    sort: string = 'classificationDate,desc',
    signal?: AbortSignal
  ): Promise<PageResponse<CropClassificationDto>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort,
    });

    const response = await apiClient.get<ApiResponse<PageResponse<CropClassificationDto>>>(
      `/classifications?${params.toString()}`,
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
   * Retrieves a single classification record by UUID
   */
  async getClassificationById(id: string, signal?: AbortSignal): Promise<CropClassificationDto> {
    const response = await apiClient.get<ApiResponse<CropClassificationDto>>(`/classifications/${id}`, { signal });
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || `Classification not found: ${id}`);
  },

  /**
   * Retrieves paginated crop classifications for a specified study area
   */
  async getClassificationsByStudyArea(
    studyAreaId: string,
    page: number = 0,
    size: number = 20,
    sort: string = 'classificationDate,desc',
    signal?: AbortSignal
  ): Promise<PageResponse<CropClassificationDto>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort,
    });

    const response = await apiClient.get<ApiResponse<PageResponse<CropClassificationDto>>>(
      `/classifications/study-area/${studyAreaId}?${params.toString()}`,
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
   * Retrieves calculated crop acreage summary (hectares, percentages, field counts for Paddy, Banana, Other)
   */
  async getCropAcreageSummary(
    studyAreaId: string,
    signal?: AbortSignal
  ): Promise<CropAcreageSummaryDto> {
    const response = await apiClient.get<ApiResponse<CropAcreageSummaryDto>>(
      `/classifications/study-area/${studyAreaId}/summary`,
      { signal }
    );

    if (response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'No crop acreage summary available');
  },
};

export default classificationService;
