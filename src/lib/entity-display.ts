import type { EntityIndexEntry, HassEntity, RGBColor } from "./types";

const DOOR_DEVICE_CLASSES = new Set(["door", "opening"]);
const GARAGE_DEVICE_CLASSES = new Set(["garage", "garage_door"]);
const OPEN_STATES = new Set(["on", "open", "opening"]);
const CLOSED_STATES = new Set(["off", "closed", "closing"]);
const COLOR_LIGHT_MODES = new Set(["hs", "xy", "rgb", "rgbw", "rgbww"]);

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function clampByte(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)));
}

function asColorTuple(value: unknown, length: number): number[] | undefined {
  if (!Array.isArray(value) || value.length < length) {
    return undefined;
  }

  const numbers = value
    .slice(0, length)
    .map((entry) => asFiniteNumber(entry))
    .filter((entry): entry is number => entry !== undefined);

  return numbers.length === length ? numbers : undefined;
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

function hsColorToRgb(hue: number, saturation: number): RGBColor {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = Math.max(0, Math.min(1, saturation / 100));
  const chroma = normalizedSaturation;
  const segment = normalizedHue / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) {
    red = chroma;
    green = second;
  } else if (segment < 2) {
    red = second;
    green = chroma;
  } else if (segment < 3) {
    green = chroma;
    blue = second;
  } else if (segment < 4) {
    green = second;
    blue = chroma;
  } else if (segment < 5) {
    red = second;
    blue = chroma;
  } else {
    red = chroma;
    blue = second;
  }

  const match = 1 - chroma;
  return {
    r: clampByte((red + match) * 255),
    g: clampByte((green + match) * 255),
    b: clampByte((blue + match) * 255),
  };
}

function xyColorToRgb(x: number, y: number): RGBColor {
  const safeX = Math.max(0, Math.min(1, x));
  const safeY = Math.max(0.0001, Math.min(1, y));
  const z = Math.max(0, 1 - safeX - safeY);
  const luminance = 1;
  const tristimulusX = (luminance / safeY) * safeX;
  const tristimulusZ = (luminance / safeY) * z;

  let red =
    tristimulusX * 1.656492 -
    luminance * 0.354851 -
    tristimulusZ * 0.255038;
  let green =
    -tristimulusX * 0.707196 +
    luminance * 1.655397 +
    tristimulusZ * 0.036152;
  let blue =
    tristimulusX * 0.051713 -
    luminance * 0.121364 +
    tristimulusZ * 1.01153;

  red = Math.max(0, red);
  green = Math.max(0, green);
  blue = Math.max(0, blue);

  const maxComponent = Math.max(red, green, blue, 0.0001);
  red /= maxComponent;
  green /= maxComponent;
  blue /= maxComponent;

  const gammaCorrect = (value: number): number =>
    value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;

  return {
    r: clampByte(gammaCorrect(red) * 255),
    g: clampByte(gammaCorrect(green) * 255),
    b: clampByte(gammaCorrect(blue) * 255),
  };
}

function currentLightColorMode(stateObj: HassEntity | undefined): string | undefined {
  return asString(stateObj?.attributes.color_mode)?.toLowerCase();
}

function lightIsSetToColor(stateObj: HassEntity | undefined): boolean {
  const colorMode = currentLightColorMode(stateObj);
  if (colorMode) {
    return COLOR_LIGHT_MODES.has(colorMode);
  }

  return Boolean(
    asColorTuple(stateObj?.attributes.rgb_color, 3) ||
      asColorTuple(stateObj?.attributes.rgbw_color, 4) ||
      asColorTuple(stateObj?.attributes.rgbww_color, 5) ||
      asColorTuple(stateObj?.attributes.hs_color, 2) ||
      asColorTuple(stateObj?.attributes.xy_color, 2)
  );
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

export function entityLampGlowColor(
  entityId: string,
  stateObj: HassEntity | undefined
): RGBColor | undefined {
  if (entityDomain(entityId) !== "light" || !lightIsSetToColor(stateObj)) {
    return undefined;
  }

  const rgbColor = asColorTuple(stateObj?.attributes.rgb_color, 3);
  if (rgbColor) {
    return { r: clampByte(rgbColor[0]), g: clampByte(rgbColor[1]), b: clampByte(rgbColor[2]) };
  }

  const rgbwColor = asColorTuple(stateObj?.attributes.rgbw_color, 4);
  if (rgbwColor) {
    return { r: clampByte(rgbwColor[0]), g: clampByte(rgbwColor[1]), b: clampByte(rgbwColor[2]) };
  }

  const rgbwwColor = asColorTuple(stateObj?.attributes.rgbww_color, 5);
  if (rgbwwColor) {
    return {
      r: clampByte(rgbwwColor[0]),
      g: clampByte(rgbwwColor[1]),
      b: clampByte(rgbwwColor[2]),
    };
  }

  const hsColor = asColorTuple(stateObj?.attributes.hs_color, 2);
  if (hsColor) {
    return hsColorToRgb(hsColor[0], hsColor[1]);
  }

  const xyColor = asColorTuple(stateObj?.attributes.xy_color, 2);
  if (xyColor) {
    return xyColorToRgb(xyColor[0], xyColor[1]);
  }

  return undefined;
}
