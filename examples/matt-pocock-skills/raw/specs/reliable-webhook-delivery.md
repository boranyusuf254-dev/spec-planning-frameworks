---
title: Reliable webhook delivery
case_id: reliable-webhook-delivery
status: ready-for-agent
triage_labels: [ready-for-agent]
tracker: local (no remote issue tracker configured for this run; see Further Notes)
---

# Reliable webhook delivery

## Problem Statement

Tenants of our SaaS API rely on webhooks to stay in sync with events that happen in their account. Today that reliance is fragile:

- Tenants have no way to verify that a webhook actually came from us, so a receiver either has to trust any request that hits its endpoint or build its own ad-hoc verification.
- When a tenant's endpoint is briefly down, slow, or returns an error, the event is simply lost — there is no retry, so the tenant's system silently drifts out of sync with ours.
- When we do retry (today, informally), a receiver can end up processing the same event twice, corrupting downstream state, because there's no stable identifier a receiver can use to deduplicate.
- When an endpoint fails repeatedly, there is no clear point at which we stop hammering it, no record of what was attempted, and no way for the tenant or our own support engineers to find out what was sent, when, and why it failed.
- If a tenant fixes their endpoint after an outage, there is no way to ask us to resend what they missed — they either miss the events permanently or have to ask us to reconstruct history by hand.
- One tenant's misbehaving or slow endpoint can, if the delivery mechanism isn't isolated per tenant, degrade delivery for every other tenant on the platform.
- Neither tenants nor our own operators have visibility into delivery health — whether events are getting through, how long they take, how often they retry, or how big the backlog of failing deliveries is.

## Solution

We will build a reliable webhook delivery subsystem that sits between "an event happened in our system" and "a tenant's endpoint received it," with the following guarantees:

- Every webhook request is **signed**, so a receiver can cryptographically verify it came from us and was not tampered with in transit.
- Every webhook carries a stable **idempotency key**, so a receiver can safely process the same delivery twice without side effects.
- Failed deliveries are **retried automatically** using exponential backoff with jitter, so transient failures resolve themselves without manual intervention and without synchronized retry storms.
- Deliveries that exhaust their retry budget move to a **dead-letter state**, where they are visible and actionable rather than silently dropped.
- Dead-lettered (and other historical) deliveries can be **manually replayed**, so a tenant or an operator can recover from an outage without waiting for a new event.
- Every delivery attempt is recorded in a **delivery audit log**, giving tenants and operators a complete, queryable history of what was sent, when, and what happened.
- Delivery processing and delivery data are **isolated per tenant**, so one tenant's failing endpoint cannot degrade or leak into another tenant's deliveries.
- The system emits **observability signals** (structured logs, metrics, and correlation identifiers) so operators can monitor delivery health and diagnose problems without reading source code.
- The whole subsystem is validated primarily through an **acceptance test suite** that exercises it as a black box: publish an event, observe what happens at the tenant endpoint and in the audit/replay APIs, and assert on externally observable behavior only.

## User Stories

### Signed webhooks

1. As a tenant developer, I want every webhook request to carry a cryptographic signature, so that I can verify it was genuinely sent by the platform and not forged by a third party.
2. As a tenant developer, I want the signature to cover the exact request body and a timestamp, so that a captured request can't be replayed later by an attacker.
3. As a tenant developer, I want a documented, stable algorithm and header format for the signature, so that I can implement verification once and trust it won't silently change.
4. As a tenant developer, I want to rotate my endpoint's signing secret without a gap in verifiable deliveries, so that a compromised secret can be replaced without an outage.
5. As a platform operator, I want each tenant endpoint to have its own signing secret, so that a leaked secret for one tenant cannot be used to forge webhooks to another tenant.
6. As a security-conscious tenant, I want the signature scheme to reject stale requests outside a tolerance window, so that a captured-and-replayed request is rejected even if the signature is valid.

### Idempotency

