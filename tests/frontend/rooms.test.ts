import { describe, expect, it } from "vitest";

import { clampRoomRect, createRoomLightingBackground, roomContainsPlacement } from "../../src/lib/rooms";
import type { FloorMapPlacement, FloorMapRoom } from "../../src/lib/types";

describe("room helpers", () => {
  const room: FloorMapRoom = {
    id: "living",
    name: "Living Room",
    x: 0.1,
    y: 0.1,
    width: 0.4,
    height: 0.4,
  };

  it("detects placements inside the room", () => {
    const placement: FloorMapPlacement = {
      entity_id: "light.lamp",
      x: 0.2,
      y: 0.25,
      show_state: false,
      size: 1,
    };

    expect(roomContainsPlacement(room, placement)).toBe(true);
    expect(
      roomContainsPlacement(room, {
        ...placement,
        x: 0.8,
      })
    ).toBe(false);
  });

  it("clamps room rectangles to the normalized stage", () => {
    expect(
      clampRoomRect({
        ...room,
        x: 0.95,
        width: 0.4,
      }).width
    ).toBeCloseTo(0.05);
  });

  it("builds a multi-gradient light overlay for active lights", () => {
    const background = createRoomLightingBackground(room, [
      {
        entity_id: "light.lamp",
        x: 0.2,
        y: 0.25,
        show_state: false,
        size: 1.3,
      },
    ]);

    expect(background).toContain("radial-gradient");
    expect(background).toContain("linear-gradient");
  });
});
