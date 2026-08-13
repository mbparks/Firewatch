# FIREWATCH Sync Server

Optional reference server for multi-station FIREWATCH v1.0 deployments. It uses only Python's standard library and SQLite.

```bash
python server.py
# http://127.0.0.1:8790
```

For LAN use, bind explicitly:

```bash
python server.py --host 0.0.0.0 --port 8790
```

Endpoints:

- `GET /health`
- `POST /sync/push`
- `GET /sync/pull?stationId=...&cursor=...`
- `GET /stations`

The server is intentionally optional. FIREWATCH continues operating locally if it is unreachable. It is a reference deployment component, not an agency authentication/authorization service; put it behind appropriate network controls/TLS before use across untrusted networks.
