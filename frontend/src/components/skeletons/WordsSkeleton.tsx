import { Skeleton } from "../Skeleton";

export function WordsSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto py-3 px-2 sm:py-12 sm:px-6">
      <Skeleton
        width="120px"
        height="40px"
        className="mx-auto mb-8"
      />
      <div className="flex flex-col gap-8">
        {[1, 2].map((groupIndex) => (
          <div
            key={groupIndex}
            className="bg-[#0a0a0a] rounded-xl border border-zinc-800 overflow-hidden"
          >
            <div className="bg-[#18181b] p-4 sm:px-6 border-b border-zinc-800">
              <Skeleton width="150px" height="24px" />
            </div>
            <div>
              {[1, 2, 3].map((wordIndex) => (
                <div
                  key={wordIndex}
                  className="p-4 sm:px-6 border-b border-zinc-800 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton
                      width="2rem"
                      height="2rem"
                      borderRadius="50%"
                      className="flex-shrink-0"
                    />
                    <div className="flex flex-col gap-2">
                      <Skeleton width="120px" height="18px" />
                      <Skeleton width="100px" height="14px" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton width="90px" height="20px" borderRadius="6px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
