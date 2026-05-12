import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  rounded?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function LoadingSkeleton({
  width = '100%',
  height = '1em',
  rounded = false,
  className,
  style,
}: SkeletonProps) {
  const classes = ['skeleton', rounded ? 'skeleton--round' : null, className]
    .filter(Boolean)
    .join(' ');
  return (
    <span
      className={classes}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}
