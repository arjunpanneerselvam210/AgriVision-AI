import { apiClient } from './api';
import { ApiResponse, DashboardSummary, AnalysisRun } from '../types';

export const analysisService = {
  async getDashboardSummary(): Promise<DashboardSummary | null> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardSummary>>('/analysis/dashboard');
      return response.data.data;
    } catch (error) {
      // Re-throw so Redux slice captures it as rejected state without faking data
      throw error;
    }
  },

  async getAnalysisRuns(): Promise<AnalysisRun[]> {
    try {
      const response = await apiClient.get<ApiResponse<AnalysisRun[]>>('/analysis/runs');
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  },

  async triggerAnalysisRun(params: { season?: string; notes?: string }): Promise<AnalysisRun> {
    const response = await apiClient.post<ApiResponse<AnalysisRun>>('/analysis/run', params);
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to start analysis run');
  },
};
