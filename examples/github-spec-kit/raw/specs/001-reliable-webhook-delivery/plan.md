# Implementation Plan: Reliable Webhook Delivery

**Branch**: `001-reliable-webhook-delivery` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reliable-webhook-delivery/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

The feature delivers webhook events to tenant-registered endpoints with cryptographic signing, retry-safe idempotency, bounded exponential-backoff-with-jitter retries, dead-letter capture with manual replay, a full delivery audit log, strict tenant isolation, and operational observability, per `spec.md`. The brief and constitution leave the underlying technology stack open; `research.md` records those choices as explicit, labeled decisions (Postgres-native queue + Postgres storage + Fastify API + HMAC-SHA256 signing + a documented retry/retention policy) rather than assuming them silently, and carries forward the cloud-provider choice and any dashboard UI as genuinely open per the brief's Scope Constraints. Technical approach: a single TypeScript service with two runtime roles — an HTTP API (endpoint management, audit query, replay trigger) and a delivery worker (polls a Postgres-native schedule table, sends signed requests, records attempts) — sharing one PostgreSQL database whose Row-Level Security policies provide the tenant-isolation boundary required by Principle VI.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 22 LTS — brief-stated language; version is a labeled Decision (see `research.md` §1).

**Primary Dependencies**: Fastify (HTTP API), Prisma (data access/ORM), OpenTelemetry SDK (traces/metrics) — all labeled Decisions, see `research.md` §2, §5, §12.

**Storage**: PostgreSQL 16, used both as the relational store for tenant/endpoint/delivery/audit data and as the retry-scheduling queue (`SELECT ... FOR UPDATE SKIP LOCKED`) — labeled Decision, see `research.md` §3–§4.

**Testing**: Vitest for unit/integration tests; schema-driven contract tests against `contracts/*` — labeled Decision, see `research.md` §13. Acceptance-scenario traceability (Principle VIII / FR-018) is mapped in `quickstart.md`.

**Target Platform**: Containerized Node.js service behind a TLS-terminating load balancer, cloud-agnostic; specific cloud provider is an explicit **Open Question**, not decided in this plan — see `research.md` §9 and constitution Scope Constraints.

**Project Type**: Single backend service (API + worker roles within one deployable TypeScript project) — no separate frontend is in scope; see `research.md` §10 for why the replay/audit surface is API-only in this plan.

**Performance Goals**: Not stated in the brief. Assumption: moderate multi-tenant SaaS load (low-hundreds of events/sec sustained, bursts absorbed by the retry queue) — see `research.md` §11 for the assumption and its revisit condition.

**Constraints**: Every event MUST reach a terminal, observable outcome (SC-001); idempotency-key coverage MUST be 100% across attempts/replays (SC-003); tenant isolation MUST hold with zero cross-tenant leakage across acceptance testing (SC-005). These are spec-level constraints this plan's design (RLS-enforced storage, shared idempotency-key contract, dead-letter/audit persistence) is built to satisfy.

