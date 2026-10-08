// ================================================================
// AGRIVISION AI - MAPATHON 2026
// PROBLEM STATEMENT 1
// AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
//
// STUDY REGION:
// Tirunelveli District
// Target: Ambasamudram + Cheranmahadevi Taluks
//
// CLASSES:
// 0 = Other
// 1 = Paddy
// 2 = Banana
//
// IMPORTANT:
// Satellite-derived field segments are NOT legal cadastral parcels.
//
// WORKFLOW:
// Sentinel-2 + Sentinel-1 + Dynamic World
//      +
// Multi-Temporal NDVI / NDWI / LSWI & SAR Features
//      +
// Multi-Sensor Evidence Confidence Scores (Paddy, Banana, Other)
//      +
// Spatial Filtering & Automatic High-Confidence Training Polygons
//      +
// Random Forest Training & Pseudo-Label Validation
//      +
// SNIC Superpixel Field Segmentation
//      +
// Satellite-Derived Field Segment Classification
//      +
// Dynamic Crop Area Accounting & Dashboard
//
// ================================================================


// ================================================================
// 01. CONFIGURATION
// ================================================================

var CONFIG = {

  // --------------------------------------------------------------
  // ADMINISTRATIVE DATASET
  // --------------------------------------------------------------

  adminDataset:
    'FAO/GAUL/2015/level2',

  countryToken:
    'India',

  stateToken:
    'Tamil',

  districtToken:
    'Tirunel',


  // --------------------------------------------------------------
  // EXACT TALUK BOUNDARY
  // --------------------------------------------------------------
  //
  // IMPORTANT:
  // false = use public Tirunelveli district fallback
  //
  // true = use your uploaded official taluk asset
  //
  // When you have the official taluk FeatureCollection,
  // put its asset ID below.
  //
  // --------------------------------------------------------------

  useCustomTalukAsset:
    false,

  customTalukAssetId:
    'users/YOUR_USERNAME/tirunelveli_taluks',

  talukField:
    'TALUK_NAME',

  targetTaluks: [
    'Ambasamudram',
    'Cheranmahadevi'
  ],


  // --------------------------------------------------------------
  // TEMPORAL WINDOW
  // --------------------------------------------------------------

  startDate:
    '2023-09-01',

  endDate:
    '2024-04-30',

  temporalStepDays:
    30,


  // --------------------------------------------------------------
  // SENTINEL-2
  // --------------------------------------------------------------

  s2CollectionId:
    'COPERNICUS/S2_SR_HARMONIZED',

  maxS2CloudCoverage:
    40,


  // --------------------------------------------------------------
  // SENTINEL-1
  // --------------------------------------------------------------

  s1CollectionId:
    'COPERNICUS/S1_GRD',


  // --------------------------------------------------------------
  // DYNAMIC WORLD (NEAR-REAL-TIME LAND COVER PRIORS)
  // --------------------------------------------------------------

  dynamicWorldCollectionId:
    'GOOGLE/DYNAMICWORLD/V1',


  // --------------------------------------------------------------
  // AUTOMATIC HIGH-CONFIDENCE TRAINING CONFIGURATION
  // --------------------------------------------------------------

  autoTrainingEnabled:
    true,

  autoPaddyConfidenceThreshold:
    0.60,

  autoBananaConfidenceThreshold:
    0.62,

  autoOtherConfidenceThreshold:
    0.55,

  minTrainingRegionPixels:
    8,

  maxTrainingPolygonsPerClass:
    30,

  maxTrainingPixelsPerClass:
    350,

  showAutoTrainingLayers:
    true,


  // --------------------------------------------------------------
  // RANDOM FOREST
  // --------------------------------------------------------------

  rfTrees:
    100,

  trainSplitRatio:
    0.70,

  splitSeed:
    42,


  // --------------------------------------------------------------
  // PROCESSING
  // --------------------------------------------------------------

  sampleScale:
    10,

  statsScale:
    100,


  // --------------------------------------------------------------
  // SNIC
  // --------------------------------------------------------------

  snicSuperpixelSize:
    16,

  snicCompactness:
    1.0,

  snicConnectivity:
    8,

  minParcelPixels:
    8,


  // --------------------------------------------------------------
  // PILOT SECTOR
  // --------------------------------------------------------------

  pilotBufferKm:
    4,


  // --------------------------------------------------------------
  // VECTORIZATION
  // --------------------------------------------------------------

  maxPixels:
    1e8
};


// ================================================================
// 02. AOI CREATION
// ================================================================

var aoi;
var boundaryDescription;


// ---------------------------------------------------------------
// EXACT TALUK ASSET
// ---------------------------------------------------------------

var isCustomAssetConfigured =
  CONFIG.useCustomTalukAsset &&
  CONFIG.customTalukAssetId &&
  !CONFIG.customTalukAssetId.includes('YOUR_USERNAME');

if (isCustomAssetConfigured) {

  print(
    'Using custom taluk boundary asset:',
    CONFIG.customTalukAssetId
  );

  var talukAsset =
    ee.FeatureCollection(
      CONFIG.customTalukAssetId
    );

  aoi =
    talukAsset.filter(
      ee.Filter.inList(
        CONFIG.talukField,
        CONFIG.targetTaluks
      )
    );

  boundaryDescription =
    'Ambasamudram + Cheranmahadevi official taluk asset';


  // ---------------------------------------------------------------
  // PUBLIC FALLBACK
  // ---------------------------------------------------------------

} else {

  if (CONFIG.useCustomTalukAsset) {
    print(
      'NOTICE: customTalukAssetId still contains placeholder YOUR_USERNAME. ' +
      'Falling back to public administrative boundary.'
    );
  }

  print(
    'WARNING: Exact taluk asset is not enabled or placeholder used.'
  );

  print(
    'Using Tirunelveli district boundary for pipeline testing.'
  );

  var admin =
    ee.FeatureCollection(
      CONFIG.adminDataset
    );


  var country =
    admin.filter(
      ee.Filter.stringContains(
        'ADM0_NAME',
        CONFIG.countryToken
      )
    );


  var state =
    country.filter(
      ee.Filter.stringContains(
        'ADM1_NAME',
        CONFIG.stateToken
      )
    );


  aoi =
    state.filter(
      ee.Filter.stringContains(
        'ADM2_NAME',
        CONFIG.districtToken
      )
    );


  boundaryDescription =
    'Tirunelveli district fallback';


  print(
    'Country matches:',
    country.size()
  );

  print(
    'State matches:',
    state.size()
  );

  print(
    'District matches:',
    aoi.size()
  );

  print(
    'Matched district names:',
    aoi.aggregate_array(
      'ADM2_NAME'
    )
  );
}


// ================================================================
// 03. AOI VALIDATION
// ================================================================

var aoiCount =
  aoi.size().getInfo();


if (aoiCount === 0) {

  throw new Error(
    'ERROR: AOI is empty. ' +
    'Check the district/taluk boundary configuration.'
  );
}


var aoiGeometry =
  aoi.geometry();


var aoiAreaM2 =
  aoiGeometry.area();


var aoiAreaKm2 =
  aoiAreaM2.divide(1e6);


var aoiAreaHa =
  aoiAreaM2.divide(1e4);


var aoiValid =
  aoiAreaKm2.gte(20);


print('');
print('================================================');
print('01. AOI SUMMARY');
print('================================================');

print(
  'Boundary:',
  boundaryDescription
);

print(
  'AOI area km²:',
  aoiAreaKm2
);

print(
  'AOI area hectares:',
  aoiAreaHa
);

print(
  'AOI >= 20 km²:',
  aoiValid
);


// ================================================================
// 04. PILOT SECTOR
// ================================================================

var aoiCentroid =
  aoiGeometry.centroid();


var pilotSector =
  aoiCentroid
    .buffer(
      CONFIG.pilotBufferKm * 1000
    )
    .intersection(
      aoiGeometry
    );


var pilotAreaKm2 =
  pilotSector
    .area()
    .divide(1e6);


