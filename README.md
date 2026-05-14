# FloorMap

FloorMap is a Home Assistant custom integration for building a shared floor-plan view of your entities.

Version 1 includes:

- one uploaded PNG/JPG floor plan
- a dedicated Home Assistant sidebar editor at `/floormap`
- a `custom:floor-map` Lovelace card for viewing and controlling entities
- drag placement with normalized coordinates so marker positions survive resize

## Install

1. In HACS, add this repository as a custom repository with category `Integration`.
2. Install `FloorMap`.
3. Restart Home Assistant.
4. Go to **Settings -> Devices & Services -> Add Integration** and add `FloorMap`.
5. Open the new `FloorMap` sidebar page, upload a floor plan, and place entities.
6. Add a Lovelace card with:

```yaml
type: custom:floor-map
```

For a full-page floor plan dashboard, create a dashboard view with the `Panel` view type and place only the FloorMap card in that view.

## Development

Frontend source lives in [`src/index.ts`](/C:/Users/Owner/OneDrive/Documents/New%20project%203/src/index.ts) and is bundled into [`custom_components/floormap/static/floormap.js`](/C:/Users/Owner/OneDrive/Documents/New%20project%203/custom_components/floormap/static/floormap.js).

```bash
npm install
npm run build
npm test
python -m unittest discover -s tests/python
```
