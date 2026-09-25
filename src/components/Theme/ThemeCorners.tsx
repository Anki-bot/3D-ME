"use client";

import BatmanLogo from "./BatmanLogo";
import SupermanLogo from "./SupermanLogo";
import { useTheme } from "./ThemeProvider";

export default function ThemeCorners() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      {/* Batman — left corner */}
      <button
        onClick={() => setTheme("dark")}
        aria-label="Dark mode (Batman)"
        aria-pressed={isDark}
        className={`fixed left-4 top-4 z-[110] flex h-12 w-16 items-center justify-center rounded-full border backdrop-blur-xl transition-all hover:scale-105 sm:left-6 sm:top-6 ${
          isDark ? "border-black bg-white shadow-[0_0_20px_rgba(0,0,0,0.15)]" : "border-black/10 bg-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        }`}
        style={{ borderColor: isDark ? "#000000" : "rgba(0,0,0,0.12)" }}
      >
        <div style={{ filter: "invert(1) brightness(0.95)" }}>
          <BatmanLogo className="h-5 w-10" />
        </div>
      </button>

      {/* Superman — right corner */}
      <button
        onClick={() => setTheme("light")}
        aria-label="Light mode (Superman)"
        aria-pressed={!isDark}
        className={`fixed right-4 top-4 z-[110] flex h-12 w-16 items-center justify-center rounded-full border backdrop-blur-xl transition-all hover:scale-105 sm:right-6 sm:top-6 ${
          !isDark ? "border-red-600 bg-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "border-white/20 bg-black/40 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        }`}
        style={{ borderColor: !isDark ? "#DC2626" : "rgba(255,255,255,0.2)" }}
      >
        <SupermanLogo className="h-6 w-6" />
      </button>
    </>
  );
}
