# 01 — Foundational delivery pipeline & acceptance-test harness

**What to build:** End-to-end, a published event results in one dispatched HTTP delivery attempt against a tenant endpoint, with the outcome recorded in an append-only audit log entry carrying the delivery's correlation identifier; publishing the same event for the same tenant/endpoint again does not create a second delivery. This ticket establishes the domain model (webhook event, endpoint subscription, delivery, delivery attempt) and the acceptance-test seam — an internally-triggerable publish entry point, a controllable mock tenant endpoint, a controllable/fake clock, and a minimal audit read-by-delivery-id query — that every later ticket's tests build on. No signing, idempotency-key header, retries, or dead-lettering yet; this slice proves the "happy path" wiring only.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Publishing an event for a tenant with a matching endpoint subscription results in exactly one delivery being created and dispatched to that endpoint.
- [ ] Publishing the identical (tenantId, eventId, endpointId) a second time does not create a second delivery record.
- [ ] A successful HTTP response from the mock tenant endpoint results in the delivery being recorded as succeeded and one attempt entry appended to the audit log.
- [ ] The audit log entry and any structured log lines for the attempt carry the same correlation identifier (the delivery id).
- [ ] A controllable/fake clock and a controllable mock tenant endpoint are available as test infrastructure and used by the acceptance test for this ticket.
- [ ] An acceptance test drives this scenario only through the publish entry point and asserts on what the mock endpoint received and what the audit query returns — no assertions on internal call sequences.
