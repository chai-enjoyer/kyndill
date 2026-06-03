import { useEffect, useRef, useState } from 'react';

interface AnimatedValueProps {
  value: number | string;
  className?: string;
  ariaLabel?: string;
}

function classes(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function AnimatedValue({ value, className, ariaLabel }: AnimatedValueProps) {
  const previous = useRef(value);
  const firstRender = useRef(true);
  const frame = useRef<number | null>(null);
  const timeout = useRef<number | null>(null);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      previous.current = value;
      return;
    }
    if (previous.current === value) return;
    previous.current = value;
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    setChanged(false);
    frame.current = window.requestAnimationFrame(() => {
      setChanged(true);
      timeout.current = window.setTimeout(() => setChanged(false), 560);
    });

    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      if (timeout.current !== null) window.clearTimeout(timeout.current);
    };
  }, [value]);

  return (
    <span
      className={classes('animated-value', changed && 'animated-value--changed', className)}
      aria-label={ariaLabel}
    >
      {value}
    </span>
  );
}
