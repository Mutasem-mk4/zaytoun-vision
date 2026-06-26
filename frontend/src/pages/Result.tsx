import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';
import type { PredictionResult } from '../types';
import FraudVerdictCard from '../components/FraudVerdictCard';
import QualityGradeCard from '../components/QualityGradeCard';
import SpectralBarsCard from '../components/SpectralBarsCard';

export default function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('zaytoun_result');
    if (!stored) {
      navigate('/analyze');
      return;
    }
    try {
      setResult(JSON.parse(stored) as PredictionResult);
    } catch {
      navigate('/analyze');
    }
  }, [navigate]);

  if (!result) return null;

  const formattedTs = new Date(result.timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const handlePrint = () => {
    window.print();
  };

  // Check if image was invalid (too dark / out of focus)
  if (!result.valid) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="p-8 rounded-2xl border border-yellow-200 bg-yellow-50 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Image too dark — retake under UV light</h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            The system could not detect any valid UV fluorescence. Please ensure your sample is illuminated with 365nm UV light inside a darkbox, and that you have cropped to the active liquid layer.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D9E75] text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
            Try again
          </Link>
        </div>
      </div>
    );
  }

  const fraud = result.fraud_detection;
  const grading = result.quality_grading;
  const normalizedCounts = result.normalized_counts;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Analysis Report</h1>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              {formattedTs}
            </span>
            <span className="flex items-center gap-1">
              <Layers size={13} />
              CMOS low-cost spectrometer mode
            </span>
          </div>
        </div>

        <div className="flex gap-2 no-print">
          <button
            id="download-report-btn"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors bg-white shadow-sm"
          >
            <Download size={14} />
            Download Report (PDF)
          </button>
        </div>
      </div>

      {/* Main Results Stack */}
      <div className="space-y-6">
        {/* Stage 1: Fraud Verdict */}
        {fraud && <FraudVerdictCard fraud={fraud} />}

        {/* Stage 2: Quality Grading (Only show if passed Stage 1) */}
        {grading && <QualityGradeCard grading={grading} />}

        {/* Spectral Readings (Bars) */}
        {normalizedCounts && <SpectralBarsCard counts={normalizedCounts} />}

        {/* Extra info: raw means & pixel count */}
        {result.raw && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex flex-col sm:flex-row justify-between gap-2">
            <span><strong>Raw RGB Means:</strong> R={result.raw.R.toFixed(1)}, G={result.raw.G.toFixed(1)}, B={result.raw.B.toFixed(1)}</span>
            <span><strong>Active Pixels:</strong> {result.nonzero_pixels?.toLocaleString()} px after background border thresholding</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 no-print">
        <Link
          to="/analyze"
          id="analyze-another-btn"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1D9E75] text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-md text-center"
        >
          <RefreshCw size={16} />
          Analyze another sample
        </Link>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-12 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center">
        Zaytoun Vision — AI Olive Oil Authenticity Report · {formattedTs} ·
        For field screening purposes only. Not a substitute for accredited laboratory analysis.
      </div>
    </div>
  );
}
