"""Pure utility helpers for FloorMap."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TypedDict


class ImageMetaDict(TypedDict):
    """Stored floor plan metadata."""

    filename: str
    media_type: str
    width: int | None
    height: int | None
    updated_at: str


class PlacementDict(TypedDict):
    """Stored marker placement."""

    entity_id: str
    x: float
    y: float
    show_state: bool


class LayoutDict(TypedDict):
    """Stored layout payload."""

    image: ImageMetaDict | None
    placements: list[PlacementDict]


def default_layout() -> LayoutDict:
    """Return the default empty layout."""
    return {"image": None, "placements": []}


def utc_now_iso() -> str:
    """Return a stable UTC ISO timestamp."""
    return datetime.now(UTC).isoformat()


def clamp_coordinate(value: float) -> float:
    """Clamp a coordinate to the 0..1 range."""
    return max(0.0, min(1.0, float(value)))


def normalize_placements(raw_placements: list[dict]) -> list[PlacementDict]:
    """Normalize, validate, and deduplicate placement data."""
    normalized: list[PlacementDict] = []
    seen: set[str] = set()

    for raw in raw_placements:
        entity_id = str(raw["entity_id"]).strip()
        if not entity_id or "." not in entity_id or entity_id.startswith(".") or entity_id.endswith("."):
            raise ValueError(f"Invalid entity_id: {entity_id}")
        if entity_id in seen:
            raise ValueError(f"Duplicate entity_id: {entity_id}")
        seen.add(entity_id)
        normalized.append(
            PlacementDict(
                entity_id=entity_id,
                x=clamp_coordinate(float(raw["x"])),
                y=clamp_coordinate(float(raw["y"])),
                show_state=bool(raw.get("show_state", False)),
            )
        )

    return normalized


def image_dimensions_from_bytes(data: bytes, media_type: str) -> tuple[int | None, int | None]:
    """Best-effort PNG/JPEG dimension parsing without optional dependencies."""
    if media_type == "image/png":
        return _png_dimensions(data)
    if media_type in {"image/jpeg", "image/jpg"}:
        return _jpeg_dimensions(data)
    return (None, None)


def _png_dimensions(data: bytes) -> tuple[int | None, int | None]:
    if len(data) < 24 or data[:8] != b"\x89PNG\r\n\x1a\n":
        return (None, None)
    return (int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big"))


def _jpeg_dimensions(data: bytes) -> tuple[int | None, int | None]:
    if len(data) < 4 or data[0:2] != b"\xff\xd8":
        return (None, None)
    index = 2
    while index + 9 < len(data):
        if data[index] != 0xFF:
            index += 1
            continue
        marker = data[index + 1]
        index += 2
        if marker in {0xD8, 0xD9}:
            continue
        if index + 2 > len(data):
            break
        block_length = int.from_bytes(data[index : index + 2], "big")
        if block_length < 2 or index + block_length > len(data):
            break
        if marker in {
            0xC0,
            0xC1,
            0xC2,
            0xC3,
            0xC5,
            0xC6,
            0xC7,
            0xC9,
            0xCA,
            0xCB,
            0xCD,
            0xCE,
            0xCF,
        }:
            if index + 7 > len(data):
                break
            height = int.from_bytes(data[index + 3 : index + 5], "big")
            width = int.from_bytes(data[index + 5 : index + 7], "big")
            return (width, height)
        index += block_length
    return (None, None)

