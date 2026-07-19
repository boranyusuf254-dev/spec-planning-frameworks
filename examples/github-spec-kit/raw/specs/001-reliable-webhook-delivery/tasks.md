---

description: "Task list template for feature implementation"
---

# Tasks: Reliable Webhook Delivery

**Input**: Design documents from `/specs/001-reliable-webhook-delivery/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. `research.md` §13 records Vitest + a contract-test suite as an explicit Decision, `plan.md`'s Project Structure reserves `tests/contract/`, `tests/integration/`, `tests/unit/`, and Constitution Principle VIII / FR-018 require every requirement to be traceable to an acceptance test. Test tasks below implement that traceability; they are not a default TDD convention import.

**Organization**: Tasks are grouped by user story (spec.md priorities P1–P4) to enable independent implementation and testing of each story.

**Scope boundary**: No task below resolves the Open Questions the brief and `research.md` §9/§10 deliberately leave open (cloud provider/hosting environment; a dashboard UI for replay/audit). Replay and audit-log capabilities are implemented strictly as the REST API surface defined in `contracts/`, per `research.md` §10.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Paths follow `plan.md`'s Project Structure: `src/api/`, `src/worker/`, `src/domain/`, `src/models/`, `src/observability/`, `tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per `plan.md` Project Structure: `src/api/routes/`, `src/api/plugins/`, `src/worker/`, `src/domain/`, `src/models/`, `src/observability/`, `tests/contract/`, `tests/integration/`, `tests/unit/`
- [ ] T002 Initialize TypeScript 5.x project targeting Node.js 22 LTS with `package.json` and `tsconfig.json` (`research.md` §1 Decision)
- [ ] T003 [P] Add Fastify, Prisma, and OpenTelemetry SDK dependencies (`research.md` §2, §5, §12 Decisions)
- [ ] T004 [P] Add Vitest and contract-test tooling dependencies (`research.md` §13 Decision)
- [ ] T005 [P] Configure linting and formatting tools for the TypeScript project
- [ ] T006 Configure environment configuration management (DB connection string, signing config, OTLP endpoint) per `plan.md` Technical Context — deliberately no cloud-provider-specific setup (`research.md` §9 Open Question)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define Prisma schema for Tenant, Webhook Endpoint, Signing Secret, Event, Delivery, Delivery Attempt, Audit Log Entry, and Replay Request in `src/models/schema.prisma` per `data-model.md`
- [ ] T008 Write the initial Prisma migration creating all tables plus per-table Row-Level Security policies (`USING (tenant_id = current_setting('app.tenant_id')::uuid)`) per `data-model.md` Cross-cutting notes and `research.md` §3
- [ ] T009 [P] Implement Fastify tenant-auth plugin resolving the bearer token to a tenant-bound caller identity and setting the `app.tenant_id` session variable, in `src/api/plugins/tenant-auth.ts`
- [ ] T010 [P] Implement operator-role auth plugin for the `operatorAuth` security scheme (`contracts/dead-letter-replay-api.yaml`) in `src/api/plugins/operator-auth.ts`
- [ ] T011 [P] Implement worker-side per-row `app.tenant_id` binding when the worker processes a `Delivery`, in `src/worker/tenant-context.ts`
- [ ] T012 [P] Implement idempotency-key generation, generated once at `Delivery` creation and never regenerated (FR-003), in `src/domain/idempotency.ts`
- [ ] T013 [P] Implement the `Delivery` state machine (`pending → retrying → delivered`, `pending → retrying → dead_lettered`, replay re-entry transitions) in `src/domain/delivery-state-machine.ts` per `data-model.md`
- [ ] T014 [P] Implement HMAC-SHA256 signing/verification (`Webhook-Signature: t=...,v1=...` over `{timestamp}.{idempotency_key}.{raw_body}`, dual-secret rotation awareness) in `src/domain/signing.ts` per `research.md` §6 and `contracts/webhook-delivery-request.md`
- [ ] T015 [P] Implement exponential backoff with full jitter (30s base, ×2 multiplier, 1h cap, 16-attempt/24h bound) in `src/worker/backoff.ts` per `research.md` §7
- [ ] T016 Configure shared error-handling and structured JSON logging infrastructure for both the `api` and `worker` roles
- [ ] T017 [P] Bootstrap the OpenTelemetry SDK (traces + metrics, OTLP export) in `src/observability/otel.ts` per `research.md` §12
- [ ] T018 Wire the Prisma client and migration-running scripts (`npx prisma migrate deploy`) per `quickstart.md` Setup

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 - Tenant receives trustworthy, deduplicated event deliveries (Priority: P1) 🎯 MVP

