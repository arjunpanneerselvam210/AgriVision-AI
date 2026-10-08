import { apiClient } from './api';
import {
  ApiResponse,
  StudyAreaReportDto,
} from '../types';

export const reportService = {
  /**
   * Generates or retrieves executive agricultural intelligence report for a study area
   */
  async getReportByStudyArea(studyAreaId: string, signal?: AbortSignal): Promise<StudyAreaReportDto> {
    const response = await apiClient.get<ApiResponse<StudyAreaReportDto>>(
      `/reports/study-area/${studyAreaId}`,
      { signal }
    );

    if (response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Report not found for study area');
  },
};

export default reportService;
