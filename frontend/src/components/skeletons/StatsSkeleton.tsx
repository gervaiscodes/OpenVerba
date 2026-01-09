import { Skeleton } from "../Skeleton";

export function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <Skeleton
        width="200px"
        height="40px"
        className="mx-auto mb-8"
      />
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-xl p-8">
        <Skeleton width="100%" height="300px" borderRadius="8px" />
      </div>
    </div>
  );
}
