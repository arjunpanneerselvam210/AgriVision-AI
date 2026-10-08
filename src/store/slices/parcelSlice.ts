import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ParcelGeoJSON, ParcelFeature, ParcelFilters } from '../../types';
import { parcelService } from '../../services/parcel.service';

interface ParcelState {
  parcels: ParcelGeoJSON | null;
  selectedParcel: ParcelFeature | null;
  filters: ParcelFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: ParcelState = {
  parcels: null,
  selectedParcel: null,
  filters: {
    cropClass: 'ALL',
    searchQuery: '',
    sortBy: 'area_ha',
    sortOrder: 'desc',
  },
  isLoading: false,
  error: null,
};

export const fetchParcels = createAsyncThunk(
  'parcels/fetchParcels',
  async (filters: ParcelFilters | undefined, { rejectWithValue }) => {
    try {
      const data = await parcelService.getParcelsGeoJSON(filters);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch field parcels GeoJSON');
    }
  }
);

export const fetchParcelById = createAsyncThunk(
  'parcels/fetchParcelById',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await parcelService.getParcelById(id);
      return data;
    } catch (err: any) {
      return rejectWithValue(err.message || `Failed to fetch parcel ${id}`);
    }
  }
);

export const parcelSlice = createSlice({
  name: 'parcels',
  initialState,
  reducers: {
    setSelectedParcel: (state, action: PayloadAction<ParcelFeature | null>) => {
      state.selectedParcel = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<ParcelFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        cropClass: 'ALL',
        searchQuery: '',
        sortBy: 'area_ha',
        sortOrder: 'desc',
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParcels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchParcels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.parcels = action.payload;
      })
      .addCase(fetchParcels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchParcelById.fulfilled, (state, action) => {
        state.selectedParcel = action.payload;
      });
  },
});

export const { setSelectedParcel, setFilters, resetFilters } = parcelSlice.actions;
export default parcelSlice.reducer;
