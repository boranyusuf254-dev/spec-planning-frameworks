# 06 — Manual replay of a single delivery

**What to build:** A tenant developer, or an operator acting on a tenant's behalf, can trigger replay of a specific failed or dead-lettered delivery by id. Replay creates a new, separately tracked delivery attempt chain that goes through the same signing and idempotency-key path as an original delivery (reusing the original event and idempotency key), without mutating or deleting the original delivery's audit history.

**Blocked by:** 05 — Dead-letter transition and querying

**Status:** ready-for-agent

- [ ] Triggering replay of a delivery by id via the replay API creates a new delivery attempt chain rather than mutating the original delivery's existing attempts.
- [ ] The replayed delivery reuses the same idempotency key as the original delivery.
- [ ] The replayed delivery's attempts are signed the same way as original delivery attempts.
- [ ] The original delivery's audit history is unchanged and still queryable after the replay.
- [ ] Replay is triggerable both by the tenant themself and by an operator acting on the tenant's behalf, and the actor who triggered the replay is recorded and attributable in the audit trail.
- [ ] An acceptance test replays a dead-lettered delivery through the replay API only (no internal function calls), and asserts the mock endpoint receives a new attempt with the same idempotency key, and that the original audit entries are intact.
