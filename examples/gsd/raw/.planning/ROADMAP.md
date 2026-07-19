# Roadmap: Reliable Webhook Delivery

## Overview

The roadmap builds the webhook delivery pipeline as five vertical slices, each ending in a working, verifiable capability rather than a technical layer. It starts with the smallest end-to-end path — a single signed, idempotent delivery — then layers in resilience (retry/backoff/jitter, dead-letter handling), visibility and recovery (audit log, manual replay), safety (tenant isolation), and finally operational observability plus a comprehensive acceptance suite that proves every guarantee holds together. Several technical choices the brief leaves open (queue/broker, database, cloud provider, HTTP framework, signature algorithm, retry limits, retention period, replay interface) are not resolved here — each phase is scoped to be agnostic to those choices; phase planning must make and record the specific decision when it becomes load-bearing for that phase's work.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Signed, Idempotent Delivery** - A webhook event can be delivered once to a tenant endpoint with a verifiable signature and a stable idempotency identifier
- [ ] **Phase 2: Resilient Retry & Dead-Letter Handling** - Failed deliveries retry with exponential backoff and jitter; exhausted deliveries are dead-lettered and inspectable
- [ ] **Phase 3: Delivery Audit Trail & Manual Replay** - Every delivery attempt is logged and queryable; dead-lettered deliveries can be manually replayed
- [ ] **Phase 4: Tenant Isolation** - Webhook data, deliveries, and replay actions are strictly scoped per tenant with no cross-tenant interference
- [ ] **Phase 5: Observability & Acceptance Verification** - Delivery health is observable end-to-end and an automated suite verifies every guarantee together

## Phase Details

### Phase 1: Signed, Idempotent Delivery
**Goal**: A webhook event can be delivered to a tenant endpoint with a verifiable signature and a stable idempotency identifier that survives redelivery
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: SIGN-01, SIGN-02, IDEM-01, IDEM-02
**Success Criteria** (what must be TRUE):
  1. A webhook delivery request includes a signature the receiving endpoint can verify against the tenant's shared secret
  2. Modifying the delivered payload in transit invalidates the signature
  3. Each delivery carries a stable identifier a receiver can use to detect duplicate deliveries
  4. Retrying the same delivery preserves that identifier rather than minting a new one
**Plans**: TBD

**Open technical decisions for this phase:** signature algorithm (e.g. HMAC-SHA256) and the HTTP framework the delivery sender integrates with are unspecified in the brief — see PROJECT.md § Open Questions. Resolve explicitly during phase planning.

Plans:
- [ ] 01-01: TBD

### Phase 2: Resilient Retry & Dead-Letter Handling
**Goal**: A failed delivery is automatically retried with exponential backoff and jitter, and a delivery that exhausts retries is dead-lettered and remains inspectable instead of being lost
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: RETRY-01, RETRY-02, RETRY-03, DLQ-01, DLQ-02
**Success Criteria** (what must be TRUE):
  1. A delivery that receives a non-2xx response or times out is automatically retried
  2. Successive retry attempts wait progressively longer, following an exponential curve
  3. Retry wait times include randomized jitter rather than firing at fixed intervals
  4. A delivery that exhausts all retry attempts moves to a dead-letter state instead of vanishing
  5. A dead-lettered delivery's payload, target, and failure history can be inspected
**Plans**: TBD

**Open technical decisions for this phase:** the queue/job system backing retry scheduling and dead-letter storage, and the specific retry limit / backoff parameters (base delay, jitter range, cap, attempt count) are unspecified in the brief — see PROJECT.md § Open Questions. Resolve explicitly during phase planning.

Plans:
- [ ] 02-01: TBD

### Phase 3: Delivery Audit Trail & Manual Replay
**Goal**: Every delivery attempt across the pipeline is recorded in a queryable audit log, and a dead-lettered delivery can be manually replayed without losing its original failure history
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: AUDIT-01, AUDIT-02, REPLAY-01, REPLAY-02
**Success Criteria** (what must be TRUE):
  1. Every delivery attempt, successful or failed, appears in an audit log with timestamp, target, response status, and outcome
  2. Audit records can be looked up by webhook event and filtered by tenant
  3. A dead-lettered delivery can be manually triggered to redeliver on demand
  4. A replayed delivery shows up as a new audit entry while the original failure history stays intact
**Plans**: TBD

**Open technical decisions for this phase:** the datastore for audit records, the audit log retention period, and the interface used to trigger manual replay (admin UI, internal API, or CLI) are unspecified in the brief — see PROJECT.md § Open Questions. Resolve explicitly during phase planning.

Plans:
- [ ] 03-01: TBD

### Phase 4: Tenant Isolation
**Goal**: Webhook configuration, deliveries, audit records, and replay actions are strictly scoped per tenant, and one tenant's delivery failures or backlog cannot affect another tenant's deliveries
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: TENANT-01, TENANT-02
**Success Criteria** (what must be TRUE):
  1. A tenant can view and replay only deliveries belonging to their own webhooks, never another tenant's
  2. A large retry or dead-letter backlog for one tenant does not delay or block another tenant's deliveries
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Observability & Acceptance Verification
**Goal**: Operators can observe delivery pipeline health and trace individual deliveries for debugging, and an automated acceptance suite verifies every guarantee end-to-end
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: OBSV-01, OBSV-02, TEST-01
**Success Criteria** (what must be TRUE):
  1. Delivery success rate, retry counts, and dead-letter volume are visible as metrics
  2. A single delivery's full attempt history can be traced end-to-end for debugging
  3. Running the acceptance suite automatically verifies signing, idempotency, retry/backoff/jitter, dead-letter handling, replay, audit logging, and tenant isolation together
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Signed, Idempotent Delivery | 0/TBD | Not started | - |
| 2. Resilient Retry & Dead-Letter Handling | 0/TBD | Not started | - |
| 3. Delivery Audit Trail & Manual Replay | 0/TBD | Not started | - |
| 4. Tenant Isolation | 0/TBD | Not started | - |
| 5. Observability & Acceptance Verification | 0/TBD | Not started | - |
