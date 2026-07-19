# Data Model: Reliable Webhook Delivery

**Feature**: `001-reliable-webhook-delivery` | **Date**: 2026-07-19

Storage: PostgreSQL 16 (`research.md` §3). Every tenant-scoped table carries a
`tenant_id` column and a Row-Level Security policy restricting rows to the
session's bound tenant, per Principle VI / FR-014 / FR-015. RLS is bypassed
only by an explicitly operator-privileged session role used for the
dead-letter/replay operator surface, which itself must still assert the
target tenant explicitly (never a blanket cross-tenant query) — see
`contracts/dead-letter-replay-api.yaml`.

---

## Entity: Tenant

Corresponds to `spec.md`'s Tenant entity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `name` | text | |
| `status` | enum(`active`, `suspended`) | Suspended tenants' endpoints stop receiving new deliveries; in-flight deliveries drain per FR-014 scoping, not silently dropped (Principle I) |
| `created_at` | timestamptz | |

**Relationships**: owns many `Webhook Endpoint`, `Event`, `Delivery`, `Audit Log Entry` rows (all via `tenant_id`).

---

## Entity: Webhook Endpoint

Corresponds to `spec.md`'s Webhook Endpoint entity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `tenant_id` | UUID (FK → Tenant, RLS key) | |
| `url` | text | Destination for deliveries |
| `subscribed_event_types` | text[] | |
| `status` | enum(`active`, `disabled`) | A disabled/deleted endpoint's scheduled attempts are cancelled, not silently attempted (spec Edge Case) |
| `active_signing_secret_id` | UUID (FK → Signing Secret) | |
| `created_at`, `updated_at` | timestamptz | |

**Relationships**: has many `Signing Secret` (rotation history), receives many `Delivery`.