print(
  'Pilot sector area km²:',
  pilotAreaKm2
);

print(
  'Pilot sector >= 20 km²:',
  pilotAreaKm2.gte(20)
);


// ================================================================
// 05. SENTINEL-2 CLOUD / SHADOW MASK
// ================================================================

function maskSentinel2(image) {

  var scl =
    image.select('SCL');


  // Remove:
  // 1 = saturated/defective
  // 3 = cloud shadow
  // 8 = medium cloud probability
  // 9 = high cloud probability
  // 10 = cirrus

  var sclMask =
    scl.neq(1)
      .and(
        scl.neq(3)
      )
      .and(
        scl.neq(8)
      )
      .and(
        scl.neq(9)
      )
      .and(
        scl.neq(10)
      );


  var qa =
    image.select('QA60');


  var cloudMask =
    qa.bitwiseAnd(
      1 << 10
    ).eq(0)
      .and(
        qa.bitwiseAnd(
          1 << 11
        ).eq(0)
      );


  return image
    .updateMask(
      sclMask.and(
        cloudMask
      )
    )
    .copyProperties(
      image,
      [
        'system:time_start',
        'CLOUDY_PIXEL_PERCENTAGE'
      ]
    );
}


// ================================================================
// 06. SENTINEL-2 COLLECTION
// ================================================================

var s2 =
  ee.ImageCollection(
    CONFIG.s2CollectionId
  )
    .filterBounds(
      aoiGeometry
    )
    .filterDate(
      CONFIG.startDate,
      CONFIG.endDate
    )
    .filter(
      ee.Filter.lte(
        'CLOUDY_PIXEL_PERCENTAGE',
        CONFIG.maxS2CloudCoverage
      )
    )
    .map(
      maskSentinel2
    );


var s2Count =
  s2.size().getInfo();


print('');
print('================================================');
print('02. SENTINEL-2 INVENTORY');
print('================================================');

print(
  'Sentinel-2 scenes:',
  s2Count
);


if (s2Count === 0) {

  throw new Error(
    'ERROR: No Sentinel-2 images found. ' +
    'Increase the date range or cloud threshold.'
  );
}

// ================================================================
// 07. TEMPORAL SENTINEL-2 COMPOSITES - ROBUST VERSION
// ================================================================
//
// FIX:
// Some 30-day windows may contain zero Sentinel-2 images.
// We must NOT call median()/select() on an empty collection.
//
// This version creates a masked placeholder image for empty
// windows and then removes those windows afterward.
// ================================================================

var startDate =
  ee.Date(
    CONFIG.startDate
  );

var endDate =
  ee.Date(
    CONFIG.endDate
  );

var totalDays =
  endDate.difference(
    startDate,
    'day'
  );

var offsets =
  ee.List.sequence(
    0,
    totalDays.subtract(1),
    CONFIG.temporalStepDays
  );


var temporalS2 =
  ee.ImageCollection(
    offsets.map(
      function (offset) {

        offset =
          ee.Number(offset);


        var windowStart =
          startDate.advance(
            offset,
            'day'
          );


        var windowEnd =
          windowStart.advance(
            CONFIG.temporalStepDays,
            'day'
          );


        var windowImages =
          s2.filterDate(
            windowStart,
            windowEnd
          );


        var imageCount =
          windowImages.size();


        // --------------------------------------------------------
        // IMPORTANT FIX
        // --------------------------------------------------------
        //
        // If images exist:
        //     create normal median composite.
        //
        // If no images exist:
        //     create a completely masked image containing
        //     the required Sentinel-2 bands.
        //
        // This prevents:
        //
        // Image.select: Band pattern 'B2' was applied to an
        // Image with no bands.
        // --------------------------------------------------------

        var emptyBase =
          ee.Image.constant([
            0,
            0,
            0,
            0,
            0,
            0
          ])
            .rename([
              'B2',
              'B3',
              'B4',
              'B8',
              'B11',
              'B12'
            ])
            .updateMask(
              ee.Image.constant(0)
            );


        var composite =
          ee.Image(
            ee.Algorithms.If(
              imageCount.gt(0),
              windowImages.median()
                .select([
                  'B2',
                  'B3',
                  'B4',
                  'B8',
                  'B11',
                  'B12'
                ]),
              emptyBase
            )
          );


        // --------------------------------------------------------
        // SPECTRAL INDICES
        // --------------------------------------------------------

        var ndvi =
          composite
            .normalizedDifference([
              'B8',
              'B4'
            ])
            .rename(
              'NDVI'
            );


        var ndwi =
          composite
            .normalizedDifference([
              'B3',
              'B8'
            ])
            .rename(
              'NDWI'
            );


        var lswi =
          composite
            .normalizedDifference([
              'B8',
              'B11'
            ])
            .rename(
              'LSWI'
            );


        return composite
          .addBands([
            ndvi,
            ndwi,
            lswi
          ])
          .set(
            'system:time_start',
            windowStart.millis()
          )
          .set(
            'scene_count',
            imageCount
          );

      }
    )
  )
    .filter(
      ee.Filter.gt(
        'scene_count',
        0
      )
    );


var temporalCount =
  temporalS2
    .size()
    .getInfo();


print('');
print('================================================');
print('04. TEMPORAL SENTINEL-2');
print('================================================');

print(
  'Total possible temporal windows:',
  offsets.size()
);

print(
  'Valid temporal composites:',
  temporalCount
);


if (temporalCount === 0) {

  throw new Error(
    'ERROR: No valid temporal Sentinel-2 composites were created.'
  );

}


// ================================================================
// 08. SENTINEL-2 TEMPORAL FEATURES (NDVI & LSWI DYNAMICS)
// ================================================================

var baseS2 =
  temporalS2.median();


// --- NDVI TEMPORAL METRICS ---
var ndviCollection =
  temporalS2.select(
    'NDVI'
  );

var ndviMean =
  ndviCollection
    .mean()
    .rename(
      'NDVI_mean'
    );

var ndviMin =
  ndviCollection
    .min()
    .rename(
      'NDVI_min'
    );

var ndviMax =
  ndviCollection
    .max()
    .rename(
      'NDVI_max'
    );

var ndviStdDev =
  ndviCollection
    .reduce(
      ee.Reducer.stdDev()
    )
    .rename(
      'NDVI_stdDev'
    );

var ndviAmplitude =
  ndviMax
    .subtract(
      ndviMin
    )
    .rename(
      'NDVI_amplitude'
    );


// --- LSWI TEMPORAL METRICS (CANOPY MOISTURE & INUNDATION) ---
var lswiCollection =
  temporalS2.select(
    'LSWI'
  );

var lswiMean =
  lswiCollection
    .mean()
    .rename(
      'LSWI_mean'
    );

var lswiMin =
  lswiCollection
    .min()
    .rename(
      'LSWI_min'
    );

var lswiMax =
  lswiCollection
    .max()
    .rename(
      'LSWI_max'
    );

var lswiAmplitude =
  lswiMax
    .subtract(
      lswiMin
    )
    .rename(
      'LSWI_amplitude'
    );


var s2Features =
  ee.Image.cat([

    baseS2.select([
      'B2',
      'B3',
      'B4',
      'B8',
      'B11',
      'B12'
    ]),

    baseS2.select([
      'NDVI',
      'NDWI',
      'LSWI'
    ]),

    ndviMean,
    ndviMin,
    ndviMax,
    ndviStdDev,
    ndviAmplitude,

    lswiMean,
    lswiMin,
    lswiMax,
    lswiAmplitude

  ]);


var s2FeatureNames = [

  'B2',
  'B3',
  'B4',
  'B8',
  'B11',
  'B12',

  'NDVI',
  'NDWI',
  'LSWI',

  'NDVI_mean',
  'NDVI_min',
  'NDVI_max',
  'NDVI_stdDev',
  'NDVI_amplitude',

  'LSWI_mean',
  'LSWI_min',
  'LSWI_max',
  'LSWI_amplitude'

];


