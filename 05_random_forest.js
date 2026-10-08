// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 05: RANDOM FOREST CLASSIFICATION & RIGOROUS STATISTICAL VALIDATION
// =============================================================================
// STRICT NO-HARDCODING RULE:
// All accuracy scores, error matrices, F1 values, and class areas are computed dynamically.
// =============================================================================

/**
 * Trains Random Forest classifier, classifies AOI, evaluates hold-out validation set,
 * and computes dynamic class acreages with area reconciliation.
 * 
 * @param {ee.Image} featureStack Image stack containing all predictive features.
 * @param {Array<string>} featureNames List of feature band names.
 * @param {Object} trainingData Output from prepareTrainingData module.
 * @param {ee.Geometry} aoiGeometry The study area boundary.
 * @param {ee.Number} totalAoiAreaM2 Total geometric area in m².
 * @param {Object} config The system configuration object.
 * @return {Object} Trained model, classification map, error metrics, and area accounting.
 */
function runRandomForestPipeline(featureStack, featureNames, trainingData, aoiGeometry, totalAoiAreaM2, config) {
  var isTrained = ee.Number(trainingData.hasData);

  // Train Classifier conditionally
  var classifier = ee.Algorithms.If(
    isTrained,
    ee.Classifier.smileRandomForest({
      numberOfTrees: config.ML.rfTrees,
      minLeafPopulation: config.ML.minLeafPopulation,
      bagFraction: config.ML.bagFraction,
      seed: config.ML.randomSeed
    }).train({
      features: trainingData.samples.train,
      classProperty: 'class',
      inputProperties: featureNames
    }),
    null
  );

  // Classify AOI
  var classifiedMap = ee.Algorithms.If(
    isTrained,
    featureStack.select(featureNames).classify(ee.Classifier(classifier)).rename('crop_class').clip(aoiGeometry),
    ee.Image.constant(0).clip(aoiGeometry).rename('crop_class')
  );
  classifiedMap = ee.Image(classifiedMap);

  // Independent Validation on Hold-Out Test Set (30%)
  var validationReport = ee.Algorithms.If(
    isTrained,
    (function() {
      var validatedSet = trainingData.samples.val.classify(ee.Classifier(classifier));
      var em = validatedSet.errorMatrix('class', 'classification');
      var oa = em.accuracy();
      var kappa = em.kappa();

      // Mathematically Rigorous F1-Score: 2 * TP / (RowSum + ColSum)
      var matArray = em.array();
      function computeF1(classIdx) {
        var tp = ee.Number(matArray.get([classIdx, classIdx]));
        var rowSum = ee.Number(matArray.slice(0, classIdx, classIdx + 1).reduce(ee.Reducer.sum(), [1]).get([0, 0]));
        var colSum = ee.Number(matArray.slice(1, classIdx, classIdx + 1).reduce(ee.Reducer.sum(), [0]).get([0, 0]));
        var denom = rowSum.add(colSum);
        return ee.Algorithms.If(denom.gt(0), ee.Number(2).multiply(tp).divide(denom), 0);
      }

      var f1Other = ee.Number(computeF1(0));
      var f1Paddy = ee.Number(computeF1(1));
      var f1Banana = ee.Number(computeF1(2));

      return {
        hasResults: true,
        matrix: em,
        overallAccuracy: oa,
        kappa: kappa,
        f1Other: f1Other,
        f1Paddy: f1Paddy,
        f1Banana: f1Banana
      };
    })(),
    {
      hasResults: false,
      overallAccuracy: ee.Number(0),
      kappa: ee.Number(0),
      f1Other: ee.Number(0),
      f1Paddy: ee.Number(0),
      f1Banana: ee.Number(0)
    }
  );

  // Dynamic Geographic Area Accounting via Pixel-Area Integration
  var pixelAreaM2 = ee.Image.pixelArea();
  var areaImage = pixelAreaM2.addBands(classifiedMap);

  var rawAreas = ee.Algorithms.If(
    isTrained,
    areaImage.reduceRegion({
      reducer: ee.Reducer.sum().group({ groupField: 1, groupName: 'code' }),
      geometry: aoiGeometry,
      scale: config.SCALES.statsAggregation,
      maxPixels: 1e9,
      tileScale: 4,
      bestEffort: true
    }).get('groups'),
    ee.List([])
  );

  var areaGroups = ee.List(rawAreas);

  function getClassAreaM2(targetCode) {
    var matches = areaGroups.filter(ee.Filter.eq('code', targetCode));
    return ee.Algorithms.If(matches.size().gt(0), ee.Dictionary(matches.get(0)).get('sum'), 0);
  }

  var areaOtherM2 = ee.Number(getClassAreaM2(0));
  var areaPaddyM2 = ee.Number(getClassAreaM2(1));
  var areaBananaM2 = ee.Number(getClassAreaM2(2));

  var areaOtherHa = areaOtherM2.divide(1e4);
  var areaPaddyHa = areaPaddyM2.divide(1e4);
  var areaBananaHa = areaBananaM2.divide(1e4);

  var areaOtherKm2 = areaOtherM2.divide(1e6);
  var areaPaddyKm2 = areaPaddyM2.divide(1e6);
  var areaBananaKm2 = areaBananaM2.divide(1e6);

  var pctOther = areaOtherM2.divide(totalAoiAreaM2).multiply(100);
  var pctPaddy = areaPaddyM2.divide(totalAoiAreaM2).multiply(100);
  var pctBanana = areaBananaM2.divide(totalAoiAreaM2).multiply(100);

  // Geometric Reconciliation Check
  var totalClassifiedKm2 = areaOtherKm2.add(areaPaddyKm2).add(areaBananaKm2);
  var totalAoiKm2 = totalAoiAreaM2.divide(1e6);
  var areaResidualKm2 = totalAoiKm2.subtract(totalClassifiedKm2).abs();
  var isAreaReconciled = areaResidualKm2.divide(totalAoiKm2).multiply(100).lt(0.5);

  return {
    isTrained: isTrained,
    classifier: classifier,
    classifiedMap: classifiedMap,
    validation: validationReport,
    acreage: {
      other:  { ha: areaOtherHa,  km2: areaOtherKm2,  pct: pctOther },
      paddy:  { ha: areaPaddyHa,  km2: areaPaddyKm2,  pct: pctPaddy },
      banana: { ha: areaBananaHa, km2: areaBananaKm2, pct: pctBanana },
      reconciliation: {
        totalClassifiedKm2: totalClassifiedKm2,
        totalAoiKm2: totalAoiKm2,
        residualKm2: areaResidualKm2,
        isConsistent: isAreaReconciled
      }
    }
  };
}

// Export module if used in modular environment
if (typeof exports !== 'undefined') {
  exports.runRandomForestPipeline = runRandomForestPipeline;
}
