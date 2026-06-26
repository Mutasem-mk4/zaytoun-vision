import { BarChart3 } from 'lucide-react';

interface SpectralBarsCardProps {
  counts: {
    red_670nm: number;
    green_530nm: number;
    blue_440nm: number;
  };
}

export default function SpectralBarsCard({ counts }: SpectralBarsCardProps) {
  const { red_670nm, green_530nm, blue_440nm } = counts;

  // Scale is 0 to 1000. Clamp to prevent UI overflows
  const getPercentage = (val: number) => {
    return `${Math.max(0, Math.min(100, (val / 1000) * 100))}%`;
  };

  return (
    <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 size={20} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Spectral Readings (0–1000 Counts)</h3>
      </div>

      <div className="space-y-5">
        {/* Red Channel */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              🔴 Red 670nm — Chlorophyll
            </span>
            <span className="font-mono text-gray-900 bg-red-50 px-2 py-0.5 rounded border border-red-100">
              {red_670nm.toFixed(1)} counts
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: getPercentage(red_670nm) }}
            />
          </div>
        </div>

        {/* Green Channel */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-green-600">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              🟢 Green 530nm — Antioxidants / Phenols / Vit E
            </span>
            <span className="font-mono text-gray-900 bg-green-50 px-2 py-0.5 rounded border border-green-100">
              {green_530nm.toFixed(1)} counts
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: getPercentage(green_530nm) }}
            />
          </div>
        </div>

        {/* Blue Channel */}
        <div>
          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              🔵 Blue 440nm — Oxidation / Refining Marker
            </span>
            <span className="font-mono text-gray-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {blue_440nm.toFixed(1)} counts
            </span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: getPercentage(blue_440nm) }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-semibold text-gray-400 uppercase tracking-widest border-t border-gray-50 pt-3">
        <span>0 counts (Dark)</span>
        <span>500</span>
        <span>1000 counts (Max)</span>
      </div>
    </div>
  );
}
