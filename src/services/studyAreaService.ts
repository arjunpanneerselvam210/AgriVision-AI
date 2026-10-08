import { apiClient } from './api';
import {
  ApiResponse,
  PageResponse,
  StudyAreaDto,
  CreateStudyAreaRequest,
  UpdateStudyAreaRequest,
} from '../types';

export const studyAreaService = {
  /**
   * Retrieves paginated list of registered study areas
   */
  async getStudyAreas(
    page: number = 0,
    size: number = 20,
    sort: string = 'createdAt,desc',
    signal?: AbortSignal
  ): Promise<PageResponse<StudyAreaDto>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort,
    });

    const response = await apiClient.get<ApiResponse<PageResponse<StudyAreaDto>>>(
      `/study-areas?${params.toString()}`,
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
   * Retrieves a single study area by UUID
   */
  async getStudyAreaById(id: string, signal?: AbortSignal): Promise<StudyAreaDto> {
    const response = await apiClient.get<ApiResponse<StudyAreaDto>>(`/study-areas/${id}`, { signal });
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || `Study area not found: ${id}`);
  },

  /**
   * Creates a new study area (Requires ANALYST or ADMIN role)
   */
  async createStudyArea(data: CreateStudyAreaRequest): Promise<StudyAreaDto> {
    const response = await apiClient.post<ApiResponse<StudyAreaDto>>('/study-areas', data);
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create study area');
  },

  /**
   * Updates existing study area properties
   */
  async updateStudyArea(id: string, data: UpdateStudyAreaRequest): Promise<StudyAreaDto> {
    const response = await apiClient.put<ApiResponse<StudyAreaDto>>(`/study-areas/${id}`, data);
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update study area');
  },

  /**
   * Deletes a study area by UUID (Requires ADMIN role)
   */
  async deleteStudyArea(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/study-areas/${id}`);
  },
};

export default studyAreaService;
