"""HTTP API for FloorMap."""

from __future__ import annotations

from aiohttp import hdrs, web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import ALLOWED_IMAGE_TYPES, DATA_MANAGER, DOMAIN, FLOORPLAN_API_PATH
from .storage import FloorMapLayoutManager


def get_manager(hass: HomeAssistant) -> FloorMapLayoutManager | None:
    """Return the currently loaded layout manager."""
    return hass.data.get(DOMAIN, {}).get(DATA_MANAGER)


class FloorMapFloorplanView(HomeAssistantView):
    """Serve and update the active floor plan image."""

    url = FLOORPLAN_API_PATH
    name = "api:floormap:floorplan"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the view."""
        self.hass = hass

    async def get(self, request: web.Request) -> web.StreamResponse:
        """Return the uploaded floor plan."""
        manager = get_manager(self.hass)
        if manager is None:
            raise web.HTTPNotFound(text="FloorMap is not configured")

        floorplan_path = await manager.async_floorplan_path()
        if floorplan_path is None:
            raise web.HTTPNotFound(text="No floor plan uploaded")

        return web.FileResponse(floorplan_path)

    async def post(self, request: web.Request) -> web.Response:
        """Upload or replace the active floor plan image."""
        manager = get_manager(self.hass)
        if manager is None:
            raise web.HTTPNotFound(text="FloorMap is not configured")

        if request.method != hdrs.METH_POST or not request.content_type.startswith("multipart/"):
            raise web.HTTPBadRequest(text="Expected multipart form data")

        reader = await request.multipart()
        file_field = None

        while part := await reader.next():
            if part.name == "file":
                file_field = part
                break

        if file_field is None:
            raise web.HTTPBadRequest(text="Missing file field")

        media_type = (file_field.headers.get(hdrs.CONTENT_TYPE) or "").lower()
        if media_type not in ALLOWED_IMAGE_TYPES:
            raise web.HTTPBadRequest(text="Only PNG and JPG floor plans are supported")

        content = await file_field.read(decode=False)
        if not content:
            raise web.HTTPBadRequest(text="Uploaded file is empty")

        layout = await manager.async_save_floorplan(content=content, media_type=media_type)
        return web.json_response(layout)

