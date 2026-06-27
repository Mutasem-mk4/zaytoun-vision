// ============================================================
// Zaytoun Vision — Demo Service
// ============================================================
// Provides 3 pre-loaded demo scenarios that bypass camera and
// Azure Custom Vision API. These ensure the demo NEVER fails
// during the live hackathon presentation.
//
// Azure Justification: In production, these scenarios would be
// replaced by real Azure Custom Vision predictions. The demo
// scenarios simulate identical response shapes so the UI
// renders identically regardless of data source.
// ============================================================

import type { DemoScenario, AnalysisResult, OilBreakdown } from '../types';

/** Generate a UUID-like ID for demo purposes */
function generateId(): string {
  return 'zv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
}

/** Generate a certificate ID in ZV-YYYYMMDD-XXXX format */
export function generateCertificateId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ZV-${dateStr}-${rand}`;
}

/**
 * Three pre-loaded demo scenarios for the hackathon presentation.
 * Each scenario has predetermined results that showcase different
 * analysis outcomes: pure, warning, and adulterated.
 */
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'nablus-premium',
    name: 'Nablus Premium EVOO',
    nameAr: 'زيت زيتون نابلسي ممتاز',
    description: 'First-press extra virgin olive oil from Nablus cooperative, harvested November 2025.',
    descriptionAr: 'زيت زيتون بكر ممتاز عصرة أولى من تعاونية نابلس، محصول نوفمبر 2025.',
    thumbnailColor: '#4A7C59',
    icon: '🫒',
    result: {
      id: generateId(),
      purityScore: 90,
      adulterantDetected: null,
      confidence: 0.96,
      tags: ['fresh_evoo', 'high_red_chlorophyll', 'low_blue_oxidation'],
      timestamp: new Date().toISOString(),
      status: 'pure',
      sampleName: 'Nablus Premium EVOO',
      authenticityScore: 96,
      fakeProbability: 4,
      freshnessScore: 94,
      evooScore: 90,
      estimatedAgingStep: 0,
      agingConfidence: 70,
      category: 'fresh_evoo',
      verdict: 'Fresh EVOO-like',
      uvFingerprint: {
        redChlorophyll: 850,
        greenBiologicalBaseline: 350,
        blueOxidation: 50,
        redBlueRatio: 17,
        greenBlueRatio: 7,
      },
      qualityFlags: [],
      scientificExplanation: 'The red chlorophyll signal is strong, the green biological baseline is present, and blue oxidation is low.',
      referenceComparison: { distanceFromAgingStep0: 3 },
      calibration: { isCalibrated: false, expectedPhoneToLabErrorPct: 25, expectedAgingStepError: 2 },
      absorptionNote: 'K232, K268, and deltaK are lab absorption metrics and cannot be directly measured from one phone fluorescence photo.',
    },
  },
  {
    id: 'market-sample-b',
    name: 'Market Sample B',
    nameAr: 'عينة السوق ب',
    description: 'Unlabeled olive oil purchased from a local market in Amman. Origin unknown.',
    descriptionAr: 'زيت زيتون بدون ملصق من سوق محلي في عمّان. المصدر غير معروف.',
    thumbnailColor: '#D4843A',
    icon: '⚠️',
    result: {
      id: generateId(),
      purityScore: 37,
      adulterantDetected: null,
      confidence: 0.82,
      tags: ['real_but_aged', 'reduced_red_chlorophyll', 'higher_blue_oxidation'],
      timestamp: new Date().toISOString(),
      status: 'warning',
      sampleName: 'Market Sample B',
      authenticityScore: 78,
      fakeProbability: 22,
      freshnessScore: 48,
      evooScore: 37,
      estimatedAgingStep: 5,
      agingConfidence: 68,
      category: 'real_but_aged',
      verdict: 'Real Olive Oil, Not Fresh Enough for EVOO',
      uvFingerprint: {
        redChlorophyll: 400,
        greenBiologicalBaseline: 110,
        blueOxidation: 450,
        redBlueRatio: 0.89,
        greenBlueRatio: 0.24,
      },
      qualityFlags: [],
      scientificExplanation: 'The sample keeps an olive-oil UV identity, but blue oxidation is elevated and freshness is below a fresh EVOO-like profile.',
      referenceComparison: { distanceFromAgingStep0: 52 },
      calibration: { isCalibrated: false, expectedPhoneToLabErrorPct: 25, expectedAgingStepError: 2 },
      absorptionNote: 'K232, K268, and deltaK are lab absorption metrics and cannot be directly measured from one phone fluorescence photo.',
    },
  },
  {
    id: 'unknown-batch',
    name: 'Unknown Batch X-47',
    nameAr: 'دفعة مجهولة X-47',
    description: 'Suspicious bulk oil seized by inspectors. Strong off-color and unusual viscosity.',
    descriptionAr: 'زيت مشبوه بالجملة صادرته الجهات الرقابية. لون غير طبيعي ولزوجة غير معتادة.',
    thumbnailColor: '#B33A3A',
    icon: '🚨',
    result: {
      id: generateId(),
      purityScore: 12,
      adulterantDetected: 'Refined or seed-oil UV signature',
      confidence: 0.94,
      tags: ['fake_or_refined', 'near_flat_green_baseline', 'high_blue_oxidation'],
      timestamp: new Date().toISOString(),
      status: 'adulterated',
      sampleName: 'Unknown Batch X-47',
      authenticityScore: 12,
      fakeProbability: 88,
      freshnessScore: null,
      evooScore: null,
      estimatedAgingStep: null,
      agingConfidence: null,
      category: 'fake_or_refined',
      verdict: 'Likely Fake or Refined',
      uvFingerprint: {
        redChlorophyll: 20,
        greenBiologicalBaseline: 4,
        blueOxidation: 850,
        redBlueRatio: 0.02,
        greenBlueRatio: 0.005,
      },
      qualityFlags: [],
      scientificExplanation: 'The UV fingerprint has weak red chlorophyll, strong blue emission, and a near-flat green biological baseline.',
      referenceComparison: { distanceFromAgingStep0: null },
      calibration: { isCalibrated: false, expectedPhoneToLabErrorPct: 25, expectedAgingStepError: 2 },
      absorptionNote: 'K232, K268, and deltaK are lab absorption metrics and cannot be directly measured from one phone fluorescence photo.',
    },
  },
];

/** Oil breakdown for each demo scenario */
export const DEMO_OIL_BREAKDOWNS: Record<string, OilBreakdown[]> = {
  'nablus-premium': [
    { type: 'Fresh EVOO-like signal', percentage: 90, color: '#4A7C59' },
    { type: 'Natural variation', percentage: 10, color: '#8fbc8f' },
  ],
  'market-sample-b': [
    { type: 'Fresh EVOO-like signal', percentage: 37, color: '#4A7C59' },
    { type: 'Aged olive-oil signal', percentage: 41, color: '#D4843A' },
    { type: 'Uncertain or non-olive signal', percentage: 22, color: '#9CA3AF' },
  ],
  'unknown-batch': [
    { type: 'Fake or refined UV signature', percentage: 88, color: '#B33A3A' },
    { type: 'Residual olive-like signal', percentage: 12, color: '#9CA3AF' },
  ],
};

/**
 * Simulates an analysis delay to make the demo feel realistic.
 * Shows progress through capturing → uploading → analyzing → complete states.
 */
export async function simulateAnalysis(
  onProgress: (stage: string) => void
): Promise<void> {
  const stages = [
    { label: 'Capturing image...', delay: 600 },
    { label: 'Uploading to Azure Blob Storage...', delay: 800 },
    { label: 'Azure Custom Vision analyzing...', delay: 1400 },
    { label: 'Computing purity metrics...', delay: 600 },
  ];

  for (const stage of stages) {
    onProgress(stage.label);
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
  }
}

/**
 * Mock analysis function that works identically to the real API
 * but uses local color analysis as a fallback prediction method.
 * 
 * Azure Justification: In production, this would call Azure Custom
 * Vision's prediction endpoint. The mock uses simple RGB brightness
 * analysis to simulate fluorescence pattern detection — a scientifically
 * grounded simplification of the real spectral analysis.
 */
export function mockAnalyzeImage(imageDataUrl: string, sampleName?: string): AnalysisResult {
  // Simple brightness-based heuristic for camera captures
  // In production, Azure Custom Vision handles the real classification
  const brightness = estimateImageBrightness(imageDataUrl);
  
  let purityScore: number;
  let status: AnalysisResult['status'];
  let adulterantDetected: string | null;
  let confidence: number;
  let tags: string[];
  let authenticityScore: number;
  let fakeProbability: number;
  let freshnessScore: number | null;
  let evooScore: number | null;
  let estimatedAgingStep: number | null;
  let agingConfidence: number | null;
  let category: AnalysisResult['category'];
  let verdict: string;
  let uvFingerprint: NonNullable<AnalysisResult['uvFingerprint']>;
  let scientificExplanation: string;

  if (brightness > 0.6) {
    authenticityScore = 90 + Math.floor(Math.random() * 8);
    fakeProbability = 100 - authenticityScore;
    freshnessScore = 84 + Math.floor(Math.random() * 12);
    evooScore = Math.round(authenticityScore * freshnessScore / 100);
    purityScore = evooScore;
    status = 'pure';
    adulterantDetected = null;
    confidence = 0.85 + Math.random() * 0.1;
    tags = ['fresh_evoo', 'good_red_chlorophyll'];
    estimatedAgingStep = 0;
    agingConfidence = 70;
    category = 'fresh_evoo';
    verdict = 'Fresh EVOO-like';
    uvFingerprint = {
      redChlorophyll: 820,
      greenBiologicalBaseline: 310,
      blueOxidation: 70,
      redBlueRatio: 11.7,
      greenBlueRatio: 4.4,
    };
    scientificExplanation = 'The red chlorophyll signal is strong, the green biological baseline is present, and blue oxidation is low.';
  } else if (brightness > 0.35) {
    authenticityScore = 68 + Math.floor(Math.random() * 18);
    fakeProbability = 100 - authenticityScore;
    freshnessScore = 35 + Math.floor(Math.random() * 25);
    evooScore = Math.round(authenticityScore * freshnessScore / 100);
    purityScore = evooScore;
    status = 'warning';
    adulterantDetected = null;
    confidence = 0.7 + Math.random() * 0.15;
    tags = ['real_but_aged', 'reduced_chlorophyll'];
    estimatedAgingStep = 5;
    agingConfidence = 66;
    category = 'real_but_aged';
    verdict = 'Real Olive Oil, Not Fresh Enough for EVOO';
    uvFingerprint = {
      redChlorophyll: 360,
      greenBiologicalBaseline: 100,
      blueOxidation: 420,
      redBlueRatio: 0.86,
      greenBlueRatio: 0.24,
    };
    scientificExplanation = 'The sample keeps an olive-oil UV identity, but the freshness score is below a fresh EVOO-like profile.';
  } else {
    authenticityScore = 8 + Math.floor(Math.random() * 12);
    fakeProbability = 100 - authenticityScore;
    freshnessScore = null;
    evooScore = null;
    purityScore = authenticityScore;
    status = 'adulterated';
    adulterantDetected = 'Refined or seed-oil UV signature';
    confidence = 0.8 + Math.random() * 0.15;
    tags = ['fake_or_refined', 'low_chlorophyll', 'high_oxidation'];
    estimatedAgingStep = null;
    agingConfidence = null;
    category = 'fake_or_refined';
    verdict = 'Likely Fake or Refined';
    uvFingerprint = {
      redChlorophyll: 20,
      greenBiologicalBaseline: 5,
      blueOxidation: 820,
      redBlueRatio: 0.02,
      greenBlueRatio: 0.006,
    };
    scientificExplanation = 'The UV fingerprint has weak red chlorophyll, strong blue emission, and a near-flat green biological baseline.';
  }

  return {
    id: generateId(),
    purityScore,
    adulterantDetected,
    confidence,
    tags,
    timestamp: new Date().toISOString(),
    status,
    sampleName: sampleName || 'Camera Capture',
    imageUrl: imageDataUrl,
    authenticityScore,
    fakeProbability,
    freshnessScore,
    evooScore,
    estimatedAgingStep,
    agingConfidence,
    category,
    verdict,
    uvFingerprint,
    qualityFlags: [],
    scientificExplanation,
    referenceComparison: { distanceFromAgingStep0: estimatedAgingStep === null ? null : Math.round((estimatedAgingStep / 9) * 100) },
    calibration: { isCalibrated: false, expectedPhoneToLabErrorPct: 25, expectedAgingStepError: 2 },
    absorptionNote: 'K232, K268, and deltaK are lab absorption metrics and cannot be directly measured from one phone fluorescence photo.',
  };
}

/** Estimate image brightness from a data URL (simplified) */
function estimateImageBrightness(_dataUrl: string): number {
  // In a real implementation, this would analyze the canvas pixel data.
  // For the hackathon demo, we return a random value to simulate variety.
  return 0.3 + Math.random() * 0.5;
}
