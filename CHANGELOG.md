# FIREWATCH Changelog

## v1.5.2 — Map Startup Hotfix

- Embedded the Leaflet loader directly in the HTML.
- Embedded Leaflet CSS directly in the HTML.
- Removed dependency on `vendor/leaflet-loader.js` for online map startup.
- Added visible per-source loading progress.
- Added 5-second timeout per CDN.
- Added explicit final error details and retry.
- Removed cross-origin mode from classic script loading.
- Preserved the v1.2 storage key and operational data migration path.
