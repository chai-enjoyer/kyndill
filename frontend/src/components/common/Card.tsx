import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  selected?: boolean;
  as?: 'div' | 'article' | 'section';
}

export function Card({
  interactive = false,
  selected = false,
  className,
  as = 'div',
  ...rest
}: CardProps) {
  const Component = as;
  const classes = [
    'card',
    interactive ? 'card--interactive' : null,
    selected ? 'card--selected' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Component className={classes} {...rest} />;
}
