// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 03: SENTINEL-2 PREPROCESSING & MULTI-TEMPORAL SPECTRAL FEATURES
// =============================================================================
// STRICT NO-HARDCODING RULE:
// Preprocessing masks, spectral indices, and phenology statistics are data-derived.
// =============================================================================

/**
 * Applies a dual-layer cloud and cloud-shadow mask to Sentinel-2 Level-2A imagery.
 * Combines Scene Classification Layer (SCL) with QA60 bitmask flags.
 * 
 * @param {ee.Image} image Sentinel-2 SR Harmonized image.
 * @return {ee.Image} Clean, cloud-free, and shadow-free surface reflectance image.
 */
function maskS2SrClouds(image) {
  // 1. SCL Band: Scene Classification Layer from Sen2Cor
  var scl = image.select('SCL');
  var sclMask = scl.neq(3)   // Cloud shadows
    .and(scl.neq(8))         // Cloud medium probability
    .and(scl.neq(9))         // Cloud high probability
    .and(scl.neq(10))        // Thin cirrus
    .and(scl.neq(1));        // Saturated or defective pixels
  
  // 2. QA60 Band: Catch residual opaque clouds (bit 10) and cirrus (bit 11)
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var qaMask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  
  return image.updateMask(sclMask.and(qaMask));
}

/**
 * Builds the complete multi-temporal Sentinel-2 feature stack.
 * 
 * @param {ee.Geometry} aoiGeometry The study area boundary geometry.
 * @param {Object} config The system configuration object.
 * @return {Object} Dictionary with the processed collection, periodic composites,
 *                  feature stack image, and dynamic feature names.
 */
function buildSentinel2Features(aoiGeometry, config) {
  // 1. Filter Raw Collection
  var rawCollection = ee.ImageCollection(config.DATASETS.s2Harmonized)
    .filterBounds(aoiGeometry)
    .filterDate(config.TEMPORAL.startDate, config.TEMPORAL.endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', config.TEMPORAL.maxS2CloudCoverage));
  
  // 2. Apply Cloud & Shadow Masking
  var cleanCollection = rawCollection.map(maskS2SrClouds);

  // 3. Construct Periodic Time-Series Composites (Pishanam Season)
  var startEE = ee.Date(config.TEMPORAL.startDate);
  var endEE = ee.Date(config.TEMPORAL.endDate);
  var totalDays = endEE.difference(startEE, 'days');
  var stepDays = config.TEMPORAL.stepDays;
  var offsets = ee.List.sequence(0, totalDays.subtract(1), stepDays);

  var periodicCollection = ee.ImageCollection(offsets.map(function(offset) {
    var tStart = startEE.advance(offset, 'days');
    var tEnd = tStart.advance(stepDays, 'days');
    var windowImages = cleanCollection.filterDate(tStart, tEnd);
    var medianImg = windowImages.median();
    
    // Core agricultural indices (scale-invariant normalized difference)
    var ndvi = medianImg.normalizedDifference(['B8', 'B4']).rename('NDVI');
    var ndwi = medianImg.normalizedDifference(['B3', 'B8']).rename('NDWI');
    var lswi = medianImg.normalizedDifference(['B8', 'B11']).rename('LSWI');
    
    return medianImg.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
      .addBands([ndvi, ndwi, lswi])
      .set('system:time_start', tStart.millis())
      .set('period_start', tStart.format('YYYY-MM-dd'))
      .set('period_end', tEnd.format('YYYY-MM-dd'))
      .set('scene_count', windowImages.size());
  })).filter(ee.Filter.gt('scene_count', 0)); // Filter out intervals with zero valid scenes

  // 4. Derive Dynamic Pixel-Level Phenological Metrics
  var ndviCol = periodicCollection.select('NDVI');
  var ndviMean = ndviCol.mean().rename('NDVI_mean');
  var ndviMin = ndviCol.min().rename('NDVI_min');
  var ndviMax = ndviCol.max().rename('NDVI_max');
  var ndviStdDev = ndviCol.reduce(ee.Reducer.stdDev()).rename('NDVI_stdDev');
  var ndviAmp = ndviMax.subtract(ndviMin).rename('NDVI_amplitude');

  // Base optical surface reflectance composite
  var baseComposite = periodicCollection.median();

  // 5. Assemble Verified 14-Band Feature Stack
  var featureStack = ee.Image.cat([
    baseComposite.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12']),
    baseComposite.select(['NDVI', 'NDWI', 'LSWI']),
    ndviMean,
    ndviMin,
    ndviMax,
    ndviStdDev,
    ndviAmp
  ]).clip(aoiGeometry);

  var featureNames = [
    'B2', 'B3', 'B4', 'B8', 'B11', 'B12',
    'NDVI', 'NDWI', 'LSWI',
    'NDVI_mean', 'NDVI_min', 'NDVI_max', 'NDVI_stdDev', 'NDVI_amplitude'
  ];

  return {
    rawCollection: rawCollection,
    cleanCollection: cleanCollection,
    periodicCollection: periodicCollection,
    baseComposite: baseComposite,
    featureStack: featureStack,
    featureNames: featureNames
  };
}

// Export module if used in modular environment
if (typeof exports !== 'undefined') {
  exports.maskS2SrClouds = maskS2SrClouds;
  exports.buildSentinel2Features = buildSentinel2Features;
}