**Goal**: Deliver a signed webhook request to a tenant's registered endpoint, automatically retry transient failures with exponential backoff and jitter under a stable idempotency key, and keep each tenant's deliveries strictly isolated.

**Independent Test**: Register a tenant webhook endpoint, trigger an event, verify the receiver gets a correctly signed request, and confirm a simulated transient receiver failure results in automatic retries that eventually succeed with the receiver observing the event exactly once (by idempotency key) despite multiple attempts.

### Tests for User Story 1

- [ ] T019 [P] [US1] Contract test for the outbound webhook wire format (headers, canonical signed string) against `contracts/webhook-delivery-request.md` in `tests/contract/webhook-delivery-request.test.ts`
- [ ] T020 [P] [US1] Contract test for `contracts/webhook-endpoints-api.yaml` (list/create/get/patch/rotate-secret) in `tests/contract/webhook-endpoints-api.test.ts`
- [ ] T021 [P] [US1] Integration test: signed delivery is sent and the receiver can verify the signature (`quickstart.md` Scenario 1 step 2 / spec.md Acceptance Scenario 1) in `tests/integration/signed-delivery.test.ts`
- [ ] T022 [P] [US1] Integration test: a transient failure triggers retries with exponential backoff and jitter, each carrying the same idempotency key (`quickstart.md` Scenario 1 step 3 / spec.md Acceptance Scenario 2) in `tests/integration/retry-backoff.test.ts`
- [ ] T023 [P] [US1] Integration test: a receiver that sees a repeated idempotency key safely treats the event as already handled (`quickstart.md` Scenario 1 step 4 / spec.md Acceptance Scenario 3) in `tests/integration/idempotent-redelivery.test.ts`
- [ ] T024 [P] [US1] Integration test: tenant A's endpoint never receives tenant B's deliveries and vice versa (`quickstart.md` Scenario 1 step 5 / spec.md Acceptance Scenario 4) in `tests/integration/tenant-isolation-delivery.test.ts`

### Implementation for User Story 1

- [ ] T025 [P] [US1] Create Webhook Endpoint and Signing Secret data-access wiring with validation (HTTPS-only `url`, at least one `subscribed_event_types` entry for an active endpoint) in `src/models/webhook-endpoint.ts`
- [ ] T026 [P] [US1] Create Event data-access wiring and tenant-scoped fan-out into one `Delivery` per subscribed Webhook Endpoint in `src/domain/event-fanout.ts`
- [ ] T027 [US1] Implement `GET /webhook-endpoints`, `POST /webhook-endpoints`, `GET /webhook-endpoints/{endpointId}`, `PATCH /webhook-endpoints/{endpointId}` in `src/api/routes/webhook-endpoints.ts` (depends on T025)
- [ ] T028 [US1] Implement `POST /webhook-endpoints/{endpointId}/rotate-secret` (new secret becomes `active`, prior becomes `grace_period`) in `src/api/routes/webhook-endpoints.ts` (depends on T025)
- [ ] T029 [US1] Implement `Delivery` creation on event fan-out, generating the stable idempotency key, in `src/domain/event-fanout.ts` (depends on T012, T026)
- [ ] T030 [US1] Implement the scheduler polling `delivery_attempt_schedule` via `SELECT ... FOR UPDATE SKIP LOCKED` in `src/worker/scheduler.ts` (depends on T008, T013)
- [ ] T031 [US1] Implement the sender: signs and sends the outbound request, classifies the outcome per FR-007 (2xx = success; timeout/5xx/429 = retryable; other 4xx = non-retryable) in `src/worker/sender.ts` (depends on T014)
- [ ] T032 [US1] Wire scheduler and sender together to advance the `Delivery` state machine and schedule the next attempt using the backoff policy on retryable failure in `src/worker/scheduler.ts` (depends on T030, T031, T015)
- [ ] T033 [US1] Add validation and error handling to the webhook-endpoints routes (malformed URL, empty event types, 404 for not-found/not-owned) in `src/api/routes/webhook-endpoints.ts`
- [ ] T034 [US1] Add structured logging for delivery-attempt lifecycle events across `src/worker/` and `src/api/`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Operator recovers permanently failed deliveries (Priority: P2)