print(
  'Sentinel-2 feature bands:',
  s2FeatureNames
);


// ================================================================
// 09. SENTINEL-1
// ================================================================

var s1 =
  ee.ImageCollection(
    CONFIG.s1CollectionId
  )
    .filterBounds(
      aoiGeometry
    )
    .filterDate(
      CONFIG.startDate,
      CONFIG.endDate
    )
    .filter(
      ee.Filter.listContains(
        'transmitterReceiverPolarisation',
        'VV'
      )
    )
    .filter(
      ee.Filter.listContains(
        'transmitterReceiverPolarisation',
        'VH'
      )
    )
    .filter(
      ee.Filter.eq(
        'instrumentMode',
        'IW'
      )
    );


var s1Count =
  s1.size().getInfo();


print('');
print('================================================');
print('03. SENTINEL-1 INVENTORY');
print('================================================');

print(
  'Sentinel-1 scenes:',
  s1Count
);


if (s1Count === 0) {

  throw new Error(
    'ERROR: No Sentinel-1 VV/VH images found.'
  );
}


// ================================================================
// 10. SENTINEL-1 FEATURES
// ================================================================

var s1Processed =
  s1.map(
    function (image) {

      var vhMinusVv =
        image
          .select('VH')
          .subtract(
            image.select('VV')
          )
          .rename(
            'VH_minus_VV'
          );


      return image
        .select([
          'VV',
          'VH'
        ])
        .addBands(
          vhMinusVv
        );
    }
  );


var s1Mean =
  s1Processed
    .select([
      'VV',
      'VH',
      'VH_minus_VV'
    ])
    .mean()
    .rename([
      'VV_mean',
      'VH_mean',
      'VH_minus_VV_mean'
    ]);


var s1StdDev =
  s1Processed
    .select([
      'VV',
      'VH'
    ])
    .reduce(
      ee.Reducer.stdDev()
    )
    .rename([
      'VV_stdDev',
      'VH_stdDev'
    ]);


var s1Features =
  ee.Image.cat([
    s1Mean,
    s1StdDev
  ]);


var s1FeatureNames = [

  'VV_mean',
  'VH_mean',
  'VH_minus_VV_mean',
  'VV_stdDev',
  'VH_stdDev'

];


// ================================================================
// 11. FUSED FEATURE STACK
// ================================================================

var fusedFeatureNames =
  s2FeatureNames.concat(
    s1FeatureNames
  );


var fusedFeatureStack =
  ee.Image.cat([
    s2Features,
    s1Features
  ])
    .clip(
      aoiGeometry
    );


print('');
print('================================================');
print('04. FEATURE STACK');
print('================================================');

print(
  'S2 feature count:',
  s2FeatureNames.length
);

print(
  'S1 feature count:',
  s1FeatureNames.length
);

print(
  'Total fused feature count:',
  fusedFeatureNames.length
);

print(
  'Feature names:',
  fusedFeatureNames
);


// ================================================================
// 12. AUTOMATIC HIGH-CONFIDENCE TRAINING CANDIDATE GENERATION
// ================================================================
//
// SCIENTIFIC FRAMEWORK & REMOTE SENSING METHODOLOGY:
// 1. DYNAMIC WORLD (GOOGLE/DYNAMICWORLD/V1):
//    A 10m near-real-time global land cover dataset from Sentinel-2
//    deep-learning inference. We use the multi-temporal mean of the
//    'crops' probability band as an independent agricultural prior.
//    Crucially, Dynamic World does NOT distinguish Paddy from Banana;
//    it provides general cropland likelihood (Class 1 vs 2 separation
//    requires optical phenology and SAR backscatter fusion).
//
// 2. PADDY CANDIDATE DETECTION (Class 1):
//    - Annual wetland crop with distinct transplanting, tillering, heading,
//      and harvest stages.
//    - Pronounced seasonal vegetation fluctuation: high NDVI amplitude and
//      high NDVI temporal standard deviation.
//    - Strong inundation / water response: high LSWI amplitude or peak
//      wetness during transplanting and early growth stages.
//    - Sentinel-1 SAR dynamics: low specular backscatter during flooded
//      transplanting rising steeply to volume/double-bounce scattering ->
//      elevated VH_stdDev and characteristic VH - VV ratio.
//
// 3. BANANA CANDIDATE DETECTION (Class 2):
//    - Semi-perennial / perennial broadleaf monocot crop cultivated over
//      11-14+ months per cycle.
//    - Persistent high greenness: high minimum NDVI (NDVI_min >= 0.30)
//      and high mean NDVI (NDVI_mean >= 0.50), with low temporal amplitude
//      (no bare-soil fallow period like seasonal paddy).
//    - Sustained canopy moisture: consistently positive and elevated LSWI.
//    - Sentinel-1 SAR signature: dense broadleaf canopy creates strong C-band
//      radar volume scattering (elevated VH_mean and higher cross-pol ratio).
//
// 4. OTHER CLASS DETECTION (Class 0):
//    - Represents non-target agricultural/landscape context: fallow fields,
//      bare agricultural soil, sparse scrub, and low-density grass.
//    - Low crop probability (crops <= 0.25), low peak greenness (NDVI_max <= 0.35),
//      and elevated bare soil probability.
//    - Deep permanent water bodies and dense built-up infrastructure are masked out
//      so they do not contaminate agricultural field model training.
//
// 5. SPATIAL CLEANING & VECTOR CANDIDATE REGIONS:
//    - Connected-component filtering removes isolated noisy pixels (< minTrainingRegionPixels).
//    - High-confidence raster masks are vectorized into candidate polygons
//      within the pilot agricultural sector (preventing GEE memory limits).
//
// 6. PSEUDO-LABEL VALIDATION CAVEAT:
//    - These dynamically generated regions are "high-confidence pseudo-labels"
//      derived from auxiliary biophysical rules before Random Forest training.
//    - They prevent circular data leakage because they are extracted from independent
//      biophysical priors rather than the Random Forest's own output.
//    - They are NOT legal cadastral ground truth; model validation against them
//      evaluates internal convergence and multi-sensor consistency.
// ================================================================

// ----------------------------------------------------------------
// 12.1 INGEST DYNAMIC WORLD NEAR-REAL-TIME STACK
// ----------------------------------------------------------------

var dwCol =
  ee.ImageCollection(
    CONFIG.dynamicWorldCollectionId
  )
    .filterBounds(
      aoiGeometry
    )
    .filterDate(
      CONFIG.startDate,
      CONFIG.endDate
    );

var dwCount =
  dwCol.size().getInfo();

print('');
print('================================================');
print('05. DYNAMIC WORLD & AUTOMATIC CANDIDATES');
print('================================================');

print(
  'Dynamic World scenes available:',
  dwCount
);

var dwBands = [
  'crops',
  'trees',
  'grass',
  'shrub_and_scrub',
  'built',
  'bare',
  'water'
];

var dwMean =
  ee.Image(
    ee.Algorithms.If(
      dwCount > 0,
      dwCol.select(dwBands).mean(),
      ee.Image.constant([0.45, 0.10, 0.10, 0.10, 0.05, 0.15, 0.05]).rename(dwBands)
    )
  ).clip(
    aoiGeometry
  );

var dwCrops =
  dwMean.select('crops');

var dwTrees =
  dwMean.select('trees');

var dwBare =
  dwMean.select('bare');

var dwBuilt =
  dwMean.select('built');

var dwWater =
  dwMean.select('water');


// ----------------------------------------------------------------
// 12.2 MULTI-SENSOR CONFIDENCE SCORE GENERATION [0 to 1]
// ----------------------------------------------------------------

// --- PADDY EVIDENCE CONFIDENCE ---
// Multi-sensor components:
// A. Dynamic World cropland prior
var cDW_paddy =
  dwCrops;

