import type { TransformState } from "./types";

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampCoordinate(value: number): number {
  return clamp(value, 0, 1);
}

export function zoomAroundPoint(
  transform: TransformState,
  anchorX: number,
  anchorY: number,
  nextScale: number
): TransformState {
  const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
  const ratio = scale / transform.scale;
  return {
    scale,
    panX: anchorX - (anchorX - transform.panX) * ratio,
    panY: anchorY - (anchorY - transform.panY) * ratio,
  };
}

export function pointerToNormalizedPoint(
  pointerX: number,
  pointerY: number,
  rect: DOMRect,
  transform: TransformState
): { x: number; y: number } {
  const unscaledX = (pointerX - rect.left - transform.panX) / transform.scale;
  const unscaledY = (pointerY - rect.top - transform.panY) / transform.scale;
  return {
    x: clampCoordinate(unscaledX / rect.width),
    y: clampCoordinate(unscaledY / rect.height),
  };
}

