# Phase 2 load verification

Run against an isolated staging environment, never production:

```powershell
docker run --rm -i -e BASE_URL=https://staging-api.example.com/api/v1 grafana/k6 run - < tests/load/catalog.k6.js
```

The test holds 500 catalog requests/second for two minutes and fails unless p95 is below 300 ms, errors are below 1%, and checks exceed 99%. Record the k6 summary, deployment commit, API replica count, database size, cache hit ratio, and staging hardware in the release evidence. A localhost result is useful for debugging but does not satisfy the staging DoD.
