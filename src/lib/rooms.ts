import type { FloorMapPlacement, FloorMapPoint, FloorMapRoom } from "./types";

export const MIN_ROOM_POINTS = 3;

function clampCoordinate(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roomBoundsFromPoints(points: FloorMapPoint[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    x: minX,
    y: minY,
    width: Math.max(0.001, maxX - minX),
    height: Math.max(0.001, maxY - minY),
  };
}

export function clampRoomPoint(point: FloorMapPoint): FloorMapPoint {
  return {
    x: clampCoordinate(point.x),
    y: clampCoordinate(point.y),
  };
}

export function roomBounds(room: FloorMapRoom): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return roomBoundsFromPoints(room.points);
}

export function roomStyle(room: FloorMapRoom): string {
  const bounds = roomBounds(room);
  return `left:${bounds.x * 100}%; top:${bounds.y * 100}%; width:${bounds.width * 100}%; height:${bounds.height * 100}%;`;
}

export function defaultRoomLabelPosition(room: Pick<FloorMapRoom, "points">): FloorMapPoint {
  const bounds = roomBoundsFromPoints(room.points);
  return {
    x: clampCoordinate(bounds.x + 0.01),
    y: clampCoordinate(bounds.y + 0.01),
  };
}

export function roomLabelStyle(room: Pick<FloorMapRoom, "label_x" | "label_y">): string {
  return `left:${room.label_x * 100}%; top:${room.label_y * 100}%;`;
}

export function roomRelativePoints(room: FloorMapRoom): FloorMapPoint[] {
  const bounds = roomBounds(room);
  return room.points.map((point) => ({
    x: ((point.x - bounds.x) / bounds.width) * 100,
    y: ((point.y - bounds.y) / bounds.height) * 100,
  }));
}

export function roomPolygonPoints(room: FloorMapRoom): string {
  return roomRelativePoints(room)
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

export function roomClipPath(room: FloorMapRoom): string {
  return `polygon(${roomRelativePoints(room)
    .map((point) => `${point.x.toFixed(2)}% ${point.y.toFixed(2)}%`)
    .join(", ")})`;
}

export function roomContainsPoint(room: FloorMapRoom, x: number, y: number): boolean {
  let inside = false;
  for (let index = 0, previous = room.points.length - 1; index < room.points.length; previous = index++) {
    const currentPoint = room.points[index];
    const previousPoint = room.points[previous];
    const intersects =
      currentPoint.y > y !== previousPoint.y > y &&
      x <
        ((previousPoint.x - currentPoint.x) * (y - currentPoint.y)) /
          ((previousPoint.y - currentPoint.y) || Number.EPSILON) +
          currentPoint.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

export function roomContainsPlacement(room: FloorMapRoom, placement: FloorMapPlacement): boolean {
  return roomContainsPoint(room, placement.x, placement.y);
}

export function normalizeRoomPoints(points: FloorMapPoint[]): FloorMapPoint[] {
  return points.map((point) => clampRoomPoint(point));
}

export function createRoomLightingBackground(
  room: FloorMapRoom,
  placements: FloorMapPlacement[]
): string | undefined {
  const bounds = roomBounds(room);
  const gradients = placements
    .filter((placement) => roomContainsPlacement(room, placement))
    .map((placement) => {
      const localX = ((placement.x - bounds.x) / bounds.width) * 100;
      const localY = ((placement.y - bounds.y) / bounds.height) * 100;
      const inner = Math.min(16, 7 + placement.size * 4);
      const middle = Math.min(32, 15 + placement.size * 7);
      const outer = Math.min(54, 26 + placement.size * 9);
      return `radial-gradient(circle at ${localX.toFixed(2)}% ${localY.toFixed(2)}%, rgba(255, 250, 232, 0.88) 0%, rgba(255, 234, 168, 0.46) ${inner.toFixed(2)}%, rgba(255, 216, 112, 0.18) ${middle.toFixed(2)}%, rgba(255, 206, 92, 0.03) ${outer.toFixed(2)}%, rgba(255, 206, 92, 0) 100%)`;
    });

  if (!gradients.length) {
    return undefined;
  }

  gradients.push("linear-gradient(180deg, rgba(255, 244, 210, 0.05), rgba(255, 244, 210, 0.08))");
  return gradients.join(", ");
}
