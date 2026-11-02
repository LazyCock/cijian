# Load test

Run against the production-shaped stack (Postgres + Redis), never against
the embedded PGlite development database.

```bash
docker compose up -d --build --scale app=3
k6 run -e BASE_URL=http://127.0.0.1:8080 loadtest/k6.js
```

The script ramps to 2,000 concurrent browsing users and mixes 2 authenticated
writes per second (matching the per-user like limit). The first run establishes
a baseline; tune connection pool sizes and HPA limits from the observed
p95/p99 and Postgres/Redis saturation.

The sample Nginx config limits each source IP to 30 req/s as an edge safety
valve. A single-machine synthetic test comes from one IP, so run it against the
app service directly or distribute load across source IPs; do not remove the
edge limit just to make a synthetic test pass.

Suggested production gates:

- `http_req_failed < 1%`
- `p95 < 500ms`, `p99 < 1200ms` for SSR pages
- Redis hit ratio > 85% on `/` and `/tasks`
- Postgres CPU < 70% at 2× expected peak
- no 5xx during rolling deploys
