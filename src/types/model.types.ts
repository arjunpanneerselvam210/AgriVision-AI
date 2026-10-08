export interface ConfusionMatrixCell {
  actualClass: string;
  predictedClass: string;
  count: number;
}

export interface ClassPerformanceMetrics {
  className: 'Other' | 'Paddy' | 'Banana';
  classCode: number;
  producersAccuracy: number; // Recall
  consumersAccuracy: number; // Precision
  f1Score: number;
  sampleCount: number;
}

export interface ModelAblationMetrics {
  modelName: string;
  featuresUsed: string[];
  featureCount: number;
  overallAccuracy: number;
  kappa: number;
  paddyF1: number;
  bananaF1: number;
  otherF1: number;
}

export interface FeatureImportanceItem {
  featureName: string;
  importanceScore: number;
  category: 'Optical' | 'Index' | 'Temporal' | 'SAR';
  description: string;
}

export interface ModelEvaluationReport {
  modelId: string;
  algorithm: string;
  treeCount: number;
  trainingSamplesCount: number;
  validationSamplesCount: number;
  overallAccuracy: number;
  kappa: number;
  confusionMatrix: number[][]; // 3x3 array [ [M00, M01, M02], ... ]
  classMetrics: ClassPerformanceMetrics[];
  ablation: {
    modelA_OpticalOnly: ModelAblationMetrics;
    modelB_FusedS1S2: ModelAblationMetrics;
    deltaOverallAccuracy: number;
    deltaKappa: number;
    sarVerdict: string;
  };
  featureImportance: FeatureImportanceItem[];
  evaluatedAt: string;
}
