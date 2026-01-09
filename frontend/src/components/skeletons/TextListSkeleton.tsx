import { Skeleton } from "../Skeleton";

export function TextListSkeleton() {
  return (
    <div className="grid gap-4 max-w-[800px] mx-auto">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-800 transition-colors duration-200 ease-in-out mb-3 text-left"
        >
          <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm mb-2">
            <Skeleton width="80px" height="20px" />
            <span className="opacity-30">→</span>
            <Skeleton width="80px" height="20px" />
            <span className="ml-auto">
              <Skeleton width="100px" height="16px" />
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton width="100%" height="20px" />
            <Skeleton width="80%" height="20px" />
          </div>
        </div>
      ))}
    </div>
  );
}
