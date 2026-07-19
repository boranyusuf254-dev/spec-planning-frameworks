# 11 — Observability: structured logs, metrics, and alerting

**What to build:** Every delivery attempt emits structured logs carrying the delivery's correlation identifier, and the system exposes per-tenant metrics for delivery success rate, retry counts, dead-letter volume, and delivery latency, plus an alertable signal that fires when dead-letter volume grows abnormally or a tenant's success rate drops sharply.

**Blocked by:** 10 — Tenant isolation and dispatcher fairness

**Status:** ready-for-agent

- [ ] Every delivery attempt emits a structured log line carrying the delivery id as a correlation identifier, consistent across all attempts (including retries and replays) of the same delivery.
- [ ] Per-tenant metrics are emitted for delivery success rate, retry counts, dead-letter volume, and delivery latency.
- [ ] An alertable signal fires when a tenant's dead-letter volume grows abnormally or their delivery success rate drops sharply, verified by driving a scenario that crosses the threshold.
- [ ] The correlation identifier used in logs and metrics is the same identifier exposed to tenants in the audit log, so a tenant-reported delivery id can be traced directly in logs/metrics.
- [ ] An acceptance test drives a mixed-outcome scenario (successes, retries, dead-letters) across two tenants and asserts the resulting per-tenant metrics and alert signal match the driven scenario, and that correlation ids match between audit entries and emitted logs/metrics.
