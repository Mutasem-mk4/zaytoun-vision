import { ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react';
import type { FraudDetection } from '../types';

interface FraudVerdictCardProps {
  fraud: FraudDetection;
}

export default function FraudVerdictCard({ fraud }: FraudVerdictCardProps) {
  const { passed, verdict, label, message, confidence } = fraud;

  // Decide colors and icon
  let cardBg = 'bg-red-50 border-red-200';
  let Icon = ShieldAlert;

  if (passed) {
    cardBg = 'bg-green-50 border-green-200';
    Icon = ShieldCheck;
  } else if (verdict === 'inconclusive') {
    cardBg = 'bg-yellow-50 border-yellow-200';
    Icon = AlertCircle;
  }

  return (
    <div className={`p-6 rounded-2xl border ${cardBg} shadow-sm transition-all duration-200`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
            <Icon size={28} className={passed ? 'text-green-600' : verdict === 'inconclusive' ? 'text-yellow-600' : 'text-red-600'} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Stage 1: Fraud Detection</span>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">{label}</h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>

        {verdict !== 'inconclusive' && (
          <div className="flex flex-col items-center justify-center sm:text-right border-t sm:border-t-0 sm:border-l border-gray-200/50 pt-4 sm:pt-0 sm:pl-6 min-w-[120px]">
            <span className="text-3xl font-extrabold text-gray-900">{confidence}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mt-1">Confidence</span>
          </div>
        )}
      </div>
    </div>
  );
}
