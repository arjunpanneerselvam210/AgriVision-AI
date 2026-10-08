import { apiClient } from './api';
import {
  ApiResponse,
  MlModelDto,
  ModelMetricsDto,
} from '../types';

export const modelService = {
  /**
   * Retrieves all registered machine learning models
   */
  async getModels(signal?: AbortSignal): Promise<MlModelDto[]> {
    const response = await apiClient.get<ApiResponse<MlModelDto[]>>('/models', { signal });
    return response.data.data || [];
  },

  /**
   * Retrieves metadata for a specific machine learning model
   */
  async getModelById(id: string, signal?: AbortSignal): Promise<MlModelDto> {
    const response = await apiClient.get<ApiResponse<MlModelDto>>(`/models/${id}`, { signal });
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || `ML Model not found: ${id}`);
  },

  /**
   * Retrieves validation metrics, confusion matrix, and SAR ablation analysis for a model
   */
  async getModelMetrics(id: string, signal?: AbortSignal): Promise<ModelMetricsDto> {
    const response = await apiClient.get<ApiResponse<ModelMetricsDto>>(`/models/${id}/metrics`, { signal });
    if (response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || `Model metrics not found for ID: ${id}`);
  },
};

export default modelService;
