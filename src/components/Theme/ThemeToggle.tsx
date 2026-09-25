"use client";

import { motion } from "framer-motion";
import BatmanLogo from "./BatmanLogo";
import SupermanLogo from "./SupermanLogo";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode (Superman)" : "Switch to dark mode (Batman)"}
      aria-pressed={isDark}
      className="group relative flex items-center gap-1 rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-xl transition-all hover:border-white/40 hover:bg-black/60"
      style={{
        background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.9)",
        borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
      }}
    >
      {/* Batman — Dark */}
      <div
        className="relative flex h-9 w-14 items-center justify-center rounded-full transition-colors"
        style={{ filter: isDark ? "none" : "brightness(0)" }}
      >
        <BatmanLogo className="h-5 w-8" />
        <span className="sr-only">Batman Dark</span>
      </div>

      {/* Superman — Light */}
      <div className="relative flex h-9 w-14 items-center justify-center rounded-full transition-colors">
        <SupermanLogo className="h-6 w-5" />
        <span className="sr-only">Superman Light</span>
      </div>

      {/* Sliding indicator */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="pointer-events-none absolute top-1 h-9 w-14 rounded-full border shadow-lg"
        style={{
          left: isDark ? 4 : 60,
          background: isDark ? "#000000" : "#DC2626",
          borderColor: isDark ? "#333333" : "#991B1B",
          boxShadow: isDark ? "0 0 20px rgba(0,0,0,0.6)" : "0 0 20px rgba(220,38,38,0.5)",
        }}
        aria-hidden="true"
      >
        <div className="flex h-full w-full items-center justify-center">
          {isDark ? <BatmanLogo className="h-4 w-6" /> : <SupermanLogo className="h-5 w-4" />}
        </div>
      </motion.div>
    </button>
  );
}
