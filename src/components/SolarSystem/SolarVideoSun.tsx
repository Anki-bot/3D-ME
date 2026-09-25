/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "@/data/projects";

gsap.registerPlugin(ScrollTrigger);

export default function SolarVideoSun({
  containerRef,
  onProjectChange,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onProjectChange: (i: number) => void;
}) {
  const sunRef = useRef<HTMLVideoElement>(null);
  const sunContainerRef = useRef<HTMLDivElement>(null);
  const orbitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !orbitsRef.current) return;

    const ctx = gsap.context(() => {
      const planets = orbitsRef.current!.querySelectorAll("[data-planet]");
      const sunEl = sunContainerRef.current;
      // Initially hide planets - sun only
      planets.forEach((el) => {
        const planet = el as HTMLElement;
        planet.style.opacity = "0";
        planet.style.transform = "translate3d(0,0,0) scale(0.5)";
      });

      const trigger = ScrollTrigger.create({
        trigger: containerRef.current!,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          // Update project index
          const idx = Math.min(Math.floor(progress * projects.length + 0.25), projects.length - 1);
          onProjectChange(idx);

          // Sun same size, moves down with swipe but stays stuck to top and follows till end (vertical solar system)
          if (sunEl) {
            const sunScale = 1 + progress * 0.03;
            const sunY = progress * 40; // subtle down movement, stays at top via sticky top-6
            const sunRotate = progress * 8;
            const sunWobble = Math.sin(progress * Math.PI * 2) * 4;
            sunEl.style.transform = `translateX(-50%) translateY(${sunY + sunWobble}px) scale(${sunScale}) rotate(${sunRotate}deg)`;
            sunEl.style.willChange = "transform";
          }
          // Orbits twist like Active Theory backbone - whole system tilts
          const orbitsEl = orbitsRef.current;
          if (orbitsEl) {
            const tilt = progress * 12; // degrees
            const twist = Math.sin(progress * Math.PI) * 6;
            orbitsEl.style.transform = `perspective(900px) rotateX(${12 + tilt * 0.3}deg) rotateZ(${twist}deg)`;
            orbitsEl.style.transformOrigin = "center center";
          }

          // Planets: sun only 0-0.08, then 8 planets fade in orbiting
          planets.forEach((el, i) => {
            const radius = 135 + i * 34;
            const speed = 0.55 - i * 0.045;
            const baseAngle = (i * 45 * Math.PI) / 180;
            const angle = baseAngle + progress * Math.PI * 2 * speed;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.38;
            const planet = el as HTMLElement;
            const appearProgress = Math.max(0, Math.min(1, (progress - 0.06 - i * 0.04) / 0.2));
            const scale = (0.85 + Math.sin(angle) * 0.1 + 0.1) * (0.5 + appearProgress * 0.5);
            planet.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
            planet.style.zIndex = `${Math.round(10 + Math.sin(angle) * 5)}`;
            planet.style.opacity = `${appearProgress * (0.88 + Math.sin(angle) * 0.1)}`;
          });
        },
      });

      return () => trigger.kill();
    });

    return () => ctx.revert();
  }, [containerRef, onProjectChange]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Starfield */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(ellipse at center top, transparent 20%, rgba(0,0,0,0.85) 75%)" }} />

      {/* Sun - same size, stuck to top of page, follows till end (vertical solar system) */}
      <div
        ref={sunContainerRef}
        className="absolute left-1/2 top-6 z-20 h-[280px] w-[280px] -translate-x-1/2 overflow-hidden rounded-full shadow-[0_0_80px_rgba(255,160,50,0.6)] will-change-transform sm:h-[360px] sm:w-[360px] lg:h-[420px] lg:w-[420px]"
        style={{ transform: "translate3d(-50%, 0, 0)" }}
      >
        <video
          ref={sunRef}
          src="/videos/sun.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          style={{ filter: "brightness(1.1) contrast(1.05)" }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_60px_rgba(255,200,80,0.4)]" />
      </div>

      {/* Orbits container - vertical solar system, centred at sun top */}
      <div ref={orbitsRef} className="absolute inset-0 flex items-start justify-center pt-[420px] will-change-transform sm:pt-[460px] lg:pt-[500px]">
        {/* Orbits - 8 rings for 8 planets */}
        {projects.map((_, i) => (
          <div
            key={`orbit-${i}`}
            className="pointer-events-none absolute rounded-full border border-white/10"
            style={{
              width: `${260 + i * 68}px`,
              height: `${260 + i * 68}px`,
              opacity: 0.12 + (i % 2) * 0.06,
            }}
          />
        ))}

        {/* Planets - 8 projects */}
        {projects.map((project, i) => (
          <div
            key={project.id}
            data-planet={i}
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center will-change-transform sm:h-24 sm:w-24"
            style={{ transform: "translate3d(0,0,0)" }}
          >
            <div className="group relative flex h-full w-full cursor-pointer items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white/20 bg-zinc-900 shadow-xl transition-transform group-hover:scale-110 sm:h-16 sm:w-16">
                <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-white backdrop-blur sm:block">
                {project.title.split(" ")[0]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
