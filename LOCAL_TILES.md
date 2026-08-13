# FIREWATCH Local Tile Packages

FIREWATCH v1.5.0 can use a local Leaflet XYZ tile tree instead of the online OpenStreetMap basemap.

## Expected layout

The default template is:

```text
./tiles/{z}/{x}/{y}.png
```

Place the tile directory beside `index.html`:

```text
firewatch/
  index.html
  tiles/
    7/
    8/
    9/
    10/
    11/
    12/
```

FIREWATCH does not generate map tiles. Create or obtain tiles only from data whose license permits local/offline use.

## Configure

Open:

**TOWER → MAP DATA**

Set:

- Basemap: `LOCAL TILES`
- URL template: e.g. `./tiles/{z}/{x}/{y}.png`
- minimum zoom
- maximum zoom

The same controls are available on the MAP screen.

## Fully disconnected use

Leaflet CSS and the FIREWATCH map loader are included locally. For a first-ever cold start with no Internet, place the official Leaflet 1.9.4 distribution file at `vendor/leaflet.js`. No HTML edit or compilation is required.

Alternatively, while connected once, use **TOWER → DIAGNOSTICS → PREPARE MAP ENGINE**. FIREWATCH caches the pinned Leaflet runtime for later disconnected starts on that browser/origin. See `OFFLINE_MAP.md`.

## No basemap mode

If no raster tiles are available, select `NO BASEMAP`. FIREWATCH will still display:

- towers
- landmarks
- imported GeoJSON
- bearing lines
- incidents
- uncertainty areas
- lightning
- range rings
- azimuth grid

