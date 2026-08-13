# FIREWATCH v1.5.2 Validation

## Map startup hotfix

- PASS — `index.html` contains the Leaflet loader inline.
- PASS — `index.html` contains Leaflet CSS inline.
- PASS — no reference to `./vendor/leaflet-loader.js` remains.
- PASS — no reference to `./vendor/leaflet.css` remains.
- PASS — three hosted Leaflet 1.9.4 JavaScript fallbacks are configured: unpkg, jsDelivr, cdnjs.
- PASS — each hosted source has a finite 5-second timeout.
- PASS — loader publishes progress and completion events.
- PASS — MAP distinguishes STARTING / TRYING / UNAVAILABLE instead of showing an indefinite generic LOADING state.
- PASS — RETRY MAP ENGINE remains available after all sources fail.
- PASS — no dynamic `eval()` execution is used.

## Static validation

- PASS — both deployable HTML files parse structurally.
- PASS — all inline JavaScript blocks pass `node --check`.
- PASS — Meshtastic Python bridge passes `py_compile`.
- PASS — FIREWATCH application version displays v1.5.2.
- PASS — existing local-storage key remains `firewatch.nobuild.v1.1`, preserving the upgrade path for existing browser data.

## Environment limitation

The sandbox cannot complete a trustworthy live Internet Leaflet/OSM browser test because outbound browser networking is restricted. The loader itself is therefore validated structurally and by syntax/control-flow checks rather than by claiming a successful external CDN request from this environment.