7. As a tenant developer, I want every webhook to carry a stable idempotency key that is identical across retries of the same event, so that I can safely deduplicate deliveries on my side.
8. As a tenant developer, I want the idempotency key to remain the same when a delivery is manually replayed, so that my deduplication logic doesn't need special-case handling for replays versus automatic retries.
9. As a platform operator, I want the platform itself to avoid creating duplicate delivery records when the same event is submitted for delivery more than once internally, so that internal at-least-once processing doesn't multiply outbound requests.
10. As a tenant developer, I want to know which attempt number a given delivery represents, so that I can distinguish "first attempt" from "retry" in my own logs when debugging.

### Retries with exponential backoff and jitter

11. As a tenant developer, I want a temporarily unreachable or slow endpoint to be retried automatically, so that a brief outage on my side doesn't cause permanent event loss.
12. As a platform operator, I want retries to back off exponentially, so that a struggling endpoint isn't hammered with immediate repeated requests.
13. As a platform operator, I want jitter applied to retry delays, so that many simultaneously failing deliveries don't retry in lockstep and create load spikes.
14. As a platform operator, I want a bounded maximum number of retry attempts (or total retry window), so that the system doesn't retry a permanently dead endpoint forever.
15. As a tenant developer, I want only retryable failures (timeouts, connection errors, 5xx responses) to trigger a retry, so that a deliberate 4xx rejection from my endpoint isn't retried pointlessly.
16. As a platform operator, I want the retry schedule to be deterministic and testable, so that I can verify backoff behavior without waiting in real time during tests.

### Dead-letter handling

17. As a platform operator, I want a delivery that exhausts its retry budget to move to a distinct dead-letter state, so that it stops consuming retry capacity but isn't silently discarded.
18. As a tenant developer, I want to see which of my events ended up dead-lettered and why, so that I can fix my endpoint and recover the missed events.
19. As a platform operator, I want dead-lettered deliveries for one tenant to have no effect on delivery processing for other tenants, so that a chronically broken endpoint doesn't create a growing backlog that starves the rest of the system.
20. As a support engineer, I want to query dead-lettered deliveries across tenants, so that I can proactively identify tenants who may not have noticed their integration is broken.

### Manual replay

21. As a tenant developer, I want to manually trigger redelivery of a specific failed or dead-lettered event to my endpoint, so that I can recover missed data after fixing whatever caused the failures.
22. As a tenant developer, I want a replay to create a new, separately tracked delivery attempt rather than mutating the original attempt's history, so that the audit trail of what originally happened is preserved.
23. As a support engineer, I want to replay a delivery on a tenant's behalf, so that I can help a tenant recover without them needing direct API access to do it themselves.
24. As a tenant developer, I want to replay a batch of dead-lettered deliveries at once (e.g. all failures in a time range), so that recovering from an extended outage doesn't require replaying events one at a time.
25. As a tenant developer, I want a replayed delivery to go through the same signing and idempotency-key behavior as an original delivery, so that my receiver doesn't need special-case handling for replays.

### Delivery audit log

26. As a tenant developer, I want to see a complete history of every delivery attempt for a given event, including timestamps, response status, and latency, so that I can diagnose why an integration isn't behaving as expected.
27. As a platform operator, I want the audit log to be immutable once written, so that it can be trusted as a record of what actually happened, including during incident investigations.
28. As a support engineer, I want to search the audit log by tenant, event type, endpoint, or delivery outcome, so that I can quickly answer "did this event get delivered?" support requests.
29. As a compliance-minded tenant, I want to know how long delivery audit records are retained, so that I can assess whether the retention period meets my own compliance obligations.
30. As a tenant developer, I want to see the response body or a truncated/redacted summary of it for failed attempts, so that I can understand why my endpoint rejected the request.

### Tenant isolation

31. As a platform operator, I want each tenant's delivery data (audit log, dead letters, endpoint configuration) to be logically partitioned, so that a tenant can never see another tenant's delivery history.
32. As a platform operator, I want delivery throughput to be fairly allocated across tenants, so that one tenant sending a very high volume of events cannot delay delivery for other tenants.
33. As a platform operator, I want a single tenant's failing or slow endpoint to be contained so it cannot exhaust shared retry workers or queue capacity needed by other tenants.
34. As a tenant developer, I want to manage only my own endpoints and subscriptions through the API, so that tenant isolation is enforced at the access-control layer as well as the data layer.

### Observability

