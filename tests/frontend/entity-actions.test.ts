import { describe, expect, it } from "vitest";

import { resolveEntityAction } from "../../src/lib/entity-actions";

describe("resolveEntityAction", () => {
  it("prefers the generic homeassistant toggle action", () => {
    expect(
      resolveEntityAction(["homeassistant.toggle", "light.turn_on"], "light.kitchen", "off")
    ).toEqual({ domain: "homeassistant", service: "toggle" });
  });

  it("falls back to turn_on and turn_off pairs", () => {
    expect(
      resolveEntityAction(["switch.turn_on", "switch.turn_off"], "switch.fan", "on")
    ).toEqual({ domain: "switch", service: "turn_off" });
  });

  it("returns null for read-only entities", () => {
    expect(resolveEntityAction(["sensor.calibrate"], "sensor.temp", "23")).toBeNull();
  });
});
