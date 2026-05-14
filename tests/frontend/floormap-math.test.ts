import { describe, expect, it } from "vitest";

import {
  clampCoordinate,
  pointerToNormalizedPoint,
  zoomAroundPoint,
} from "../../src/lib/floormap-math";

describe("floormap math helpers", () => {
  it("clamps normalized coordinates", () => {
    expect(clampCoordinate(-1)).toBe(0);
    expect(clampCoordinate(0.35)).toBe(0.35);
    expect(clampCoordinate(2)).toBe(1);
  });

  it("converts pointer coordinates into normalized map points", () => {
    const rect = {
      left: 10,
      top: 20,
      width: 400,
      height: 200,
    } as DOMRect;

    expect(
      pointerToNormalizedPoint(210, 120, rect, { scale: 1, panX: 0, panY: 0 })
    ).toEqual({ x: 0.5, y: 0.5 });
  });

  it("zooms around the chosen anchor point", () => {
    expect(
      zoomAroundPoint({ scale: 1, panX: 0, panY: 0 }, 120, 80, 2)
    ).toEqual({ scale: 2, panX: -120, panY: -80 });
  });
});

