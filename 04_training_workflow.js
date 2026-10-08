// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 04: AUTOMATIC HIGH-CONFIDENCE TRAINING DATA GENERATION & SAMPLING
// =============================================================================
// STRICT NO-HARDCODING RULE:
// Candidate training regions are generated dynamically from satellite-derived
// evidence (Dynamic World crop priors, multi-temporal S2 NDVI/LSWI dynamics,
// and Sentinel-1 C-band SAR backscatter/polarimetric ratios).
// All metric evaluations and training partitions are computed strictly by GEE.
// =============================================================================

/**
 * Computes multi-sensor evidence confidence surfaces and vectorizes
 * high-confidence training candidate regions for Paddy, Banana, and Other.
 * 
 * @param {ee.Geometry} aoiGeometry The overall study area geometry.
 * @param {ee.Geometry} pilotSector The pilot vectorization sector.
 * @param {ee.Image} s2Features Sentinel-2 feature composite.
 * @param {ee.Image} s1Features Sentinel-1 SAR feature composite.
 * @param {Object} config The system configuration object.
 * @return {Object} Confidence images, candidate masks, and generated FeatureCollections.
 */
function generateAutomaticTrainingCandidates(aoiGeometry, pilotSector, s2Features, s1Features, config) {
  var autoCfg = config.AUTO_TRAINING;

  // 1. Ingest Dynamic World Near-Real-Time Land Cover Probability Stack
  var dwCol = ee.ImageCollection(config.DATASETS.dynamicWorld)
    .filterBounds(aoiGeometry)
    .filterDate(config.TEMPORAL.startDate, config.TEMPORAL.endDate);

  var dwBands = ['crops', 'trees', 'grass', 'shrub_and_scrub', 'built', 'bare', 'water'];
  var dwMean = ee.Image(
    ee.Algorithms.If(
      dwCol.size().gt(0),
      dwCol.select(dwBands).mean(),
      ee.Image.constant([0.4, 0.1, 0.1, 0.1, 0.1, 0.1, 0.05]).rename(dwBands)
    )
  );

  var dwCrops = dwMean.select('crops');
  var dwTrees = dwMean.select('trees');
  var dwBare  = dwMean.select('bare');
  var dwBuilt = dwMean.select('built');
  var dwWater = dwMean.select('water');

  // 2. Multi-temporal Indices & SAR Metric Extraction
  var ndviMean = s2Features.select('NDVI_mean');
  var ndviMin  = s2Features.select('NDVI_min');
  var ndviMax  = s2Features.select('NDVI_max');
  var ndviAmp  = s2Features.select('NDVI_amplitude');
  var ndviStd  = s2Features.select('NDVI_stdDev');
  var lswiMean = s2Features.select('LSWI'); // baseline or mean LSWI

  var vhMean   = s1Features.select('VH_mean');
  var vhStdDev = s1Features.select('VH_stdDev');
  var vhMinusVv = s1Features.select('VH_minus_VV_mean');

  // 3. PADDY EVIDENCE CONFIDENCE (Class 1)
  // - High Dynamic World crop prior
  // - Strong seasonal phenological variation (high NDVI amplitude & stdDev)
  // - S1 temporal variability from specular reflection at transplanting to volume canopy
  var cDW_paddy = dwCrops;
  var cNDVI_paddy = ndviAmp.subtract(0.20).divide(0.40).clamp(0, 1)
    .multiply(ndviStd.subtract(0.08).divide(0.15).clamp(0, 1));
  var cSAR_paddy = vhStdDev.subtract(0.8).divide(1.5).clamp(0, 1);
  var cLSWI_paddy = lswiMean.add(0.10).divide(0.40).clamp(0, 1);

  var paddyConfidence = cDW_paddy.multiply(0.35)
    .add(cNDVI_paddy.multiply(0.35))
    .add(cLSWI_paddy.multiply(0.15))
    .add(cSAR_paddy.multiply(0.15))
    .rename('paddy_confidence');

  // 4. BANANA EVIDENCE CONFIDENCE (Class 2)
  // - High Dynamic World crop / tree canopy prior (broadleaf perennial pseudostem)
  // - Persistent high greenness throughout season (high NDVI min & mean, low amplitude)
  // - Elevated sustained canopy moisture (high LSWI)
  // - Strong C-band radar volume scattering (elevated VH mean and VH-VV ratio)
  var cDW_banana = dwCrops.max(dwTrees);
  var cNDVI_green = ndviMean.subtract(0.45).divide(0.35).clamp(0, 1)
    .multiply(ndviMin.subtract(0.30).divide(0.30).clamp(0, 1));
  var cNDVI_stable = ee.Image(1).subtract(ndviAmp.subtract(0.15).divide(0.35)).clamp(0, 1);
  var cNDVI_banana = cNDVI_green.multiply(cNDVI_stable);
  var cLSWI_banana = lswiMean.subtract(0.05).divide(0.30).clamp(0, 1);
  var cSAR_banana = vhMean.add(18).divide(7).clamp(0, 1)
    .multiply(vhMinusVv.add(10).divide(5).clamp(0, 1));

  var bananaConfidence = cDW_banana.multiply(0.25)
    .add(cNDVI_banana.multiply(0.35))
    .add(cLSWI_banana.multiply(0.20))
    .add(cSAR_banana.multiply(0.20))
    .rename('banana_confidence');

  // 5. OTHER EVIDENCE CONFIDENCE (Class 0)
  // - Fallow fields, dry bare agricultural soil, sparse scrub, non-crop agricultural areas
  // - Low crop probability, low peak greenness, bare ground presence
  // - Exclude deep open water and built infrastructure
  var cDW_other = dwBare.add(dwMean.select('grass')).add(dwMean.select('shrub_and_scrub')).clamp(0, 1);
  var cNDVI_low = ee.Image(1).subtract(ndviMax.subtract(0.20).divide(0.35)).clamp(0, 1);
  var cNonCrop = ee.Image(1).subtract(dwCrops).clamp(0, 1);

  var otherConfidence = cNonCrop.multiply(0.40)
    .add(cNDVI_low.multiply(0.35))
    .add(cDW_other.multiply(0.25))
    .updateMask(dwWater.lt(0.60).and(dwBuilt.lt(0.60)))
    .rename('other_confidence');

  // 6. Thresholding & Spatial Mutual Exclusivity
  var rawPaddy = paddyConfidence.gte(autoCfg.paddyConfidenceThreshold);
  var rawBanana = bananaConfidence.gte(autoCfg.bananaConfidenceThreshold);
  var rawOther = otherConfidence.gte(autoCfg.otherConfidenceThreshold);

  var paddyOverBanana = paddyConfidence.gt(bananaConfidence);
  var cleanPaddy = rawPaddy.and(rawBanana.not().or(paddyOverBanana)).and(rawOther.not());
  var cleanBanana = rawBanana.and(rawPaddy.not().or(paddyOverBanana.not())).and(rawOther.not());
  var cleanOther = rawOther.and(cleanPaddy.not()).and(cleanBanana.not());

  // 7. Speckle Suppression via Connected Component Filtering
  var filterConnected = function(mask) {
    return mask.updateMask(
      mask.connectedPixelCount(100, true).gte(autoCfg.minCandidateRegionPixels)
    );
  };

  var filteredPaddy = filterConnected(cleanPaddy);
  var filteredBanana = filterConnected(cleanBanana);
  var filteredOther = filterConnected(cleanOther);

  // 8. Vectorization into Training FeatureCollections (Pilot Sector)
  var extractPolygons = function(mask, classVal, className) {
    var vectors = mask.selfMask().reduceToVectors({
      geometry: pilotSector,
      scale: config.SCALES.nativeS2,
      geometryType: 'polygon',
      eightConnected: true,
      labelProperty: 'candidate_id',
      maxPixels: 1e8,
      tileScale: 4
    });
    return vectors
      .filter(ee.Filter.gte('count', autoCfg.minCandidateRegionPixels))
      .limit(autoCfg.maxCandidatePolygonsPerClass)
      .map(function(f) {
        return f.set({
          'class': classVal,
          'class_name': className,
          'source': 'satellite_pseudo_label'
        });
      });
  };

  var paddyFC  = extractPolygons(filteredPaddy, 1, 'Paddy');
  var bananaFC = extractPolygons(filteredBanana, 2, 'Banana');
  var otherFC  = extractPolygons(filteredOther, 0, 'Other');

  return {
    confidence: {
      paddy: paddyConfidence,
      banana: bananaConfidence,
      other: otherConfidence,
      dwCrops: dwCrops
    },
    masks: {
      paddy: filteredPaddy,
      banana: filteredBanana,
      other: filteredOther
    },
    polygons: {
      paddy: paddyFC,
      banana: bananaFC,
      other: otherFC,
      all: otherFC.merge(paddyFC).merge(bananaFC)
    }
  };
}

