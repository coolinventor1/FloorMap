import { describe, expect, it } from "vitest";

import {
  createRoomLightingBackground,
  defaultRoomLabelPosition,
  roomBounds,
  roomContainsPlacement,
  roomPolygonPoints,
} from "../../src/lib/rooms";
import type { FloorMapPlacement, FloorMapRoom } from "../../src/lib/types";

describe("room helpers", () => {
  const room: FloorMapRoom = {
    id: "living",
    name: "Living Room",
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.5, y: 0.5 },
      { x: 0.1, y: 0.5 },
    ],
    label_x: 0.12,
    label_y: 0.12,
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

  it("calculates room bounds and polygon points", () => {
    expect(roomBounds(room)).toEqual({
      x: 0.1,
      y: 0.1,
      width: 0.4,
      height: 0.4,
    });
    expect(roomPolygonPoints(room)).toContain("0.00,0.00");
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

  it("defaults the room label near the room's upper-left bounds", () => {
    expect(defaultRoomLabelPosition({ points: room.points })).toEqual({
      x: 0.11,
      y: 0.11,
    });
  });
});
