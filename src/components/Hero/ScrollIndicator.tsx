"use client";

export default function ScrollIndicator() {
  return (
    <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
      <div className="flex h-12 w-7 justify-center rounded-full border border-white/40">
        <div className="mt-2 h-2 w-2 animate-bounce rounded-full bg-white" />
      </div>

      <span className="text-xs uppercase tracking-[0.35em] text-gray-500">
        Scroll
      </span>
    </div>
  );
}