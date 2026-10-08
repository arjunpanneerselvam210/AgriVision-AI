// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 01: SYSTEM CONFIGURATION
// =============================================================================
// STRICT NO-HARDCODING RULE:
// Configuration parameters define operational settings, NOT empirical results.
// =============================================================================

var CONFIG = {
  // 1. Administrative Boundary Settings
  ADMIN: {
    dataset: 'FAO/GAUL/2015/level2',
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Tirunelveli',
    // Custom user asset switch for official Taluk shapefile (Survey of India / TN Revenue)
    useCustomTalukAsset: false,
    customTalukAssetId: 'users/YOUR_USERNAME/tirunelveli_taluks',
    talukField: 'TALUK_NAME',
    targetTaluks: ['Ambasamudram', 'Cheranmahadevi']
  },

  // 2. Focused Study AOI Options
  // Ambasamudram and Cheranmahadevi taluk centers along the Thamirabarani River
  // When full taluk vectors are unavailable in public catalog, we operate on
  // the District boundary while defining a focused agricultural sector (>= 20 km²).
  STUDY_AREA: {
    minRequiredAreaKm2: 20.0,
    // Buffer around the Ambasamudram-Cheranmahadevi river-canal agricultural belt
    // Centroid approximate reference for localized vectorization (km)
    pilotBufferKm: 5.0 // ~78.5 km² contiguous agricultural zone
  },

  // 3. Temporal Window (Pishanam Cropping Season: Land Prep -> Vegetative -> Harvest)
  TEMPORAL: {
    startDate: '2023-09-01',
    endDate: '2024-04-30',
    stepDays: 30, // 30-day periodic composite steps
    maxS2CloudCoverage: 40 // Pre-filter before per-pixel cloud/shadow masking
  },

  // 4. Data Collection Asset IDs
  DATASETS: {
    s2Harmonized: 'COPERNICUS/S2_SR_HARMONIZED',
    s1Grd: 'COPERNICUS/S1_GRD',
    dynamicWorld: 'GOOGLE/DYNAMICWORLD/V1'
  },

  // 5. Automatic High-Confidence Training Parameters
  AUTO_TRAINING: {
    enabled: true,                       // Automatically generate candidate polygons from satellite priors
    paddyConfidenceThreshold: 0.60,      // Minimum multi-sensor evidence threshold for Paddy pseudo-labels
    bananaConfidenceThreshold: 0.62,     // Minimum multi-sensor evidence threshold for Banana pseudo-labels
    otherConfidenceThreshold: 0.55,      // Minimum evidence threshold for non-crop / fallow / bare pseudo-labels
    minCandidateRegionPixels: 8,         // Minimum contiguous pixel count (~800 m²) to suppress speckle
    maxCandidatePolygonsPerClass: 30,    // Memory-safe limit of vector parcels per class
    maxTrainingPixelsPerClass: 350,      // Balanced sample allocation per class
    showCandidateLayers: true            // Display candidate masks and confidence gradients on map
  },

  // 6. Machine Learning Parameters
  ML: {
    trainSplitRatio: 0.70, // 70% Train, 30% Independent Test
    randomSeed: 42,
    rfTrees: 100,
    minLeafPopulation: 1,
    bagFraction: 0.7,
    sampleScale: 10 // Native 10m Sentinel-2 resolution
  },

  // 6. Object-Based Image Analysis (SNIC Segmentation)
  SEGMENTATION: {
    superpixelSize: 16,   // ~160m seed grid at 10m scale
    compactness: 1.0,     // Shape regularity vs. edge adherence
    connectivity: 8,      // 8-neighbor adjacency
    neighborhoodSize: 256,// Tile processing buffer
    minParcelPixels: 8    // Filter slivers (< 0.08 ha)
  },

  // 7. Spatial Reduction Scales
  SCALES: {
    nativeS2: 10,
    statsAggregation: 100 // Scale for district-wide regional reductions (prevents memory limits)
  },

  // 8. Target Classes
  CLASSES: {
    OTHER: { code: 0, name: 'Other', color: '#8c8c8c' },
    PADDY: { code: 1, name: 'Paddy', color: '#2ca02c' },
    BANANA: { code: 2, name: 'Banana', color: '#ffbb00' }
  }
};

// Export configuration object if used in modular environment
if (typeof exports !== 'undefined') {
  exports.CONFIG = CONFIG;
}
