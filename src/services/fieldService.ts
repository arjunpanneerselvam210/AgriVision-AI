import { apiClient } from './api';
import {
  ApiResponse,
  PageResponse,
  FieldParcelDto,
  FieldQueryParams,
} from '../types';

export const fieldService = {
  /**
   * Retrieves paginated agricultural field/parcel segments with optional filtering
   */
  async getFields(
    params?: FieldQueryParams,
    signal?: AbortSignal
  ): Promise<PageResponse<FieldParcelDto>> {
    const searchParams = new URLSearchParams();

    if (params?.studyAreaId) searchParams.append('studyAreaId', params.studyAreaId);
    if (params?.cropClass) searchParams.append('cropClass', String(params.cropClass));
    if (params?.minAreaHa !== undefined) searchParams.append('minAreaHa', String(params.minAreaHa));
    if (params?.maxAreaHa !== undefined) searchParams.append('maxAreaHa', String(params.maxAreaHa));
    if (params?.minNdvi !== undefined) searchParams.append('minNdvi', String(params.minNdvi));
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page !== undefined) searchParams.append('page', String(params.page));
    if (params?.size !== undefined) searchParams.append('size', String(params.size));
    if (params?.sort) searchParams.append('sort', params.sort);

    const query = searchParams.toString();
    const url = query ? `/fields?${query}` : '/fields';

    const response = await apiClient.get<ApiResponse<PageResponse<FieldParcelDto>>>(url, { signal });

    return (
      response.data.data || {
        content: [],
        pageNumber: 0,
        pageSize: params?.size || 20,
        totalElements: 0,
        totalPages: 0,
        last: true,
      }
    );
  },

  /**
   * Retrieves detailed attributes and GeoJSON geometry for a single field parcel
   */
  async getFieldById(id: string, signal?: AbortSignal): Promise<FieldParcelDto> {
    const response = await apiClient.get<ApiResponse<FieldParcelDto>>(`/fields/${id}`, { signal });
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || `Field parcel not found: ${id}`);
  },

  /**
   * Retrieves fields belonging to a specific study area
   */
  async getFieldsByStudyArea(
    studyAreaId: string,
    page: number = 0,
    size: number = 20,
    sort: string = 'areaHa,desc',
    signal?: AbortSignal
  ): Promise<PageResponse<FieldParcelDto>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort,
    });

    const response = await apiClient.get<ApiResponse<PageResponse<FieldParcelDto>>>(
      `/fields/study-area/${studyAreaId}?${params.toString()}`,
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
};

export default fieldService;
