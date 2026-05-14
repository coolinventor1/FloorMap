"""The FloorMap integration."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import (
    DATA_MANAGER,
    DATA_STATIC_REGISTERED,
    DATA_VIEWS_REGISTERED,
    DOMAIN,
    FRONTEND_BUNDLE_URL,
    FRONTEND_STATIC_URL,
    NAME,
    PANEL_COMPONENT_NAME,
    PANEL_ICON,
    PANEL_URL_PATH,
)
from .http_api import FloorMapFloorplanView
from .storage import FloorMapLayoutManager, create_manager
from .websocket_api import async_register_websocket_api

PLATFORMS: list[Platform] = []


@dataclass
class FloorMapRuntimeData:
    """Runtime data kept on the config entry."""

    manager: FloorMapLayoutManager


FloorMapConfigEntry = ConfigEntry[FloorMapRuntimeData]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up FloorMap integration resources."""
    hass.data.setdefault(DOMAIN, {})

    if not hass.data[DOMAIN].get(DATA_STATIC_REGISTERED):
        static_dir = Path(__file__).parent / "static"
        await hass.http.async_register_static_paths(
            [StaticPathConfig(FRONTEND_STATIC_URL, str(static_dir), True)]
        )
        hass.data[DOMAIN][DATA_STATIC_REGISTERED] = True

    if not hass.data[DOMAIN].get(DATA_VIEWS_REGISTERED):
        hass.http.register_view(FloorMapFloorplanView(hass))
        async_register_websocket_api(hass)
        hass.data[DOMAIN][DATA_VIEWS_REGISTERED] = True

    return True


async def async_setup_entry(hass: HomeAssistant, entry: FloorMapConfigEntry) -> bool:
    """Set up FloorMap from a config entry."""
    manager = create_manager(hass)
    await manager.async_load()

    frontend.add_extra_js_url(hass, FRONTEND_BUNDLE_URL)
    frontend.async_register_built_in_panel(
        hass,
        PANEL_COMPONENT_NAME,
        sidebar_title=NAME,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL_PATH,
        require_admin=False,
    )

    hass.data[DOMAIN][DATA_MANAGER] = manager
    entry.runtime_data = FloorMapRuntimeData(manager=manager)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: FloorMapConfigEntry) -> bool:
    """Unload FloorMap."""
    frontend.remove_extra_js_url(hass, FRONTEND_BUNDLE_URL)
    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    hass.data.get(DOMAIN, {}).pop(DATA_MANAGER, None)
    return True

