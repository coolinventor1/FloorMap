import type { FloorMapPlacement, FloorMapRoom } from "./types";

export const MIN_ROOM_SIZE = 0.05;

export function clampRoomSize(value: number): number {
  return Math.max(MIN_ROOM_SIZE, Math.min(1, value));
}

export function roomContainsPoint(room: FloorMapRoom, x: number, y: number): boolean {
  return x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height;
}

export function roomContainsPlacement(room: FloorMapRoom, placement: FloorMapPlacement): boolean {
  return roomContainsPoint(room, placement.x, placement.y);
}

export function clampRoomRect(room: FloorMapRoom): FloorMapRoom {
  const x = Math.max(0, Math.min(1, room.x));
  const y = Math.max(0, Math.min(1, room.y));
  const width = Math.min(clampRoomSize(room.width), 1 - x);
  const height = Math.min(clampRoomSize(room.height), 1 - y);
  return { ...room, x, y, width, height };
}

export function createRoomLightingBackground(
  room: FloorMapRoom,
  placements: FloorMapPlacement[]
): string | undefined {
  const gradients = placements
    .filter((placement) => roomContainsPlacement(room, placement))
    .map((placement) => {
      const localX = ((placement.x - room.x) / room.width) * 100;
      const localY = ((placement.y - room.y) / room.height) * 100;
      const inner = Math.min(26, 12 + placement.size * 8);
      const middle = Math.min(58, 28 + placement.size * 14);
      const outer = Math.min(96, 56 + placement.size * 18);
      return `radial-gradient(circle at ${localX.toFixed(2)}% ${localY.toFixed(2)}%, rgba(255, 249, 224, 0.82) 0%, rgba(255, 232, 156, 0.52) ${inner.toFixed(2)}%, rgba(255, 216, 112, 0.24) ${middle.toFixed(2)}%, rgba(255, 206, 92, 0.04) ${outer.toFixed(2)}%, rgba(255, 206, 92, 0) 100%)`;
    });

  if (!gradients.length) {
    return undefined;
  }

  gradients.push("linear-gradient(180deg, rgba(255, 240, 190, 0.10), rgba(255, 240, 190, 0.18))");
  return gradients.join(", ");
}
