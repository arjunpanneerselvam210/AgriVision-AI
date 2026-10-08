import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import analysisReducer from './slices/analysisSlice';
import parcelReducer from './slices/parcelSlice';
import mapReducer from './slices/mapSlice';
import satelliteReducer from './slices/satelliteSlice';
import modelReducer from './slices/modelSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    analysis: analysisReducer,
    parcels: parcelReducer,
    map: mapReducer,
    satellite: satelliteReducer,
    model: modelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
