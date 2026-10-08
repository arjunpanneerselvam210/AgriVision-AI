import { apiClient } from './api';
import { ApiResponse, ParcelGeoJSON, ParcelFeature, ParcelFilters } from '../types';

export const parcelService = {
  /**
   * Retrieves real field parcel geometries as GeoJSON FeatureCollection directly from backend PostGIS
   */
  async getParcelsGeoJSON(filters?: ParcelFilters): Promise<ParcelGeoJSON | null> {
    const params = new URLSearchParams();

    if (filters?.studyAreaId) {
      params.append('studyAreaId', filters.studyAreaId);
    }

    // Map crop filter
    const crop = filters?.crop || (filters?.cropClass !== 'ALL' && filters?.cropClass !== undefined ? filters.cropClass : undefined);
    if (crop && String(crop).toLowerCase() !== 'all') {
      let cropStr = String(crop).toUpperCase();
      if (cropStr === '1') cropStr = 'PADDY';
      else if (cropStr === '2') cropStr = 'BANANA';
      else if (cropStr === '0') cropStr = 'OTHER';
      params.append('cropClass', cropStr);
    }

    // Map confidence filter: High (>=80%), Medium (60-79%), Low (<60%)
    if (filters?.confidence && filters.confidence !== 'all') {
      if (filters.confidence === 'high') {
        params.append('minConfidence', '0.80');
      } else if (filters.confidence === 'medium') {
        params.append('minConfidence', '0.60');
        params.append('maxConfidence', '0.799');
      } else if (filters.confidence === 'low') {
        params.append('maxConfidence', '0.599');
      }
    }

    if (filters?.minAreaHa !== undefined) {
      params.append('minAreaHa', String(filters.minAreaHa));
    }
    if (filters?.maxAreaHa !== undefined) {
      params.append('maxAreaHa', String(filters.maxAreaHa));
    }
    if (filters?.minNdvi !== undefined) {
      params.append('minNdvi', String(filters.minNdvi));
    }
    if (filters?.searchQuery) {
      params.append('search', filters.searchQuery.trim());
    }

    try {
      const response = await apiClient.get<ApiResponse<ParcelGeoJSON>>(`/fields/geojson?${params.toString()}`);
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback: try parsing paginated /fields if endpoint is unavailable
      try {
        const fallbackResp = await apiClient.get<ApiResponse<any>>(`/fields?${params.toString()}&size=100`);
        const items = fallbackResp.data?.data?.content || [];
        const features = items
          .map((item: any) => {
            if (!item.geojsonGeometry) return null;
            try {
              const geometry = typeof item.geojsonGeometry === 'string'
                ? JSON.parse(item.geojsonGeometry)
                : item.geojsonGeometry;
              return {
                type: 'Feature' as const,
                id: item.id || item.segmentId,
                geometry,
                properties: {
                  field_id: item.segmentId,
                  id: item.id,
                  segment_id: item.segmentId,
                  study_area_id: item.studyAreaId,
                  area_ha: item.areaHa,
                  area_m2: item.areaM2,
                  predicted_crop: item.cropClass || 'OTHER',
                  crop_class: item.cropClass || 'OTHER',
                  crop_code: item.cropClass === 'PADDY' ? 1 : item.cropClass === 'BANANA' ? 2 : 0,
                  crop_name: item.cropClass === 'PADDY' ? 'Paddy' : item.cropClass === 'BANANA' ? 'Banana' : 'Other',
                  confidence: item.confidence,
                  analysis_date: item.analysisDate || item.createdAt,
                  model_version: item.modelVersion || 'RF-v1.4-Fused',
                  satellite_analysis_id: item.satelliteAnalysisId,
                  mean_ndvi: item.meanNdvi,
                  mean_lswi: item.meanLswi,
                  mean_ndwi: item.meanNdwi,
                  mean_vh_dB: item.meanVhDb,
                  taluk: item.taluk,
                  village: item.village,
                },
              };
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        return {
          type: 'FeatureCollection',
          features,
          totalFeatures: features.length,
        };
      } catch {
        // Return empty collection when backend has no data
        return {
          type: 'FeatureCollection',
          features: [],
          totalFeatures: 0,
        };
      }
    }

    return {
      type: 'FeatureCollection',
      features: [],
      totalFeatures: 0,
    };
  },

  async getParcelById(id: string): Promise<ParcelFeature | null> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/fields/${id}`);
      const item = response.data?.data;
      if (!item) return null;
      if (!item.geojsonGeometry) return null;
      const geometry = typeof item.geojsonGeometry === 'string'
        ? JSON.parse(item.geojsonGeometry)
        : item.geojsonGeometry;

      return {
        type: 'Feature',
        id: item.id || item.segmentId,
        geometry,
        properties: {
          field_id: item.segmentId,
          id: item.id,
          segment_id: item.segmentId,
          study_area_id: item.studyAreaId,
          area_ha: item.areaHa,
          area_m2: item.areaM2,
          predicted_crop: item.cropClass || 'OTHER',
          crop_class: item.cropClass || 'OTHER',
          crop_code: item.cropClass === 'PADDY' ? 1 : item.cropClass === 'BANANA' ? 2 : 0,
          crop_name: item.cropClass === 'PADDY' ? 'Paddy' : item.cropClass === 'BANANA' ? 'Banana' : 'Other',
          confidence: item.confidence,
          analysis_date: item.analysisDate || item.createdAt,
          model_version: item.modelVersion || 'RF-v1.4-Fused',
          satellite_analysis_id: item.satelliteAnalysisId,
          mean_ndvi: item.meanNdvi,
          mean_lswi: item.meanLswi,
          mean_ndwi: item.meanNdwi,
          mean_vh_dB: item.meanVhDb,
          taluk: item.taluk,
          village: item.village,
        },
      };
    } catch {
      return null;
    }
  },
};
