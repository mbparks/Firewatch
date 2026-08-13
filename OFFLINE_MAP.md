# FIREWATCH v1.5.1 — Map Engine / Offline Notes

FIREWATCH remains a direct-upload/no-build application and uses Leaflet 1.9.4.

## Loader order

`vendor/leaflet-loader.js` does **not** use `eval()`. It attempts ordinary browser script loading in this order:

1. `./vendor/leaflet.js`
2. unpkg Leaflet 1.9.4
3. jsDelivr Leaflet 1.9.4
4. cdnjs Leaflet 1.9.4

If a network source is merely slow, MAP displays `LEAFLET · LOADING MAP ENGINE…`. Only after all configured sources fail does it show `LEAFLET UNAVAILABLE`, with a RETRY MAP ENGINE button.

## Recommended remote-tower deployment

For a first-ever startup with no Internet, place the official Leaflet 1.9.4 `leaflet.js` distribution file at:

```text
vendor/leaflet.js
```

`vendor/leaflet.css` is already local. If you use Leaflet's default marker icons, keep the official `images/` directory beside `leaflet.css` as well. FIREWATCH's operational overlays primarily use vector/div icons, but the complete distribution is the safest deployment package.

No package manager, compiler, or build step is required.
