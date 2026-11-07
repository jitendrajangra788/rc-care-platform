import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function PatientDetailLoading() {
  return (
    <div className="dash-stack" aria-busy="true" aria-label="Loading patient">
      <Skeleton className="h-4 w-32" />
      <div className="soft-panel space-y-1.5 rounded-[var(--radius-xl)] border border-[var(--line)] p-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <SkeletonText lines={2} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-[var(--radius-xl)]" />
    </div>
  );
}
