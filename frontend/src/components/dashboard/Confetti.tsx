// CSS-only burst rendered next to a habit checkbox on completion.
// Twelve pieces with deterministic dx/dy/colors set in components.css.

export function Confetti() {
  return (
    <span className="confetti" aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={`confetti__piece confetti__piece--${i}`} />
      ))}
    </span>
  );
}
