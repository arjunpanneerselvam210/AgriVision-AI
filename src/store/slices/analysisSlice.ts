import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardSummary, AnalysisRun } from '../../types';
import { analysisService } from '../../services/analysis.service';

interface AnalysisState {
  summary: DashboardSummary | null;
  runs: AnalysisRun[];
  isLoading: boolean;
  isTriggering: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: AnalysisState = {
  summary: null,
  runs: [],
  isLoading: false,
  isTriggering: false,
  error: null,
  lastUpdated: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  'analysis/fetchDashboardSummary',
  async (_, { rejectWithValue }) => {
    try {
      const data = await analysisService.getDashboardSummary();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch analysis dashboard summary');
    }
  }
);

export const fetchLatestSummary = fetchDashboardSummary;

export const fetchAnalysisRuns = createAsyncThunk(
  'analysis/fetchAnalysisRuns',
  async (_, { rejectWithValue }) => {
    try {
      const data = await analysisService.getAnalysisRuns();
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch analysis runs');
    }
  }
);

export const triggerAnalysis = createAsyncThunk(
  'analysis/triggerAnalysis',
  async (params: { season?: string; notes?: string }, { rejectWithValue }) => {
    try {
      const data = await analysisService.triggerAnalysisRun(params);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to trigger analysis run');
    }
  }
);

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearAnalysisError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Summary
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Analysis Runs
      .addCase(fetchAnalysisRuns.fulfilled, (state, action) => {
        state.runs = action.payload;
      })
      // Trigger Analysis
      .addCase(triggerAnalysis.pending, (state) => {
        state.isTriggering = true;
      })
      .addCase(triggerAnalysis.fulfilled, (state, action) => {
        state.isTriggering = false;
        state.runs.unshift(action.payload);
      })
      .addCase(triggerAnalysis.rejected, (state, action) => {
        state.isTriggering = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAnalysisError } = analysisSlice.actions;
export default analysisSlice.reducer;