/**
 * Ingests ground-truth geometry layers or automatically generated candidates,
 * audits sample distributions, and executes a reproducible 70/30 train/test partition.
 * 
 * @param {ee.Image} featureStack The multi-band predictive feature image.
 * @param {Array<string>} featureNames List of band names to sample.
 * @param {Object} candidatePolygons Object containing paddy, banana, and other FeatureCollections.
 * @param {Object} config The system configuration object.
 * @return {Object} Audit summary, partitioned feature collections, and status flag.
 */
function prepareTrainingData(featureStack, featureNames, candidatePolygons, config) {
  var paddyFC  = candidatePolygons.paddy  || ee.FeatureCollection([]);
  var bananaFC = candidatePolygons.banana || ee.FeatureCollection([]);
  var otherFC  = candidatePolygons.other  || ee.FeatureCollection([]);

  var allPolygons = otherFC.merge(paddyFC).merge(bananaFC);
  var totalPolygons = allPolygons.size();

  // Extract pixel samples
  var sampledPixels = ee.Algorithms.If(
    totalPolygons.gt(0),
    featureStack.select(featureNames).sampleRegions({
      collection: allPolygons,
      properties: ['class', 'class_name', 'source'],
      scale: config.ML.sampleScale,
      tileScale: 4,
      geometries: false
    }),
    ee.FeatureCollection([])
  );

  sampledPixels = ee.FeatureCollection(sampledPixels);
  var totalSamples = sampledPixels.size();

  // Partition into Train (70%) and Independent Validation (30%)
  var partitioned = sampledPixels.randomColumn('split_rand', config.ML.randomSeed);
  var trainSet = partitioned.filter(ee.Filter.lt('split_rand', config.ML.trainSplitRatio));
  var valSet = partitioned.filter(ee.Filter.gte('split_rand', config.ML.trainSplitRatio));

  return {
    hasData: totalSamples.gt(0),
    totalPolygons: totalPolygons,
    totalSamples: totalSamples,
    polygonCounts: {
      other: otherFC.size(),
      paddy: paddyFC.size(),
      banana: bananaFC.size()
    },
    polygons: {
      other: otherFC,
      paddy: paddyFC,
      banana: bananaFC,
      all: allPolygons
    },
    samples: {
      all: sampledPixels,
      train: trainSet,
      val: valSet
    }
  };
}

// Export module if used in modular environment
if (typeof exports !== 'undefined') {
  exports.generateAutomaticTrainingCandidates = generateAutomaticTrainingCandidates;
  exports.prepareTrainingData = prepareTrainingData;
}

