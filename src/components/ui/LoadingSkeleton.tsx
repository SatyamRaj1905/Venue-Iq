interface LoadingSkeletonProps {
  label?: string;
  lines?: number;
  announce?: boolean;
}

export function LoadingSkeleton({
  label = "Loading content",
  lines = 4,
  announce = true,
}: LoadingSkeletonProps) {
  return (
    <div
      className="skeleton"
      role={announce ? "status" : undefined}
      aria-label={announce ? label : undefined}
    >
      {announce ? <span className="sr-only">{label}</span> : null}
      <div className="skeleton__eyebrow" aria-hidden="true" />
      <div className="skeleton__title" aria-hidden="true" />
      {Array.from({ length: lines }, (_, index) => (
        <div
          className="skeleton__line"
          key={index}
          style={{ width: `${Math.max(46, 100 - index * 11)}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
