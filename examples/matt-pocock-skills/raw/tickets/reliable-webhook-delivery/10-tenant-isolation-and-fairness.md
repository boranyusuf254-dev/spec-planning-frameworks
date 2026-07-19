# 10 — Tenant isolation and dispatcher fairness

**What to build:** Two tenants running through the same delivery scenario concurrently — one with a healthy endpoint, one with a failing/slow endpoint accumulating retries — are proven not to affect each other's delivery throughput, backoff behavior, or visible data, with tenant id enforced as a mandatory partition key and per-tenant concurrency/throughput limits in the dispatcher.

**Blocked by:** 08 — Delivery audit log query surface and retention, 09 — Endpoint/subscription management API and secret rotation

**Status:** ready-for-agent

- [ ] Running a misbehaving tenant's endpoint (failing, slow, or retry-heavy) concurrently with a well-behaved tenant's endpoint does not measurably delay or degrade the well-behaved tenant's delivery latency or success rate.
- [ ] Per-tenant concurrency/throughput limits in the dispatcher prevent one tenant's delivery volume from starving another tenant's retry workers or queue capacity.
- [ ] A tenant's audit-log queries and replay actions never return or affect another tenant's delivery or attempt records, even when both tenants' data exists in the same run.
- [ ] An acceptance test runs two tenants through the same scenario concurrently and asserts, via the audit/query API and mock endpoints, that neither tenant's deliveries, audit entries, or backoff behavior are affected by the other.
