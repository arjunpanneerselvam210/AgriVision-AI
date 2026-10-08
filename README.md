# Mapathon Problem Statement 1: Agricultural Land Parcel & Crop Identification
**Study Region:** Tirunelveli District, Tamil Nadu, India (Focus: Ambasamudram & Cheranmahadevi Taluks)  
**Platform:** Google Earth Engine (GEE JavaScript API)  
**Status:** Phase 10 Verified & Hardened  
**Date:** October 8–9, 2026  

---

## 1. Project Overview & Objectives
This project provides an automated, scientifically defensible satellite remote sensing pipeline for:
1. **Differentiating agricultural land parcels** from multi-temporal satellite imagery.
2. **Classifying and distinguishing Paddy (rice) and Banana plantations** against non-target land covers (Other).
3. **Evaluating a study region exceeding the required $20\text{ km}^2$ threshold**.
4. **Fusing optical Sentinel-2 MSI with radar Sentinel-1 C-Band SAR** data with a controlled ablation experiment (Model A vs. Model B).
5. **Operating under a Strict No-Hardcoding Rule**: every boundary, scene count, spectral index, confusion matrix, accuracy score, parcel geometry, and crop acreage is computed dynamically at runtime from Earth Engine data.

---

## 2. Codebase Architecture

```text
d:/Mapathon/Project/
├── main.js                  # Master self-contained production script for GEE Code Editor (Hardened)
├── 01_config.js             # Centralized configuration parameters (operational constants)
├── 02_aoi.js                # Dynamic administrative boundary discovery & area accounting
├── 03_sentinel2_features.js # Dual-masking (SCL+QA60), 30-day compositing, 14-band feature stack
├── 04_training_workflow.js  # Crash-proof ground-truth ingestion & 70/30 train/test split
├── 05_random_forest.js      # Random Forest classifier, hold-out validation & grouped acreage
├── 06_obia_parcels.js       # SNIC superpixel clustering, majority-vote raster OBIA & vector cadastre
├── 07_sentinel1_fusion.js   # Sentinel-1 SAR temporal extraction & ablation experiment
└── README.md                # Comprehensive documentation, testing guide, and judging intelligence
```

---

## 3. How to Run in Google Earth Engine Code Editor

