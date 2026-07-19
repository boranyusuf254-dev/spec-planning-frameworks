# Reliable Webhook Delivery — Design

Case ID: `reliable-webhook-delivery`
Date: 2026-07-19
Status: Draft (auto-approved for a controlled framework-comparison run — see note below)

> **Process note:** This run is a controlled comparison across planning frameworks.
> The brief (`brief.md`) is the sole product input; the brainstorming skill's
> interactive clarifying-question loop is intentionally skipped per operator
> instruction. Every point where that loop would normally have asked the user
> a question is instead recorded below as an explicit **Assumption** or
> **Open question** — nothing is treated as a hidden fact. If this were a real
> engagement, the Open Questions section (§9) would block sign-off until
> answered.

## 1. Problem

Provide reliable delivery of tenant-configured webhooks from a TypeScript
SaaS API to customer-controlled HTTP endpoints, so that:

- customers can cryptographically verify a delivery came from us and wasn't
  tampered with (**signed webhooks**);
- customers can safely process a delivery more than once without side
  effects (**idempotency**);
- transient customer-endpoint failures are retried automatically with
  **exponential backoff and jitter**;
- permanently failing deliveries are quarantined rather than retried forever
  (**dead-letter handling**);
- operators and customers can re-send a specific delivery on demand
  (**manual replay**);
- every delivery attempt is recorded for support, debugging, and compliance
  (**delivery audit log**);
- one tenant's webhook configuration, traffic, or failures cannot affect or
  leak into another tenant's (**tenant isolation**);
- the system's health and per-tenant delivery behavior are visible to
  operators (**observability**);
- the above behaviors are captured in **acceptance tests** that gate
  correctness independent of implementation.

## 2. Scope

In scope: the webhook delivery subsystem — event intake from internal
publishers, signing, queuing, delivery attempts, retry scheduling,
dead-letter handling, replay, audit logging, tenant isolation, and
observability, plus the acceptance-test suite for all of the above.

Out of scope: the internal event-producing services (order service,
billing service, etc.) that decide *when* a webhook-worthy event occurs;
customer-facing UI for managing subscriptions (an API is sufficient per
Assumption A7); any billing/metering for webhook usage.

This is a single, appropriately-scoped subsystem — it does not need
decomposition into independent sub-projects.

## 3. Assumptions (technical choices the brief deliberately left open)

The brief explicitly withholds queue, database, cloud provider, HTTP
framework, signature algorithm, retry limit, retention period, and UI
choices. Each is resolved here as a labeled assumption so the design is
concrete enough to plan and test, while staying visibly swappable.

- **A1 — Runtime/language:** Node.js + TypeScript (given directly by the
  brief).
- **A2 — Durable queue:** A generic durable, at-least-once, delayed-delivery
  message queue (e.g., SQS-, Cloud Tasks-, or Postgres-backed job queue —
  any of these satisfy the design). The design depends only on the queue
  supporting: enqueue with a visibility/delay timestamp, at-least-once
  delivery, and per-message retry count. No specific vendor is chosen.
- **A3 — System of record:** A relational database (Postgres-compatible
  SQL) for tenants, endpoints, secrets, deliveries, attempts, and the
  dead-letter table. Relational is assumed because the domain is
  transactional (state transitions per delivery) and needs tenant-scoped
  indexed queries and audit joins.
- **A4 — Signature algorithm:** HMAC-SHA256 over `timestamp.body`, sent as
  a `Webhook-Signature: t=<unix_ts>,v1=<hex_hmac>` header, following the
  common Stripe/GitHub-style convention. Chosen for wide client-library
  support and no key-management complexity beyond a shared secret.
- **A5 — Retry policy:** Exponential backoff with full jitter, base 30s,
  cap 1h between attempts, 16 attempts max, spanning roughly 24h before
  dead-lettering. Numbers are a starting point, not a product requirement;
  they are configurable per tenant (§4.4).
