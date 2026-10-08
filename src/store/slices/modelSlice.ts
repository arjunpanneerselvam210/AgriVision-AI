import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ModelEvaluationReport } from '../../types';
import { modelService } from '../../services/model.service';

interface ModelState {
  metrics: ModelEvaluationReport | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ModelState = {
  metrics: null,
  isLoading: false,
  error: null,
};

export const fetchModelEvaluation = createAsyncThunk(
  'model/fetchEvaluation',
  async (_, { rejectWithValue }) => {
    try {
      const data = await modelService.getModelEvaluation();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch model evaluation');
    }
  }
);

// Alias
export const fetchModelMetrics = fetchModelEvaluation;

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    clearModelError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModelEvaluation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchModelEvaluation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchModelEvaluation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearModelError } = modelSlice.actions;
export default modelSlice.reducer;