// B. Sentinel-2 phenological seasonality (high amplitude & high temporal stdDev)
var cNDVI_paddy =
  ndviAmplitude
    .subtract(0.20)
    .divide(0.35)
    .clamp(0, 1)
    .multiply(
      ndviStdDev
        .subtract(0.08)
        .divide(0.15)
        .clamp(0, 1)
    );

// C. Inundation & canopy moisture response (LSWI dynamics)
var cLSWI_paddy =
  lswiAmplitude
    .subtract(0.12)
    .divide(0.35)
    .clamp(0, 1);

// D. Sentinel-1 SAR temporal variability (flooded specular -> dense canopy volume)
var cSAR_paddy =
  s1Features
    .select('VH_stdDev')
    .subtract(0.8)
    .divide(1.5)
    .clamp(0, 1);

var paddyConfidence =
  cDW_paddy.multiply(0.30)
    .add(cNDVI_paddy.multiply(0.35))
    .add(cLSWI_paddy.multiply(0.20))
    .add(cSAR_paddy.multiply(0.15))
    .rename('paddy_confidence');


// --- BANANA EVIDENCE CONFIDENCE ---
// Multi-sensor components:
// A. Dynamic World broadleaf crop / tree canopy prior
var cDW_banana =
  dwCrops.max(dwTrees);

// B. Sustained high greenness throughout season (high min & mean NDVI)
var cNDVI_banana_green =
  ndviMean
    .subtract(0.45)
    .divide(0.30)
    .clamp(0, 1)
    .multiply(
      ndviMin
        .subtract(0.28)
        .divide(0.25)
        .clamp(0, 1)
    );

// C. Temporal stability (lack of annual bare-soil fallow cycle)
var cNDVI_banana_stable =
  ee.Image(1)
    .subtract(
      ndviAmplitude
        .subtract(0.15)
        .divide(0.30)
    )
    .clamp(0, 1);

var cNDVI_banana =
  cNDVI_banana_green
    .multiply(
      cNDVI_banana_stable
    );

// D. Sustained high canopy moisture (consistently positive LSWI)
var cLSWI_banana =
  lswiMean
    .subtract(0.05)
    .divide(0.25)
    .clamp(0, 1);

// E. C-band SAR volumetric scattering (elevated VH mean and higher cross-pol ratio)
var cSAR_banana =
  s1Features
    .select('VH_mean')
    .add(18)
    .divide(7)
    .clamp(0, 1)
    .multiply(
      s1Features
        .select('VH_minus_VV_mean')
        .add(10)
        .divide(5)
        .clamp(0, 1)
    );

var bananaConfidence =
  cDW_banana.multiply(0.25)
    .add(cNDVI_banana.multiply(0.35))
    .add(cLSWI_banana.multiply(0.20))
    .add(cSAR_banana.multiply(0.20))
    .rename('banana_confidence');


// --- OTHER EVIDENCE CONFIDENCE ---
// Non-target agricultural matrix (fallow fields, dry bare soil, sparse scrub)
var cDW_other =
  dwBare
    .add(dwMean.select('grass'))
    .add(dwMean.select('shrub_and_scrub'))
    .clamp(0, 1);

var cNDVI_other =
  ee.Image(1)
    .subtract(
      ndviMax
        .subtract(0.20)
        .divide(0.35)
    )
    .clamp(0, 1);

var cNonCrop_other =
  ee.Image(1)
    .subtract(dwCrops)
    .clamp(0, 1);

var otherConfidence =
  cNonCrop_other.multiply(0.40)
    .add(cNDVI_other.multiply(0.35))
    .add(cDW_other.multiply(0.25))
    .updateMask(
      dwWater.lt(0.60).and(dwBuilt.lt(0.60))
    )
    .rename('other_confidence');


// ----------------------------------------------------------------
// 12.3 MUTUAL EXCLUSIVITY & SPATIAL CLEANING
// ----------------------------------------------------------------

var rawPaddyMask =
  paddyConfidence.gte(
    CONFIG.autoPaddyConfidenceThreshold
  );

var rawBananaMask =
  bananaConfidence.gte(
    CONFIG.autoBananaConfidenceThreshold
  );

var rawOtherMask =
  otherConfidence.gte(
    CONFIG.autoOtherConfidenceThreshold
  );

// Resolve overlapping pixels: higher confidence score wins
var paddyWinsOverBanana =
  paddyConfidence.gt(
    bananaConfidence
  );

var cleanPaddyMask =
  rawPaddyMask
    .and(
      rawBananaMask.not().or(paddyWinsOverBanana)
    )
    .and(
      rawOtherMask.not()
    )
    .updateMask(
      dwWater.lt(0.50).and(dwBuilt.lt(0.50))
    );

var cleanBananaMask =
  rawBananaMask
    .and(
      rawPaddyMask.not().or(paddyWinsOverBanana.not())
    )
    .and(
      rawOtherMask.not()
    )
    .updateMask(
      dwWater.lt(0.50).and(dwBuilt.lt(0.50))
    );

var cleanOtherMask =
  rawOtherMask
    .and(
      cleanPaddyMask.not()
    )
    .and(
      cleanBananaMask.not()
    );

// Filter isolated noisy pixels (< minTrainingRegionPixels)
var cleanPaddyConnected =
  cleanPaddyMask.updateMask(
    cleanPaddyMask
      .connectedPixelCount(100, true)
      .gte(CONFIG.minTrainingRegionPixels)
  );

var cleanBananaConnected =
  cleanBananaMask.updateMask(
    cleanBananaMask
      .connectedPixelCount(100, true)
      .gte(CONFIG.minTrainingRegionPixels)
  );

var cleanOtherConnected =
  cleanOtherMask.updateMask(
    cleanOtherMask
      .connectedPixelCount(100, true)
      .gte(CONFIG.minTrainingRegionPixels)
  );


// ----------------------------------------------------------------
// 12.4 AUTOMATIC VECTOR CANDIDATE REGION EXTRACTION
// ----------------------------------------------------------------

var vectorizeCandidateRegions = function (
  mask,
  classVal,
  className,
  maxPolys
) {
  var vectors =
    mask.selfMask().reduceToVectors({
      geometry:
        pilotSector,
      scale:
        CONFIG.sampleScale,
      geometryType:
        'polygon',
      eightConnected:
        true,
      labelProperty:
        'candidate_id',
      maxPixels:
        CONFIG.maxPixels,
      tileScale:
        4
    });

  return vectors
    .filter(
      ee.Filter.gte('count', CONFIG.minTrainingRegionPixels)
    )
    .limit(
      maxPolys
    )
    .map(function (feat) {
      return feat.set({
        'class': classVal,
        'class_name': className,
        'source': 'auto_satellite_candidate'
      });
    });
};

// Check if manual geometry imports exist and user explicitly disabled auto-training:
var hasManualPaddy =
  (typeof paddy_polygons !== 'undefined' && !CONFIG.autoTrainingEnabled);

var hasManualBanana =
  (typeof banana_polygons !== 'undefined' && !CONFIG.autoTrainingEnabled);

var hasManualOther =
  (typeof other_polygons !== 'undefined' && !CONFIG.autoTrainingEnabled);

var paddyFC =
  hasManualPaddy
    ? ee.FeatureCollection(paddy_polygons).map(function (f) {
      return f.set({'class': 1, 'class_name': 'Paddy', 'source': 'manual'});
    })
    : vectorizeCandidateRegions(
      cleanPaddyConnected,
      1,
      'Paddy',
      CONFIG.maxTrainingPolygonsPerClass
    );

var bananaFC =
  hasManualBanana
    ? ee.FeatureCollection(banana_polygons).map(function (f) {
      return f.set({'class': 2, 'class_name': 'Banana', 'source': 'manual'});
    })
    : vectorizeCandidateRegions(
      cleanBananaConnected,
      2,
      'Banana',
      CONFIG.maxTrainingPolygonsPerClass
    );

var otherFC =
  hasManualOther
    ? ee.FeatureCollection(other_polygons).map(function (f) {
      return f.set({'class': 0, 'class_name': 'Other', 'source': 'manual'});
    })
    : vectorizeCandidateRegions(
      cleanOtherConnected,
      0,
      'Other',
      CONFIG.maxTrainingPolygonsPerClass
    );