- **A6 — Audit log retention:** 90 days of full attempt bodies/headers,
  indefinite retention of delivery-level metadata (status, timestamps,
  counts) after body/header purge. Chosen as a reasonable
  support-window default; genuinely open (§9, Q1).
- **A7 — Interface surface:** REST/JSON admin API only (endpoint CRUD,
  delivery listing, replay trigger). No dedicated UI is designed; a
  console could consume this API later.
- **A8 — Delivery timeout:** 10s HTTP timeout per attempt to a customer
  endpoint, non-2xx or timeout counts as a failed attempt.
- **A9 — Ordering:** Per-endpoint delivery is best-effort ordered (FIFO
  per endpoint within a single attempt cycle) but not strictly guaranteed
  across retries — a later event can be delivered before an earlier one's
  retries are exhausted. Called out because the brief does not ask for
  ordering guarantees and providing strict ordering would add scope.

## 4. Architecture

### 4.1 Component overview

```
Internal event source
        |
        v
  Event Publisher API  --(writes)-->  events table
        |
        v
  Fan-out Job Creator  --(reads endpoint subscriptions for tenant+event type)
        |
        v
  Delivery Queue (A2)  <---------------------+
        |                                    |
        v                                    |
  Delivery Worker  --(HTTP POST, signed)-->  Customer Endpoint
        |                                    ^
        | failure                            | manual replay
        v                                    |
  Retry Scheduler --(re-enqueue w/ backoff)--+
        |
        | attempts exhausted
        v
  Dead-Letter Store  <-----+
        |                  |
        v                  |
  Delivery Audit Log ------+ (every attempt, terminal or not, is logged)
        ^
        |
  Admin/Replay API  --(operators, tenant admins)
        |
  Observability (metrics/logs/traces/alerts) taps every stage above
```

### 4.2 Components

- **Event Publisher API** (internal-only): internal services call this to
  record a domain event (`tenant_id`, `event_type`, `payload`, dedupe
  key). Writes to the `events` table in one transaction; does not touch
  the queue directly (keeps publishing decoupled from fan-out failure).
- **Fan-out Job Creator**: on new `events` rows (via outbox-poll or
  transactional trigger — see §4.3), looks up active `endpoints` for that
  tenant + event type, creates one `deliveries` row and one queue message
  per matching endpoint. This is where **tenant isolation** starts: fan-out
  is always scoped by `tenant_id`, and an endpoint can never be resolved
  for the wrong tenant because the lookup query is always
  `WHERE tenant_id = :event.tenant_id`.
- **Delivery Queue**: holds one message per delivery attempt, keyed by
  `delivery_id` + `attempt_number`. Messages have a not-before timestamp
  the Retry Scheduler sets for backoff.
- **Delivery Worker**: pool of stateless workers. For each message: loads
  the `deliveries` + `endpoints` row, builds the signed request (§4.5),
  performs the HTTP POST with timeout (A8), records a `delivery_attempts`
  row with outcome, and either marks the delivery `succeeded`, hands off
  to the Retry Scheduler, or (if attempts exhausted) hands off to
  dead-lettering. Workers are tenant-agnostic processes but every unit of
  work they touch carries `tenant_id`, so no cross-tenant state is ever
  held in memory across messages.
- **Retry Scheduler**: pure function `nextAttemptAt(attempt_number,
  policy)` plus the re-enqueue call. Computes exponential backoff with
  full jitter: `delay = random(0, min(cap, base * 2^attempt_number))`.
  Policy (base/cap/max attempts) is read from tenant or endpoint config
  (falls back to system default from A5).
- **Dead-Letter Store**: `dead_letters` table (see §4.4) holding
  deliveries that exhausted retries. Distinct from the audit log — it is
  the *actionable* queue of failed deliveries, while the audit log is the
  *historical* record of all attempts, successful or not.
- **Admin/Replay API**: REST endpoints scoped by `tenant_id` (and an
  operator override for cross-tenant support access, always logged) to:
  list deliveries/attempts, inspect a dead-letter entry, and trigger
  manual replay (creates a fresh `deliveries` row referencing the
  original event, attempt counter reset to 0, logged as a replay in the
  audit trail with the initiating principal).
