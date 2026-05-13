import { useRef, type CSSProperties } from 'react';
import { createFlameMotionStyle, type FlameMotionStyle } from '../../lib/flameMotion';

interface FlameIconProps {
  className?: string;
  size?: number;
  title?: string;
  style?: CSSProperties;
}

function classes(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function FlameIcon({ className, size = 20, title, style }: FlameIconProps) {
  const motionStyle = useRef<FlameMotionStyle | null>(null);
  if (!motionStyle.current) motionStyle.current = createFlameMotionStyle();

  const labelled = Boolean(title);
  const mergedStyle = style ? { ...motionStyle.current, ...style } : motionStyle.current;

  return (
    <svg
      className={classes('animated-flame', className)}
      style={mergedStyle}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      role={labelled ? 'img' : undefined}
      aria-label={title}
      aria-hidden={labelled ? undefined : true}
    >
      {title && <title>{title}</title>}
      <path
        className="animated-flame__outer"
        d="M12.4 2.3c1.4 4.1 5 6.2 5 10.8 0 4.1-3.1 7.2-7.3 7.2-3.6 0-6.3-2.6-6.3-6.1 0-3.1 2-5.1 3.8-6.8.2 2.3 1 3.7 2.4 4.6-.5-3.7.5-6.8 2.4-9.7Z"
      />
      <path
        className="animated-flame__inner"
        d="M12 13.2c1.5 1.3 2.3 2.5 2.3 3.9 0 2-1.5 3.5-3.7 3.5-1.9 0-3.2-1.3-3.2-3.2 0-1.7 1.1-2.8 2.4-3.9.1 1.1.6 1.9 1.5 2.5-.3-1.1.1-2 .7-2.8Z"
      />
      <circle className="animated-flame__spark animated-flame__spark--one" cx="6.5" cy="9" r="1" />
      <circle className="animated-flame__spark animated-flame__spark--two" cx="18.2" cy="7.4" r="0.85" />
    </svg>
  );
}
