# 03 — Idempotency key and attempt-number on outbound requests

**What to build:** Every delivery attempt for a given delivery carries a stable idempotency-key header (derived from the event and endpoint) that does not change across attempts, plus an attempt-number header/field so a receiver can tell first attempts from retries.

**Blocked by:** 01 — Foundational delivery pipeline & acceptance-test harness

**Status:** ready-for-agent

- [ ] Every delivery attempt includes an idempotency-key header derived from (eventId, endpointId), generated once at delivery creation.
- [ ] The idempotency key is present and correctly attached on the initial attempt of a delivery (multi-attempt stability across automatic retries is verified once retries exist, in the retries ticket).
- [ ] Every delivery attempt includes an attempt-number header or field reflecting its position in the delivery's attempt sequence.
- [ ] An acceptance test asserts the mock endpoint receives the idempotency-key and attempt-number headers on a delivery.