- **Observability**: structured logs and metrics emitted at every stage
  (§7); no separate service — a cross-cutting concern implemented as
  instrumentation in each component above.

### 4.3 Event → delivery reliability (outbox pattern)

To avoid losing events if the process crashes between "event recorded"
and "queue message enqueued," the Event Publisher and Fan-out Job Creator
use the transactional outbox pattern: the event row and its fan-out
job rows are written in the database, and a separate relay process polls
for un-relayed rows and pushes them onto the Delivery Queue, marking them
relayed only after a successful enqueue (at-least-once). This is an
explicit design choice to avoid a dual-write (DB + queue in one
non-atomic operation) failure mode; it does add one moving part (the
relay poller) which is called out as a build cost, not hidden.

### 4.4 Data model (logical)

- `tenants(id, name, ...)`
- `endpoints(id, tenant_id, url, secret_id, subscribed_event_types[],
  status[active|disabled], retry_policy_override?, created_at)`
- `secrets(id, tenant_id, endpoint_id, signing_key, status[active|
  rotating|retired], created_at)` — supports **A4** and secret rotation
  (§4.5)
- `events(id, tenant_id, event_type, payload, dedupe_key, created_at)`
- `deliveries(id, tenant_id, event_id, endpoint_id, status[pending|
  succeeded|retrying|dead_lettered|replayed], attempt_count,
  next_attempt_at, created_at, updated_at)`
- `delivery_attempts(id, delivery_id, attempt_number, request_headers,
  request_body_ref, response_status, response_body_ref, latency_ms,
  outcome[success|http_error|timeout|network_error], attempted_at)` — the
  **delivery audit log**
- `dead_letters(id, delivery_id, tenant_id, reason, first_failed_at,
  dead_lettered_at, replayed_at?)`

