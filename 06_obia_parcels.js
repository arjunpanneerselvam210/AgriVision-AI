// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 06: OBJECT-BASED IMAGE ANALYSIS (SNIC) & FIELD SEGMENT CADASTRE
// =============================================================================
// STRICT NO-HARDCODING RULE:
// Field segment geometries, boundaries, IDs, and crop attributions are dynamically extracted.
// =============================================================================

/**
 * Executes SNIC superpixel segmentation, mode-vote parcel classification,
 * boundary delineation, and vector field segment extraction within the pilot sector.
 * 
 * @param {ee.Image} baseComposite Median optical surface reflectance composite.
 * @param {ee.Image} featureStack Multi-band feature stack with NDVI and LSWI.
 * @param {ee.Image} pixelClassified Initial pixel-level classification map.
 * @param {ee.Geometry} aoiGeometry Full study area geometry.
 * @param {ee.Geometry} pilotGeometry High-resolution pilot sector geometry (>= 20 km²).
 * @param {Object} config The system configuration object.
 * @return {Object} OBIA raster, edge boundaries, vector field segments, and counts.
 */
function runObiaParcelPipeline(baseComposite, featureStack, pixelClassified, aoiGeometry, pilotGeometry, config) {
  // 1. Prepare Segmentation Input Image (spectral edge bands)
  var segInput = baseComposite.select(['B4', 'B8', 'B11'])
    .addBands(featureStack.select(['NDVI', 'LSWI']))
    .clip(aoiGeometry);

  // 2. Execute Simple Non-Iterative Clustering (SNIC)
  var snic = ee.Algorithms.Image.Segmentation.SNIC({
    image: segInput,
    size: config.SEGMENTATION.superpixelSize,
    compactness: config.SEGMENTATION.compactness,
    connectivity: config.SEGMENTATION.connectivity,
    neighborhoodSize: config.SEGMENTATION.neighborhoodSize,
    seeds: null
  });

  var clusters = snic.select('clusters').rename('cluster_id');

  // 3. Prune Micro-Segments & Slivers
  var clusterPixelCount = clusters.connectedPixelCount(100, false);
  var validClusterMask = clusterPixelCount.gte(config.SEGMENTATION.minParcelPixels);
  clusters = clusters.updateMask(validClusterMask);

  // 4. Object-Level Mode Classification (Majority Vote per Field Segment)
  var parcelCropClass = pixelClassified.updateMask(validClusterMask).reduceConnectedComponents({
    reducer: ee.Reducer.mode(),
    labelBand: 'cluster_id'
  }).rename('parcel_crop_class');

  // 5. High-Contrast Edge Boundary Detection
  var parcelBoundaries = ee.Algorithms.CannyEdge({
    image: clusters,
    threshold: 0.1,
    sigma: 0.5
  }).updateMask(validClusterMask);

  // 6. Memory-Safe Vector Field Segment Extraction in Pilot Sector (>= 20 km²)
  var rawParcelVectors = ee.Image.cat([clusters, parcelCropClass]).reduceToVectors({
    geometry: pilotGeometry,
    scale: config.SCALES.nativeS2,
    geometryType: 'polygon',
    eightConnected: true,
    labelProperty: 'cluster_id',
    maxPixels: 1e8,
    tileScale: 4
  });

  var classNameLookup = ee.Dictionary({'0': 'Other', '1': 'Paddy', '2': 'Banana'});

  // Enrich each satellite-derived field segment with dynamic attributes
  var enrichedParcels = rawParcelVectors.map(function(parcel) {
    var geom = parcel.geometry();
    var code = ee.Number(parcel.get('parcel_crop_class'));
    var areaHa = geom.area().divide(1e4);
    return parcel.set({
      'segment_id': parcel.id(),
      'area_ha': areaHa,
      'crop_code': code,
      'crop_name': classNameLookup.get(code.format('%d'))
    });
  });

  // Filter into discrete crop field segment collections
  var paddyParcels  = enrichedParcels.filter(ee.Filter.eq('crop_code', 1));
  var bananaParcels = enrichedParcels.filter(ee.Filter.eq('crop_code', 2));
  var otherParcels  = enrichedParcels.filter(ee.Filter.eq('crop_code', 0));

  return {
    clusters: clusters,
    parcelCropClass: parcelCropClass,
    parcelBoundaries: parcelBoundaries,
    parcels: {
      all: enrichedParcels,
      paddy: paddyParcels,
      banana: bananaParcels,
      other: otherParcels
    },
    counts: {
      total: enrichedParcels.size(),
      paddy: paddyParcels.size(),
      banana: bananaParcels.size(),
      other: otherParcels.size()
    }
  };
}

// Export module if used in modular environment
if (typeof exports !== 'undefined') {
  exports.runObiaParcelPipeline = runObiaParcelPipeline;
}
