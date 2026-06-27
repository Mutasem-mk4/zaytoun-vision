// ============================================================
// Zaytoun Vision — Shared TypeScript Types
// ============================================================
// These types define the contract between frontend and Azure
// Functions backend. They are the single source of truth.
// ============================================================

/** Analysis status based on purity thresholds */
export type AnalysisStatus = 'pure' | 'warning' | 'adulterated';

export type AnalysisCategory =
  | 'fresh_evoo'
  | 'real_but_aged'
  | 'expired_olive_oil'
  | 'fake_or_refined'
  | 'invalid_image';

export interface UVFingerprint {
  redChlorophyll: number;
  greenBiologicalBaseline: number;
  blueOxidation: number;
  redBlueRatio: number;
  greenBlueRatio: number;
}

export interface DecisionTrace {
  rule: string;
  qualityGatePassed: boolean;
  qualityFlags: string[];
  signals: {
    redDetected: boolean;
    greenBaselinePresent: boolean;
    blueDominant: boolean;
    redWeak: boolean;
  };
  scores: {
    redPresenceScore?: number;
    greenPresenceScore?: number;
    authenticityScore?: number;
    fakeProbability?: number;
    freshnessScore?: number | null;
  };
  channelFractions: {
    redFraction?: number;
    greenFraction?: number;
    blueFraction?: number;
  };
  notes: string[];
}

export interface PhotoSetup {
  validForAnalysis: boolean;
  setupScore: number;
  category:
    | 'valid_dark_uv_oil'
    | 'recovered_dark_uv_oil'
    | 'daylight_or_stock_photo'
    | 'glare_or_reflection'
    | 'wrong_crop'
    | 'no_liquid_detected'
    | 'blurry_or_saturated';
  enhancementAttempted: boolean;
  enhancementApplied: boolean;
  enhancementMethod?: 'mask_only_no_color_transform' | null;
  recoveryLimitReason?: string | null;
  reasons: string[];
  retakeInstructions: string[];
}

/** Result from Azure Custom Vision analysis */
export interface AnalysisResult {
  /** Unique analysis identifier (UUID) */
  id: string;
  /** Purity score from 0-100 */
  purityScore: number;
  /** Detected adulterant type, null if pure */
  adulterantDetected: string | null;
  /** Confidence score from Azure Custom Vision (0-1) */
  confidence: number;
  /** Classification tags from Custom Vision */
  tags: string[];
  /** ISO timestamp of analysis */
  timestamp: string;
  /** Status classification based on purity thresholds */
  status: AnalysisStatus;
  /** User-provided sample name */
  sampleName?: string;
  /** Azure Blob Storage URL of the sample image */
  imageUrl?: string;
  /** Real olive-oil likelihood from the UV fingerprint, 0-100 */
  authenticityScore?: number;
  /** Refined or seed-oil likelihood, 0-100 */
  fakeProbability?: number;
  /** Freshness score, only meaningful for authentic olive oil */
  freshnessScore?: number | null;
  /** Combined authenticity and freshness score */
  evooScore?: number | null;
  /** Closest Swiss aging dataset step, 0 fresh through 9 oxidized */
  estimatedAgingStep?: number | null;
  /** Confidence in the aging-step estimate, 0-100 */
  agingConfidence?: number | null;
  /** Scientific category from the UV screening engine */
  category?: AnalysisCategory;
  /** Display verdict for the report */
  verdict?: string;
  /** Red, green, and blue UV emission proxies */
  uvFingerprint?: UVFingerprint;
  /** Image quality warnings from the dark-room UV pipeline */
  qualityFlags?: string[];
  /** Stage 0 photo setup/recovery result */
  photoSetup?: PhotoSetup;
  /** Human-readable and machine-readable decision path */
  decisionTrace?: DecisionTrace;
  /** Human-readable scientific reasoning */
  scientificExplanation?: string;
  /** Reference-dataset comparison details */
  referenceComparison?: {
    distanceFromAgingStep0?: number | null;
    closestReference?: unknown;
    step0Reference?: unknown;
    step9Reference?: unknown;
  };
  /** Phone-to-lab calibration metadata */
  calibration?: {
    isCalibrated: boolean;
    expectedPhoneToLabErrorPct?: number;
    expectedAgingStepError?: number;
  };
  /** Absorption limitation note */
  absorptionNote?: string;
}

/** Request body for POST /api/analyze */
export interface AnalyzeRequest {
  /** Azure Blob Storage URL of the uploaded image */
  imageUrl: string;
  /** Optional user-provided sample name */
  sampleName?: string;
}

/** Response from GET /api/history */
export interface HistoryResponse {
  /** List of analysis results */
  analyses: AnalysisResult[];
  /** Total count for pagination */
  total: number;
}

/** Request body for POST /api/certificate */
export interface CertificateRequest {
  /** Analysis ID to generate certificate for */
  analysisId: string;
}

/** Response from POST /api/certificate */
export interface CertificateResponse {
  /** URL to the generated certificate PDF */
  certificateUrl: string;
  /** Unique certificate identifier */
  certificateId: string;
}

/** Response from GET /api/verify/:id */
export interface VerifyResponse {
  /** Whether the certificate is valid */
  valid: boolean;
  /** Associated analysis data */
  analysis: AnalysisResult;
}

/** Digital certificate for an analysis */
export interface Certificate {
  /** Certificate ID in ZV-YYYYMMDD-XXXX format */
  certificateId: string;
  /** Associated analysis result */
  analysis: AnalysisResult;
  /** ISO timestamp of certificate generation */
  issuedAt: string;
  /** Verification URL */
  verifyUrl: string;
}

/** Demo scenario for pre-loaded testing */
export interface DemoScenario {
  /** Scenario identifier */
  id: string;
  /** Display name */
  name: string;
  /** Arabic display name */
  nameAr: string;
  /** Description of the scenario */
  description: string;
  /** Arabic description */
  descriptionAr: string;
  /** Pre-determined analysis result */
  result: AnalysisResult;
  /** Thumbnail color for demo card (hex) */
  thumbnailColor: string;
  /** Emoji icon for the scenario card */
  icon: string;
}

/** Oil type breakdown for adulteration visualization */
export interface OilBreakdown {
  /** Oil type name */
  type: string;
  /** Percentage (0-100) */
  percentage: number;
  /** Display color */
  color: string;
}

/** Application loading states */
export type LoadingState = 'idle' | 'capturing' | 'uploading' | 'analyzing' | 'complete' | 'error';