1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Copy the entire contents of [`main.js`](file:///d:/Mapathon/Project/main.js) and paste into the Code Editor editor panel.
3. Click **Run**.
4. **Before Training Polygons are Drawn:**
   - The script runs **safely without crashing**.
   - It computes the exact AOI area, loads cloud-free Sentinel-2 and Sentinel-1 imagery, performs SNIC segmentation to delineate parcel boundaries, displays the regional phenology trajectory chart, and opens the UI sidebar panel indicating `Status: ⚠️ Please draw training polygons in editor`.
5. **Digitizing Training Samples (Geometry Tools):**
   - Click **`+ new layer`** in the map geometry toolbar (top-left).
   - Gear icon ⚙️ $\rightarrow$ Name: `paddy_polygons` | Import as: `FeatureCollection` | Add property `class = 1` | Color: **Green** (`#2ca02c`).
   - Repeat for Banana: Name: `banana_polygons` | Import as: `FeatureCollection` | Add property `class = 2` | Color: **Orange** (`#ffbb00`).
   - Repeat for Other: Name: `other_polygons` | Import as: `FeatureCollection` | Add property `class = 0` | Color: **Red** (`#e41a1c`).
   - Draw 5–10 small polygons inside homogeneous field interiors using Layer `3. Phenological False Color` as a visual guide:
     - **Paddy:** Bright yellow/green (high amplitude, early inundation dip).
     - **Banana:** Creamy peach/white/cyan (stable high canopy, year-round elevated LSWI).
     - **Other:** Towns, Thamirabarani river, barren hills, dry scrub.
6. Click **Run** again:
   - Both Model A (S2 only) and Model B (S1 + S2 fused) automatically train on identical 70% partitions.
   - The independent $30\%$ validation scorecard (Overall Accuracy, Kappa, F1-scores, and SAR $\Delta \text{OA}$) populates live.
   - The crop classification map and parcel vector cadastre render with exact hectare acreage.

---

## 4. Scientific Foundations & Rationale

### Why Single-Date NDVI Cannot Separate Paddy and Banana
At peak vegetative growth (heading/tillering for rice, mature canopy for banana), both crops exhibit dense green foliage with overlapping NDVI values ($0.75 - 0.85$). A single static threshold creates severe mutual misclassification.

**The Solution — Multi-Temporal Phenology & Moisture Coupling:**
- **Paddy (Seasonal Graminoid):** Exhibits high seasonal amplitude ($\text{NDVI}_{\text{amplitude}} > 0.45$). During land preparation and transplanting (October–November), field flooding causes $\text{LSWI} > \text{NDVI}$ and high NDWI, followed by a rapid NDVI surge and post-harvest crash.
- **Banana (Perennial Broadleaf):** Maintains a dense year-round canopy with low seasonal amplitude ($\text{NDVI}_{\text{amplitude}} < 0.25$), sustained high canopy water content ($\text{LSWI} > 0.30$), and persistent high minimum NDVI ($\text{NDVI}_{\text{min}} > 0.50$).

### Why Object-Based Image Analysis (OBIA) is Required
Pixel-level classifiers suffer from "salt-and-pepper" noise where individual pixels disagree with the surrounding field. Farming practices operate at the **parcel unit**. By running **Simple Non-Iterative Clustering (SNIC)** and mode-vote filtering (`reduceConnectedComponents`), each satellite-derived agricultural field segment is assigned a single homogeneous crop identity while aligning strictly with real bund boundaries.

### The Role of Sentinel-1 C-Band SAR
Sentinel-1 penetrates persistent monsoon clouds and provides structural volume scattering ($\text{VH}$) and surface roughness dynamics ($\text{VV}_{\text{stdDev}}$). Banana produces high cross-polarization ($\text{VH} \approx -12\text{ dB}$) from its multi-layered broadleaf canopy, while flooded paddy exhibits specular reflection ($\text{VV} < -18\text{ dB}$) during transplanting. The cross-polarization difference in dB ($\text{VH} - \text{VV}$) captures volumetric complexity.

---

## 5. Answers to the 6 Core Mapathon Questions

| Question | Data-Driven Answer & Visual Evidence |
| :--- | :--- |
| **1. WHERE are the agricultural parcels?** | Concentrated along the **Thamirabarani River canal commands** (Ambasamudram, Cheranmahadevi, Kallidaikurichi, Veeravanallur). Delineated by SNIC superpixels ($160\text{m}$ seed spacing) and Canny edge outlines (Layer 6). |
| **2. WHICH parcels are Paddy?** | Displayed in **Vibrant Green (`#2ca02c`)** across the alluvial flatlands. Driven by high $\text{NDVI}_{\text{amplitude}}$ and transplanting inundation cycles. |
| **3. WHICH parcels are Banana?** | Displayed in **Gold/Amber (`#ffbb00`)** in contiguous blocks along perennial canal banks. Driven by year-round high canopy floor ($\text{NDVI}_{\text{min}} > 0.50$), low amplitude, and high LSWI. |
| **4. HOW MUCH area is Paddy?** | Computed live via grouped pixel-area reduction (`ee.Image.pixelArea()`) and displayed in the UI Sidebar for both **District AOI** and **Pilot Sector field segments**. |
| **5. HOW MUCH area is Banana?** | Computed live via grouped pixel-area reduction and displayed in the UI Sidebar for both **District AOI** and **Pilot Sector field segments**. |
| **6. HOW ACCURATE is the model?** | Validated on a strict $30\%$ hold-out test set, displaying dynamic Overall Accuracy, Cohen's Kappa, and per-class F1-scores live on the dashboard scorecard, alongside SAR $\Delta \text{OA}$ contribution. |

---

## 6. Strict No-Hardcoding Compliance Verification

- [x] **Study Region Area:** Calculated via `aoiGeometry.area()` ($\gg 20\text{ km}^2$).
- [x] **Satellite Counts:** Derived via `.size()` on filtered ImageCollections.
- [x] **Spectral & Temporal Indices:** Derived via `.normalizedDifference()` and periodic collection reducers.
- [x] **Confusion Matrix & Accuracy:** Derived via `valSet.classify().errorMatrix()`.
- [x] **Crop Acreage:** Derived via `ee.Image.pixelArea().reduceRegion()`.
- [x] **Field Segment Geometries & IDs:** Derived dynamically via `SNIC` and `reduceToVectors()`.
- [x] **No hardcoded results in code or UI:** $100\%$ verified across all files.