35. As a platform operator, I want structured logs emitted for every delivery attempt, including a correlation identifier shared across retries of the same event, so that I can trace a single event's full delivery history through log tooling.
36. As a platform operator, I want metrics on delivery success rate, retry counts, dead-letter volume, and delivery latency, broken down per tenant, so that I can monitor overall system health and catch regressions.
37. As an on-call engineer, I want an alertable signal when the dead-letter volume grows abnormally or a tenant's success rate drops sharply, so that I can investigate before the tenant notices.
38. As a platform operator, I want the correlation identifier used in logs and metrics to be the same identifier exposed to tenants in the audit log, so that a tenant-reported issue can be traced internally without translation.

### Acceptance tests

39. As a developer building this subsystem, I want an acceptance test suite that publishes an event and asserts on what a mock tenant endpoint actually receives (headers, signature, idempotency key, payload), so that the tests validate real external behavior rather than internal call graphs.
40. As a developer building this subsystem, I want acceptance tests that use a controllable clock, so that exponential backoff, jitter bounds, and retry-exhaustion-to-dead-letter behavior can be verified deterministically without real-time waits.
41. As a developer building this subsystem, I want acceptance tests that verify manual replay through the same public surface a tenant or operator would use, so that replay is validated end-to-end rather than by calling internal functions directly.
42. As a developer building this subsystem, I want acceptance tests that verify tenant isolation by running two tenants through the same scenario concurrently and asserting neither's deliveries, audit entries, or backoff behavior affect the other, so that isolation is proven, not assumed.

## Implementation Decisions

This is a greenfield subsystem — no existing codebase, domain glossary, or ADRs were found in this repository, so the terms and boundaries below are being established here for the first time and should be treated as the initial domain glossary for this area.

### Domain terms introduced

- **Webhook event**: an internal occurrence (e.g. `invoice.paid`) that is a candidate for outbound notification to subscribed tenant endpoints.
- **Endpoint (subscription)**: a tenant-configured destination URL plus the set of event types it subscribes to, plus its own signing secret(s).
- **Delivery**: one tracked unit of work representing "this event must be delivered to this endpoint." A delivery has a lifecycle state: `pending` → `in_flight` → (`succeeded` | `retrying` | `dead_lettered`), plus a `replayed` marker.
- **Delivery attempt**: a single HTTP call made while executing a delivery. A delivery accumulates one or more attempts as it retries.
- **Idempotency key**: a stable identifier, constant across all attempts (including replays) of a given delivery, that the receiver can use for deduplication.
- **Dead letter**: a delivery whose attempts exhausted the retry policy without success; it stops retrying automatically but remains queryable and replayable.
- **Delivery audit log**: the immutable, append-only record of every delivery attempt (not just outcomes).
- **Replay**: an operator- or tenant-triggered action that creates a new delivery (or new delivery attempt chain) for a previously seen event, reusing the same event and idempotency key.

### Module boundaries

- **Event publisher**: internal entry point invoked by other parts of the platform to enqueue a webhook event for one or more matching endpoint subscriptions. Publishing is idempotent per (tenant, event id, endpoint id) — re-publishing the same event does not create a duplicate delivery.
- **Dispatcher / delivery worker**: consumes pending deliveries and executes attempts (signs the payload, sends the HTTP request, interprets the response).
- **Retry scheduler**: decides, after a failed attempt, whether and when the next attempt runs, based on the exponential-backoff-with-jitter policy and the max-attempts/window policy.
- **Dead-letter handler**: transitions a delivery to `dead_lettered` when the retry scheduler determines the policy is exhausted, and excludes it from further automatic scheduling.
- **Replay service**: accepts a request (single delivery, or a filtered batch) and creates new delivery attempts that flow through the same dispatcher and signing path as original deliveries.
- **Audit log writer/reader**: appends an entry per attempt and exposes a query interface (by tenant, endpoint, event, outcome, time range).
- **Signing module**: computes and attaches the signature header given a payload, timestamp, and the endpoint's active signing secret(s).
- **Tenant isolation boundary**: enforced at three layers — access control (a tenant's credentials only reach their own endpoints/audit log/replay actions), data partitioning (all delivery/audit records keyed by tenant id), and runtime fairness (per-tenant concurrency/throughput limits in the dispatcher so no tenant can starve another).
- **Observability emitter**: attaches a correlation id (the delivery id) to every log line and metric for an attempt, and emits the metrics described under Testing/Observability above.

### Interfaces (contracts, not code)

- `publish(tenantId, eventType, eventId, payload)` — internal call that fans out to all matching endpoint subscriptions for that tenant and creates one delivery per matching endpoint. Idempotent on `(tenantId, eventId, endpointId)`.
- Outbound HTTP request contract to tenant endpoints includes, at minimum: a signature header, a timestamp used in the signature, an idempotency-key header, and an attempt-number header or field.
- Tenant/operator-facing read API: list deliveries and their attempts, filterable by tenant, endpoint, event type, outcome, and time range (this is the audit log query surface).
- Tenant/operator-facing replay API: trigger replay of a single delivery by id, or a batch by filter (e.g. all dead-lettered deliveries for an endpoint within a time range).
- Endpoint/subscription management API: CRUD for a tenant's endpoints, including secret rotation (supporting at least one overlapping "old + new secret" grace period so in-flight verification doesn't break mid-rotation).

