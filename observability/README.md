# Centralized logging (local/staging baseline)

The API writes one-line JSON logs to stdout. Grafana Alloy reads only Docker
containers carrying the `logging=alloy` label and forwards their logs to Loki.
Grafana is provisioned with Loki as its default data source.

Start the stack together with the application:

```bash
docker compose --profile observability up -d postgres redis minio api worker loki alloy grafana
```

Open Grafana at `http://localhost:3101` (local default: `admin` / `admin`) and
use **Explore** with queries such as:

```logql
{service="marketplace-api"} | json
{service="marketplace-api"} | json | requestId="req_example123"
{service="marketplace-api", level="error"} | json
```

Override `GRAFANA_ADMIN_PASSWORD`, `LOG_HASH_SALT`, ports, and all application
secrets outside local development. Loki does not provide an authentication
layer; do not expose port 3100 publicly. For production, place Grafana/Loki
behind authenticated private networking and use durable object storage.

The logger intentionally omits request bodies, headers, and query values. It
stores only the URL pathname, redacts secret/PII-shaped fields and text, and
logs a salted hash instead of the authenticated user ID.