**Goal**: Once a delivery's bounded retry policy is exhausted, preserve it in a dead-letter state with full diagnostic detail, and let an authorized operator trigger a replay signed and idempotency-keyed identically to the original.

**Independent Test**: Force a delivery to exhaust its retry policy, confirm it appears in the dead-letter state with its payload and attempt history intact, trigger a manual replay, and confirm the replay is delivered with a valid signature and the same idempotency key as the original.

### Tests for User Story 2

- [ ] T035 [P] [US2] Contract test for `contracts/dead-letter-replay-api.yaml` (list/detail/replay, including 404/409/422) in `tests/contract/dead-letter-replay-api.test.ts`
- [ ] T036 [P] [US2] Integration test: an exhausted retry policy moves the delivery to `dead_lettered`, preserving payload, target endpoint, and attempt history (`quickstart.md` Scenario 2 step 1 / spec.md Acceptance Scenario 1) in `tests/integration/dead-letter-transition.test.ts`
- [ ] T037 [P] [US2] Integration test: a manual replay of a dead-lettered delivery succeeds with the same idempotency key and a valid signature (`quickstart.md` Scenario 2 step 2 / spec.md Acceptance Scenario 2) in `tests/integration/replay-success.test.ts`
- [ ] T038 [P] [US2] Integration test: cross-tenant dead-letter/replay access returns 404, not 403 (`quickstart.md` Scenario 2 step 3 / spec.md Acceptance Scenario 3) in `tests/integration/tenant-isolation-replay.test.ts`
- [ ] T039 [P] [US2] Integration test: a replay's outcome is recorded into the delivery's history immediately after it resolves (`quickstart.md` Scenario 2 step 4 / spec.md Acceptance Scenario 4) in `tests/integration/replay-outcome-recording.test.ts`

### Implementation for User Story 2

- [ ] T040 [US2] Implement the dead-letter transition when the 16-attempt/24-hour bound is reached (`research.md` §7) in `src/domain/delivery-state-machine.ts` (depends on T013, T032)
- [ ] T041 [US2] Implement `GET /dead-letters` and `GET /dead-letters/{deliveryId}` in `src/api/routes/deliveries.ts` (depends on T040)
- [ ] T042 [US2] Implement the Replay Request data-access wiring and a per-delivery mutual-exclusion lock reusing the scheduler's `SKIP LOCKED` lock, so a replay and an in-flight automatic retry can never run concurrently (`data-model.md` Replay Request validation rule) in `src/models/replay-request.ts` and `src/worker/scheduler.ts`
- [ ] T043 [US2] Implement `POST /deliveries/{deliveryId}/replay` (202 accepted; 409 if a replay or retry is already in flight; 422 if the payload has been purged past retention) in `src/api/routes/replays.ts` (depends on T042, T014)
- [ ] T044 [US2] Implement the retention-based payload purge job (90-day payload purge, indefinite structural record) in `src/worker/retention-purge.ts` per `research.md` §8
- [ ] T045 [US2] Record `replay_triggered`/`replay_outcome` Audit Log Entries and update the delivery's history on replay resolution in `src/domain/audit-log.ts` (depends on T043)
- [ ] T046 [US2] Add validation and error handling for the dead-letter and replay endpoints (404 no-existence-leak, 409 in-flight conflict, 422 purged payload)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Support staff reconstructs an event's full delivery history (Priority: P3)

**Goal**: Let an authorized tenant user or operator look up an event's full delivery audit log — every attempt, retry, dead-letter transition, and replay, scoped strictly to the owning tenant.

