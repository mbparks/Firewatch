# FIREWATCH v1.5.2 — Map Startup

v1.5.2 removes the external `vendor/leaflet-loader.js` dependency that could leave the MAP view permanently showing `LEAFLET · LOADING MAP ENGINE…` when only `index.html` was deployed.

The loader and Leaflet CSS are now embedded directly in `index.html` and `FIREWATCH.html`.

Leaflet 1.9.4 JavaScript is attempted using normal classic-script loading from, in order:

1. unpkg
2. jsDelivr
3. cdnjs

Each source has a five-second timeout. The MAP status shows the source currently being attempted. If all three fail, FIREWATCH displays the combined failure reasons and a RETRY MAP ENGINE button instead of remaining in an indefinite loading state.

No `eval()`, npm, Vite, TypeScript, React, or compilation step is used.

For an online deployment, uploading `index.html` alone is sufficient for the application and map engine loader. OpenStreetMap raster tiles still require network access when ONLINE OSM is selected.