**Validation rules**: `url` must be a well-formed HTTPS URL (signing a request over plaintext HTTP would defeat Principle II's tamper-evidence guarantee); at least one `subscribed_event_types` entry required for an `active` endpoint.

---

## Entity: Signing Secret

Not named explicitly in `spec.md`'s Key Entities but required to make
Principle II's key-management requirement concrete (`research.md` §6).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | Referenced as `kid` in the `Webhook-Signature` header context |
| `webhook_endpoint_id` | UUID (FK) | |
| `secret` | text (encrypted at rest) | |
| `status` | enum(`active`, `grace_period`, `revoked`) | Rotation: new secret becomes `active`, prior becomes `grace_period` until its window elapses, then `revoked` |
| `grace_period_ends_at` | timestamptz, nullable | Null when `status = active` |
| `created_at` | timestamptz | |

**State transitions**: `active → grace_period` (on rotation) `→ revoked` (on grace window elapse). New deliveries always sign with the endpoint's current `active` secret (`research.md` §6); verification-side documentation tells tenants to accept either `active` or `grace_period` secrets for their endpoint during a rotation window.

---

## Entity: Event

Corresponds to `spec.md`'s Event entity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `tenant_id` | UUID (FK, RLS key) | |
| `type` | text | e.g. `invoice.paid` |
| `payload` | jsonb | Purged (set null, structural record kept) after retention window (`research.md` §8) |
| `occurred_at` | timestamptz | |

**Relationships**: fans out into one `Delivery` per subscribed `Webhook Endpoint` (spec Assumption: multiple endpoints per tenant are tracked independently).

---

## Entity: Delivery

Corresponds to `spec.md`'s Delivery entity — the logical event/endpoint pairing.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `tenant_id` | UUID (FK, RLS key) | Denormalized from `Event`/`Webhook Endpoint` for direct RLS enforcement and query efficiency |
| `event_id` | UUID (FK → Event) | |
| `webhook_endpoint_id` | UUID (FK → Webhook Endpoint) | |
| `idempotency_key` | text, unique per (`event_id`, `webhook_endpoint_id`) | Stable across every attempt and replay of this delivery (FR-003) |
| `state` | enum — see state machine below | |
| `attempt_count` | integer | Incremented per `Delivery Attempt` |
| `next_attempt_at` | timestamptz, nullable | Drives the `SKIP LOCKED` scheduler poll (`research.md` §4); null when not awaiting a scheduled attempt |
| `first_attempted_at`, `last_attempted_at` | timestamptz, nullable | Used to evaluate the 24h retry-window bound (`research.md` §7) |
| `created_at` | timestamptz | |

**State machine** (FR-006, FR-008, FR-009, Principle I):

```text
pending → retrying → delivered            (success)
pending → retrying → dead_lettered        (retry policy exhausted: 16 attempts OR 24h, research.md §7)
dead_lettered → retrying → delivered      (operator replay succeeds)
dead_lettered → retrying → dead_lettered  (operator replay itself exhausts retries again)
delivered → retrying → delivered          (operator replay of an already-delivered event, FR-009)
```

No transition exits this graph without landing in `delivered` or `dead_lettered` — satisfying SC-001's "zero events silently dropped."

**Validation rules**: `idempotency_key` generation and value MUST NOT change across any transition (FR-003); a `replay` action always re-enters `retrying`, never fabricates a new `Delivery` row, so history stays attached to the original (FR-011).

---

## Entity: Delivery Attempt

Corresponds to `spec.md`'s Delivery Attempt entity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `tenant_id` | UUID (RLS key, denormalized) | |
| `delivery_id` | UUID (FK → Delivery) | |
| `attempt_number` | integer | 1-based, monotonic per `delivery_id` |
| `kind` | enum(`original`, `retry`, `replay`) | |
| `idempotency_key` | text | Copied from parent `Delivery.idempotency_key` at write time (never independently generated) |
| `signing_secret_id` | UUID (FK → Signing Secret) | Records which secret signed this specific attempt, for audit reconstruction during a rotation |
| `request_signature` | text | The computed `Webhook-Signature` header value sent |
| `outcome` | enum(`success`, `retryable_failure`, `non_retryable_failure`, `timeout`) | Classification per FR-007 |
| `http_status_code` | integer, nullable | Null on timeout/connection error |
| `latency_ms` | integer, nullable | |
| `attempted_at` | timestamptz | |

**Validation rules**: `outcome` classification is derived deterministically (`research.md`'s inherited assumption from `spec.md`: 2xx = success; timeout/connection-error/5xx/429 = retryable; other 4xx = non-retryable) — this classification function is the single place FR-007 is enforced, so `Delivery.state` transitions are driven by it, not re-implemented per caller.

---

## Entity: Dead-Letter Entry

Corresponds to `spec.md`'s Dead-Letter Entry entity. Modeled as a view over
`Delivery` (`state = dead_lettered`) joined with its `Event` (for payload,
subject to retention purge) and its `Delivery Attempt` history, rather than a
separately duplicated table — avoiding a second copy of the same history that
could drift from the audit log (Principle V/IX: don't invent a redundant
source of truth).

| Field (derived) | Source |
|---|---|
| `delivery` | `Delivery` row where `state = dead_lettered` |
| `payload` | `Event.payload` (may be null if purged past retention — spec Edge Case) |
| `target_endpoint` | `Webhook Endpoint` joined via `Delivery.webhook_endpoint_id` |
| `attempt_history` | All `Delivery Attempt` rows for `delivery_id`, ordered by `attempt_number` |

---

## Entity: Audit Log Entry

Corresponds to `spec.md`'s Audit Log Entry entity — immutable, append-only.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `tenant_id` | UUID (RLS key) | |
| `delivery_id` | UUID (FK → Delivery) | |
| `event_type` | enum(`attempt`, `retry_scheduled`, `dead_lettered`, `replay_triggered`, `replay_outcome`) | |
| `detail` | jsonb | Timestamp, outcome, target endpoint, attempt context (FR-012) — a structured, append-only projection, not a mutable summary |
| `actor` | text | System, or the identity of the operator who triggered a replay (FR-009 accountability) |
| `recorded_at` | timestamptz | |

**Validation rules**: Rows are insert-only; no update/delete path exists in the API surface (immutability supports FR-012/FR-013's reconstruction guarantee). Every `Delivery` state transition and every `Delivery Attempt` write produces exactly one corresponding `Audit Log Entry` in the same transaction, so the audit log can never under-report relative to `Delivery`/`Delivery Attempt` (closes the gap User Story 3 depends on).

---

## Entity: Replay Request

Corresponds to `spec.md`'s Replay Request entity.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID (PK) | |
| `tenant_id` | UUID (RLS key) | |
| `delivery_id` | UUID (FK → Delivery) | The delivery being replayed — dead-lettered or previously delivered (FR-009) |
| `requested_by` | text | Operator identity |
| `requested_at` | timestamptz | |
| `resulting_attempt_id` | UUID (FK → Delivery Attempt), nullable until the replay executes | Links back to the concrete attempt this request produced |

**Validation rules**: Creating a `Replay Request` for a `delivery_id` that has an attempt currently `retrying` (i.e., an automatic retry already in flight) MUST be serialized against that in-flight attempt — resolved by requiring the replay to acquire the same per-`delivery_id` scheduling lock the worker's `SKIP LOCKED` poll uses (`research.md` §4), so a manual replay and an automatic retry can never both be in flight for the same `Delivery` simultaneously (spec Edge Case: "manual replay racing with an in-flight automatic retry").

---

## Cross-cutting notes

- **Tenant isolation enforcement**: every table above carries `tenant_id` and an RLS policy `USING (tenant_id = current_setting('app.tenant_id')::uuid)`; the API layer sets `app.tenant_id` from the authenticated caller's session at the start of every request/transaction, and the worker sets it per-row from the `Delivery` being processed. This is the concrete mechanism behind Principle VI / FR-015's "enforced at the data and access-control layer, not by client-side convention alone."
- **Idempotency-key lifecycle**: generated once, at `Delivery` creation, and never regenerated — every `Delivery Attempt` (original, retry, or replay) copies it verbatim, which is what makes FR-004/FR-010/SC-003 structurally true rather than something each call site has to remember to preserve.
