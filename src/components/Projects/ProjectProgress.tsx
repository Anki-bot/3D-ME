interface ProjectProgressProps {
  current: number;
  total: number;
}

export default function ProjectProgress({
  current,
  total,
}: ProjectProgressProps) {
  return (
    <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 lg:flex xl:right-10">
      <div className="flex flex-col items-end gap-4">
        {/* Label */}
        <span className="mb-2 text-[9px] uppercase tracking-[0.35em] text-zinc-600 [writing-mode:vertical-rl]">
          Work
        </span>

        {/* Indicators */}
        <div className="flex flex-col items-end gap-3">
          {Array.from({ length: total }).map((_, index) => {
            const isActive = index === current;

            return (
              <div
                key={index}
                className="flex items-center gap-2"
              >
                <span
                  className={`text-[9px] font-medium tracking-[0.2em] transition-all duration-500 ${
                    isActive
                      ? "translate-x-0 text-white opacity-100"
                      : "translate-x-1 text-zinc-600 opacity-0"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div
                  className={`origin-right rounded-full transition-all duration-700 ease-out ${
                    isActive
                      ? "h-14 w-[2px] scale-y-100 bg-white"
                      : "h-8 w-[2px] scale-y-75 bg-white/20"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Total */}
        <span className="mt-2 text-[9px] tracking-[0.2em] text-zinc-600">
          / {String(total).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}