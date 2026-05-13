// PLACEHOLDER: Replace with final candle hero artist asset when delivered.
// Single candle with a warm halo, sized to feel intimate, not iconic.

import { useRef } from 'react';
import { createFlameMotionStyle, type FlameMotionStyle } from '../../lib/flameMotion';

interface CandleIllustrationProps {
  className?: string;
  ariaLabel?: string;
}

export function CandleIllustration({ className, ariaLabel = 'A single candle' }: CandleIllustrationProps) {
  const motionStyle = useRef<FlameMotionStyle | null>(null);
  if (!motionStyle.current) motionStyle.current = createFlameMotionStyle();

  return (
    <svg
      viewBox="0 0 200 320"
      role="img"
      aria-label={ariaLabel}
      className={className}
      style={motionStyle.current}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="kyndill-candle-halo" cx="50%" cy="40%" r="48%">
          <stop offset="0%" stopColor="oklch(0.88 0.13 70 / 0.55)" />
          <stop offset="50%" stopColor="oklch(0.85 0.11 65 / 0.18)" />
          <stop offset="100%" stopColor="oklch(0.85 0.10 65 / 0)" />
        </radialGradient>
        <linearGradient id="kyndill-candle-wax" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.94 0.014 75)" />
          <stop offset="50%" stopColor="oklch(0.96 0.010 75)" />
          <stop offset="100%" stopColor="oklch(0.90 0.018 70)" />
        </linearGradient>
        <linearGradient id="kyndill-flame-outer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.15 60)" />
          <stop offset="100%" stopColor="oklch(0.62 0.16 45)" />
        </linearGradient>
        <linearGradient id="kyndill-flame-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.92 0.10 95)" />
          <stop offset="100%" stopColor="oklch(0.78 0.14 75)" />
        </linearGradient>
      </defs>

      <ellipse className="candle-illustration__halo" cx="100" cy="128" rx="92" ry="116" fill="url(#kyndill-candle-halo)" />

      <ellipse cx="100" cy="282" rx="34" ry="7" fill="oklch(0.42 0.02 60 / 0.22)" />

      <rect x="84" y="170" width="32" height="112" rx="3" fill="url(#kyndill-candle-wax)" />
      <path
        className="candle-illustration__wax-highlight"
        d="M 84 178 C 81 184 83 192 86 196 L 86 178 Z"
        fill="oklch(0.90 0.015 75)"
      />
      <path
        className="candle-illustration__wax-highlight candle-illustration__wax-highlight--right"
        d="M 116 184 C 119 190 117 200 114 204 L 114 184 Z"
        fill="oklch(0.90 0.015 75)"
      />

      <line
        className="candle-illustration__wick"
        x1="100"
        y1="170"
        x2="100"
        y2="156"
        stroke="oklch(0.28 0.02 50)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <g className="candle-illustration__sparks" aria-hidden="true">
        <circle className="candle-illustration__spark candle-illustration__spark--one" cx="82" cy="132" r="2.2" />
        <circle className="candle-illustration__spark candle-illustration__spark--two" cx="119" cy="124" r="1.8" />
        <circle className="candle-illustration__spark candle-illustration__spark--three" cx="97" cy="92" r="1.6" />
      </g>

      <path
        className="candle-illustration__flame candle-illustration__flame--outer"
        d="M 100 96 C 84 110 76 132 88 150 C 94 160 106 160 112 150 C 124 132 116 110 100 96 Z"
        fill="url(#kyndill-flame-outer)"
      />
      <path
        className="candle-illustration__flame candle-illustration__flame--inner"
        d="M 100 114 C 92 124 90 138 96 148 C 99 152 101 152 104 148 C 110 138 108 124 100 114 Z"
        fill="url(#kyndill-flame-inner)"
      />
      <ellipse className="candle-illustration__glow-core" cx="100" cy="138" rx="3" ry="6" fill="oklch(0.96 0.06 95)" />
    </svg>
  );
}
