interface ProjectProgressProps {
  current: number;
  total: number;
}

export default function ProjectProgress({
  current,
  total,
}: ProjectProgressProps) {
  return (
    <div className="fixed right-8 top-1/2 hidden -translate-y-1/2 lg:flex flex-col items-center gap-3">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-10 w-[2px] rounded-full transition-all duration-300 ${
            index === current
              ? "bg-white"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}