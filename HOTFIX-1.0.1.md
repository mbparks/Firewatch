# FIREWATCH v1.0.1 startup/deployment hotfix

## Symptom

A blank white page appeared when the v1.0 project was placed directly on a static host or when it was hosted in a URL subfolder.

## Root causes

1. The delivered ZIP contained Vite/React **source**, while its source `index.html` loads `src/main.tsx`. A normal static browser cannot run raw TSX.
2. Vite/PWA paths were rooted at `/`, which is incorrect for deployments below the domain root.
3. Failures before React mounted left no useful visible startup diagnostic.

## Fixes

- Vite now uses `base: './'`.
- Manifest, service-worker registration, and service-worker cache paths are scope-relative.
- The PWA manifest uses relative `start_url` and `scope`.
- The HTML bootstrap provides a visible diagnostic even if the application JavaScript never mounts.
- Added `build-static.sh` and `build-static.bat`.
- Version advanced to 1.0.1 without clearing or replacing the IndexedDB schema.

## Deployment

Run `npm install` and `npm run build`, then upload the **contents of `dist/`**.