**Independent Test**: Generate an event that goes through multiple attempts, a dead-letter transition, and a replay, then confirm the audit log for that event shows every one of those steps in order, and that a user from a different tenant cannot retrieve it.

### Tests for User Story 3

- [ ] T047 [P] [US3] Contract test for `contracts/deliveries-audit-api.yaml` (list/detail/audit-log, including 404) in `tests/contract/deliveries-audit-api.test.ts`
- [ ] T048 [P] [US3] Integration test: the audit log shows every attempt, retry, dead-letter transition, and replay in chronological order (`quickstart.md` Scenario 3 step 1 / spec.md Acceptance Scenario 1) in `tests/integration/audit-log-history.test.ts`
- [ ] T049 [P] [US3] Integration test: a cross-tenant audit-log query returns 404 without revealing existence (`quickstart.md` Scenario 3 step 2 / spec.md Acceptance Scenario 2) in `tests/integration/tenant-isolation-audit.test.ts`
- [ ] T050 [P] [US3] Integration test: audit entries carry enough detail (timestamp, outcome, target endpoint) to reconstruct the delivery lifecycle without consulting raw system internals (`quickstart.md` Scenario 3 step 3 / spec.md Acceptance Scenario 3) in `tests/integration/audit-log-detail.test.ts`

### Implementation for User Story 3

- [ ] T051 [US3] Ensure every `Delivery` state transition and `Delivery Attempt` write produces exactly one corresponding Audit Log Entry in the same transaction, in `src/domain/audit-log.ts` (depends on T013, T032, T040, T045)
- [ ] T052 [US3] Implement `GET /deliveries` (filterable by `webhook_endpoint_id`, `state`, `event_id`) in `src/api/routes/deliveries.ts`
- [ ] T053 [US3] Implement `GET /deliveries/{deliveryId}` (state plus attempt summary) in `src/api/routes/deliveries.ts`
- [ ] T054 [US3] Implement `GET /deliveries/{deliveryId}/audit-log` (chronological, tenant-scoped, 404 no-existence-leak) in `src/api/routes/deliveries.ts`

**Checkpoint**: User Stories 1, 2, AND 3 all work independently

---

## Phase 6: User Story 4 - On-call engineer detects systemic delivery problems before tenants report them (Priority: P4)

**Goal**: Surface operational signals (metrics/logs/traces) that let an on-call engineer see failure spikes, backlog growth, and retry storms without manually reading audit log entries.

**Independent Test**: Simulate a spike in delivery failures or a growing retry backlog and confirm that an operational signal (metric, log pattern, or trace) surfaces the degradation without requiring a manual audit log query.

### Tests for User Story 4

- [ ] T055 [P] [US4] Integration test: a failure-rate spike is visible via OpenTelemetry outcome counters without querying the audit log (`quickstart.md` Scenario 4 step 1 / spec.md Acceptance Scenario 1) in `tests/integration/observability-failure-spike.test.ts`
- [ ] T056 [P] [US4] Integration test: dead-letter/retry backlog growth is visible via the retry-queue-depth gauge (`quickstart.md` Scenario 4 step 2 / spec.md Acceptance Scenario 2) in `tests/integration/observability-backlog-growth.test.ts`
- [ ] T057 [P] [US4] Integration test: a retry storm is distinguishable from normal traffic via the retry-rate-of-change signal (`quickstart.md` Scenario 4 step 3 / spec.md Acceptance Scenario 3) in `tests/integration/observability-retry-storm.test.ts`

### Implementation for User Story 4

- [ ] T058 [P] [US4] Implement delivery-outcome counters (success/retry/dead-letter) with tenant-bucketed, cardinality-safe labels in `src/observability/outcome-metrics.ts` (depends on T017)
- [ ] T059 [P] [US4] Implement attempt-latency histograms in `src/observability/latency-metrics.ts` (depends on T017)
- [ ] T060 [P] [US4] Implement the retry-queue-depth gauge sourced from `delivery_attempt_schedule` in `src/observability/queue-depth-metrics.ts` (depends on T017, T030)
- [ ] T061 [US4] Implement the retry-rate-of-change signal distinguishing storms from steady-state retry volume in `src/observability/retry-rate-metrics.ts` (depends on T058)
- [ ] T062 [US4] Wire outcome counters, latency histograms, queue-depth gauge, and rate-of-change signal into the worker's scheduler and sender emission points in `src/worker/scheduler.ts` and `src/worker/sender.ts` (depends on T058, T059, T060, T061, T032)
- [ ] T063 [US4] Document alerting-threshold guidance for failure-rate and backlog-size degradation (FR-017) in `quickstart.md`

