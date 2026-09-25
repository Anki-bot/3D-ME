"use client";

import { useMediaQuery } from "./useMediaQuery";

export const FINE_POINTER_QUERY = "(pointer: fine)";
export const HOVER_QUERY = "(hover: hover)";

export function useFinePointer(): boolean {
  const isFine = useMediaQuery(FINE_POINTER_QUERY);
  const canHover = useMediaQuery(HOVER_QUERY);
  return isFine && canHover;
}
