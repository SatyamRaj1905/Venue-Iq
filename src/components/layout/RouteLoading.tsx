import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface RouteLoadingProps {
  label: string;
}

export function RouteLoading({ label }: RouteLoadingProps) {
  return (
    <div className="route-loading" role="status" aria-label={label}>
      <div className="route-loading__heading">
        <LoadingSkeleton label={label} lines={2} />
      </div>
      <div className="route-loading__grid">
        <LoadingSkeleton label={label} lines={5} />
        <LoadingSkeleton label={label} lines={6} />
      </div>
    </div>
  );
}
