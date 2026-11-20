/** A shimmering placeholder while content loads; screen readers hear the label instead. */
export default function Skeleton({ label, block = false }) {
  if (block) return <span className="skeleton"><span className="skeleton-block" role="img" aria-label={label} /></span>;
  return (
    <span className="skeleton" role="status" aria-label={label}>
      <span /><span /><span />
    </span>
  );
}
