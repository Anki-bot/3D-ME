"use client";

import { ReactNode, useRef } from "react";
import { useGSAPReveal } from "@/hooks/animations/useGSAPReveal";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Reveal({
  children,
  className,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAPReveal(ref, delay);

  return (
    <div
      ref={ref}
      className={className}
    >
      {children}
    </div>
  );
}