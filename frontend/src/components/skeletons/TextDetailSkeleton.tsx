import { Skeleton } from "../Skeleton";

export function TextDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm mb-6">
        <Skeleton width="80px" height="20px" />
        <span className="opacity-30">→</span>
        <Skeleton width="80px" height="20px" />
      </div>

      <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-zinc-800 mb-4 sm:mb-8 gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            width="100%"
            height="36px"
            borderRadius="6px"
            className="flex-1"
          />
        ))}
      </div>

      <div className="flex gap-4 items-center justify-center text-zinc-500 font-medium text-sm">
        <Skeleton width="120px" height="32px" borderRadius="6px" />
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 sm:p-4 rounded-xl bg-[#0a0a0a] border border-zinc-800 transition-colors duration-200 ease-in-out mb-3">
          <div className="flex flex-wrap gap-y-2 gap-x-1 sm:gap-y-5 sm:gap-x-3 items-end justify-center mb-4 sm:mb-10">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex flex-col gap-[0.35rem]">
                <Skeleton width="40px" height="14px" />
                <Skeleton width="50px" height="20px" />
              </div>
            ))}
          </div>
          <div className="pt-3 sm:pt-8 border-t border-dashed border-zinc-800 flex flex-col gap-3 sm:gap-4 items-center text-center">
            <Skeleton width="90%" height="22px" />
            <Skeleton width="80%" height="16px" />
          </div>
        </div>
      ))}
    </div>
  );
}
