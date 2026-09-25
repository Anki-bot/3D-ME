"use client";

import { useEffect, useState } from "react";

export const ACTIVE_SECTION_IDS = ["home", "about", "projects"] as const;

export type ActiveSectionId = (typeof ACTIVE_SECTION_IDS)[number];

export const ACTIVE_SECTION_OBSERVER_OPTIONS: IntersectionObserverInit = {
  root: null,
  rootMargin: "-40% 0px -59.9% 0px",
  threshold: 0,
};

export function selectActiveSection(
  intersectingSections: ReadonlySet<string>,
): ActiveSectionId | null {
  return (
    ACTIVE_SECTION_IDS.find((id) => intersectingSections.has(id)) ?? null
  );
}

export function getNavigationAriaCurrent(
  activeSection: ActiveSectionId,
  linkSection: ActiveSectionId,
): "page" | undefined {
  return activeSection === linkSection ? "page" : undefined;
}

function isActiveSectionId(id: string): id is ActiveSectionId {
  return ACTIVE_SECTION_IDS.some((sectionId) => sectionId === id);
}

export function useActiveSection() {
  const [activeSection, setActiveSection] =
    useState<ActiveSectionId>("home");

  useEffect(() => {
    const intersectingSections = new Set<ActiveSectionId>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = entry.target.id;

        if (!isActiveSectionId(id)) {
          continue;
        }

        if (entry.isIntersecting) {
          intersectingSections.add(id);
        } else {
          intersectingSections.delete(id);
        }
      }

      const nextActiveSection = selectActiveSection(intersectingSections);

      if (nextActiveSection) {
        setActiveSection(nextActiveSection);
      }
    }, ACTIVE_SECTION_OBSERVER_OPTIONS);

    for (const id of ACTIVE_SECTION_IDS) {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    }

    return () => {
      intersectingSections.clear();
      observer.disconnect();
    };
  }, []);

  return activeSection;
}