**Scale/Scope**: Not stated in the brief; see `research.md` §11 (Assumption) — order of hundreds of tenants, low-hundreds of events/sec, revisit if actuals diverge materially.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | How this plan satisfies it |
|---|---|---|---|
| I. Reliable, Idempotent Delivery | Every event reaches delivered/dead-lettered/replayed, never silently dropped; idempotency key on every attempt | **PASS** | `data-model.md` Delivery state machine has no terminal "dropped" state; `Delivery Attempt` carries a stable idempotency key sourced from the parent `Delivery` (data-model.md §Delivery Attempt) |
| II. Signed Requests | Signature algorithm/key management recorded as explicit decision | **PASS** | `research.md` §6 (HMAC-SHA256, dual-secret rotation window); `contracts/webhook-delivery-request.md` documents the wire format |
| III. Resilient Retries | Exponential backoff + jitter; bounded; parameters recorded as explicit decisions | **PASS** | `research.md` §7 (30s base, ×2, 1h cap, full jitter, 16 attempts/24h bound) |
| IV. Dead-Letter Recovery & Manual Replay | Dead-letter preserves payload/target/history; replay reuses signing+idempotency | **PASS** | `data-model.md` Dead-Letter Entry; `contracts/dead-letter-replay-api.yaml` replay endpoint reuses the original `Delivery`'s idempotency key (research.md §6, data-model.md Replay Request) |
| V. Auditability | Every attempt/retry/dead-letter/replay recorded; retention recorded as explicit decision | **PASS** | `data-model.md` Audit Log Entry; `research.md` §8 (90-day payload retention, indefinite structural record) |
| VI. Tenant Isolation | Isolation enforced at data/access-control layer, not convention | **PASS** | `research.md` §3 (Postgres RLS); `data-model.md` notes `tenant_id` + RLS policy on every tenant-scoped table; `contracts/*` require tenant-scoped auth context on every endpoint |
| VII. Observability | Metrics/logs/traces distinct from audit log, sufficient to detect failure spikes/backlog growth/retry storms | **PASS** | `research.md` §12 (OpenTelemetry signals: outcome counters, latency histograms, queue-depth gauge, retry-rate-of-change) |
| VIII. Acceptance-Test Evidence | Every requirement traceable to an acceptance test | **PASS** | `quickstart.md` maps each `spec.md` acceptance scenario to a validation step; `research.md` §13 records the test framework decision |
| IX. Explicit Scope Boundary | No invented product/infra facts; every open item is a labeled Decision/Assumption/Open Question | **PASS** | `research.md` labels all nine Scope Constraint items individually (§1–§10); cloud provider (§9) and dashboard UI (§10) are explicitly left open rather than resolved |

No violations requiring justification. **Complexity Tracking is not filled in** — the two-role (API + worker) structure is required directly by Principle III's retry-scheduling need, not an avoidable elaboration.

*Post-Phase-1 re-check performed after `data-model.md`/`contracts/`/`quickstart.md` were drafted: no new violations introduced — the RLS-per-tenant-table design and the shared idempotency-key field on `Delivery` (rather than per-attempt regeneration) keep Principles I and VI satisfied by the concrete schema, not just the narrative above.*

## Project Structure

### Documentation (this feature)

```text
specs/001-reliable-webhook-delivery/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── api/                        # Fastify HTTP API (management, audit query, replay trigger)
│   ├── routes/
│   │   ├── webhook-endpoints.ts
│   │   ├── deliveries.ts       # audit log query surface
│   │   └── replays.ts
│   └── plugins/                # auth/tenant-context, RLS session binding, schema validation
├── worker/                     # delivery worker role
│   ├── scheduler.ts            # polls delivery_attempt_schedule via SKIP LOCKED
│   ├── sender.ts                # signs + sends outbound HTTP requests
│   └── backoff.ts               # exponential backoff + full jitter policy (research.md §7)
├── domain/                     # shared domain logic used by both roles
│   ├── signing.ts               # HMAC-SHA256 signing/verification (research.md §6)
│   ├── idempotency.ts
│   └── delivery-state-machine.ts
├── models/                     # Prisma schema + generated client wiring
└── observability/              # OpenTelemetry setup (research.md §12)

tests/
├── contract/                   # validates contracts/* schemas (wire format + REST API)
├── integration/                # end-to-end acceptance-scenario coverage (see quickstart.md)
└── unit/
```

**Structure Decision**: Single backend TypeScript project (no separate frontend — see `research.md` §10) with two runtime entry points (`api`, `worker`) sharing `domain/` and `models/`, both connecting to the one PostgreSQL database. This matches "Option 1: Single project" from the template, specialized with `api/`/`worker/` in place of a generic `services/` folder to make the two independently-scaled runtime roles explicit, since Principle III's retry scheduling and Principle VII's API-driven audit/replay surface have genuinely different scaling and failure-isolation needs.

## Complexity Tracking

*No entries — Constitution Check reported no violations requiring justification.*
