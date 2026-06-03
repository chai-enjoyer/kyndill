// геометрические заглушки по видам; mood меняет только глаза/рот

import type { CSSProperties } from 'react';

export type PetSpecies = 'star' | 'cube' | 'sphere' | 'pyramid';
export type PetMood = 'happy' | 'neutral' | 'sad';

interface PlaceholderPetProps {
  species: PetSpecies;
  mood?: PetMood;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const SPECIES_COLORS: Record<PetSpecies, string> = {
  star: '#7A9B76',
  cube: '#D4A574',
  sphere: '#C17B68',
  pyramid: '#8BA3B5',
};

const FACE_OFFSET: Record<PetSpecies, number> = {
  star: 0,
  cube: 0,
  sphere: 0,
  pyramid: 20,
};

export function PlaceholderPet({
  species,
  mood = 'neutral',
  size = 160,
  className,
  style,
}: PlaceholderPetProps) {
  const color = SPECIES_COLORS[species];
  const faceShiftY = FACE_OFFSET[species];

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={`${species} pet, ${mood}`}
      className={className}
      style={style}
    >
      {renderShape(species, color)}
      <g transform={`translate(0, ${faceShiftY})`}>{renderFace(mood)}</g>
    </svg>
  );
}

function renderShape(species: PetSpecies, color: string) {
  switch (species) {
    case 'star':
      return <polygon points="80,18 96,58 139,61 106,88 117,131 80,108 43,131 54,88 21,61 64,58" fill={color} />;
    case 'cube':
      return <rect x="20" y="20" width="120" height="120" rx="22" fill={color} />;
    case 'sphere':
      return <circle cx="80" cy="80" r="60" fill={color} />;
    case 'pyramid':
      return <polygon points="80,22 142,140 18,140" fill={color} />;
  }
}

function renderFace(mood: PetMood) {
  const eye = 'oklch(0.22 0.012 50 / 0.78)';
  switch (mood) {
    case 'happy':
      return (
        <>
          <circle cx="62" cy="76" r="4.5" fill={eye} />
          <circle cx="98" cy="76" r="4.5" fill={eye} />
          <path
            d="M 60 96 Q 80 110 100 96"
            stroke={eye}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
    case 'sad':
      return (
        <>
          <circle cx="62" cy="76" r="4.5" fill={eye} />
          <circle cx="98" cy="76" r="4.5" fill={eye} />
          <path
            d="M 60 102 Q 80 90 100 102"
            stroke={eye}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      );
    case 'neutral':
    default:
      return (
        <>
          <circle cx="62" cy="76" r="4.5" fill={eye} />
          <circle cx="98" cy="76" r="4.5" fill={eye} />
          <line
            x1="64"
            y1="100"
            x2="96"
            y2="100"
            stroke={eye}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      );
  }
}
