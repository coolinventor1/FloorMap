import type { ResolvedServiceAction } from "./types";

export function resolveEntityAction(
  serviceIds: string[],
  entityId: string,
  currentState?: string
): ResolvedServiceAction | null {
  const domain = entityId.split(".")[0];
  const actions = new Set(serviceIds);

  if (actions.has("homeassistant.toggle")) {
    return { domain: "homeassistant", service: "toggle" };
  }

  if (actions.has(`${domain}.toggle`)) {
    return { domain, service: "toggle" };
  }

  const isOn = currentState === "on";

  if (actions.has("homeassistant.turn_on") && actions.has("homeassistant.turn_off")) {
    return { domain: "homeassistant", service: isOn ? "turn_off" : "turn_on" };
  }

  if (actions.has(`${domain}.turn_on`) && actions.has(`${domain}.turn_off`)) {
    return { domain, service: isOn ? "turn_off" : "turn_on" };
  }

  return null;
}