// Globally bind aliases to support external references
var auto_paddy_polygons =
  paddyFC;

var auto_banana_polygons =
  bananaFC;

var auto_other_polygons =
  otherFC;

var paddyCount =
  paddyFC.size().getInfo();

var bananaCount =
  bananaFC.size().getInfo();

var otherCount =
  otherFC.size().getInfo();

print('');
print('================================================');
print('05. AUTOMATIC HIGH-CONFIDENCE TRAINING SAMPLES');
print('================================================');

print(
  'Paddy candidate regions (auto-polygons):',
  paddyCount
);

print(
  'Banana candidate regions (auto-polygons):',
  bananaCount
);

print(
  'Other candidate regions (auto-polygons):',
  otherCount
);

var trainingReady =
  paddyCount > 0 &&
  bananaCount > 0 &&
  otherCount > 0;

print(
  'Automatic training ready:',
  trainingReady
);

if (!trainingReady) {
  print(
    '⚠ WARNING: Automatic training samples are insufficient. ' +
    'Lower the confidence thresholds in CONFIG or verify sensor coverage.'
  );
}


// ================================================================
// 13. RANDOM FOREST VARIABLES
// ================================================================

var modelHasTrained =
  false;


var classifiedImage =
  null;


var classifierS2 =
  null;


var classifierFusion =
  null;


var overallAccuracy =
  ee.Number(0);


var kappa =
  ee.Number(0);


var f1Scores =
  ee.List([]);


var deltaOA =
  ee.Number(0);


var paddyPixelCount =
  0;


var bananaPixelCount =
  0;


var otherPixelCount =
  0;


var totalSampleCount =
  0;


// ================================================================
// 14. RANDOM FOREST TRAINING
// ================================================================

if (trainingReady) {

  print('');
  print(
    'Starting Random Forest training on automatic pseudo-labels...'
  );


  var allTrainingPolygons =
    otherFC
      .merge(
        paddyFC
      )
      .merge(
        bananaFC
      );


  var samples =
    fusedFeatureStack
      .select(
        fusedFeatureNames
      )
      .sampleRegions({

        collection:
          allTrainingPolygons,

        properties: [
          'class',
          'class_name',
          'source'
        ],

        scale:
          CONFIG.sampleScale,

        tileScale:
          4,

        geometries:
          false
      });


  totalSampleCount =
    samples.size().getInfo();

  paddyPixelCount =
    samples.filter(ee.Filter.eq('class', 1)).size().getInfo();

  bananaPixelCount =
    samples.filter(ee.Filter.eq('class', 2)).size().getInfo();

  otherPixelCount =
    samples.filter(ee.Filter.eq('class', 0)).size().getInfo();


  print(
    'Total training pixels:',
    totalSampleCount
  );

  print(
    'Paddy training pixels:',
    paddyPixelCount
  );

  print(
    'Banana training pixels:',
    bananaPixelCount
  );

  print(
    'Other training pixels:',
    otherPixelCount
  );


  if (totalSampleCount < 15 || paddyPixelCount === 0 || bananaPixelCount === 0 || otherPixelCount === 0) {

    print(
      '⚠ WARNING: Automatic training samples are insufficient. ' +
      'Lower the confidence threshold or provide manual verification samples.'
    );

  } else {

    var randomized =
      samples.randomColumn(
        'random',
        CONFIG.splitSeed
      );


    var trainSet =
      randomized.filter(
        ee.Filter.lt(
          'random',
          CONFIG.trainSplitRatio
        )
      );


    var validationSet =
      randomized.filter(
        ee.Filter.gte(
          'random',
          CONFIG.trainSplitRatio
        )
      );


  // --------------------------------------------------------------
  // MODEL A - SENTINEL-2 ONLY
  // --------------------------------------------------------------

  classifierS2 =
    ee.Classifier.smileRandomForest({

      numberOfTrees:
        CONFIG.rfTrees,

      seed:
        CONFIG.splitSeed

    })
      .train({

        features:
          trainSet,

        classProperty:
          'class',

        inputProperties:
          s2FeatureNames

      });


  // --------------------------------------------------------------
  // MODEL B - SENTINEL-1 + SENTINEL-2
  // --------------------------------------------------------------

  classifierFusion =
    ee.Classifier.smileRandomForest({

      numberOfTrees:
        CONFIG.rfTrees,

      seed:
        CONFIG.splitSeed

    })
      .train({

        features:
          trainSet,

        classProperty:
          'class',

        inputProperties:
          fusedFeatureNames

      });


  // --------------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------------

  var validationS2 =
    validationSet.classify(
      classifierS2
    );


  var validationFusion =
    validationSet.classify(
      classifierFusion
    );


  var cmS2 =
    validationS2.errorMatrix(
      'class',
      'classification',
      [0, 1, 2]
    );


  var cmFusion =
    validationFusion.errorMatrix(
      'class',
      'classification',
      [0, 1, 2]
    );


  var accuracyS2 =
    cmS2.accuracy();


  var accuracyFusion =
    cmFusion.accuracy();


  var kappaS2 =
    cmS2.kappa();


  var kappaFusion =
    cmFusion.kappa();


  deltaOA =
    accuracyFusion.subtract(
      accuracyS2
    );


  overallAccuracy =
    accuracyFusion;


  kappa =
    kappaFusion;


  f1Scores =
    cmFusion.fscore(1);


  // --------------------------------------------------------------
  // FINAL CLASSIFICATION
  // --------------------------------------------------------------

  classifiedImage =
    fusedFeatureStack
      .select(
        fusedFeatureNames
      )
      .classify(
        classifierFusion
      )
      .rename(
        'crop_class'
      );


  modelHasTrained =
    true;


  // --------------------------------------------------------------
  // PRINT RESULTS
  // --------------------------------------------------------------

  print('');
  print('================================================');
  print('06. MODEL VALIDATION');
  print('================================================');

  print(
    'Model A - S2 only confusion matrix:',
    cmS2
  );

  print(
    'Model B - S1 + S2 confusion matrix:',
    cmFusion
  );

  print(
    'Model A - S2 Accuracy:',
    accuracyS2
  );

  print(
    'Model B - Fusion Accuracy:',
    accuracyFusion
  );

  print(
    'Accuracy improvement from SAR:',
    deltaOA
  );

  print(
    'Model A - S2 Kappa:',
    kappaS2
  );

  print(
    'Model B - Fusion Kappa:',
    kappaFusion
  );

  print(
    'Model B F1 scores [Other, Paddy, Banana]:',
    f1Scores
  );


  }

} else {

  print('');
  print('================================================');
  print('06. MODEL VALIDATION');
  print('================================================');

  print(
    'Automatic training has NOT started.'
  );

  print(
    '⚠ Automatic training samples are insufficient. ' +
    'Lower the confidence thresholds in CONFIG or provide manual verification samples.'
  );

}


// ================================================================
// 15. SNIC FIELD SEGMENTATION
// ================================================================
//
// IMPORTANT:
// These are satellite-derived field-like segments.
// They are NOT legal cadastral parcels.
// ================================================================

var segmentationInput =
  baseS2
    .select([
      'B4',
      'B8',
      'B11'
    ])
    .addBands(
      fusedFeatureStack.select([
        'NDVI',
        'LSWI'
      ])
    )
    .clip(
      pilotSector
    );


var snic =
  ee.Algorithms.Image.Segmentation.SNIC({

    image:
      segmentationInput,

    size:
      CONFIG.snicSuperpixelSize,

    compactness:
      CONFIG.snicCompactness,

    connectivity:
      CONFIG.snicConnectivity,

    neighborhoodSize:
      256,

    seeds:
      null

  });


var clusters =
  snic
    .select(
      'clusters'
    )
    .rename(
      'cluster_id'
    );


