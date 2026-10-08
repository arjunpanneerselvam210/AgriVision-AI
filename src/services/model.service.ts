import { apiClient } from './api';
import { ApiResponse, ModelEvaluationReport } from '../types';

export const modelService = {
  async getModelEvaluation(): Promise<ModelEvaluationReport | null> {
    const response = await apiClient.get<ApiResponse<ModelEvaluationReport>>('/model/evaluation');
    return response.data.data;
  },
};
