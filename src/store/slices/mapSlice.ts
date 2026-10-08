import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../utils/constants';

export type BaseMapType = 'satellite' | 'streets' | 'dark' | 'topo';

interface MapState {
  center: [number, number];
  zoom: number;
  baseMap: BaseMapType;
  layers: {
    showPaddy: boolean;
    showBanana: boolean;
    showOther: boolean;
    showBoundaries: boolean;
    showPilotSector: boolean;
    showNdviHeatmap: boolean;
  };
  inspectorMode: boolean;
  inspectedCoords: [number, number] | null;
}

const initialState: MapState = {
  center: DEFAULT_MAP_CENTER,
  zoom: DEFAULT_MAP_ZOOM,
  baseMap: 'satellite',
  layers: {
    showPaddy: true,
    showBanana: true,
    showOther: true,
    showBoundaries: true,
    showPilotSector: true,
    showNdviHeatmap: false,
  },
  inspectorMode: false,
  inspectedCoords: null,
};

export const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setMapCenter: (state, action: PayloadAction<[number, number]>) => {
      state.center = action.payload;
    },
    setMapZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
    setBaseMap: (state, action: PayloadAction<BaseMapType>) => {
      state.baseMap = action.payload;
    },
    toggleLayer: (state, action: PayloadAction<keyof MapState['layers']>) => {
      state.layers[action.payload] = !state.layers[action.payload];
    },
    setLayerVisibility: (state, action: PayloadAction<{ layer: keyof MapState['layers']; visible: boolean }>) => {
      state.layers[action.payload.layer] = action.payload.visible;
    },
    setInspectorMode: (state, action: PayloadAction<boolean>) => {
      state.inspectorMode = action.payload;
    },
    setInspectedCoords: (state, action: PayloadAction<[number, number] | null>) => {
      state.inspectedCoords = action.payload;
    },
    resetMapView: (state) => {
      state.center = DEFAULT_MAP_CENTER;
      state.zoom = DEFAULT_MAP_ZOOM;
    },
  },
});

export const {
  setMapCenter,
  setMapZoom,
  setBaseMap,
  toggleLayer,
  setLayerVisibility,
  setInspectorMode,
  setInspectedCoords,
  resetMapView,
} = mapSlice.actions;

export default mapSlice.reducer;
