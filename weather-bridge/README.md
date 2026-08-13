# FIREWATCH Local Weather Bridge

A dependency-free reference bridge for local weather instruments.

Run:

```bash
python bridge.py
```

FIREWATCH can then add a **LOCAL SENSOR** weather source at:

```text
http://127.0.0.1:8780/weather
```

A sensor process may update the latest observation with:

```bash
curl -X POST http://127.0.0.1:8780/weather \
  -H 'Content-Type: application/json' \
  -d '{"temperatureF":84.2,"rh":21,"windDir":"SW","windMph":12,"gustMph":19,"pressureInHg":29.91,"visibilityMi":28}'
```

Recognized browser-side fields include Fahrenheit or Celsius temperature, mph or kph wind/gust, inHg or hPa pressure, inches or millimeters precipitation, miles or kilometers visibility, RH, wind direction, cloud cover, timestamp, station ID, and notes.

This bridge intentionally contains no vendor-specific driver. Adapt a weather station, microcontroller, serial logger, MQTT consumer, or other local process by POSTing the normalized observation to `/weather`.