### Decisions

- **Signature algorithm**: HMAC-SHA256 over a canonical string of `timestamp + "." + raw request body`, using the endpoint's active signing secret. Chosen as the de facto industry-standard scheme (matches common patterns tenants' HTTP libraries already know how to verify) and cheap to compute per attempt.
- **Idempotency key**: derived from `(eventId, endpointId)`, generated once at delivery creation and unchanged across retries and replays.
- **Retry algorithm shape**: exponential backoff with full jitter (`delay = random_between(0, min(cap, base * 2^attempt))`), rather than fixed or linear backoff, to avoid synchronized retry storms across many failing deliveries.
- **Retryable vs. non-retryable failures**: connection errors, timeouts, and 5xx responses are retryable; 4xx responses (other than 429, which is treated as retryable/back-off-honoring) are treated as a permanent rejection and do not consume the automatic retry budget — they still count as a completed (failed) delivery attempt in the audit log.
- **Dead-letter transition**: automatic, triggered purely by exhausting the retry policy (attempt count or total elapsed window, whichever is reached first) — not by any content inspection.
- **Replay semantics**: replay always creates a new delivery attempt chain reusing the original event and idempotency key; it never rewrites or deletes the original delivery's audit history.
- **Tenant isolation mechanism**: enforced by tenant-scoped access control on every read/write path, tenant id as a mandatory partition key on all delivery and audit records, and per-tenant concurrency/rate limits in the dispatcher.
- **Persistence and messaging model (technology-agnostic)**: deliveries are processed via a durable, at-least-once work queue with lease/visibility-timeout semantics, and delivery/audit state is persisted in a store that supports transactional writes for state transitions. These are architectural requirements, not vendor choices — see Open Questions for the concrete technology selection, which the brief deliberately leaves unspecified.

### Assumptions

- A reasonable default retry policy is roughly 6–8 attempts spread over up to ~24 hours, but the exact attempt count/window is called out below as an open question rather than asserted as fixed.
- A grace period of a few days for overlapping old/new signing secrets during rotation is reasonable, but the exact duration is an open question.
- Both tenant self-service replay and operator-on-behalf-of-tenant replay are in scope, scoped so an operator action is itself attributable and audited like any other actor.
- Batch replay (story 24) operates on a bounded, filtered set (e.g., "all dead letters for endpoint X between date A and B") rather than an unbounded "replay everything" action.

### Open Questions

