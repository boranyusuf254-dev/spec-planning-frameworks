# Reliable Webhook Delivery

## What This Is

A webhook delivery subsystem for a TypeScript SaaS API. It signs outgoing webhook events, delivers them to tenant-configured endpoints with idempotency guarantees, retries failed deliveries with exponential backoff and jitter, routes exhausted deliveries to a dead-letter path with manual replay, and records every delivery attempt in an audit log — all scoped per tenant and observable in production.

## Core Value

A webhook event, once accepted, is eventually delivered to the tenant's endpoint exactly as promised (verifiably signed, safe to process more than once, never silently dropped) — or it is visibly parked for manual attention. Silent loss is the one failure this system must never produce.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Webhook payloads are cryptographically signed so receivers can verify authenticity
- [ ] Duplicate delivery attempts are safely idempotent for the receiving endpoint
- [ ] Failed deliveries are retried with exponential backoff and jitter
- [ ] Deliveries that exhaust retries are routed to dead-letter handling instead of being dropped
- [ ] Dead-lettered deliveries can be manually replayed
- [ ] Every delivery attempt is recorded in an audit log
- [ ] Webhook data and configuration are isolated per tenant
- [ ] Delivery pipeline health and failures are observable (metrics/logs/traces)
- [ ] Acceptance tests exist that verify the above guarantees end-to-end

### Out of Scope

- Webhook subscription management UI — brief specifies no user interface; deferred as a product surface, not part of the delivery design itself
- Inbound webhook receipt (this system sends webhooks, it does not receive them) — brief scope is outbound delivery only
- Multi-region/multi-cloud failover — brief does not specify a cloud provider or availability target; treated as an open question, not assumed in scope

## Context

**Source input:** This project was initialized from `brief.md`, a fixed product brief used as a controlled comparison input across planning frameworks. The brief intentionally withholds several technical decisions (see Constraints and Open Questions below) so that each framework must surface them as decisions, assumptions, or open questions rather than treating them as hidden facts.

**Constraint on scope:** Per the brief's "Comparison boundary," this project covers planning artifacts only — PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, config — not an implementation of the webhook service. No product requirements beyond the brief's nine listed capabilities (signed webhooks, idempotency, retries with backoff/jitter, dead-letter handling, manual replay, delivery audit log, tenant isolation, observability, acceptance tests) have been added.

## Constraints

- **Language/runtime**: TypeScript SaaS API — stated directly in the brief.
- **Product scope**: Outbound webhook delivery design only, per the brief's comparison boundary; no implementation is expected from this initialization.

## Open Questions

<!-- Brief explicitly leaves these unspecified; downstream planning (requirements/roadmap/phase-planning) must resolve or continue to track these rather than silently assuming an answer. -->

- **Queue/broker**: Not specified. What durable queue or job system backs retry scheduling and dead-letter routing (e.g. a managed queue, a database-backed job table, a message broker)?
- **Database**: Not specified. What datastore holds tenant config, delivery audit records, and dead-letter entries?
- **Cloud provider**: Not specified. Is this deployed to a specific cloud, self-hosted, or provider-agnostic?
- **HTTP framework**: Not specified. What TypeScript HTTP framework does the SaaS API already use (relevant for where delivery endpoints/replay APIs live)?
- **Signature algorithm**: Not specified. HMAC-SHA256 is the common webhook-signing convention (e.g. Stripe-style), but the brief does not mandate it — needs an explicit decision.
- **Retry limit / backoff parameters**: Not specified. How many retry attempts before dead-lettering, and what are the base delay/jitter/cap values?
- **Audit log retention period**: Not specified. How long are delivery audit records and dead-letter entries retained?
- **User interface for manual replay**: Not specified. Is replay triggered via an admin UI, an internal API, a CLI, or a support-only tool?

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat brief.md as the complete and sole product input | This is a controlled comparison run; adding product requirements beyond the brief would invalidate the comparison | — Pending |
| Defer queue, database, cloud provider, HTTP framework, signature algorithm, retry limits, retention period, and UI to explicit open questions rather than assuming defaults | Brief explicitly marks these "deliberately unspecified" and requires them to be exposed, not hidden | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-19 after initialization*
