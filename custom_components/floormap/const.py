"""Constants for FloorMap."""

from __future__ import annotations

DOMAIN = "floormap"
NAME = "FloorMap"
VERSION = "0.1.9"

EVENT_LAYOUT_UPDATED = "floormap_layout_updated"

STORAGE_VERSION = 1
STORAGE_KEY = "floormap_layout"

DATA_MANAGER = "manager"
DATA_VIEWS_REGISTERED = "views_registered"
DATA_STATIC_REGISTERED = "static_registered"

PANEL_COMPONENT_NAME = "floormap"
PANEL_URL_PATH = "floormap"
PANEL_ICON = "mdi:floor-plan"

FRONTEND_STATIC_URL = "/floormap_static"
FRONTEND_BUNDLE_URL = f"{FRONTEND_STATIC_URL}/floormap.js?v={VERSION}"

FLOORPLAN_DIRECTORY = ".floormap"
FLOORPLAN_API_PATH = f"/api/{DOMAIN}/floorplan"

WEBSOCKET_GET_LAYOUT = f"{DOMAIN}/get_layout"
WEBSOCKET_SAVE_LAYOUT = f"{DOMAIN}/save_layout"
WEBSOCKET_UPLOAD_FLOORPLAN = f"{DOMAIN}/upload_floorplan"

ALLOWED_IMAGE_TYPES: dict[str, str] = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
}
