# FIREWATCH Offline Map Preparation

FIREWATCH v1.5.0 remains a direct-upload/no-build application. The map uses Leaflet 1.9.4.

## Map engine

`vendor/leaflet.css` is included locally. `vendor/leaflet-loader.js` uses this order:

1. `vendor/leaflet.js`, if you have placed the official Leaflet 1.9.4 distribution file there.
2. The browser's FIREWATCH Cache Storage copy of Leaflet, if previously prepared.
3. The official hosted Leaflet 1.9.4 runtime while connected, which is then cached for later disconnected starts.

### Best field deployment

For a deployment that must cold-start with no Internet at all, download the official **Leaflet 1.9.4 downloaded distribution** and place its `leaflet.js` at:

```text
vendor/leaflet.js
```

No compilation is involved. It is simply a static file beside FIREWATCH.

If you do not place that file locally, open **TOWER → DIAGNOSTICS → PREPARE MAP ENGINE** once while connected. FIREWATCH caches the runtime in browser-local storage (and Cache Storage when available) for that browser/origin.

Cache Storage is origin-specific. If FIREWATCH is moved to another hostname/path/origin, prepare it there again.

## Basemap

For disconnected operation use **TOWER → MAP DATA → LOCAL TILES** and set a standard XYZ template such as:

```text
./tiles/{z}/{x}/{y}.png
```

A typical package is:

```text
firewatch/
  index.html
  vendor/
    leaflet.css
    leaflet-loader.js
    leaflet.js       # recommended for true cold-start offline deployment
  tiles/
    8/
    9/
    10/
    ...
```

FIREWATCH can also run with **NO BASEMAP**. Towers, bearings, incident geometry, lightning points, range rings, imported GeoJSON, and other operational overlays remain available when Leaflet itself is loaded.
