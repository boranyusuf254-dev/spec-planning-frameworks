# 05 — Dead-letter transition and querying

**What to build:** A delivery that exhausts its retry policy (max attempts or window, whichever is reached first) automatically transitions to a distinct dead-lettered state, stops consuming retry capacity, and remains visible and queryable — including by a support engineer querying across tenants — without being deleted.

**Blocked by:** 04 — Retries with exponential backoff and jitter

**Status:** ready-for-agent

- [ ] A delivery whose retries are exhausted (by attempt count or window) transitions to a `dead_lettered` state, and no further automatic attempts are scheduled for it.
- [ ] A dead-lettered delivery remains queryable and shows why it was dead-lettered (its attempt history and outcomes).
- [ ] A dead-lettered delivery for one tenant does not consume retry scheduling capacity that affects delivery processing for another tenant (verified with a second, healthy tenant delivery proceeding normally in the same test).
- [ ] Dead-lettered deliveries can be queried across tenants (a support-engineer-scoped query), distinct from a single tenant's own scoped view.
- [ ] An acceptance test forces a delivery to exhaust retries via the controllable clock and asserts the resulting state and queryability through the audit/query API.
