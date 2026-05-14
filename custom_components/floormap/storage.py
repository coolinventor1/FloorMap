"""Storage manager for FloorMap."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import ALLOWED_IMAGE_TYPES, DOMAIN, EVENT_LAYOUT_UPDATED, FLOORPLAN_DIRECTORY, STORAGE_KEY, STORAGE_VERSION
from .util import LayoutDict, default_layout, image_dimensions_from_bytes, normalize_placements, utc_now_iso


@dataclass
class FloorMapLayoutManager:
    """Manage persisted FloorMap state."""

    hass: HomeAssistant
    store: Store[LayoutDict]
    floorplan_dir: Path
    _layout: LayoutDict = field(default_factory=default_layout)

    async def async_load(self) -> None:
        """Load layout state from storage."""
        loaded = await self.store.async_load()
        if not isinstance(loaded, dict):
            self._layout = default_layout()
            return

        try:
            placements = normalize_placements(list(loaded.get("placements", [])))
        except (TypeError, ValueError):
            placements = []

        image = loaded.get("image")
        self._layout = {
            "image": image if isinstance(image, dict) else None,
            "placements": placements,
        }

    def get_layout(self) -> LayoutDict:
        """Return a copy of the current layout."""
        return {
            "image": dict(self._layout["image"]) if self._layout["image"] else None,
            "placements": [dict(placement) for placement in self._layout["placements"]],
        }

    async def async_save_layout(self, placements: list[dict]) -> LayoutDict:
        """Persist a full placement list."""
        self._layout["placements"] = normalize_placements(placements)
        await self.store.async_save(self._layout)
        self.hass.bus.async_fire(EVENT_LAYOUT_UPDATED)
        return self.get_layout()

    async def async_save_floorplan(self, content: bytes, media_type: str) -> LayoutDict:
        """Persist an uploaded floor plan image."""
        suffix = ALLOWED_IMAGE_TYPES[media_type]
        floorplan_path = self.floorplan_dir / f"floorplan{suffix}"
        self.floorplan_dir.mkdir(parents=True, exist_ok=True)

        await self.hass.async_add_executor_job(self._delete_previous_floorplans, floorplan_path)
        await self.hass.async_add_executor_job(floorplan_path.write_bytes, content)

        width, height = image_dimensions_from_bytes(content, media_type)
        self._layout["image"] = {
            "filename": floorplan_path.name,
            "media_type": media_type,
            "width": width,
            "height": height,
            "updated_at": utc_now_iso(),
        }
        await self.store.async_save(self._layout)
        self.hass.bus.async_fire(EVENT_LAYOUT_UPDATED)
        return self.get_layout()

    async def async_floorplan_path(self) -> Path | None:
        """Return the current floor plan path if it exists."""
        image = self._layout["image"]
        if not image:
            return None
        floorplan_path = self.floorplan_dir / image["filename"]
        exists = await self.hass.async_add_executor_job(floorplan_path.exists)
        return floorplan_path if exists else None

    def _delete_previous_floorplans(self, keep_path: Path) -> None:
        """Remove prior saved floor plan files."""
        for suffix in ALLOWED_IMAGE_TYPES.values():
            candidate = self.floorplan_dir / f"floorplan{suffix}"
            if candidate != keep_path and candidate.exists():
                candidate.unlink()


def create_manager(hass: HomeAssistant) -> FloorMapLayoutManager:
    """Create a configured layout manager."""
    store = Store[LayoutDict](hass, STORAGE_VERSION, STORAGE_KEY)
    return FloorMapLayoutManager(
        hass=hass,
        store=store,
        floorplan_dir=Path(hass.config.path(FLOORPLAN_DIRECTORY, DOMAIN)),
    )

