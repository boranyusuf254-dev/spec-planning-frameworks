---
id: SPEC-reliable-webhook-delivery
companions: []
sources: ["../../../brief.md"]
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability only — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Reliable webhook delivery

## Why

This TypeScript SaaS API sends webhooks to tenant-configured endpoints; a delivery mechanism that loses events, delivers duplicates unpredictably, or leaves operators unable to see or recover from failures erodes tenant trust in the platform. This is a mandate to realize a reliable webhook delivery subsystem — spanning signing, idempotency, retries, dead-lettering, replay, auditing, tenant isolation, and observability — for tenant integrators who depend on receiving every event and platform operators who must keep delivery healthy and recoverable.

## Capabilities

- **CAP-1**
  - **intent:** Recipients can verify a webhook payload's authenticity and integrity via a platform-provided signature.
  - **success:** A receiver can confirm a genuine payload verifies, and a tampered or unsigned payload fails verification.

- **CAP-2**
  - **intent:** Recipients can safely process a delivery attempt received more than once without duplicating side effects.
  - **success:** Two delivery attempts carrying the same idempotency identifier for one event are recognizable by the recipient as duplicates.

- **CAP-3**
  - **intent:** A failed delivery attempt is retried automatically on a schedule that grows exponentially and includes randomized jitter.
  - **success:** The recorded attempt timestamps for a failing event show increasing, jittered intervals between attempts.

- **CAP-4**
  - **intent:** An event that exhausts its retry attempts moves to a dead-letter state instead of being silently dropped.
  - **success:** An event that fails past the retry limit is present and retrievable in a dead-letter store.

- **CAP-5**
  - **intent:** An operator can manually resubmit a dead-lettered or previously delivered event for a fresh delivery attempt.
  - **success:** Triggering replay on an event produces a new delivery attempt against the tenant's current endpoint configuration, recorded as such.

- **CAP-6**
  - **intent:** Every delivery attempt for every event is recorded for later inspection.
  - **success:** Querying the audit log for a given event returns its complete attempt history (timestamps, outcomes).

- **CAP-7**
  - **intent:** One tenant's webhook configuration, events, and delivery/audit data are inaccessible to and unaffected by another tenant.
  - **success:** An action or query scoped to tenant A cannot read or modify data belonging to tenant B.

- **CAP-8**
  - **intent:** Operators can monitor the health of webhook delivery across tenants.
  - **success:** Delivery success rate, latency, and failure counts are observable for a given time window.

- **CAP-9**
  - **intent:** The design defines an acceptance test suite that verifies CAP-1 through CAP-8.
  - **success:** An acceptance test exists and passes for each of CAP-1 through CAP-8.

## Constraints

- The delivery mechanism must be implemented in TypeScript (brief names a "TypeScript SaaS API"); rules out non-TS runtime/language choices for the delivery service.

## Non-goals

- Implementation and infrastructure provisioning for the webhook delivery service — this comparison covers planning artifacts, not an implementation.
- Inbound webhook receipt/ingestion (this SaaS API acting as a receiver of third-party webhooks) — the brief describes only outbound delivery to tenant-configured endpoints.

## Success signal

Every emitted event reaches its tenant's configured endpoint (verified via signature, deduplicated via idempotency key) within the retry policy's window, or lands in a recoverable dead-letter store; every attempt — success, failure, retry, dead-letter, replay — is visible in a per-tenant audit trail; and the CAP-1..CAP-9 acceptance suite passes.

## Assumptions

- Assumed "delivery" means an outbound HTTP callback to a tenant-configured webhook endpoint URL (standard webhook semantics); the brief does not define the transport.
- Assumed "signed webhooks" means the platform signs outgoing payloads for the receiving tenant endpoint to verify — the standard outbound-webhook signing direction.
- Assumed the delivery audit log (CAP-6) must capture per-attempt records, not just final event status, since a log that only shows the last outcome would not satisfy "audit."
- Assumed "acceptance tests" (CAP-9) refers to a test suite validating CAP-1..CAP-8 as part of this design's own deliverables, not tenant-facing or end-user tests.

## Open Questions

- Which message queue / broker technology backs retry scheduling and dead-lettering? Deliberately unspecified in the brief.
- Which datastore holds the audit log and dead-letter store? Deliberately unspecified in the brief.
- Which cloud provider (or on-prem) hosts the service? Deliberately unspecified in the brief.
- Which HTTP framework implements the delivery service and any admin endpoints? Deliberately unspecified in the brief.
- Which signature algorithm (e.g., HMAC-SHA256 vs asymmetric signing) is used for CAP-1? Deliberately unspecified in the brief.
- What is the retry limit (max attempt count) before an event moves to dead-letter (CAP-3/CAP-4)? Deliberately unspecified in the brief.
- What is the retention period for the audit log and dead-letter store (CAP-4/CAP-6)? Deliberately unspecified in the brief.
- Is a user interface provided for manual replay, audit log review, or observability (CAP-5/CAP-6/CAP-8), or is this API/CLI only? Deliberately unspecified in the brief.
- Does the design need to guarantee per-tenant delivery ordering, or is unordered at-least-once delivery acceptable? Not addressed by the brief; a domain implication of combining retries with idempotency (CAP-2/CAP-3).
- How are tenant-supplied webhook endpoint URLs validated to prevent SSRF (e.g., requests to internal/private network addresses)? Not addressed by the brief; a domain implication of accepting tenant-configured URLs (CAP-7).
- How are signing keys generated, stored, and rotated (CAP-1)? Not addressed by the brief; a domain implication of a signing capability.
- Who is authorized to trigger a manual replay (CAP-5) — platform operators only, or tenant self-service? Not addressed by the brief; affects access-control design.