**Checkpoint**: All user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T064 [P] Additional unit tests for `src/domain/signing.ts`, `src/domain/idempotency.ts`, `src/domain/delivery-state-machine.ts`, and `src/worker/backoff.ts` in `tests/unit/`
- [ ] T065 [P] Documentation: README covering setup, running the `api` and `worker` roles, and links to `spec.md`/`plan.md`/`quickstart.md`
- [ ] T066 Security hardening review: signing-secret encryption at rest, and confirmation the operator-role RLS bypass always asserts an explicit target tenant rather than a blanket cross-tenant query (`data-model.md` intro note)
- [ ] T067 Run the full `quickstart.md` validation end-to-end (all four scenario groups) and record results
- [ ] T068 Code cleanup and refactoring pass across `src/api/`, `src/worker/`, `src/domain/`
- [ ] T069 Confirm FR-018 traceability: every FR-001–FR-017 maps to at least one passing test per `quickstart.md`'s Requirement traceability table

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — no dependency on other user stories
- **User Story 2 (Phase 4)**: Depends on Foundational; extends the `Delivery` state machine and worker scheduler built in User Story 1 (T013, T030, T032), so is built after US1 even though its acceptance test is independent
- **User Story 3 (Phase 5)**: Depends on Foundational; reads audit log entries written by US1 and US2 (T032, T040, T045), so is built after US2
- **User Story 4 (Phase 6)**: Depends on Foundational; instruments the worker built in US1 and the dead-letter/replay flow built in US2 (T032, T040, T043), so is built after US2 and can proceed alongside US3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests are written before implementation and should fail first
- Models/data-access before services
- Services before routes/endpoints
- Core implementation before cross-cutting wiring (logging, observability)
- Story complete before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel, and can start as soon as that story's dependencies are met
- Data-access/model tasks within a story marked [P] can run in parallel
- User Story 3 and User Story 4 implementation can proceed in parallel once User Story 2 is complete (both build on US1+US2 outputs but not on each other)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for outbound webhook wire format in tests/contract/webhook-delivery-request.test.ts"
Task: "Contract test for webhook-endpoints-api.yaml in tests/contract/webhook-endpoints-api.test.ts"
Task: "Integration test: signed delivery verification in tests/integration/signed-delivery.test.ts"
Task: "Integration test: retry backoff+jitter in tests/integration/retry-backoff.test.ts"
Task: "Integration test: idempotent redelivery in tests/integration/idempotent-redelivery.test.ts"
Task: "Integration test: tenant isolation on delivery in tests/integration/tenant-isolation-delivery.test.ts"

# Launch data-access tasks for User Story 1 together:
Task: "Webhook Endpoint + Signing Secret data-access wiring in src/models/webhook-endpoint.ts"
Task: "Event data-access wiring and fan-out in src/domain/event-fanout.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `quickstart.md` Scenario 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → validate against `quickstart.md` Scenario 1 → Deploy/Demo (MVP!)
3. Add User Story 2 → validate against `quickstart.md` Scenario 2 → Deploy/Demo
4. Add User Story 3 → validate against `quickstart.md` Scenario 3 → Deploy/Demo
5. Add User Story 4 → validate against `quickstart.md` Scenario 4 → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers, once Foundational is done:

- Developer A: User Story 1
- Developer B: starts User Story 2 as soon as US1's T013/T030/T032 land, ahead of full US1 completion
- Developer C: User Story 3 and User Story 4, once US2 lands

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No task resolves the brief's Open Questions (cloud provider, dashboard UI) — those remain open per `research.md` §9–§10
- Retry limit, retention period, signature algorithm, queue mechanism, database, and HTTP framework are implemented exactly as recorded in `research.md`'s labeled Decisions — no new technology choice is introduced by this task list
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
