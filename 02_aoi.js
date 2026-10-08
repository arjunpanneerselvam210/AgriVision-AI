// =============================================================================
// MAPATHON PROBLEM STATEMENT 1: AGRICULTURAL LAND PARCEL & CROP IDENTIFICATION
// Study Region: Tirunelveli District (Ambasamudram & Cheranmahadevi Taluks)
// MODULE 02: ADMINISTRATIVE BOUNDARY & STUDY REGION DEFINITION
// =============================================================================
// STRICT NO-HARDCODING RULE:
// AOI geometry, areas in km²/ha, and validation status are calculated dynamically.
// =============================================================================

/**
 * Resolves the study area boundary using authoritative GEE datasets
 * or user-provided official shapefile assets.
 * 
 * @param {Object} config The system configuration object.
 * @return {Object} Dictionary containing the resolved AOI feature collection,
 *                  geometry, area calculations, and metadata.
 */
function resolveAOI(config) {
  var aoiFC;
  var boundaryType;
  var boundarySource;
  var regionNames;

  // 1. Resolve Boundary Source
  if (config.ADMIN.useCustomTalukAsset) {
    // Option A: Official user-uploaded Taluk Asset (Survey of India / Tamil Nadu Revenue)
    aoiFC = ee.FeatureCollection(config.ADMIN.customTalukAssetId)
      .filter(ee.Filter.inList(config.ADMIN.talukField, config.ADMIN.targetTaluks));
    boundaryType = 'Taluk (Admin Level 3)';
    boundarySource = config.ADMIN.customTalukAssetId;
    regionNames = config.ADMIN.targetTaluks;
  } else {
    // Option B: Public GEE Catalog Fallback (FAO GAUL Level 2 District)
    // Encompasses Ambasamudram & Cheranmahadevi taluks natively
    aoiFC = ee.FeatureCollection(config.ADMIN.dataset)
      .filter(ee.Filter.and(
        ee.Filter.eq('ADM0_NAME', config.ADMIN.country),
        ee.Filter.eq('ADM1_NAME', config.ADMIN.state),
        ee.Filter.eq('ADM2_NAME', config.ADMIN.district)
      ));
    boundaryType = 'District (Admin Level 2 - Encompassing Target Taluks)';
    boundarySource = config.ADMIN.dataset;
    regionNames = [config.ADMIN.district + ' (Ambasamudram & Cheranmahadevi Taluks)'];
  }

  // 2. Extract Geometric Boundary
  var aoiGeometry = aoiFC.geometry();

  // 3. Dynamic Area Accounting (Zero Hardcoded Values)
  var areaM2 = aoiGeometry.area();
  var areaHa = areaM2.divide(1e4);
  var areaKm2 = areaM2.divide(1e6);

  // 4. Verification Check: AOI must be >= 20 sq km
  var isValidSize = areaKm2.gte(config.STUDY_AREA.minRequiredAreaKm2);

  // 5. Construct Focused Pilot Agricultural Sector (>= 20 km²)
  // Inside the Ambasamudram-Cheranmahadevi alluvial plain for memory-safe parcel vectorization
  var aoiCentroid = aoiGeometry.centroid();
  var pilotSectorGeom = aoiCentroid.buffer(config.STUDY_AREA.pilotBufferKm * 1000).intersection(aoiGeometry);
  var pilotAreaM2 = pilotSectorGeom.area();
  var pilotAreaKm2 = pilotAreaM2.divide(1e6);
  var isPilotValid = pilotAreaKm2.gte(config.STUDY_AREA.minRequiredAreaKm2);

  return {
    fc: aoiFC,
    geometry: aoiGeometry,
    areaM2: areaM2,
    areaHa: areaHa,
    areaKm2: areaKm2,
    isValidSize: isValidSize,
    metadata: {
      type: boundaryType,
      source: boundarySource,
      regions: regionNames
    },
    // High-resolution pilot extraction sector (>= 20 km²)
    pilotSector: {
      geometry: pilotSectorGeom,
      areaKm2: pilotAreaKm2,
      isValid: isPilotValid
    }
  };
}

// Export module if used in modular environment
if (typeof exports !== 'undefined') {
  exports.resolveAOI = resolveAOI;
}
