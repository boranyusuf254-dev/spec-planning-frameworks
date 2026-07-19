# Research: Reliable Webhook Delivery

**Feature**: `001-reliable-webhook-delivery` | **Date**: 2026-07-19

## Purpose

The brief (`brief.md`) and the constitution (Scope Constraints, Principle IX)
deliberately leave a set of technical choices open: queue technology,
database, cloud provider, HTTP framework, signature algorithm, retry limit,
retention period, and replay UI. The constitution also requires (Principles
II, III, V) that the signature algorithm, retry policy parameters, and
retention period specifically be resolved as **explicit decisions in the
planning artifact** rather than left unassumed. This document records how
each open item is resolved for this plan: as a labeled **Decision** (with
rationale and alternatives), a labeled **Assumption** (with a
revisit-if-wrong note), or an explicit **Open Question** carried forward
unresolved. None of these are product requirements — they are technical
choices made to produce a buildable design from the brief's product intent.

---

## 1. Language & runtime

- **Decision**: TypeScript 5.x targeting Node.js 22 LTS (Active LTS at time of writing).
- **Rationale**: The brief states the product is "a TypeScript SaaS API" — this is given, not chosen. Node.js 22 is selected as the concrete LTS line because it is the current Active LTS, giving the longest support runway from the plan's creation date; no product requirement depends on a specific Node version.
- **Alternatives considered**: Node.js 20 LTS (Maintenance LTS by the time this would ship — rejected as it shortens support runway with no offsetting benefit); Deno/Bun (rejected — brief's ecosystem/tooling assumption is Node-based TypeScript SaaS, and introducing a non-Node runtime is an unrequested product-adjacent choice).

## 2. HTTP framework (outbound sender + inbound management/audit API)

- **Decision**: Fastify.
- **Rationale**: TypeScript-first typing, built-in JSON Schema request/response validation (useful for contract enforcement on the audit/replay/management API), and a plugin model that cleanly separates the inbound API surface from the outbound delivery worker. This is a technical, swappable choice — no functional requirement depends on Fastify specifically.
- **Alternatives considered**: Express (larger ecosystem but weaker native TS/validation story, would need extra middleware); NestJS (more structure than this scope needs, heavier learning/complexity cost not justified by requirements).

## 3. Database / storage

- **Decision**: PostgreSQL 16.
- **Rationale**: Delivery state, dead-letter entries, and the audit log (FR-008, FR-012) need transactional consistency between "record the attempt" and "advance the delivery state machine" — a relational store with real transactions is a natural fit. PostgreSQL additionally supports Row-Level Security, which gives tenant isolation (Principle VI, FR-014/FR-015) a database-enforced boundary rather than an application-convention one, and JSONB for flexible payload/attempt-context storage without a schema migration per event type.
- **Alternatives considered**: DynamoDB or another managed NoSQL store (rejected — weaker fit for the audit log's append-and-query-by-multiple-dimensions access pattern and for RLS-style tenant enforcement); MySQL (viable alternative, no RLS equivalent as mature as Postgres's, so rejected in favor of Postgres for the tenant-isolation gate).

## 4. Queue / retry scheduling mechanism

- **Decision**: A PostgreSQL-native queue (a `delivery_attempt_schedule` table polled with `SELECT ... FOR UPDATE SKIP LOCKED`), not a separate message broker.
- **Rationale**: Retry scheduling (FR-005, FR-006) must stay consistent with delivery state and the audit log — using the same transactional store for "next attempt due at T" avoids a dual-write/outbox problem between a broker and the database, and avoids introducing a second piece of stateful infrastructure. `SKIP LOCKED` gives safe concurrent worker polling without external coordination.
- **Alternatives considered**: Redis + BullMQ (mature retry/backoff primitives out of the box, but introduces a second source of truth that must be kept consistent with the Postgres-recorded audit log and risks a class of "queue says retrying, DB says dead-lettered" bugs); a managed cloud queue (SQS/Cloud Tasks) — rejected here because it also couples the design to a cloud provider, which is explicitly an open item (see §9); revisit if delivery volume outgrows what a polled Postgres table can sustain (see risk note below).
- **Risk / revisit condition**: This decision favors consistency over raw throughput. If observed or projected delivery volume requires a dedicated broker's throughput characteristics, this should be revisited — the brief and spec do not state a scale target (see §11), so this is a plannable but not yet triggered risk.

## 5. Data access layer

- **Decision**: Prisma ORM with raw-SQL escape hatches for `SKIP LOCKED` polling and RLS session-variable setup.
- **Rationale**: Type-safe schema-to-TypeScript mapping reduces drift between `data-model.md` and implementation; Prisma supports raw queries where its query builder can't express `FOR UPDATE SKIP LOCKED` or per-request `SET LOCAL app.tenant_id`.
- **Alternatives considered**: Drizzle ORM (comparable fit, lighter weight; Prisma chosen for maturity of migration tooling, not a strong requirement either way — this is the lowest-stakes decision in this document and easily revisited).

## 6. Signature algorithm & key management (Principle II — decision required)

- **Decision**: HMAC-SHA256 over a canonical string of `{timestamp}.{idempotency_key}.{raw_request_body}`, sent as a `Webhook-Signature: t={timestamp},v1={hex_hmac}` header, following the pattern established by Stripe/GitHub-style webhook signing. Each webhook endpoint has one **currently active** signing secret plus, during rotation, one **still-valid previous** secret; both are checked on generation of new deliveries only against the active one, but tenants are told to accept either during a rotation window.
- **Rationale**: HMAC-SHA256 is symmetric, fast, and requires no PKI/certificate management, appropriate for a tenant-provided shared secret model. Including the timestamp in the signed string lets receivers reject stale/replayed requests independent of the idempotency key. This is the prevailing industry convention (matches the spec's Assumption in `spec.md` about industry-convention success/failure classification).
- **Alternatives considered**: Asymmetric signing (Ed25519/RSA) — rejected as unnecessary complexity for this brief; it adds public-key distribution/rotation machinery that only pays off if tenants need to verify without a shared secret (not stated as a requirement), and it materially increases key-management scope beyond what the brief asks for. Plain HMAC-SHA1 — rejected, weaker primitive with no offsetting benefit.
- **Key rotation mechanism**: A tenant-initiated rotation creates a new active secret and demotes the prior one to "grace period" (time-bounded, see retention/rotation window in §7 assumption) rather than immediate revocation, so in-flight retries signed with the old secret during the rotation race (see spec Edge Cases) remain verifiable until the grace window ends.

## 7. Retry policy parameters (Principle III — decision required)

- **Decision**:
  - Backoff: exponential base delay of 30 seconds, multiplier 2, capped at a 1-hour maximum inter-attempt delay.
  - Jitter: "full jitter" (`delay = random_between(0, min(cap, base * 2^attempt))`), per the AWS Architecture Blog's widely-cited backoff/jitter analysis, to avoid synchronized retry storms across tenants sharing infrastructure (spec Edge Case).
  - Bound: 16 total attempts **or** 24 hours elapsed since the first attempt, whichever comes first; the delivery moves to dead-letter when either bound is reached.
- **Rationale**: These numbers are not stated in the brief; they are a reasonable, documented default balancing "give a transiently-down receiver a real chance to recover" against "don't hold an event in limbo indefinitely." Full jitter is chosen specifically because the spec's Edge Cases and User Story 4 call out retry storms and cross-tenant noisy-neighbor risk as things the design must not create.
- **Alternatives considered**: Fixed/linear backoff (rejected — spec/constitution require exponential); equal or decorrelated jitter (viable, full jitter chosen as the simplest strategy that still meets the storm-avoidance goal — this is a low-stakes sub-choice within the decision).
- **What happens if this is wrong**: If 24 hours / 16 attempts proves too short for tenants whose receivers have longer outages, dead-letter volume will run higher than typical (this risk is already flagged in `spec.md`'s Assumptions); if too long, tenants may perceive "stuck" deliveries. Both are cheaply adjustable config, not architectural, so the risk is contained.

## 8. Retention period (Principle V — decision required)

- **Decision**: Delivery attempts, dead-letter entries (including payload), and audit log entries are retained for 90 days from creation, after which payload bodies are purged but the audit log's structural record (timestamps, outcome, target, attempt count) is retained indefinitely for compliance/history purposes. Dead-lettered events whose payload has been purged can no longer be replayed (spec Edge Case is explicitly resolved this way: replay after purge returns a "payload no longer available" error rather than a silent no-op).
- **Rationale**: 90 days is long enough to cover the overwhelming majority of "tenant reports a missing webhook weeks later" support cases while bounding storage growth for payload bodies, which are the most storage-heavy part of the audit trail.
- **Alternatives considered**: 30 days (rejected — too short a window for typical enterprise support/billing-cycle investigation lag); indefinite payload retention (rejected — unbounded storage growth and potential data-minimization/compliance concerns for tenant payload data with no stated business need to keep it forever).

## 9. Cloud provider / hosting environment — left open

- **Open Question** (per Scope Constraints — not decided here): The design commits only to "a container running Node.js 22 behind a TLS-terminating HTTP load balancer, with a managed PostgreSQL-compatible database." This runs unmodified on AWS, GCP, Azure, or a self-hosted equivalent. Choosing the specific provider does not change any artifact in this plan (data model, contracts, quickstart) and is deferred to a deployment decision outside this feature's scope.

## 10. Replay / audit interface

- **Decision**: The replay and audit-log capabilities are exposed as an authenticated REST API (see `contracts/`); this plan does not include a dedicated operator or tenant-facing dashboard UI.
- **Rationale**: The spec's Assumption already narrows this to "some authorized-operator-facing interface exists" (FR-009) without committing to a UI. An API-first design satisfies FR-009/FR-013 directly and lets a dashboard (internal or tenant-self-service) be built as a thin client later without re-opening this feature's contracts.
- **Open Question carried forward**: Whether a dashboard UI ships, and whether it's tenant-self-service, operator-only, or both, remains open per `spec.md`'s existing Open Question — this plan does not resolve it, since no UI-affecting product requirement is stated in the brief.

## 11. Scale / performance targets — assumption

- **Assumption**: The brief and spec state no throughput, latency, or tenant-count target. This plan assumes a moderate multi-tenant SaaS load profile (order of hundreds of tenants, low-hundreds of events/second sustained, bursts tolerated by queuing) for the purpose of sizing the Postgres-native queue decision in §4.
- **What happens if this is wrong**: If actual/projected scale is materially higher, §4's queue decision (Postgres `SKIP LOCKED`) is the first thing to revisit in favor of a dedicated broker. This is called out explicitly so the tradeoff is visible rather than silently baked in.

## 12. Observability instrumentation

- **Decision**: OpenTelemetry (traces + metrics) emitted via the OTLP protocol, plus structured (JSON) logs, satisfying FR-016/FR-017 without committing to a specific backend/vendor.
- **Rationale**: OpenTelemetry is vendor-neutral, so it doesn't force the cloud-provider decision this plan deliberately leaves open (§9) — whatever backend a deployment chooses (CloudWatch, Datadog, Grafana Cloud, etc.) can ingest OTLP. Key signals to emit: delivery outcome counters (success/retry/dead-letter) by tenant-bucketed cardinality-safe labels, attempt latency histograms, retry-queue depth gauge, and a retry-rate-of-change signal to distinguish a "storm" from normal traffic (User Story 4).
- **Alternatives considered**: Vendor-specific SDK (e.g., Datadog APM) — rejected, would silently couple observability to a cloud/vendor choice the brief leaves open.

## 13. Testing approach (Principle VIII — acceptance-test evidence)

- **Decision**: Vitest for unit and integration tests; a contract-test suite that validates the outbound webhook wire format (§6, `contracts/webhook-delivery-request.md`) and the management/audit/replay REST API (`contracts/*.yaml`) against their documented schemas; acceptance scenarios from `spec.md` (§ User Scenarios) are each mapped to at least one integration test in `quickstart.md`'s validation flow, satisfying FR-018.
- **Rationale**: Vitest is TypeScript-native (no transpile config overhead), fast, and has first-class ESM/TS support matching the Node 22 + TS 5 stack decided in §1.
- **Alternatives considered**: Jest (mature, larger ecosystem, but slower TS/ESM story) — rejected in favor of Vitest given no requirement favors Jest specifically.

---

## Summary table

| # | Item | Resolution |
|---|------|------------|
| 1 | Language/runtime | Decision — TypeScript 5.x / Node.js 22 LTS |
| 2 | HTTP framework | Decision — Fastify |
| 3 | Database | Decision — PostgreSQL 16 |
| 4 | Queue | Decision — Postgres-native (`SKIP LOCKED`), with revisit condition |
| 5 | Data access layer | Decision — Prisma |
| 6 | Signature algorithm | Decision — HMAC-SHA256, dual-secret rotation window |
| 7 | Retry limit/backoff | Decision — 16 attempts / 24h, exponential base 30s ×2, full jitter, 1h cap |
| 8 | Retention period | Decision — 90 days payload + attempt detail, indefinite structural audit record |
| 9 | Cloud provider | **Open Question** — deliberately not decided |
| 10 | Replay/audit interface | Decision — REST API; dashboard UI left open |
| 11 | Scale/performance targets | Assumption — moderate SaaS load, revisit condition stated |
| 12 | Observability stack | Decision — OpenTelemetry (vendor-neutral) |
| 13 | Testing framework | Decision — Vitest |