Every table above carries `tenant_id` (denormalized onto `delivery_attempts`
and `dead_letters` even though it's derivable via `delivery_id`) so that
**every query, index, and row-level security policy can filter on it
directly** — this is the primary tenant-isolation mechanism at the data
layer (§6).

### 4.5 Signed webhooks

- Each `endpoints` row has an associated signing secret (`secrets` table).
- Outgoing request: `Webhook-Signature: t=<unix_ts>,v1=HMAC_SHA256(secret,
  "<unix_ts>.<raw_body>")`, plus `Webhook-Id: <delivery_id>` and
  `Webhook-Timestamp: <unix_ts>` headers (A4).
- Customers verify by recomputing the HMAC and checking the timestamp is
  within a tolerance window (default 5 minutes) to mitigate replay of a
  captured request.
- **Secret rotation:** a `secrets` row can be `rotating` — during rotation
  the worker signs with both old and new secret, sending two `v1=`/`v2=`
  values in the header, until the tenant confirms the new secret and the
  old one is retired. This is a deliberate design inclusion (not asked for
  literally by name, but required for signed webhooks to be operable
  long-term) — flagged in §9 as worth confirming with the user.

### 4.6 Idempotency

Two layers:

1. **Producer-side dedupe:** `events.dedupe_key` (unique per tenant) lets
   internal publishers safely retry their own `POST /events` call without
   creating duplicate events (standard idempotency-key pattern, unique
   constraint on `(tenant_id, dedupe_key)`).
2. **Consumer-side idempotency (the brief's primary ask):** every delivery
   carries a stable `Webhook-Id` (the `delivery_id`) that is **identical
   across retries of the same delivery** and **identical again on manual
   replay only if the customer opts into treating replays as the same
   logical delivery** — by default a replay gets a *new* `delivery_id`
   because it's a distinct customer-visible send event, with the *original*
   `event_id` unchanged so customers can still correlate. This distinction
   (retry vs. replay identity) is called out explicitly because getting it
   backwards would silently break customer dedupe logic.
   Customers are documented to dedupe on `Webhook-Id`; the system does not
   and cannot force customer-side idempotent handling, only make it
   possible.

### 4.7 Retries, backoff, and jitter

Covered by the Retry Scheduler (§4.2) and policy in A5. Full-jitter
exponential backoff is chosen over fixed or capped-without-jitter backoff
specifically to avoid thundering-herd retries against a customer endpoint
that is recovering, and to avoid synchronized retry storms across tenants
sharing infrastructure.

### 4.8 Dead-letter handling

A delivery moves to `dead_lettered` when `attempt_count` reaches the
policy's max attempts (A5) with no success. Dead-lettering is an explicit
state transition (not just "give up silently"): it writes a `dead_letters`
row, stops future retries, and emits an event/notification hook (§7) so
operators or tenant-configured alerting can react. Dead-lettered
deliveries remain replayable indefinitely (or until audit retention
purges the underlying attempt bodies, A6).

### 4.9 Manual replay

`POST /admin/deliveries/{id}/replay` (tenant-scoped, or operator override
with an audit-logged reason). Effect: creates a new `deliveries` row
(attempt_count reset, new `delivery_id` per §4.6), enqueues attempt 1
immediately (no backoff delay), and links back to the original delivery
via `replayed_from_delivery_id` for traceability. Replaying a
dead-lettered delivery does not require it to still be dead-lettered —
replay is available on any delivery, including already-succeeded ones
(e.g., a customer lost the original payload), which is a deliberate scope
decision flagged in §9.

## 5. Error handling

- **Customer endpoint unreachable / DNS failure / connection refused:**
  treated as `network_error` outcome, retried per policy.
- **Customer endpoint times out (A8):** treated as `timeout` outcome,
  retried per policy (idempotency lets a customer that actually received
  the slow request safely see it again).
- **Customer endpoint returns 4xx (except 429):** still retried by
  default (a temporary bad deploy on the customer's side is common), but
  distinguished in the audit log (`http_error`, status recorded) so
  operators/tenants can see a persistent 4xx pattern; not auto-classified
  as non-retryable, since the brief does not specify that nuance and
  hard-coding it would be a hidden product decision (§9, Q3).
- **Customer endpoint returns 429:** honored `Retry-After` header if
  present, otherwise standard backoff.
- **Queue message processed twice (at-least-once delivery, A2):**
  `delivery_attempts` insert is the source of truth; a worker checks
  `deliveries.status` before sending — if already `succeeded` or a newer
  attempt already recorded, it no-ops instead of double-sending. This
  protects against the *queue's* at-least-once semantics, distinct from
  customer-facing idempotency (§4.6).
- **Database unavailable during fan-out or attempt recording:** worker
  does not ack the queue message; message becomes visible again after
  visibility timeout and is retried at the transport level — this failure
  mode never reaches the customer endpoint, so it doesn't count against
  the delivery's own attempt budget.
- **Secret missing/rotating misconfiguration:** delivery fails closed
  (not sent unsigned), recorded as a `configuration_error` outcome, and
  surfaced distinctly from customer-endpoint failures in observability
  since it's an internal problem, not a customer one.

## 6. Tenant isolation

- **Data layer:** every table carries `tenant_id`; all application queries
  are required (via a lint rule / repository-layer helper, detailed in
  the implementation plan) to include a `tenant_id` filter. Where the
  database supports it (Postgres assumed, A3), row-level security
  policies enforce this as a second, defense-in-depth layer, not the only
  one.
- **Compute layer:** delivery workers are stateless and tenant-agnostic
  per message — no per-tenant connection pools, caches, or in-memory
  state persist across messages, so there is no code path where one
  tenant's data could leak into another's response.
- **Secrets:** signing secrets are stored per-endpoint (never shared
  across tenants) and never logged in plaintext (§7).
- **Rate/resource isolation:** a noisy or failing tenant's retry volume
  must not starve other tenants' deliveries. Addressed by per-tenant
  concurrency limits on the Delivery Queue consumer (cap in-flight
  deliveries per tenant) — flagged as a scope decision worth confirming
  (§9, Q4), since the brief asks for isolation but not specifically for a
  fairness/QoS mechanism, and a naive FIFO queue alone would not provide
  it.
- **Cross-tenant admin access:** any operator action that reads or
  replays another tenant's delivery must pass an explicit
  operator-override path that is itself audit-logged (who, when, why),
  never a silent bypass of the `tenant_id` filter.

## 7. Observability

- **Structured logs** (JSON) at: event received, fan-out job created,
  delivery attempt started/finished (with outcome), retry scheduled,
  dead-lettered, replay triggered. Every log line carries `tenant_id`,
  `delivery_id`, `attempt_number` for correlation.
- **Metrics:** delivery success rate (overall and per-tenant), attempt
  latency histogram, retry count distribution, queue depth, dead-letter
  rate, dead-letter store size, replay count. Per-tenant cardinality is
  bounded by aggregating to tenant tier/plan for high-cardinality tenants
  if needed (flagged as a future concern, not blocking).
- **Tracing:** a trace spans event → fan-out → each delivery attempt,
  correlated by `delivery_id`, so a single slow/failing delivery can be
  followed end-to-end.
- **Alerting hooks:** dead-letter rate above threshold, queue depth above
  threshold, and sustained per-tenant failure rate are alertable
  conditions; exact thresholds and paging destination are an operational
  decision outside this design's scope.
- **Audit log vs. observability:** the `delivery_attempts`/`dead_letters`
  tables (§4.4) are the durable, queryable audit trail for support and
  compliance; logs/metrics/traces are the operational, typically
  shorter-retention signal for running the system day to day. Keeping
  these separate is deliberate — audit data has different
  retention/access-control requirements (tenant-visible via the Admin
  API) than raw operational logs (internal-only).

## 8. Testing strategy

### 8.1 Levels

- **Unit tests:** signature generation/verification, backoff/jitter
  calculation (statistical bounds, not exact values), idempotency-key
  uniqueness handling, retry-vs-replay `delivery_id` semantics.
- **Integration tests:** Fan-out Job Creator against a real (test)
  database and queue; Delivery Worker against a mock HTTP endpoint
  covering success, 4xx, 5xx, timeout, and malformed-response cases;
  outbox relay crash-recovery (kill relay mid-batch, verify no lost/
  duplicated enqueues).
- **Acceptance tests** (brief's explicit ask) — black-box, against the
  full delivery pipeline, one scenario per brief bullet:

### 8.2 Acceptance test scenarios

1. **Signed webhooks:** given a registered endpoint and secret, when an
   event fires, then the delivered request's `Webhook-Signature` header
   verifies against the recorded secret and fails verification against a
   wrong secret.
2. **Idempotency:** given a delivery that is retried after a timeout that
   the customer actually received, when the customer inspects
   `Webhook-Id` across both requests, then it is identical; given a
   manual replay of the same delivery, then `Webhook-Id` differs but
   `event_id`-equivalent payload content is identical.
3. **Retries with backoff+jitter:** given an endpoint that fails N times
   then succeeds, when observing attempt timestamps, then intervals grow
   exponentially within jittered bounds and the delivery ultimately
   succeeds without exceeding max attempts.
4. **Dead-letter handling:** given an endpoint that always fails, when
   attempts reach the policy max, then the delivery is marked
   `dead_lettered`, appears in the dead-letter store, and no further
   automatic attempts occur.
5. **Manual replay:** given a dead-lettered delivery, when an authorized
   admin triggers replay, then a new delivery is created, sent
   immediately, and both old and new deliveries remain queryable with
   their link intact.
6. **Delivery audit log:** given any delivery (success or failure), when
   querying its history, then every attempt is present with correct
   outcome, status code, and timestamps, and the log is immutable
   (no update path, only insert).
7. **Tenant isolation:** given two tenants with endpoints subscribed to
   the same event type, when tenant A publishes an event, then only
   tenant A's endpoints receive it; given a direct attempt to fetch
   tenant B's delivery via tenant A's credentials, then the API returns
   not-found (not a 403 that would confirm existence).
8. **Observability:** given a delivery attempt, when it completes, then a
   log line and metric emission are produced containing `tenant_id`,
   `delivery_id`, and outcome (verified via test log/metric sink).
9. **Fan-out correctness:** given an endpoint subscribed to a subset of
   event types, when an unrelated event type fires, then no delivery is
   created for that endpoint.
10. **Configuration failure handling:** given an endpoint with a missing
    signing secret, when an event fires, then the delivery fails closed
    as a `configuration_error`, distinct from a customer-endpoint
    failure, and does not send an unsigned request.

### 8.3 Review and verification steps

Concrete, repo-agnostic checks to run before this design is considered
implementable and again before implementation is considered done:

- **Design review:** a second engineer confirms each brief bullet maps to
  a named component/section above (traceability check — see the mapping
  table in §10), and confirms every "deliberately unspecified" item from
  the brief appears in §3 as an assumption or §9 as an open question, not
  silently baked into a diagram.
- **Data model review:** confirm every table in §4.4 carries `tenant_id`
  (or is derivable in one join) before implementation starts — this is
  the load-bearing check for §6.
- **Threat/spec check on signing:** confirm the signature scheme (§4.5)
  resists replay (timestamp tolerance) and downgrade (no "unsigned"
  fallback path exists in the Delivery Worker).
- **Acceptance-test-first gate:** acceptance tests in §8.2 are written
  (and initially failing/pending) before implementation begins on the
  corresponding component, per the implementation plan's task ordering.
- **Pre-merge verification:** full acceptance suite green; unit +
  integration coverage on Retry Scheduler and signing module specifically,
  since they are pure/deterministic and cheap to fully cover; a manual
  exploratory pass hitting a real (or realistic mock) slow/flaky endpoint
  to sanity-check backoff behavior isn't just correct in tests but
  visibly reasonable in logs.
- **Isolation verification:** a dedicated adversarial test run (not just
  unit tests) attempting cross-tenant reads/replays through every Admin
  API route, confirming each is rejected before sign-off.

## 9. Open questions

These are choices the brief withholds and that a real engagement would
need the user to resolve; here they are recorded rather than answered,
per the comparison boundary (brief.md, "Deliberately unspecified"). The
assumptions in §3 are this design's placeholders for them, not answers.

1. What audit-log retention period does compliance/support actually
   require (A6 picks 90 days as a placeholder)?
2. Is per-tenant configurable retry policy (§4.3, §4.2) a real
   requirement, or is a single system-wide policy sufficient?
3. Should specific HTTP status codes (e.g., 400, 410 "Gone") be treated
   as non-retryable rather than retried like any other 4xx (§5)?
4. Is per-tenant delivery concurrency/fairness (§6, noisy-neighbor
   protection) required, or is best-effort FIFO acceptable?
5. Should replay be restricted to dead-lettered/failed deliveries only,
   or, as designed (§4.9), allowed on any delivery including already-
   succeeded ones?
6. Does secret rotation (§4.5) need to be in the first implementation, or
   is single-secret-per-endpoint (with manual replace-and-accept-a-gap)
   acceptable initially?
7. What queue and database technology will actually be used in
   production (A2, A3 are deliberately generic)? This affects the
   implementation plan's concrete task list, not this design's shape.

## 10. Brief-to-design traceability

| Brief requirement | Design section |
|---|---|
| Signed webhooks | §4.5 |
| Idempotency | §4.6 |
| Retries with exponential backoff and jitter | §4.7, §4.2 (Retry Scheduler) |
| Dead-letter handling | §4.8 |
| Manual replay | §4.9 |
| Delivery audit log | §4.4 (`delivery_attempts`), §7 |
| Tenant isolation | §6 |
| Observability | §7 |
| Acceptance tests | §8 |
