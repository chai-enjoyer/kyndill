import type { CSSProperties } from 'react';

export type FlameMotionStyle = CSSProperties & Record<`--${string}`, string>;

function between(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function seconds(value: number): string {
  return `${value.toFixed(2)}s`;
}

function negativeSeconds(max: number): string {
  return seconds(-between(0, max));
}

export function createFlameMotionStyle(): FlameMotionStyle {
  return {
    '--flame-outer-duration': seconds(between(2.25, 3.25)),
    '--flame-inner-duration': seconds(between(1.45, 2.35)),
    '--flame-spark-duration': seconds(between(2.8, 4.2)),
    '--flame-halo-duration': seconds(between(4.2, 5.6)),
    '--flame-core-duration': seconds(between(1.35, 2.1)),
    '--flame-flicker-duration': seconds(between(5.2, 7.1)),
    '--flame-wick-duration': seconds(between(1.7, 2.5)),
    '--flame-wax-duration': seconds(between(4.4, 6.2)),
    '--flame-outer-delay': negativeSeconds(3),
    '--flame-inner-delay': negativeSeconds(2.4),
    '--flame-spark-one-delay': negativeSeconds(3.8),
    '--flame-spark-two-delay': seconds(between(0.7, 2.2)),
    '--flame-spark-three-delay': seconds(between(1.5, 3.3)),
    '--flame-halo-delay': negativeSeconds(5),
    '--flame-core-delay': negativeSeconds(2),
    '--flame-flicker-delay': negativeSeconds(6),
    '--flame-wick-delay': negativeSeconds(2),
    '--flame-wax-delay': negativeSeconds(5),
    '--flame-wax-right-delay': seconds(between(0.8, 2.2)),
    '--flame-glow-alpha': between(0.22, 0.42).toFixed(2),
    '--flame-glow-size': `${between(4, 8).toFixed(1)}px`,
  };
}
