import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { EemFeatureRecord } from '../types';

interface AgingChartProps {
  data: EemFeatureRecord[];
}

interface ChartDataPoint {
  step: number;
  chlorophyllMean: number;
  sampleCount: number;
}

export default function AgingChart({ data }: AgingChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Calculate averages per aging step (0 to 9)
      const computed = Array.from({ length: 10 }, (_, step) => {
        const stepSamples = data.filter((d) => d.aging_step === step);
        const sum = stepSamples.reduce((acc, curr) => acc + curr.chlorophyll_mean, 0);
        const avg = stepSamples.length > 0 ? sum / stepSamples.length : 0;
        return {
          step,
          chlorophyllMean: Math.round(avg * 100) / 100, // round to 2 decimals
          sampleCount: stepSamples.length,
        };
      });
      setChartData(computed);
    }
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl">
        <p className="text-sm text-gray-400">Loading Swiss EVOO dataset chart...</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-900">
          Chlorophyll fluorescence across aging steps (Swiss EVOO dataset)
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Source: Venturini et al., ZHAW Switzerland, 2023
        </p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="step"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={{ stroke: '#e5e7eb' }}
              label={{
                value: 'Aging Step (0 = Fresh, 9 = Degraded)',
                position: 'insideBottom',
                offset: -10,
                fill: '#9ca3af',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={{ stroke: '#e5e7eb' }}
              label={{
                value: 'Mean Chlorophyll Fluorescence (Intensity)',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: '#9ca3af',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 shadow-xl text-white text-xs">
                      <p className="font-bold text-green-400">Aging Step {dataPoint.step}</p>
                      <p className="mt-1 text-gray-300">
                        Avg Intensity: <span className="font-mono font-bold text-white">{dataPoint.chlorophyllMean}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">({dataPoint.sampleCount} samples)</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="chlorophyllMean"
              stroke="#1D9E75"
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{ stroke: '#1D9E75', strokeWidth: 2, fill: '#fff', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-green-50/40 border border-green-100/50 text-xs text-green-800 leading-relaxed">
        <strong>💡 Scientific insight:</strong> The curve demonstrates the exponential decay of chlorophyll fluorescence under storage/aging conditions. Our Purity Index utilizes this phenomenon by analyzing the ratio of intact chlorophyll (red channel) versus accumulated oxidation by-products (blue channel).
      </div>
    </div>
  );
}
