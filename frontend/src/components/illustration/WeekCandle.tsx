import { useId, useRef, type CSSProperties } from 'react';
import { createFlameMotionStyle, type FlameMotionStyle } from '../../lib/flameMotion';

interface WeekCandleProps {
  /* 0-100, задаёт размер/яркость пламени. null = в этот день не было привычек,
   * 0 = были, но ничего не сделано. И то и другое - незажжённая свеча. */
  rate: number | null;
  className?: string;
}

// мини-версия CandleIllustration для недельного графика прогресса.
// SVG тянется на весь контейнер, xMidYMax держит свечу по центру и у низа ячейки.
export function WeekCandle({ rate, className }: WeekCandleProps) {
  const reactId = useId();
  const idBase = reactId.replace(/[^a-zA-Z0-9_-]/g, '');
  const haloId = `wc-halo-${idBase}`;
  const waxId = `wc-wax-${idBase}`;
  const flameOuterId = `wc-outer-${idBase}`;
  const flameInnerId = `wc-inner-${idBase}`;

  const scheduled = rate !== null;
  const clamped = Math.min(100, Math.max(0, rate ?? 0));
  // свеча стоит всегда, но горит только если в этот день что-то сделано
  const isLit = scheduled && clamped > 0;

  // процент выполнения = высота и яркость пламени
  const flameScale = 0.7 + clamped / 200;
  const flameOpacity = 0.55 + clamped / 220;
  const haloOpacity = 0.2 + clamped / 220;

  // рандомные задержки/длительности, чтобы свечи не «дышали» синхронно
  const motionStyle = useRef<FlameMotionStyle | null>(null);
  if (!motionStyle.current) motionStyle.current = createFlameMotionStyle();

  const styleVars = {
    ...motionStyle.current,
    '--wc-flame-scale': flameScale.toFixed(2),
    '--wc-flame-opacity': flameOpacity.toFixed(2),
    '--wc-halo-opacity': haloOpacity.toFixed(2),
  } as CSSProperties;

  return (
    <svg
      viewBox="0 0 64 120"
      preserveAspectRatio="xMidYMax meet"
      role="presentation"
      aria-hidden="true"
      className={['week-candle', !scheduled && 'week-candle--rest', className].filter(Boolean).join(' ')}
      style={styleVars}
    >
      <defs>
        <radialGradient id={haloId} cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="oklch(0.88 0.13 70 / 0.55)" />
          <stop offset="55%" stopColor="oklch(0.85 0.11 65 / 0.16)" />
          <stop offset="100%" stopColor="oklch(0.85 0.10 65 / 0)" />
        </radialGradient>
        <linearGradient id={waxId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="oklch(0.94 0.014 75)" />
          <stop offset="50%" stopColor="oklch(0.97 0.010 75)" />
          <stop offset="100%" stopColor="oklch(0.90 0.018 70)" />
        </linearGradient>
        <linearGradient id={flameOuterId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.15 60)" />
          <stop offset="100%" stopColor="oklch(0.62 0.16 45)" />
        </linearGradient>
        <linearGradient id={flameInnerId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.92 0.10 95)" />
          <stop offset="100%" stopColor="oklch(0.78 0.14 75)" />
        </linearGradient>
      </defs>

      {/* Halo + flame only when the candle is lit. The wax + wick stay
          regardless so the chart still has structure on quiet days. */}
      {isLit && (
        <ellipse
          className="week-candle__halo"
          cx="32"
          cy="38"
          rx="30"
          ry="36"
          fill={`url(#${haloId})`}
        />
      )}

      {/* Candle wax body, anchored to the bottom of the viewBox. */}
      <rect
        x="24"
        y="60"
        width="16"
        height="58"
        rx="3"
        fill={`url(#${waxId})`}
      />
      <line x1="25.5" y1="64" x2="25.5" y2="114" stroke="oklch(1 0 0 / 0.35)" strokeWidth="1" strokeLinecap="round" />
      <line x1="38.5" y1="68" x2="38.5" y2="110" stroke="oklch(0.4 0.02 60 / 0.08)" strokeWidth="1" strokeLinecap="round" />

      {/* Wick. */}
      <line
        x1="32"
        y1="60"
        x2="32"
        y2="52"
        stroke="oklch(0.28 0.02 50)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* пламя только когда горит; свои классы, чтобы .animated-flame__* не перебил градиенты */}
      {isLit && (
        <g className="week-candle__flame">
          <path
            className="week-candle__flame-outer"
            d="M 32 12 C 18 24 12 40 22 52 C 27 58 37 58 42 52 C 52 40 46 24 32 12 Z"
            fill={`url(#${flameOuterId})`}
          />
          <path
            className="week-candle__flame-inner"
            d="M 32 26 C 25 34 23 44 28 51 C 30 54 34 54 36 51 C 41 44 39 34 32 26 Z"
            fill={`url(#${flameInnerId})`}
          />
          <ellipse
            className="week-candle__flame-core"
            cx="32"
            cy="42"
            rx="2.4"
            ry="4.6"
            fill="oklch(0.96 0.06 95)"
          />
        </g>
      )}
    </svg>
  );
}