- Which queue/messaging technology backs the durable at-least-once delivery mechanism (e.g. a managed queue, a log-based broker, or a DB-polling outbox)? Deliberately left unspecified by the brief.
- Which database/storage engine holds delivery and audit records? Deliberately left unspecified by the brief.
- Which cloud provider (if any) hosts this subsystem? Deliberately left unspecified by the brief.
- Which HTTP framework implements the outbound dispatcher and the tenant/operator-facing APIs? Deliberately left unspecified by the brief; there is no existing service in this repo to follow for convention.
- Exact maximum retry attempts and/or total retry time window. Deliberately left unspecified by the brief; the assumption above is a placeholder, not a decision.
- Exact audit log retention period (may be driven by compliance requirements not stated in the brief). Deliberately left unspecified by the brief.
- Exact signature timestamp tolerance window for replay-attack rejection.
- Exact signing secret rotation grace period.
- Whether a chronically failing endpoint should be automatically suspended/circuit-broken (distinct from per-delivery dead-lettering) — not requested by the brief; treated as out of scope pending a product decision (see Out of Scope).
- What UI, if any, tenants and operators use to view the audit log and trigger replay, versus a pure API — deliberately left unspecified by the brief.

## Testing Decisions

- **Acceptance tests are the primary and, wherever possible, only validation seam for this feature.** A good acceptance test here asserts on externally observable behavior — what a mock tenant endpoint receives, what the audit/query API returns, what the replay API produces — and never asserts on internal call sequences, internal queue message shapes, or private module state. This keeps the tests resilient to internal refactors (e.g. swapping the underlying queue technology) as long as external behavior is unchanged.
- The single seam for these acceptance tests is the combination of: (1) the internal `publish` entry point (or its nearest externally-triggerable equivalent) to originate an event, (2) a controllable mock HTTP endpoint standing in for the tenant's receiver, (3) the audit/query API, and (4) the replay API. Driving tests through this one seam, rather than through per-module unit seams, keeps the number of seams in this feature as close to one as the brief instructs.
- A controllable/fake clock is required as test infrastructure so that backoff timing, jitter bounds, and retry-exhaustion-to-dead-letter transitions can be asserted deterministically rather than by waiting in real time.
- Tests to cover, at minimum: signature validity and rejection of tampered/stale requests; idempotency key stability across an automatic retry and across a manual replay; backoff delay growth and jitter bounds across a sequence of forced failures; transition to dead-letter after policy exhaustion; audit log completeness and immutability for both successful and failed attempts; replay creating a new attempt without altering prior audit history; tenant isolation under two concurrently misbehaving/well-behaving tenants; and presence of the correlation identifier across logs/metrics/audit entries for the same delivery.
- **Prior art**: none. This is a greenfield repository with no existing test suite, test framework, or testing conventions to follow — the specific test runner/framework is an open question (see Implementation Decisions → Open Questions, HTTP framework/tech stack) to be resolved by whoever picks up this spec, consistent with existing project conventions once a stack is chosen.

## Out of Scope

- Any implementation code for this subsystem — this spec covers planning only, per the comparison boundary in the brief.
- Selection of the specific queue, database, cloud provider, HTTP framework, or UI technology — left as open questions/decisions above rather than resolved here.
- Design of the business event catalog (which domain events exist and what triggers them) — this spec covers delivery mechanics for events that are already deemed dispatch-worthy, not how events are produced.
- Tenant-facing UI/dashboard visual design — only the underlying API contracts are in scope.
- Automatic endpoint health circuit-breaking/suspension beyond per-delivery dead-lettering (flagged as an open product question, not designed here).
- Billing, rate-limit monetization, or plan-based throughput tiers.
- Multi-region failover and disaster recovery for the delivery subsystem itself.
- Webhook payload versioning/schema evolution strategy.

## Further Notes

- No issue tracker or triage label vocabulary was configured for this run, and the task explicitly requires local files only with no remote tickets. This spec is published as a local file (`specs/reliable-webhook-delivery.md`) with `ready-for-agent` recorded in its frontmatter in place of an actual tracker label.
- No domain-modeling artifacts (glossary, ADRs) existed in this repository prior to this spec; the terms defined under Implementation Decisions → "Domain terms introduced" should be treated as the seed of this project's domain glossary for anyone building on this feature next.
- Because this is a greenfield service, several "implementation decision" items above (module boundaries, interfaces) are necessarily proposed fresh rather than derived from an existing codebase; they should be revisited once real architectural constraints (chosen queue, chosen datastore, existing service conventions) are in place.
- Secret storage and rotation (for signing secrets) touches security-sensitive design; a security review of the chosen secret-storage mechanism is recommended before implementation, independent of this spec.
