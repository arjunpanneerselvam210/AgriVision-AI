// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 07: SENTINEL-1 SAR FUSION & ABLATION EXPERIMENT
// =============================================================================
// STRICT NO-HARDCODING RULE:
// SAR statistics, dual-model comparison metrics, and deltas are dynamically calculated.
// =============================================================================

/**
 * Extracts Sentinel-1 SAR temporal features and executes an ablation experiment
 * comparing Model A (S2 only) vs. Model B (S1 + S2 fused).
 * 
 * @param {ee.Geometry} aoiGeometry The study area boundary.
 * @param {ee.Image} s2FeatureStack Sentinel-2 feature stack image.
 * @param {Array<string>} s2FeatureNames List of Sentinel-2 feature names.
 * @param {Object} trainingData Output from prepareTrainingData module.
 * @param {Object} config The system configuration object.
 * @return {Object} Fused feature stack, S1 statistics, and comparative model evaluation.
 */
function runSentinel1FusionPipeline(aoiGeometry, s2FeatureStack, s2FeatureNames, trainingData, config) {
  // 1. Filter Sentinel-1 C-Band GRD
  var s1Col = ee.ImageCollection(config.DATASETS.s1Grd)
    .filterBounds(aoiGeometry)
    .filterDate(config.TEMPORAL.startDate, config.TEMPORAL.endDate)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .filter(ee.Filter.eq('instrumentMode', 'IW'));

  // 2. Add Cross-Polarization Difference in dB: VH_dB - VV_dB = 10 * log10(VH / VV)
  var s1Processed = s1Col.map(function(img) {
    var vhMinusVv = img.select('VH').subtract(img.select('VV')).rename('VH_minus_VV_dB');
    return img.select(['VV', 'VH']).addBands(vhMinusVv);
  });

  // 3. Compute Dynamic SAR Temporal Statistics
  var s1Mean = s1Processed.select(['VV', 'VH', 'VH_minus_VV_dB']).mean()
    .rename(['VV_mean', 'VH_mean', 'VH_minus_VV_dB_mean']);
  var s1StdDev = s1Processed.select(['VV', 'VH']).reduce(ee.Reducer.stdDev())
    .rename(['VV_stdDev', 'VH_stdDev']);

  var s1FeatureStack = ee.Image.cat([s1Mean, s1StdDev]);
  var s1FeatureNames = ['VV_mean', 'VH_mean', 'VH_minus_VV_dB_mean', 'VV_stdDev', 'VH_stdDev'];

  // 4. Construct Fused Feature Stack (S2 Optical + S1 SAR)
  var fusedStack = ee.Image.cat([s2FeatureStack, s1FeatureStack]).clip(aoiGeometry);
  var fusedFeatureNames = s2FeatureNames.concat(s1FeatureNames);

  // 5. Controlled Ablation Comparison (Model A vs Model B)
  var isTrained = ee.Number(trainingData.hasData);

  var comparisonResults = ee.Algorithms.If(
    isTrained,
    (function() {
      // Model A: Optical Sentinel-2 Only
      var modelA = ee.Classifier.smileRandomForest({
        numberOfTrees: config.ML.rfTrees,
        seed: config.ML.randomSeed
      }).train({
        features: trainingData.samples.train,
        classProperty: 'class',
        inputProperties: s2FeatureNames
      });

      // Model B: Fused Sentinel-1 + Sentinel-2
      var modelB = ee.Classifier.smileRandomForest({
        numberOfTrees: config.ML.rfTrees,
        seed: config.ML.randomSeed
      }).train({
        features: trainingData.samples.train,
        classProperty: 'class',
        inputProperties: fusedFeatureNames
      });

      // Evaluate both on identical hold-out validation set
      var valA = trainingData.samples.val.classify(modelA);
      var valB = trainingData.samples.val.classify(modelB);

      var cmA = valA.errorMatrix('class', 'classification');
      var cmB = valB.errorMatrix('class', 'classification');

      var oaA = cmA.accuracy();
      var oaB = cmB.accuracy();
      var kappaA = cmA.kappa();
      var kappaB = cmB.kappa();

      var deltaOA = oaB.subtract(oaA);
      var deltaKappa = kappaB.subtract(kappaA);

      return {
        hasResults: true,
        modelA: { overallAccuracy: oaA, kappa: kappaA, matrix: cmA },
        modelB: { overallAccuracy: oaB, kappa: kappaB, matrix: cmB },
        deltaOA: deltaOA,
        deltaKappa: deltaKappa,
        bestModel: ee.Algorithms.If(deltaOA.gte(0), 'Model B (Fused S1+S2)', 'Model A (S2 Only)')
      };
    })(),
    {
      hasResults: false,
      deltaOA: ee.Number(0),
      deltaKappa: ee.Number(0)
    }
  );

  return {
    s1CollectionSize: s1Col.size(),
    s1FeatureStack: s1FeatureStack,
    s1FeatureNames: s1FeatureNames,
    fusedStack: fusedStack,
    fusedFeatureNames: fusedFeatureNames,
    ablation: comparisonResults
  };
}

// Export module if used in modular environment
if (typeof exports !== 'undefined') {
  exports.runSentinel1FusionPipeline = runSentinel1FusionPipeline;
}