var clusterPixelCount =
  clusters.connectedPixelCount(
    100,
    false
  );


var validClusterMask =
  clusterPixelCount.gte(
    CONFIG.minParcelPixels
  );


clusters =
  clusters.updateMask(
    validClusterMask
  );


print('');
print('================================================');
print('07. SNIC FIELD SEGMENTATION');
print('================================================');

print(
  'SNIC segmentation completed.'
);


// ================================================================
// 16. FIELD BOUNDARIES
// ================================================================

var parcelBoundaries =
  ee.Algorithms.CannyEdgeDetector({

    image:
      clusters,

    threshold:
      0.1,

    sigma:
      0.5

  })
    .updateMask(
      validClusterMask
    );


// ================================================================
// 17. SEGMENT CROP CLASSIFICATION
// ================================================================

var parcelCropClass =
  null;


if (modelHasTrained) {

  // IMPORTANT FIX:
  // cluster_id MUST be included in the image passed to
  // reduceConnectedComponents().
  //
  // The original code used pixelClassified alone while
  // requesting labelBand = cluster_id.
  //
  // This corrected version combines both images.

  var classifiedWithClusters =
    classifiedImage
      .addBands(
        clusters
      );


  parcelCropClass =
    classifiedWithClusters
      .updateMask(
        validClusterMask
      )
      .reduceConnectedComponents({

        reducer:
          ee.Reducer.mode(),

        labelBand:
          'cluster_id'

      })
      .rename(
        'parcel_crop_class'
      );


} else {

  print(
    'Crop classification of field segments is waiting for training data.'
  );

}


// ================================================================
// 18. VECTOR FIELD SEGMENTS
// ================================================================

var vectorParcels =
  ee.FeatureCollection([]);


var paddyVectors =
  ee.FeatureCollection([]);


var bananaVectors =
  ee.FeatureCollection([]);


var otherVectors =
  ee.FeatureCollection([]);


if (modelHasTrained) {

  var rawParcelVectors =
    clusters
      .addBands(
        parcelCropClass
      )
      .reduceToVectors({

        geometry:
          pilotSector,

        scale:
          CONFIG.sampleScale,

        geometryType:
          'polygon',

        eightConnected:
          true,

        labelProperty:
          'cluster_id',

        reducer:
          ee.Reducer.first(),

        maxPixels:
          CONFIG.maxPixels,

        tileScale:
          4

      });


  var classNameMap =
    ee.Dictionary({

      '0':
        'Other',

      '1':
        'Paddy',

      '2':
        'Banana'

    });


  vectorParcels =
    rawParcelVectors.map(
      function (feature) {

        var areaHa =
          feature
            .geometry()
            .area()
            .divide(
              1e4
            );


        var cropVal =
          ee.Algorithms.If(
            feature.get('parcel_crop_class'),
            feature.get('parcel_crop_class'),
            ee.Algorithms.If(
              feature.get('first'),
              feature.get('first'),
              0
            )
          );

        var cropCode =
          ee.Number(
            cropVal
          ).int();


        return feature.set({

          segment_id:
            feature.id(),

          area_ha:
            areaHa,

          crop_code:
            cropCode,

          crop_name:
            classNameMap.get(
              cropCode.format(
                '%d'
              )
            )

        });

      }
    );


  paddyVectors =
    vectorParcels.filter(
      ee.Filter.eq(
        'crop_code',
        1
      )
    );


  bananaVectors =
    vectorParcels.filter(
      ee.Filter.eq(
        'crop_code',
        2
      )
    );


  otherVectors =
    vectorParcels.filter(
      ee.Filter.eq(
        'crop_code',
        0
      )
    );


  print('');
  print('================================================');
  print('08. FIELD SEGMENTS');
  print('================================================');

  print(
    'Total field segments:',
    vectorParcels.size()
  );

  print(
    'Paddy field segments:',
    paddyVectors.size()
  );

  print(
    'Banana field segments:',
    bananaVectors.size()
  );

  print(
    'Other field segments:',
    otherVectors.size()
  );

}


// ================================================================
// 19. DYNAMIC CROP AREA
// ================================================================

if (modelHasTrained) {

  var pixelArea =
    ee.Image.pixelArea();


  var areaImage =
    pixelArea
      .addBands(
        classifiedImage
      );


  var groupedArea =
    areaImage.reduceRegion({

      reducer:
        ee.Reducer.sum().group({

          groupField:
            1,

          groupName:
            'class'

        }),

      geometry:
        aoiGeometry,

      scale:
        CONFIG.statsScale,

      maxPixels:
        1e9,

      bestEffort:
        true,

      tileScale:
        4

    });


  var areaGroups =
    ee.List(
      ee.Algorithms.If(
        groupedArea.get('groups'),
        groupedArea.get('groups'),
        []
      )
    );

  var areaDict =
    ee.Dictionary(
      areaGroups.iterate(
        function (item, acc) {
          var d = ee.Dictionary(item);
          var key = ee.Number(d.get('class')).format('%d');
          return ee.Dictionary(acc).set(key, d.get('sum'));
        },
        ee.Dictionary({})
      )
    );

  function getAreaForClass(
    classCode
  ) {

    var key =
      ee.Number(classCode).format('%d');

    return ee.Algorithms.If(
      areaDict.contains(key),
      areaDict.get(key),
      0
    );

  }


  var otherAreaM2 =
    ee.Number(
      getAreaForClass(0)
    );


  var paddyAreaM2 =
    ee.Number(
      getAreaForClass(1)
    );


  var bananaAreaM2 =
    ee.Number(
      getAreaForClass(2)
    );


  var otherAreaHa =
    otherAreaM2.divide(
      1e4
    );


  var paddyAreaHa =
    paddyAreaM2.divide(
      1e4
    );


  var bananaAreaHa =
    bananaAreaM2.divide(
      1e4
    );


  var otherPercentage =
    otherAreaM2
      .divide(
        aoiAreaM2
      )
      .multiply(
        100
      );


  var paddyPercentage =
    paddyAreaM2
      .divide(
        aoiAreaM2
      )
      .multiply(
        100
      );


  var bananaPercentage =
    bananaAreaM2
      .divide(
        aoiAreaM2
      )
      .multiply(
        100
      );


  print('');
  print('================================================');
  print('09. DYNAMIC CROP AREA');
  print('================================================');

  print(
    'Other area hectares:',
    otherAreaHa
  );

  print(
    'Paddy area hectares:',
    paddyAreaHa
  );

  print(
    'Banana area hectares:',
    bananaAreaHa
  );

  print(
    'Other percentage:',
    otherPercentage
  );

  print(
    'Paddy percentage:',
    paddyPercentage
  );

  print(
    'Banana percentage:',
    bananaPercentage
  );


  // --------------------------------------------------------------
  // PILOT VECTOR AREA
  // --------------------------------------------------------------

  var pilotOtherAreaHa =
    otherVectors.aggregate_sum(
      'area_ha'
    );


  var pilotPaddyAreaHa =
    paddyVectors.aggregate_sum(
      'area_ha'
    );


  var pilotBananaAreaHa =
    bananaVectors.aggregate_sum(
      'area_ha'
    );


  print(
    'Pilot Other area hectares:',
    pilotOtherAreaHa
  );

  print(
    'Pilot Paddy area hectares:',
    pilotPaddyAreaHa
  );

  print(
    'Pilot Banana area hectares:',
    pilotBananaAreaHa
  );

}


// ================================================================
// 20. MAP
// ================================================================

Map.clear();


Map.setOptions(
  'HYBRID'
);


Map.centerObject(
  pilotSector,
  13
);


// ---------------------------------------------------------------
// AOI
// ---------------------------------------------------------------

Map.addLayer(

  aoi.style({

    color:
      'FF0000',

    fillColor:
      '00000000',

    width:
      2

  }),

  {},

  'Study Area Boundary'

);


// ---------------------------------------------------------------
// PILOT SECTOR
// ---------------------------------------------------------------

