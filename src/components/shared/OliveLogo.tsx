// ============================================================
// OliveLogo — ZaytounCom SVG Logo Component
// ============================================================
// An elegant, organic olive branch with leaves and olives.
// Styled to match the premium brand aesthetic.
// ============================================================

import { motion } from 'framer-motion';

interface OliveLogoProps {
  /** Size in pixels (width = size, height auto-scales) */
  size?: number;
  /** Optional className override */
  className?: string;
  /** Whether to animate on mount */
  animate?: boolean;
}

export default function OliveLogo({ size = 48, className = '', animate = true }: OliveLogoProps) {
  const svgContent = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ZaytounCom olive branch logo"
    >
      {/* 1. Branch Stems */}
      {/* Stem connection to Olive 1 */}
      <path
        d="M200 340 C 215 348, 230 355, 246 362"
        stroke="#5d6f4c"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Stem connection to Olive 2 */}
      <path
        d="M270 230 C 285 245, 292 258, 300 268"
        stroke="#5d6f4c"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Stem connection to Olive 3 */}
      <path
        d="M320 165 C 330 178, 335 185, 342 195"
        stroke="#5d6f4c"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Main branch stem */}
      <path
        d="M124 422 C 140 405, 230 310, 310 180 C 330 148, 350 90, 358 72"
        stroke="#5d6f4c"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />

      {/* 2. Leaves */}
      {/* Bottom leaf */}
      <path
        d="M 152 390 C 190 395, 240 420, 265 434 C 220 425, 175 405, 152 390 Z"
        fill="#889d7b"
      />
      {/* Lower-left leaf */}
      <path
        d="M 152 390 C 145 350, 150 290, 185 248 C 175 295, 170 355, 152 390 Z"
        fill="#889d7b"
      />
      {/* Middle-left leaf */}
      <path
        d="M 230 280 C 225 240, 220 180, 252 142 C 242 190, 240 245, 230 280 Z"
        fill="#889d7b"
      />
      {/* Middle-right leaf */}
      <path
        d="M 285 220 C 310 215, 360 250, 382 268 C 340 262, 305 245, 285 220 Z"
        fill="#889d7b"
      />
      {/* Top leaf */}
      <path
        d="M 335 140 C 342 110, 375 75, 388 68 C 375 88, 355 125, 335 140 Z"
        fill="#889d7b"
      />

      {/* 3. Olives */}
      {/* Olive 1 (Lowest) */}
      <g>
        <ellipse rx="36" ry="26" cx="246" cy="362" transform="rotate(30 246 362)" fill="#c6ae45" />
        <ellipse rx="9" ry="6" cx="230" cy="350" transform="rotate(30 230 350)" fill="#fcfbfa" opacity="0.85" />
      </g>

      {/* Olive 2 (Middle) */}
      <g>
        <ellipse rx="38" ry="28" cx="300" cy="268" transform="rotate(-20 300 268)" fill="#c6ae45" />
        <ellipse rx="10" ry="7" cx="284" cy="254" transform="rotate(-20 284 254)" fill="#fcfbfa" opacity="0.85" />
      </g>

      {/* Olive 3 (Highest) */}
      <g>
        <ellipse rx="38" ry="28" cx="342" cy="195" transform="rotate(-30 342 195)" fill="#c6ae45" />
        <ellipse rx="10" ry="7" cx="326" cy="181" transform="rotate(-30 326 181)" fill="#fcfbfa" opacity="0.85" />
      </g>
    </svg>
  );

  if (!animate) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {svgContent}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`inline-flex items-center ${className}`}
    >
      {svgContent}
    </motion.div>
  );
}
