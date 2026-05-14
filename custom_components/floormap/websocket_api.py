"""WebSocket API for FloorMap."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.core import HomeAssistant

from .const import DATA_MANAGER, DOMAIN, WEBSOCKET_GET_LAYOUT, WEBSOCKET_SAVE_LAYOUT
from .storage import FloorMapLayoutManager


def get_manager(hass: HomeAssistant) -> FloorMapLayoutManager | None:
    """Return the active manager if FloorMap is configured."""
    return hass.data.get(DOMAIN, {}).get(DATA_MANAGER)


@websocket_api.websocket_command(
    {
        vol.Required("type"): WEBSOCKET_GET_LAYOUT,
    }
)
@websocket_api.async_response
async def websocket_get_layout(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict
) -> None:
    """Return the active layout."""
    manager = get_manager(hass)
    if manager is None:
        connection.send_error(msg["id"], "not_found", "FloorMap is not configured")
        return

    layout = manager.get_layout()
    layout["image_url"] = "/api/floormap/floorplan" if layout["image"] else None
    connection.send_result(msg["id"], layout)


@websocket_api.websocket_command(
    {
        vol.Required("type"): WEBSOCKET_SAVE_LAYOUT,
        vol.Required("placements"): [
            {
                vol.Required("entity_id"): str,
                vol.Required("x"): vol.Coerce(float),
                vol.Required("y"): vol.Coerce(float),
                vol.Optional("show_state", default=False): bool,
            }
        ],
    }
)
@websocket_api.async_response
async def websocket_save_layout(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict
) -> None:
    """Persist a full layout replacement."""
    manager = get_manager(hass)
    if manager is None:
        connection.send_error(msg["id"], "not_found", "FloorMap is not configured")
        return

    try:
        layout = await manager.async_save_layout(msg["placements"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return

    layout["image_url"] = "/api/floormap/floorplan" if layout["image"] else None
    connection.send_result(msg["id"], layout)


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register FloorMap WebSocket commands."""
    websocket_api.async_register_command(hass, websocket_get_layout)
    websocket_api.async_register_command(hass, websocket_save_layout)

