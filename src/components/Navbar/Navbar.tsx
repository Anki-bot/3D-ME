"use client";

import { useState } from "react";

const navItems = [
  { label: "Home", target: "home" },
  { label: "Work", target: "projects" },
  { label: "About", target: "about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (target: string) => {
    document.getElementById(target)?.scrollIntoView({
      behavior: "smooth",
    });

    setMenuOpen(false);
  };

  return (
    <nav className="fixed left-0 top-0 z-50 w-full px-6 py-5 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/20 px-5 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => scrollToSection("home")}
          className="text-sm font-semibold tracking-[0.35em] text-white"
        >
          IMMERSIVE
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="group relative text-xs uppercase tracking-[0.25em] text-zinc-400 transition-colors duration-300 hover:text-white"
            >
              {item.label}

              <span className="absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-300 group-hover:scale-x-100" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 md:hidden"
        >
          <span className="relative h-3 w-4">
            <span
              className={`absolute left-0 top-0 h-px w-full bg-white transition-transform duration-300 ${
                menuOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-px w-full bg-white transition-opacity duration-300 ${
                menuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 top-3 h-px w-full bg-white transition-transform duration-300 ${
                menuOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        className={`mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl transition-all duration-500 md:hidden ${
          menuOpen
            ? "max-h-64 opacity-100"
            : "pointer-events-none max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col p-4">
          {navItems.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="border-b border-white/10 px-3 py-4 text-left text-xs uppercase tracking-[0.25em] text-zinc-400 transition-colors duration-300 last:border-0 hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}