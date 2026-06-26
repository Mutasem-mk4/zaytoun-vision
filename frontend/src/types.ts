// Shared types for the Zaytoun Vision app v2

export interface FraudDetection {
  passed: boolean;
  verdict: 'authentic_evoo' | 'industrial_seed_oil' | 'adulterated_blend' | 'inconclusive';
  label: string;
  message: string;
  confidence: number;
}

export interface QualityGrading {
  purity_index: number;
  aging_step: number;
  grade: string;
  description: string;
  color: 'green' | 'yellow' | 'red';
  green_phenols: number;
  oxidation_marker: number;
}

export interface PredictionResult {
  valid: boolean;
  error?: string;
  raw?: {
    R: number;
    G: number;
    B: number;
  };
  normalized_counts?: {
    red_670nm: number;
    green_530nm: number;
    blue_440nm: number;
  };
  fraud_detection?: FraudDetection;
  quality_grading?: QualityGrading | null;
  nonzero_pixels?: number;
  timestamp: string;
}

export interface HistoryRecord {
  id: number;
  filename: string;
  verdict: string;
  label: string;
  confidence: number;
  purity_index: number | null;
  aging_step: number | null;
  grade: string | null;
  red_670nm: number;
  green_530nm: number;
  blue_440nm: number;
  nonzero_pixels: number;
  timestamp: string;
}

export interface EemFeatureRecord {
  eem_mean: number;
  eem_max: number;
  eem_std: number;
  chlorophyll_mean: number;
  chlorophyll_max: number;
  chlorophyll_ratio: number;
  aging_step: number;
  filename: string;
}
