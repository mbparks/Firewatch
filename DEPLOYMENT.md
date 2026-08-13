# FIREWATCH v1.0.1 Deployment Guide

## Static web hosting (critical)

The project ZIP is **source code**, not a ready-to-upload static site. Browsers cannot execute `src/main.tsx` directly. Always compile first:

```bash
npm install
npm run build
```

Deploy only the generated `dist/` contents. For example, if the public URL is:

```text
https://example.org/projects/firewatch/
```

copy the files *inside* `dist/` into the web server directory that maps to `/projects/firewatch/`. Do not copy the outer project directory there as the live site.

Version 1.0.1 uses relative Vite assets and a scope-relative service worker, so this subfolder deployment works without editing the base URL.

If you see `FIREWATCH did not start` and the diagnostic mentions `src/main.tsx`, the source tree was deployed instead of the compiled `dist/` output.

## Browser application

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run build
npm run preview
```

Serve the generated application over HTTPS for normal PWA behavior and device geolocation, except where browser localhost exemptions apply.

## Optional Meshtastic radio bridge

```bash
cd radio-bridge
python -m pip install -r requirements.txt
python bridge.py
```

Configure the WebSocket URL in FIREWATCH. The simulator remains available when no radio is attached.

## Optional local weather bridge

```bash
cd weather-bridge
python bridge.py
```

Default weather endpoint: `http://127.0.0.1:8780/weather`.

## Optional multi-station sync server

```bash
cd sync-server
python server.py
```

Default endpoint: `http://127.0.0.1:8790`.

LAN binding:

```bash
python server.py --host 0.0.0.0 --port 8790
```

For Starlink/WAN deployments, put the reference server behind HTTPS, authentication, firewall controls, and an appropriate reverse proxy/VPN. Do not expose the raw reference server directly to the public Internet.

## Suggested station profiles

### Lookout

- role: LOOKOUT
- local IndexedDB: authoritative local record
- Meshtastic: enabled where available
- sync: optional
- presence sharing: optional

### Dispatch

- role: DISPATCH
- sync: enabled
- dispatch board open in NETWORK
- Meshtastic bridge optional but recommended where operationally appropriate

### Field crew

- role: FIELD_CREW
- NETWORK → FIELD optimized for incident selection and field status updates
- device GPS can be used only when the operator explicitly requests it in the browser

## Before field deployment

1. Export a FIREWATCH backup.
2. Verify offline reload after disconnecting the Internet.
3. Verify cached/locally hosted map strategy for the operating area.
4. Exercise a two-lookout triangulation.
5. Exercise real Meshtastic send/receive if radios will be used.
6. Exercise sync loss and recovery if a server will be used.
7. Generate incident/shift/handoff PDF reports.
8. Confirm procedures and contacts are agency-approved/current.
9. Confirm browser storage quota is adequate in NETWORK → DIAGNOSTICS.
10. Do not clear browser site data during an active operational period without exporting a backup.
