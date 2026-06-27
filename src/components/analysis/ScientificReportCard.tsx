import { motion, type Variants } from 'framer-motion';
import type { AnalysisResult } from '@/types';

interface ScientificReportCardProps {
  result: AnalysisResult;
  className?: string;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function displayPct(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `${Math.round(value)}%`;
}

function ScoreTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null | undefined;
  tone: 'green' | 'red' | 'gold' | 'blue';
}) {
  const color = {
    green: '#4A7C59',
    red: '#B33A3A',
    gold: '#C9A84C',
    blue: '#4776A8',
  }[tone];

  return (
    <motion.div variants={item} className="rounded-xl border border-dark/10 bg-white/55 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-dark/45">{label}</p>
        <p className="font-mono text-xl font-bold" style={{ color }}>
          {displayPct(value)}
        </p>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-dark/7 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampPercent(value)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
}

function FingerprintBar({
  label,
  value,
  color,
  note,
}: {
  label: string;
  value: number;
  color: string;
  note: string;
}) {
  const width = Math.max(0, Math.min(100, (value / 1000) * 100));
  return (
    <motion.div variants={item}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold text-dark">{label}</p>
          <p className="text-xs text-dark/45">{note}</p>
        </div>
        <span className="font-mono text-sm font-bold text-dark/70">{Math.round(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-dark/7 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );
}

function blueSignalReason(result: AnalysisResult): string {
  if (result.qualityFlags?.includes('non_dark_room_background')) {
    return 'This photo has a bright visible-light background, so the red area is not trusted as dark-room UV fluorescence.';
  }
  if (result.qualityFlags?.includes('red_surface_hotspot')) {
    return 'The red signal is concentrated near the top surface, so the quality gate treats it as a hotspot rather than liquid-center fluorescence.';
  }
  if (result.qualityFlags?.includes('blue_edge_glare')) {
    return 'Blue is concentrated near the glass edge, so the quality gate treats it as glare rather than liquid fluorescence.';
  }
  if ((result.uvFingerprint?.blueOxidation ?? 0) > 450) {
    return 'Blue is measured inside the liquid ROI, so it is treated as oxidation or refining signal.';
  }
  return 'Blue is low relative to the red and green olive-oil fingerprint.';
}

function yesNo(value: boolean | undefined): string {
  return value ? 'Yes' : 'No';
}

export default function ScientificReportCard({ result, className = '' }: ScientificReportCardProps) {
  const fingerprint = result.uvFingerprint;
  const calibration = result.calibration;
  const confidencePct = Math.round((result.confidence ?? 0) * 100);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`glass rounded-2xl p-6 sm:p-8 ${className}`}
    >
      <motion.div variants={item} className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-dark/40">UV screening verdict</p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-dark mt-1">
          {result.verdict || result.category?.replace(/_/g, ' ') || 'UV Analysis'}
        </h2>
        <p className="text-sm text-dark/55 mt-2">
          Screening confidence {confidencePct}% with expected phone-to-lab error margin of{' '}
          {calibration?.expectedPhoneToLabErrorPct ?? 25}%.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
        <ScoreTile label="Authenticity" value={result.authenticityScore} tone="green" />
        <ScoreTile label="Fake Probability" value={result.fakeProbability} tone="red" />
        <ScoreTile label="Freshness" value={result.freshnessScore} tone="gold" />
        <ScoreTile label="EVOO Score" value={result.evooScore} tone="blue" />
      </div>

      {fingerprint && (
        <motion.div variants={item} className="rounded-xl border border-dark/10 bg-white/45 p-4 sm:p-5 mb-7">
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <div>
              <h3 className="font-display text-lg font-bold text-dark">UV Fingerprint</h3>
              <p className="text-xs text-dark/45">Phone RGB channels as emission proxies under UV in a dark room.</p>
            </div>
            <span className="font-mono text-xs text-dark/45">
              R/B {fingerprint.redBlueRatio.toFixed(2)} | G/B {fingerprint.greenBlueRatio.toFixed(2)}
            </span>
          </div>
          <div className="space-y-5">
            <FingerprintBar
              label="Red chlorophyll"
              value={fingerprint.redChlorophyll}
              color="#B33A3A"
              note="Fresh olive chlorophyll signal"
            />
            <FingerprintBar
              label="Green biological baseline"
              value={fingerprint.greenBiologicalBaseline}
              color="#4A7C59"
              note="Olive phenol/tocopherol baseline"
            />
            <FingerprintBar
              label="Blue oxidation"
              value={fingerprint.blueOxidation}
              color="#4776A8"
              note="Oxidation/refining/degradation signal"
            />
          </div>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        <div className="rounded-xl border border-dark/10 bg-white/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark/40">Closest aging step</p>
          <p className="font-mono text-2xl font-bold text-dark mt-1">
            {result.estimatedAgingStep ?? 'N/A'}
          </p>
        </div>
        <div className="rounded-xl border border-dark/10 bg-white/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark/40">Distance from Step 0</p>
          <p className="font-mono text-2xl font-bold text-dark mt-1">
            {displayPct(result.referenceComparison?.distanceFromAgingStep0)}
          </p>
        </div>
        <div className="rounded-xl border border-dark/10 bg-white/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-dark/40">Aging confidence</p>
          <p className="font-mono text-2xl font-bold text-dark mt-1">
            {displayPct(result.agingConfidence)}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item} className="space-y-4">
        {result.photoSetup && (
          <div
            className={`rounded-xl border p-4 ${
              result.photoSetup.validForAnalysis
                ? 'border-success/20 bg-success/8'
                : 'border-warning/25 bg-warning/8'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <p className="text-sm font-semibold text-dark">Photo setup check</p>
                <p className="text-xs text-dark/45">
                  {result.photoSetup.category.replace(/_/g, ' ')}
                </p>
              </div>
              <span className="font-mono text-sm font-bold text-dark/70">
                {displayPct(result.photoSetup.setupScore)}
              </span>
            </div>

            <div className="space-y-2">
              {result.photoSetup.reasons.map((reason) => (
                <p key={reason} className="text-sm leading-relaxed text-dark/65">
                  {reason}
                </p>
              ))}
            </div>

            {result.photoSetup.enhancementAttempted && (
              <p className="text-xs leading-relaxed text-dark/45 mt-3">
                Mask-only recovery {result.photoSetup.enhancementApplied ? 'was applied' : 'was attempted but not trusted'} by ignoring non-sample pixels and checking the liquid center. No color, RGB, or wavelength proxy values were transformed.
                {result.photoSetup.recoveryLimitReason ? ` ${result.photoSetup.recoveryLimitReason}` : ''}
              </p>
            )}

            {!result.photoSetup.validForAnalysis && result.photoSetup.retakeInstructions.length > 0 && (
              <div className="mt-3 rounded-lg bg-white/55 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-dark/40 mb-2">Retake instructions</p>
                <ul className="space-y-1">
                  {result.photoSetup.retakeInstructions.map((instruction) => (
                    <li key={instruction} className="text-sm text-dark/65">
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-dark/10 bg-white/45 p-4">
          <p className="text-sm font-semibold text-dark mb-1">Reasoning</p>
          <p className="text-sm leading-relaxed text-dark/65">{result.scientificExplanation}</p>
          <p className="text-sm leading-relaxed text-dark/65 mt-3">{blueSignalReason(result)}</p>
        </div>

        {result.decisionTrace && (
          <div className="rounded-xl border border-dark/10 bg-white/45 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="text-sm font-semibold text-dark">Decision trace</p>
              <code className="rounded bg-dark/5 px-2 py-1 text-xs text-dark/60">
                {result.decisionTrace.rule.replace(/_/g, ' ')}
              </code>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {[
                ['Quality gate', yesNo(result.decisionTrace.qualityGatePassed)],
                ['Red detected', yesNo(result.decisionTrace.signals.redDetected)],
                ['Green baseline', yesNo(result.decisionTrace.signals.greenBaselinePresent)],
                ['Blue dominant', yesNo(result.decisionTrace.signals.blueDominant)],
                ['Red weak', yesNo(result.decisionTrace.signals.redWeak)],
                ['Red score', result.decisionTrace.scores.redPresenceScore ?? 'N/A'],
                ['Green score', result.decisionTrace.scores.greenPresenceScore ?? 'N/A'],
                ['Fake probability', displayPct(result.decisionTrace.scores.fakeProbability)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/55 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wider text-dark/35">{label}</p>
                  <p className="text-sm font-semibold text-dark mt-0.5">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-dark/45">
              {result.decisionTrace.notes[0]}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-dark/10 bg-white/45 p-4">
          <p className="text-sm font-semibold text-dark mb-1">Lab-data boundary</p>
          <p className="text-sm leading-relaxed text-dark/65">
            Red is used as a chlorophyll/freshness proxy, green as the olive biological baseline, and blue as
            oxidation/refining signal. {result.absorptionNote}
          </p>
          {!calibration?.isCalibrated && (
            <p className="text-xs leading-relaxed text-dark/45 mt-3">
              This is a screening result, not lab certification. Add validated phone samples to tighten the reported error margin.
            </p>
          )}
        </div>

        {result.qualityFlags && result.qualityFlags.length > 0 && (
          <div className="rounded-xl border border-warning/20 bg-warning/8 p-4">
            <p className="text-sm font-semibold text-dark mb-2">Quality flags</p>
            <div className="flex flex-wrap gap-2">
              {result.qualityFlags.map((flag) => (
                <span
                  key={flag}
                  className="rounded-full border border-warning/20 bg-white/60 px-3 py-1 text-xs font-medium text-dark/65"
                >
                  {flag.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
