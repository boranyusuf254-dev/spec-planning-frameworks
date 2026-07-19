# 08 — Delivery audit log query surface and retention

**What to build:** A full tenant/operator-facing read API over the audit log — list deliveries and their attempts, filterable by tenant, endpoint, event type, outcome, and time range — including the response body (or a truncated/redacted summary) for failed attempts, backed by a documented and enforced retention period, and confirmed immutable once written.

**Blocked by:** 05 — Dead-letter transition and querying

**Status:** ready-for-agent

- [ ] The audit query API supports filtering by tenant, endpoint, event type, outcome, and time range, individually and in combination.
- [ ] A failed attempt's audit entry includes the response body or a truncated/redacted summary of it.
- [ ] Audit entries are immutable once written — no code path in the query API or elsewhere allows editing or deleting an existing attempt entry.
- [ ] The audit log's retention period is documented, and an attempt entry older than the retention period is handled per that documented policy.
- [ ] An acceptance test writes attempts across multiple tenants/endpoints/outcomes and asserts the query API returns correct, filtered results for each dimension, including a failed-attempt response body.