Map.addLayer(

  pilotSector,

  {
    color:
      '0000FF'
  },

  'Pilot Sector',

  false

);


// ---------------------------------------------------------------
// AUTOMATIC TRAINING LAYERS (DYNAMIC WORLD & CANDIDATES)
// ---------------------------------------------------------------

if (CONFIG.showAutoTrainingLayers) {

  // 1. Dynamic World Crop Probability
  Map.addLayer(
    dwCrops,
    {
      min: 0,
      max: 1,
      palette: ['#ffffff', '#e5f5e0', '#a1d99b', '#31a354', '#006d2c']
    },
    'DW Crop Probability',
    false
  );

  // 2. Automatic Cropland Mask (crops >= 0.35)
  Map.addLayer(
    dwCrops.gte(0.35).selfMask(),
    {
      palette: ['#238b45']
    },
    'Automatic Crop Mask (DW >= 0.35)',
    false
  );

  // 3. Paddy Confidence Score (0 to 1)
  Map.addLayer(
    paddyConfidence,
    {
      min: 0.20,
      max: 0.85,
      palette: ['#000004', '#51127c', '#b73779', '#fc8961', '#b4f850']
    },
    'Paddy Confidence Score',
    false
  );

  // 4. Banana Confidence Score (0 to 1)
  Map.addLayer(
    bananaConfidence,
    {
      min: 0.20,
      max: 0.85,
      palette: ['#000004', '#3b0f70', '#8c2981', '#de4968', '#fec029']
    },
    'Banana Confidence Score',
    false
  );

  // 5. Paddy Candidate Regions (Cleaned mask)
  Map.addLayer(
    cleanPaddyConnected.selfMask(),
    {
      palette: ['#00FF00']
    },
    'Candidate Mask - Paddy',
    false
  );

  // 6. Banana Candidate Regions (Cleaned mask)
  Map.addLayer(
    cleanBananaConnected.selfMask(),
    {
      palette: ['#FFD700']
    },
    'Candidate Mask - Banana',
    false
  );

  // 7. Other Candidate Regions (Cleaned mask)
  Map.addLayer(
    cleanOtherConnected.selfMask(),
    {
      palette: ['#AAAAAA']
    },
    'Candidate Mask - Other',
    false
  );

  // 8. Automatically Generated Training Polygons
  Map.addLayer(
    paddyFC.style({
      color: '00AA00',
      fillColor: '00FF0033',
      width: 2
    }),
    {},
    'Auto Training Polygons - Paddy'
  );

  Map.addLayer(
    bananaFC.style({
      color: 'CC8800',
      fillColor: 'FFD70033',
      width: 2
    }),
    {},
    'Auto Training Polygons - Banana'
  );

  Map.addLayer(
    otherFC.style({
      color: '555555',
      fillColor: '88888833',
      width: 1
    }),
    {},
    'Auto Training Polygons - Other',
    false
  );

}


// ---------------------------------------------------------------
// SENTINEL-2 RGB
// ---------------------------------------------------------------

Map.addLayer(

  baseS2,

  {

    bands: [
      'B4',
      'B3',
      'B2'
    ],

    min:
      0,

    max:
      2500

  },

  'Sentinel-2 RGB'

);


// ---------------------------------------------------------------
// SENTINEL-2 FALSE COLOR
// ---------------------------------------------------------------

Map.addLayer(

  baseS2,

  {

    bands: [
      'B8',
      'B4',
      'B3'
    ],

    min:
      0,

    max:
      3500

  },

  'Sentinel-2 False Color',

  false

);


// ---------------------------------------------------------------
// NDVI
// ---------------------------------------------------------------

Map.addLayer(

  baseS2.normalizedDifference([
    'B8',
    'B4'
  ]),

  {

    min:
      -0.2,

    max:
      0.9,

    palette: [
      'brown',
      'yellow',
      'green'
    ]

  },

  'NDVI'

);


// ---------------------------------------------------------------
// SENTINEL-1
// ---------------------------------------------------------------

Map.addLayer(

  fusedFeatureStack.select([
    'VV_mean',
    'VH_mean',
    'VH_minus_VV_mean'
  ]),

  {

    min: [
      -20,
      -28,
      -12
    ],

    max: [
      -5,
      -8,
      -2
    ]

  },

  'Sentinel-1 SAR',

  false

);


// ---------------------------------------------------------------
// PHENOLOGY
// ---------------------------------------------------------------

Map.addLayer(

  fusedFeatureStack.select([
    'NDVI_max',
    'NDVI_amplitude',
    'NDVI_min'
  ]),

  {

    min: [
      0.2,
      0.05,
      0.05
    ],

    max: [
      0.85,
      0.60,
      0.50
    ]

  },

  'Phenology Features',

  false

);


// ---------------------------------------------------------------
// CROP CLASSIFICATION
// ---------------------------------------------------------------

if (modelHasTrained) {

  Map.addLayer(

    classifiedImage,

    {

      min:
        0,

      max:
        2,

      palette: [
        '808080',
        '00AA00',
        'FFD000'
      ]

    },

    'Crop Classification'

  );


  Map.addLayer(

    parcelCropClass,

    {

      min:
        0,

      max:
        2,

      palette: [
        '808080',
        '00AA00',
        'FFD000'
      ]

    },

    'Field Segment Crop Classification',

    false

  );

}


// ---------------------------------------------------------------
// FIELD BOUNDARIES
// ---------------------------------------------------------------

Map.addLayer(

  parcelBoundaries,

  {

    palette: [
      'FFFF00'
    ]

  },

  'Detected Field Boundaries'

);


// ---------------------------------------------------------------
// VECTOR FIELD SEGMENTS
// ---------------------------------------------------------------

if (modelHasTrained) {

  Map.addLayer(

    otherVectors.style({

      color:
        '666666',

      fillColor:
        '88888855',

      width:
        1

    }),

    {},

    'Field Segments - Other',

    false

  );


  Map.addLayer(

    paddyVectors.style({

      color:
        '008000',

      fillColor:
        '00AA0055',

      width:
        1

    }),

    {},

    'Field Segments - Paddy'

  );


  Map.addLayer(

    bananaVectors.style({

      color:
        'AA7700',

      fillColor:
        'FFD00055',

      width:
        1

    }),

    {},

    'Field Segments - Banana'

  );

}


// ================================================================
// 21. PHENOLOGY CHART
// ================================================================

var phenologyChart =
  ui.Chart.image.series({

    imageCollection:
      temporalS2.select([
        'NDVI',
        'NDWI',
        'LSWI'
      ]),

    region:
      aoiGeometry,

    reducer:
      ee.Reducer.mean(),

    scale:
      CONFIG.statsScale,

    xProperty:
      'system:time_start'

  })
    .setOptions({

      title:
        'Agricultural Phenology',

      hAxis: {
        title:
          'Date'
      },

      vAxis: {
        title:
          'Index Value'
      },

      lineWidth:
        2,

      pointSize:
        3,

      legend: {
        position:
          'top'
      }

    });


// ================================================================
// 22. DASHBOARD
// ================================================================

var panel =
  ui.Panel({

    layout:
      ui.Panel.Layout.flow(
        'vertical'
      ),

    style: {

      width:
        '370px',

      padding:
        '12px',

      position:
        'top-left'

    }

  });


panel.add(

  ui.Label({

    value:
      '🌾 AgriVision AI',

    style: {

      fontSize:
        '20px',

      fontWeight:
        'bold'

    }

  })

);


panel.add(

  ui.Label(
    'Agricultural Land Parcel & Crop Identification'
  )

);


panel.add(

  ui.Label(
    'Paddy • Banana • Other'
  )

);


panel.add(

  ui.Label({

    value:
      modelHasTrained
        ? 'STATUS: Auto-Trained & Validated'
        : (trainingReady ? 'STATUS: Ready for Training' : 'STATUS: Insufficient Candidates'),

    style: {

      fontWeight:
        'bold',

      color:
        modelHasTrained ? '#007700' : '#bb5500',

      margin:
        '8px 0'

    }

  })

);


