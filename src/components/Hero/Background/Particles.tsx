export default function Particles() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-30"
    >
      <div className="absolute left-[18%] top-[24%] h-1 w-1 rounded-full bg-white/40" />
      <div className="absolute left-[42%] top-[18%] h-1 w-1 rounded-full bg-white/30" />
      <div className="absolute right-[24%] top-[32%] h-1 w-1 rounded-full bg-white/40" />
      <div className="absolute left-[32%] bottom-[24%] h-1 w-1 rounded-full bg-white/30" />
      <div className="absolute right-[14%] bottom-[20%] h-1 w-1 rounded-full bg-white/40" />
      <div className="absolute left-[8%] bottom-[38%] h-1 w-1 rounded-full bg-white/20" />
    </div>
  );
}