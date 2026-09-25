"use client";

import { useSyncExternalStore } from "react";

export const PINNED_PROJECT_MIN_WIDTH = 1024;
export const PINNED_PROJECT_MIN_HEIGHT = 720;
export const PINNED_PROJECT_MEDIA_QUERY =
  `(min-width: ${PINNED_PROJECT_MIN_WIDTH}px) and (min-height: ${PINNED_PROJECT_MIN_HEIGHT}px)`;
export const PROJECT_MODE_SERVER_FALLBACK = "flow" as const;

export type ProjectMode = "flow" | "pinned";

interface ProjectViewport {
  width: number;
  height: number;
}

export function selectProjectMode({
  width,
  height,
}: ProjectViewport): ProjectMode {
  return width >= PINNED_PROJECT_MIN_WIDTH &&
    height >= PINNED_PROJECT_MIN_HEIGHT
    ? "pinned"
    : "flow";
}

function getClientSnapshot(): ProjectMode {
  if (typeof window === "undefined") {
    return PROJECT_MODE_SERVER_FALLBACK;
  }

  return window.matchMedia(PINNED_PROJECT_MEDIA_QUERY).matches
    ? "pinned"
    : "flow";
}

function getServerSnapshot(): ProjectMode {
  return PROJECT_MODE_SERVER_FALLBACK;
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(PINNED_PROJECT_MEDIA_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);

  // A desktop query can already match before hydration subscribes. Notify once
  // so the SSR flow snapshot is reconciled without waiting for a resize.
  onStoreChange();

  return () => {
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

export function useProjectMode(): ProjectMode {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