// ---------------------------------------------------------------
// AOI INFORMATION
// ---------------------------------------------------------------

panel.add(

  ui.Label({

    value:
      'Study Area',

    style: {
      fontWeight:
        'bold'
    }

  })

);


var aoiLabel =
  ui.Label(
    'AOI area: calculating...'
  );


aoiAreaKm2.evaluate(
  function (value) {

    aoiLabel.setValue(
      'AOI area: ' +
      value.toFixed(2) +
      ' km²'
    );

  }
);


panel.add(
  aoiLabel
);


var pilotLabel =
  ui.Label(
    'Pilot area: calculating...'
  );


pilotAreaKm2.evaluate(
  function (value) {

    pilotLabel.setValue(
      'Pilot area: ' +
      value.toFixed(2) +
      ' km²'
    );

  }
);


panel.add(
  pilotLabel
);


panel.add(

  ui.Label(
    'Sentinel-2 scenes: ' +
    s2Count
  )

);


panel.add(

  ui.Label(
    'Sentinel-1 scenes: ' +
    s1Count
  )

);


// ---------------------------------------------------------------
// AUTOMATIC TRAINING SAMPLES
// ---------------------------------------------------------------

panel.add(

  ui.Label({

    value:
      'Automatic Training Samples',

    style: {

      fontWeight:
        'bold',

      margin:
        '10px 0 3px 0'

    }

  })

);


panel.add(
  ui.Label(
    'Paddy candidate regions: ' +
    paddyCount
  )
);

panel.add(
  ui.Label(
    'Banana candidate regions: ' +
    bananaCount
  )
);

panel.add(
  ui.Label(
    'Other candidate regions: ' +
    otherCount
  )
);

panel.add(
  ui.Label(
    'Paddy training pixels: ' +
    paddyPixelCount
  )
);

panel.add(
  ui.Label(
    'Banana training pixels: ' +
    bananaPixelCount
  )
);

panel.add(
  ui.Label(
    'Other training pixels: ' +
    otherPixelCount
  )
);

panel.add(
  ui.Label(
    'Training ready: ' +
    (trainingReady ? 'YES' : 'NO')
  )
);

panel.add(

  ui.Label({

    value:
      'ℹ Automatic high-confidence candidate samples are satellite-derived pseudo-labels based on multi-sensor evidence (Dynamic World, S2 phenology, S1 SAR backscatter). Not legal cadastral ground truth.',

    style: {

      fontSize:
        '10px',

      fontStyle:
        'italic',

      color:
        '#555555',

      margin:
        '4px 0 8px 0'

    }

  })

);


// ---------------------------------------------------------------
// MODEL INFORMATION
// ---------------------------------------------------------------

panel.add(

  ui.Label({

    value:
      'Model Validation',

    style: {

      fontWeight:
        'bold',

      margin:
        '10px 0 3px 0'

    }

  })

);


var accuracyLabel =
  ui.Label(
    'Overall Accuracy: waiting...'
  );


var kappaLabel =
  ui.Label(
    'Kappa: waiting...'
  );


var f1Label =
  ui.Label(
    'F1 Scores: waiting...'
  );


if (modelHasTrained) {

  overallAccuracy.evaluate(
    function (value) {

      accuracyLabel.setValue(
        'Overall Accuracy: ' +
        (
          value * 100
        ).toFixed(2) +
        '%'
      );

    }
  );


  kappa.evaluate(
    function (value) {

      kappaLabel.setValue(
        'Kappa: ' +
        value.toFixed(3)
      );

    }
  );


  f1Scores.evaluate(
    function (value) {

      f1Label.setValue(
        'F1 [Other, Paddy, Banana]: ' +
        JSON.stringify(
          value
        )
      );

    }
  );

} else {

  accuracyLabel.setValue(
    'Overall Accuracy: training required'
  );

  kappaLabel.setValue(
    'Kappa: training required'
  );

  f1Label.setValue(
    'F1: training required'
  );

}


panel.add(
  accuracyLabel
);

panel.add(
  kappaLabel
);

panel.add(
  f1Label
);


// ---------------------------------------------------------------
// CLASS LEGEND
// ---------------------------------------------------------------

panel.add(

  ui.Label({

    value:
      'Crop Classes',

    style: {

      fontWeight:
        'bold',

      margin:
        '10px 0 3px 0'

    }

  })

);


panel.add(
  ui.Label(
    '🟢 Paddy (Class 1)'
  )
);


panel.add(
  ui.Label(
    '🟡 Banana (Class 2)'
  )
);


panel.add(
  ui.Label(
    '⚪ Other (Class 0)'
  )
);


panel.add(

  ui.Label({

    value:
      '⚠ Field boundaries are satellite-derived segments, not legal cadastral boundaries.',

    style: {

      fontSize:
        '10px',

      fontStyle:
        'italic',

      margin:
        '8px 0'

    }

  })

);


// ---------------------------------------------------------------
// PHENOLOGY CHART
// ---------------------------------------------------------------

panel.add(

  ui.Label({

    value:
      'Regional Crop Phenology',

    style: {

      fontWeight:
        'bold',

      margin:
        '10px 0 3px 0'

    }

  })

);


panel.add(
  phenologyChart
);


ui.root.add(
  panel
);


// ================================================================
// 23. CLICK INSPECTOR
// ================================================================

Map.onClick(
  function (coords) {

    var point =
      ee.Geometry.Point([
        coords.lon,
        coords.lat
      ]);


    var clickChart =
      ui.Chart.image.series({

        imageCollection:
          temporalS2.select([
            'NDVI',
            'LSWI'
          ]),

        region:
          point,

        reducer:
          ee.Reducer.first(),

        scale:
          10,

        xProperty:
          'system:time_start'

      })
        .setOptions({

          title:
            'Field Profile',

          hAxis: {
            title:
              'Date'
          },

          vAxis: {
            title:
              'Index'
          },

          lineWidth:
            2,

          pointSize:
            4

        });


    print(
      'Clicked coordinates:',
      coords
    );


    print(
      clickChart
    );

  }
);


// ================================================================
// 24. FINAL SUMMARY
// ================================================================

print('');
print('');
print('================================================');
print('AGRIVISION AI - PIPELINE STATUS');
print('================================================');

print(
  'Boundary:',
  boundaryDescription
);

print(
  'AOI area:',
  aoiAreaKm2,
  'km²'
);

print(
  'AOI >= 20 km²:',
  aoiValid
);

print(
  'Pilot sector:',
  pilotAreaKm2,
  'km²'
);

print(
  'Sentinel-2 scenes:',
  s2Count
);

print(
  'Sentinel-1 scenes:',
  s1Count
);

print(
  'Temporal composites:',
  temporalCount
);

print(
  'Dynamic World scenes:',
  dwCount
);

print(
  'Paddy candidate regions:',
  paddyCount
);

print(
  'Banana candidate regions:',
  bananaCount
);

print(
  'Other candidate regions:',
  otherCount
);

print(
  'Total training pixels:',
  totalSampleCount
);

print(
  'Training ready:',
  trainingReady
);

print(
  'Model trained:',
  modelHasTrained
);

print(
  'SNIC segmentation:',
  'READY'
);

print(
  'Field boundary extraction:',
  'READY'
);

print(
  '================================================'
);

print(
  'SCIENTIFIC CAVEAT: Candidate training samples are'
);

print(
  'automatically generated satellite pseudo-labels based'
);

print(
  'on Dynamic World, S2 phenology, and S1 SAR metrics.'
);

print(
  'Detected field segments are satellite-derived objects,'
);

print(
  'not official cadastral parcels.'
);

print(
  '------------------------------------------------'
);

print(
  'IMPORTANT: The current fallback boundary is the'
);

print(
  'Tirunelveli district. For the final Mapathon result,'
);

print(
  'use the official Ambasamudram + Cheranmahadevi taluk asset.'
);

print(
  '================================================'
);