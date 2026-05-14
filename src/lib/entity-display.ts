import type { EntityIndexEntry, HassEntity } from "./types";

const DOOR_DEVICE_CLASSES = new Set(["door", "opening"]);
const GARAGE_DEVICE_CLASSES = new Set(["garage", "garage_door"]);
const OPEN_STATES = new Set(["on", "open", "opening"]);
const CLOSED_STATES = new Set(["off", "closed", "closing"]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizedState(stateObj: HassEntity | undefined): string | undefined {
  return asString(stateObj?.state)?.toLowerCase();
}

function entityDomain(entityId: string): string {
  const [domain] = entityId.split(".");
  return domain ?? "";
}

function entityDeviceClass(stateObj: HassEntity | undefined): string | undefined {
  return asString(stateObj?.attributes.device_class)?.toLowerCase();
}

function tokenPattern(token: string): RegExp {
  return new RegExp(`(^|[\\s._-])${token}([\\s._-]|$)`, "i");
}

function matchesToken(value: string | undefined, token: string): boolean {
  return value ? tokenPattern(token).test(value) : false;
}

function entityBaseIcon(stateObj: HassEntity | undefined, fallback: EntityIndexEntry | undefined): string {
  return asString(stateObj?.attributes.icon) ?? fallback?.icon ?? "mdi:map-marker";
}

function entityDoorKind(
  entityId: string,
  stateObj: HassEntity | undefined,
  fallback: EntityIndexEntry | undefined
): "door" | "garage" | null {
  const deviceClass = entityDeviceClass(stateObj);
  if (deviceClass && GARAGE_DEVICE_CLASSES.has(deviceClass)) {
    return "garage";
  }
  if (deviceClass && DOOR_DEVICE_CLASSES.has(deviceClass)) {
    return "door";
  }

  const icon = entityBaseIcon(stateObj, fallback).toLowerCase();
  if (matchesToken(icon, "garage")) {
    return "garage";
  }
  if (matchesToken(icon, "door")) {
    return "door";
  }

  const label = entityLabel(stateObj, fallback, entityId).toLowerCase();
  if (matchesToken(label, "garage")) {
    return "garage";
  }
  if (matchesToken(label, "door")) {
    return "door";
  }

  const domain = entityDomain(entityId);
  if (domain === "binary_sensor" || domain === "cover") {
    if (matchesToken(entityId.toLowerCase(), "garage")) {
      return "garage";
    }
    if (matchesToken(entityId.toLowerCase(), "door")) {
      return "door";
    }
  }

  return null;
}

function doorStateIcon(kind: "door" | "garage", stateObj: HassEntity | undefined): string | null {
  const state = normalizedState(stateObj);
  if (!state) {
    return null;
  }

  if (OPEN_STATES.has(state)) {
    return kind === "garage" ? "mdi:garage-open" : "mdi:door-open";
  }
  if (CLOSED_STATES.has(state)) {
    return kind === "garage" ? "mdi:garage" : "mdi:door-closed";
  }

  return null;
}

export function entityLabel(
  stateObj: HassEntity | undefined,
  fallback: EntityIndexEntry | undefined,
  entityId: string
): string {
  return asString(stateObj?.attributes.friendly_name) ?? fallback?.name ?? entityId;
}

export function entityIcon(
  entityId: string,
  stateObj: HassEntity | undefined,
  fallback: EntityIndexEntry | undefined
): string {
  const doorKind = entityDoorKind(entityId, stateObj, fallback);
  if (doorKind) {
    const statefulIcon = doorStateIcon(doorKind, stateObj);
    if (statefulIcon) {
      return statefulIcon;
    }
  }

  return entityBaseIcon(stateObj, fallback);
}

export function entityUsesLampPalette(
  entityId: string,
  stateObj: HassEntity | undefined,
  fallback: EntityIndexEntry | undefined
): boolean {
  const domain = entityDomain(entityId);
  if (domain === "light") {
    return true;
  }

  const name = entityLabel(stateObj, fallback, entityId).toLowerCase();
  if (name.includes("lamp")) {
    return true;
  }

  const icon = entityBaseIcon(stateObj, fallback).toLowerCase();
  return icon.includes("lamp") || icon.includes("lightbulb");
}
