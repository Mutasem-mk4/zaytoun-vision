import { Award, Timer } from 'lucide-react';
import type { QualityGrading } from '../types';

interface QualityGradeCardProps {
  grading: QualityGrading;
}

export default function QualityGradeCard({ grading }: QualityGradeCardProps) {
  const { purity_index, aging_step, grade, description, color } = grading;

  // Color mapping for UI
  const colorClasses = {
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
      bar: 'bg-green-500',
    },
    yellow: {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
      bar: 'bg-yellow-500',
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      bar: 'bg-red-500',
    },
  };

  const currentTheme = colorClasses[color] || colorClasses.green;

  return (
    <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <Award size={20} className={currentTheme.text} />
        <h3 className="text-sm font-semibold text-gray-700">Stage 2: Purity & Quality Grading</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: Grade and Description */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${currentTheme.bg} ${currentTheme.text}`}>
                {grade}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                <Timer size={12} />
                Aging Step: {aging_step}/9
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{description}</p>
          </div>
        </div>

        {/* Right column: Purity Gauge */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Purity Index</span>
            <span className={`text-base font-extrabold ${currentTheme.text}`}>{purity_index}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${currentTheme.bar}`}
              style={{ width: `${purity_index}%` }}
            />
          </div>

          <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            <span>Degraded (0%)</span>
            <span>Pure EVOO (100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
