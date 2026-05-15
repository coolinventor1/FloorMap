"""WebSocket API for FloorMap."""

from __future__ import annotations

import base64
import binascii

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.core import HomeAssistant

from .const import (
    ALLOWED_IMAGE_TYPES,
    DATA_MANAGER,
    DOMAIN,
    WEBSOCKET_GET_LAYOUT,
    WEBSOCKET_SAVE_LAYOUT,
    WEBSOCKET_UPLOAD_FLOORPLAN,
)
from .storage import FloorMapLayoutManager


def get_manager(hass: HomeAssistant) -> FloorMapLayoutManager | None:
    """Return the active manager if FloorMap is configured."""
    return hass.data.get(DOMAIN, {}).get(DATA_MANAGER)


async def async_serialize_layout_for_frontend(
    manager: FloorMapLayoutManager, layout: dict
) -> dict:
    """Attach frontend-friendly image data to a layout payload."""
    serialized = dict(layout)
    image = serialized.get("image")
    serialized["image_url"] = "/api/floormap/floorplan" if image else None
    serialized["image_data_url"] = None

    if image:
        content = await manager.async_floorplan_bytes()
        if content:
            encoded = base64.b64encode(content).decode("ascii")
            serialized["image_data_url"] = f"data:{image['media_type']};base64,{encoded}"

    return serialized


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

    layout = await async_serialize_layout_for_frontend(manager, manager.get_layout())
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
                vol.Optional("size", default=1.0): vol.Coerce(float),
            }
        ],
        vol.Optional("rooms", default=[]): [
            {
                vol.Required("id"): str,
                vol.Required("name"): str,
                vol.Required("points"): [
                    {
                        vol.Required("x"): vol.Coerce(float),
                        vol.Required("y"): vol.Coerce(float),
                    }
                ],
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
        layout = await manager.async_save_layout(msg["placements"], msg["rooms"])
    except ValueError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return

    layout = await async_serialize_layout_for_frontend(manager, layout)
    connection.send_result(msg["id"], layout)


@websocket_api.websocket_command(
    {
        vol.Required("type"): WEBSOCKET_UPLOAD_FLOORPLAN,
        vol.Required("file_name"): str,
        vol.Required("media_type"): str,
        vol.Required("content_base64"): str,
    }
)
@websocket_api.async_response
async def websocket_upload_floorplan(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict
) -> None:
    """Persist an uploaded floor plan image over the authenticated websocket."""
    manager = get_manager(hass)
    if manager is None:
        connection.send_error(msg["id"], "not_found", "FloorMap is not configured")
        return

    media_type = msg["media_type"].lower()
    if media_type not in ALLOWED_IMAGE_TYPES:
        connection.send_error(
            msg["id"],
            "invalid_format",
            "Only PNG and JPG floor plans are supported",
        )
        return

    try:
        content = base64.b64decode(msg["content_base64"], validate=True)
    except binascii.Error:
        connection.send_error(msg["id"], "invalid_format", "Invalid image payload")
        return

    if not content:
        connection.send_error(msg["id"], "invalid_format", "Uploaded file is empty")
        return

    layout = await manager.async_save_floorplan(content=content, media_type=media_type)
    layout = await async_serialize_layout_for_frontend(manager, layout)
    connection.send_result(msg["id"], layout)


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register FloorMap WebSocket commands."""
    websocket_api.async_register_command(hass, websocket_get_layout)
    websocket_api.async_register_command(hass, websocket_save_layout)
    websocket_api.async_register_command(hass, websocket_upload_floorplan)
