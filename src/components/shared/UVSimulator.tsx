// ============================================================
// UVSimulator — Interactive UV Fluorescence Simulator
// ============================================================
// A high-fidelity CSS/SVG component that visualizes how
// olive oil behaves under normal vs. UV light (fluorescence).
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function UVSimulator() {
  const [uvOn, setUvOn] = useState(false);

  const t = {
    title: 'UV Fluorescence Simulator',
    subtitle: 'Toggle the switch to trigger UV light and see fluorescence',
    switchLabel: 'UV light source (365nm)',
    vial1: 'Extra Virgin Olive Oil',
    vial2: 'Aged/Oxidized Olive Oil',
    vial3: 'Seed/Adulterated Oil',
    vial1Desc: 'Intense red glow due to active chlorophyll',
    vial2Desc: 'Dim orange/blue glow as oxidation begins',
    vial3Desc: 'Bright blue fluorescence of refined oils',
    tagPure: 'Pure & Natural',
    tagAged: 'Aged',
    tagAdulterated: 'Adulterated',
  };

  return (
    <div className="w-full glass rounded-3xl p-6 sm:p-8 shadow-elevated border border-white/20">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="font-display text-2xl font-bold text-primary flex justify-center items-center gap-2">
          <span>🔬</span>
          <span>{t.title}</span>
        </h3>
        <p className="text-xs text-dark/50 mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Box enclosure representing the dark box */}
      <div className="relative w-full rounded-2xl bg-[#0d0f0c] p-6 pt-12 overflow-hidden border border-white/10 shadow-inner flex flex-col items-center">
        {/* UV emitter element */}
        <div className="absolute top-0 w-28 h-4 bg-zinc-800 rounded-b-xl border-x border-b border-zinc-700 flex justify-center">
          <motion.div
            animate={{
              backgroundColor: uvOn ? '#a855f7' : '#d4d4d8',
              boxShadow: uvOn
                ? '0 0 20px 4px rgba(168, 85, 247, 0.8)'
                : '0 0 4px 1px rgba(212, 212, 212, 0.3)',
            }}
            className="w-16 h-2 rounded-full mt-1.5 transition-all duration-300"
          />
        </div>

        {/* Dynamic Light Beam from top */}
        <motion.div
          initial={{ opacity: 0.1 }}
          animate={{
            background: uvOn
              ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.25) 0%, rgba(168, 85, 247, 0) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)',
            opacity: uvOn ? 0.9 : 0.4,
          }}
          className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 h-64 pointer-events-none blur-sm"
        />

        {/* Vials Grid */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-md relative z-10 mt-2">
          {/* Vial 1: Pure EVOO */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 sm:w-16 h-36 sm:h-44 bg-zinc-900/40 rounded-t-xl rounded-b-2xl border border-white/10 flex items-end justify-center p-1 overflow-hidden">
              {/* Cap */}
              <div className="absolute top-0 w-8 h-3 bg-zinc-700 rounded-b-sm border-b border-zinc-600" />
              
              {/* Liquid inside */}
              <motion.div
                animate={{
                  background: uvOn
                    ? 'linear-gradient(0deg, #dc2626 0%, #ef4444 60%, #b91c1c 100%)' // Red glow
                    : 'linear-gradient(0deg, #2d5016 0%, #4a7c59 70%, #c9a84c 100%)', // Olive gold
                  boxShadow: uvOn
                    ? '0 0 25px 6px rgba(239, 68, 68, 0.65)'
                    : 'none',
                }}
                className="w-full h-[85%] rounded-b-xl transition-all duration-500 origin-bottom"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 mt-3 text-center leading-tight">
              {t.vial1}
            </span>
            <span className={`text-[8px] mt-1 text-center font-medium leading-normal ${uvOn ? 'text-red-400' : 'text-zinc-500'}`}>
              {uvOn ? t.vial1Desc : t.tagPure}
            </span>
          </div>

          {/* Vial 2: Aged EVOO */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 sm:w-16 h-36 sm:h-44 bg-zinc-900/40 rounded-t-xl rounded-b-2xl border border-white/10 flex items-end justify-center p-1 overflow-hidden">
              {/* Cap */}
              <div className="absolute top-0 w-8 h-3 bg-zinc-700 rounded-b-sm border-b border-zinc-600" />
              
              {/* Liquid inside */}
              <motion.div
                animate={{
                  background: uvOn
                    ? 'linear-gradient(0deg, #c2410c 0%, #ea580c 40%, #6366f1 100%)' // Faint orange/blue mix
                    : 'linear-gradient(0deg, #a88a32 0%, #d4b96a 75%, #f3f4f6 100%)', // Gold/yellowish
                  boxShadow: uvOn
                    ? '0 0 15px 3px rgba(234, 88, 12, 0.4), 0 0 15px 3px rgba(99, 102, 241, 0.3)'
                    : 'none',
                }}
                className="w-full h-[85%] rounded-b-xl transition-all duration-500 origin-bottom"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 mt-3 text-center leading-tight">
              {t.vial2}
            </span>
            <span className={`text-[8px] mt-1 text-center font-medium leading-normal ${uvOn ? 'text-orange-400' : 'text-zinc-500'}`}>
              {uvOn ? t.vial2Desc : t.tagAged}
            </span>
          </div>

          {/* Vial 3: Seed / Adulterated Oil */}
          <div className="flex flex-col items-center">
            <div className="relative w-12 sm:w-16 h-36 sm:h-44 bg-zinc-900/40 rounded-t-xl rounded-b-2xl border border-white/10 flex items-end justify-center p-1 overflow-hidden">
              {/* Cap */}
              <div className="absolute top-0 w-8 h-3 bg-zinc-700 rounded-b-sm border-b border-zinc-600" />
              
              {/* Liquid inside */}
              <motion.div
                animate={{
                  background: uvOn
                    ? 'linear-gradient(0deg, #2563eb 0%, #3b82f6 60%, #60a5fa 100%)' // Strong blue
                    : 'linear-gradient(0deg, #d97706 0%, #fbbf24 80%, #fef08a 100%)', // Pale yellow
                  boxShadow: uvOn
                    ? '0 0 25px 6px rgba(59, 130, 246, 0.7)'
                    : 'none',
                }}
                className="w-full h-[85%] rounded-b-xl transition-all duration-500 origin-bottom"
              />
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-white/90 mt-3 text-center leading-tight">
              {t.vial3}
            </span>
            <span className={`text-[8px] mt-1 text-center font-medium leading-normal ${uvOn ? 'text-blue-400' : 'text-zinc-500'}`}>
              {uvOn ? t.vial3Desc : t.tagAdulterated}
            </span>
          </div>
        </div>
      </div>

      {/* Switch Control */}
      <div className="flex justify-center mt-6">
        <label className="flex items-center gap-3 cursor-pointer group select-none">
          <span className="text-sm font-semibold text-dark/70 group-hover:text-primary transition-colors">
            {t.switchLabel}
          </span>
          <div 
            onClick={() => setUvOn(!uvOn)}
            className="relative w-14 h-8 bg-zinc-200 group-hover:bg-zinc-300 rounded-full transition-colors flex items-center p-1 shadow-inner"
          >
            <motion.div
              layout
              animate={{
                backgroundColor: uvOn ? '#2D5016' : '#a1a1aa',
                x: uvOn ? 24 : 0,
              }}
              className="w-6 h-6 rounded-full shadow-md"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
