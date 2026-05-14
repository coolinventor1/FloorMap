import { describe, expect, it } from "vitest";

import { entityIcon } from "../../src/lib/entity-display";
import type { HassEntity } from "../../src/lib/types";

function createState(
  entity_id: string,
  state: string,
  attributes: HassEntity["attributes"] = {}
): HassEntity {
  return { entity_id, state, attributes };
}

describe("entity display helpers", () => {
  it("shows open and closed icons for door sensors", () => {
    const closedDoor = createState("binary_sensor.front_door", "off", {
      device_class: "door",
    });
    const openDoor = createState("binary_sensor.front_door", "on", {
      device_class: "door",
    });

    expect(entityIcon(closedDoor.entity_id, closedDoor, undefined)).toBe("mdi:door-closed");
    expect(entityIcon(openDoor.entity_id, openDoor, undefined)).toBe("mdi:door-open");
  });

  it("shows open and closed icons for garage door covers", () => {
    const closedGarage = createState("cover.garage_door", "closed", {
      device_class: "garage",
    });
    const openGarage = createState("cover.garage_door", "open", {
      device_class: "garage",
    });

    expect(entityIcon(closedGarage.entity_id, closedGarage, undefined)).toBe("mdi:garage");
    expect(entityIcon(openGarage.entity_id, openGarage, undefined)).toBe("mdi:garage-open");
  });

  it("falls back to the entity icon for non-door entities", () => {
    const light = createState("light.kitchen", "on", {
      icon: "mdi:lightbulb",
    });

    expect(entityIcon(light.entity_id, light, undefined)).toBe("mdi:lightbulb");
  });
});
