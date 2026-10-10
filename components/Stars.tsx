export function Stars({ rating, count, label }: { rating: number; count?: number; label?: string }) {
  const full = Math.round(rating);
  return (
    <span className="small" aria-label={`${rating.toFixed(1)} / 5`}>
      <span className="stars">{"★".repeat(full)}{"☆".repeat(5 - full)}</span>{" "}
      {count != null && (count > 0 ? <span className="muted">{rating.toFixed(1)} ({count}{label ? ` ${label}` : ""})</span> : null)}
    </span>
  );
}
