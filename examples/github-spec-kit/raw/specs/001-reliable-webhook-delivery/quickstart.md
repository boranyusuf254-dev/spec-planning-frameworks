# Quickstart: Validating Reliable Webhook Delivery

**Feature**: `001-reliable-webhook-delivery` | **Date**: 2026-07-19

This guide is a validation/run guide, not an implementation guide — it proves
the design in `plan.md`/`data-model.md`/`contracts/` satisfies `spec.md`'s
acceptance scenarios (Principle VIII / FR-018). It does not contain
model/service/controller code or migrations; those belong to the
implementation phase and `tasks.md`.

## Prerequisites

- Node.js 22 LTS, PostgreSQL 16 running locally (or via container) — per `research.md` §1, §3.
- A local "mock receiver" HTTP server capable of: (a) verifying the `Webhook-Signature` header per `contracts/webhook-delivery-request.md`, (b) being toggled to return timeouts / 5xx / 4xx on demand, to simulate transient and permanent failures.
- Environment configured with a database connection string and the service's own signing/config values (see `plan.md` Technical Context — no cloud-provider-specific setup is required, per `research.md` §9).

## Setup

```bash
# install dependencies, run Prisma migrations against the schema in data-model.md
npm install
npx prisma migrate deploy

# start both runtime roles (plan.md Project Structure)
npm run start:api      # src/api
npm run start:worker   # src/worker
```

## Validation scenarios

Each scenario below maps directly to an acceptance scenario in `spec.md`.
Automated coverage lives in `tests/integration/` per `research.md` §13; the
manual steps here are the same flow, runnable by hand for a demo or a
one-off sanity check.

### 1. Trustworthy, deduplicated delivery (User Story 1, P1)

Maps to `spec.md` User Story 1, Acceptance Scenarios 1–4.

1. Register a mock-receiver URL as a webhook endpoint via `POST /webhook-endpoints` (`contracts/webhook-endpoints-api.yaml`); note the returned `signing_secret`.
2. Trigger a domain event for that tenant. **Expect**: the mock receiver gets a request whose `Webhook-Signature` verifies against the noted secret using the computation in `contracts/webhook-delivery-request.md`. *(Scenario 1)*
3. Configure the mock receiver to return a 500 for the first two requests, then succeed. **Expect**: `GET /deliveries/{id}` shows `attempt_count = 3`, each attempt's `Idempotency-Key` identical, and increasing delay between `attempted_at` timestamps consistent with `research.md` §7's backoff. *(Scenario 2)*
4. Have the mock receiver record every `Idempotency-Key` it has already processed and short-circuit to a stored response on repeat. **Expect**: even though attempt 3 succeeded after attempt 2's response was artificially dropped (simulate by having the receiver process but not respond), the receiver's own dedupe logic (informed by `Idempotency-Key`) means it never double-processes. *(Scenario 3)*
5. Repeat step 1–2 for a second tenant's endpoint. **Expect**: `GET /deliveries` scoped to tenant A's auth token never returns tenant B's delivery, and vice versa. *(Scenario 4)*

### 2. Dead-letter recovery and replay (User Story 2, P2)

Maps to `spec.md` User Story 2, Acceptance Scenarios 1–4.

1. Configure the mock receiver to always fail (e.g. return 503). Trigger an event. **Expect**: after the bound in `research.md` §7 (16 attempts or 24h) is reached, `GET /deliveries/{id}` shows `state = dead_lettered`, and `GET /dead-letters/{id}` (`contracts/dead-letter-replay-api.yaml`) returns the payload and full attempt history. *(Scenario 1)*
2. Fix the mock receiver to return 200. Call `POST /deliveries/{id}/replay`. **Expect**: `202` response, and shortly after, the delivery's attempt history gains a `kind = replay` entry with the same `Idempotency-Key` and a valid signature. *(Scenario 2)*
3. Attempt the same `GET /dead-letters/{id}` and `POST .../replay` calls using tenant B's auth token against tenant A's delivery id. **Expect**: `404` in both cases (not `403`, per FR-014's no-existence-leak requirement). *(Scenario 3)*
4. After the replay in step 2 resolves, call `GET /deliveries/{id}/audit-log`. **Expect**: a `replay_triggered` entry followed by a `replay_outcome` entry reflecting the actual result. *(Scenario 4)*

### 3. Full delivery audit history (User Story 3, P3)

Maps to `spec.md` User Story 3, Acceptance Scenarios 1–3.

1. Using the delivery from Scenario 2 above (which has gone through attempts, a dead-letter transition, and a replay), call `GET /deliveries/{id}/audit-log`. **Expect**: entries in chronological order covering every `attempt`, the `dead_lettered` transition, and the `replay_triggered`/`replay_outcome` pair. *(Scenario 1)*
2. Call the same endpoint with tenant B's auth token. **Expect**: `404`. *(Scenario 2)*
3. Inspect the returned entries' `detail` field. **Expect**: each contains a timestamp, outcome, and target endpoint sufficient to reconstruct what happened without querying the database directly. *(Scenario 3)*

### 4. Systemic health detection (User Story 4, P4)

Maps to `spec.md` User Story 4, Acceptance Scenarios 1–3.

1. Point several dozen test deliveries at a mock receiver forced to fail. **Expect**: the OpenTelemetry outcome counter for `retryable_failure`/`dead_lettered` (`research.md` §12) visibly rises in whatever local OTLP-compatible viewer is configured (e.g. an OpenTelemetry Collector + console exporter for local validation). *(Scenario 1)*
2. Let dead-lettered volume accumulate faster than replays drain it. **Expect**: the retry-queue-depth gauge trends upward. *(Scenario 2)*
3. Trigger a burst of simultaneous failures across many deliveries at once (a "storm"). **Expect**: the retry-rate-of-change signal distinguishably spikes relative to steady-state retry volume, per the full-jitter design intent in `research.md` §7 (jitter spreads retries out but the storm's initial spike is still visible as an aggregate rate change). *(Scenario 3)*

## Requirement traceability (FR-018)

Every functional requirement in `spec.md` is exercised by at least one step
above or by a contract-level test:

- FR-001–FR-002 (signing) → Scenario 1.2, `contracts/webhook-delivery-request.md` contract tests
- FR-003–FR-004 (idempotency) → Scenario 1.3–1.4
- FR-005–FR-007 (retries/classification) → Scenario 1.3, 2.1
- FR-008–FR-011 (dead-letter/replay) → Scenario 2.1–2.4
- FR-012–FR-013 (audit log) → Scenario 3.1–3.3
- FR-014–FR-015 (tenant isolation) → Scenario 1.5, 2.3, 3.2, plus RLS-level tests in `tests/integration/tenant-isolation.*`
- FR-016–FR-017 (observability) → Scenario 4.1–4.3
- FR-018 (this table)
