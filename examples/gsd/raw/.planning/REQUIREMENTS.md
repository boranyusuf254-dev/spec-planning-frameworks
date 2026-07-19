# Requirements: Reliable Webhook Delivery

**Defined:** 2026-07-19
**Core Value:** A webhook event, once accepted, is eventually delivered to the tenant's endpoint exactly as promised (verifiably signed, safe to process more than once, never silently dropped) — or it is visibly parked for manual attention.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases. Every requirement traces directly to one of the nine design dimensions listed in `brief.md`; none extend product scope beyond it.

### Signing

- [ ] **SIGN-01**: Every outbound webhook request includes a cryptographic signature the receiving endpoint can verify against a shared secret
- [ ] **SIGN-02**: The signature is tamper-evident — it covers the exact payload delivered, so any modification in transit invalidates it

### Idempotency

- [ ] **IDEM-01**: Every webhook delivery carries a unique identifier so a receiver can detect and ignore a duplicate delivery
- [ ] **IDEM-02**: Redelivering the same event (e.g., on retry) preserves its original idempotency identifier

### Retries

- [ ] **RETRY-01**: A failed delivery (non-2xx response or timeout) is automatically retried
- [ ] **RETRY-02**: Retry delay increases exponentially between successive attempts
- [ ] **RETRY-03**: Retry delay includes randomized jitter to avoid synchronized retry storms across tenants

### Dead-Letter Handling

- [ ] **DLQ-01**: A delivery that exhausts its retry attempts moves to a dead-letter state instead of being silently discarded
- [ ] **DLQ-02**: A dead-lettered delivery remains inspectable — its payload, target, and failure history are retrievable

### Manual Replay

- [ ] **REPLAY-01**: A dead-lettered delivery can be manually triggered for redelivery on demand
- [ ] **REPLAY-02**: A replayed delivery is recorded as a new attempt in the audit log without losing the original delivery's failure history

### Delivery Audit Log

- [ ] **AUDIT-01**: Every delivery attempt, successful or failed, is recorded with timestamp, target endpoint, response status, and outcome
- [ ] **AUDIT-02**: Audit records can be queried per webhook event and per tenant

### Tenant Isolation

- [ ] **TENANT-01**: A tenant can only view or replay deliveries belonging to their own webhooks
- [ ] **TENANT-02**: A failure or retry backlog in one tenant's webhook deliveries does not block or delay another tenant's deliveries

### Observability

- [ ] **OBSV-01**: Delivery success rate, retry counts, and dead-letter volume are exposed as metrics
- [ ] **OBSV-02**: An individual delivery's full attempt history can be traced end-to-end for debugging

### Acceptance Tests

- [ ] **TEST-01**: Automated acceptance tests verify signature generation/verification, idempotent redelivery, exponential backoff with jitter, dead-letter transition, manual replay, audit logging, and tenant isolation end-to-end

## v2 Requirements

None. The brief defines a single, complete set of design dimensions ("The design must cover: ...") with no explicitly deferred capabilities. Nothing has been added beyond it, so there is no v2 backlog at this time.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Webhook subscription management UI | Brief specifies no user interface for any part of this system; deferred as a separate product surface, not part of the delivery design |
| Inbound webhook receipt | Brief's scope is outbound delivery ("webhook delivery"), not receiving webhooks from third parties |
| Multi-region / multi-cloud failover | Brief does not specify a cloud provider or availability target — tracked as an open question in PROJECT.md, not assumed in scope |
| Specific queue/broker, database, cloud provider, HTTP framework, signature algorithm, retry limit, and retention period choices | Brief marks these "deliberately unspecified" — see PROJECT.md § Open Questions. These are technical decisions for roadmap/phase planning to make explicitly, not requirements to define now |

## Traceability

Which phases cover which requirements. Updated after roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SIGN-01 | Phase 1 | Pending |
| SIGN-02 | Phase 1 | Pending |
| IDEM-01 | Phase 1 | Pending |
| IDEM-02 | Phase 1 | Pending |
| RETRY-01 | Phase 2 | Pending |
| RETRY-02 | Phase 2 | Pending |
| RETRY-03 | Phase 2 | Pending |
| DLQ-01 | Phase 2 | Pending |
| DLQ-02 | Phase 2 | Pending |
| AUDIT-01 | Phase 3 | Pending |
| AUDIT-02 | Phase 3 | Pending |
| REPLAY-01 | Phase 3 | Pending |
| REPLAY-02 | Phase 3 | Pending |
| TENANT-01 | Phase 4 | Pending |
| TENANT-02 | Phase 4 | Pending |
| OBSV-01 | Phase 5 | Pending |
| OBSV-02 | Phase 5 | Pending |
| TEST-01 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-19*
*Last updated: 2026-07-19 after roadmap creation (5 phases, 100% coverage)*
