# Phase 1: Signed, Idempotent Delivery - Context

**Gathered:** 2026-07-19
**Status:** Ready for planning

<domain>
## Phase Boundary

A webhook event can be delivered to a tenant endpoint with a verifiable signature and a stable idempotency identifier that survives redelivery. Scope is limited to SIGN-01, SIGN-02, IDEM-01, IDEM-02 — signing and idempotency only. Retries/backoff, dead-letter handling, audit trail, replay, tenant-isolation enforcement, and observability are explicitly out of scope for Phase 1 (they belong to Phases 2-5).

</domain>

<decisions>
### Process note — why there is no interactive discuss-phase transcript

This project is one run in a controlled comparison across planning frameworks (see `brief.md` "Comparison boundary" and "Deliberately unspecified"). Per explicit operator instruction for this run: no product requirements are added beyond `brief.md`'s nine listed design dimensions, no code is implemented, and this planning pass stops before `/gsd-execute-phase`. Rather than an interactive discuss-phase Q&A, this CONTEXT.md is synthesized directly from `brief.md` plus the already-committed `PROJECT.md` / `REQUIREMENTS.md` / `ROADMAP.md`.

This file deliberately does **not** pre-decide the phase's open technical questions below — that is delegated to `gsd-phase-researcher` / `gsd-planner`, who MUST record their choice as a visible, explicit decision or assumption (with rationale) in RESEARCH.md / PLAN.md rather than a silent default, per the brief's explicit requirement that unspecified choices be exposed, not hidden.

### Scope fence — no UI
- `brief.md` specifies no user interface for any part of this system; `PROJECT.md` Out of Scope explicitly excludes "Webhook subscription management UI." This is a backend delivery subsystem only — do not introduce one.
- **Walking Skeleton adaptation:** GSD's standard Walking Skeleton template (Phase 1 of a new MVP-mode project) calls for "one real UI interaction wired to the API." This system has no UI by brief scope. Substitute the equivalent end-to-end proof for a backend delivery pipeline: a real trigger (an internal API call, CLI command, or test harness) that causes one signed, idempotent delivery to reach a real receiving HTTP endpoint. That is the "real interaction" that proves the stack here — not a browser click. Do not force a UI into the skeleton to satisfy the template literally.

### Open technical decisions for this phase (from ROADMAP.md — resolve explicitly, do not silently default)
- **Signature algorithm** — not specified by the brief. Research and select (e.g., HMAC-SHA256 is the common webhook-signing convention), recording the choice and rationale explicitly.
- **HTTP framework** for the delivery sender — not specified by the brief, and there is no existing codebase to infer one from (this is a fresh planning artifact set; no application code exists yet). Select a concrete option so Phase 1's plan is actionable, and record the choice and rationale explicitly as swappable, not brief-mandated.
- **Minimal persistence for Phase 1** — the brief leaves "Database" as a project-wide open question (`PROJECT.md` § Open Questions), not resolved to a specific engine by any phase. Phase 1 still needs *some* concrete place to hold a tenant's signing secret and the delivery records used to prove idempotency end-to-end. Pick the smallest workable option for Phase 1 (e.g., a single relational table set) and record it as an explicit, swappable assumption — do not treat it as a locked project-wide database decision; Phase 3 (audit trail) may revisit it.

### Claude's Discretion
- Exact request/response header names for the signature and idempotency identifier, as long as documented in the plan.
- Internal code structure / module layout for the delivery sender, within whatever HTTP framework is selected.

</decisions>

<specifics>
## Specific Ideas

None. The brief provides no product-level specifics beyond the nine listed design dimensions (signed webhooks, idempotency, retries, dead-letter handling, manual replay, audit log, tenant isolation, observability, acceptance tests). No additional product requirements should be inferred beyond them.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product scope and constraints
- `brief.md` — the fixed, sole product input for this controlled-comparison run; defines the 9 required design dimensions and explicitly marks queue/broker, database, cloud provider, HTTP framework, signature algorithm, retry limits, retention period, and replay UI as "deliberately unspecified"
- `.planning/PROJECT.md` § Open Questions — the full list of unresolved technical choices tracked project-wide
- `.planning/REQUIREMENTS.md` — SIGN-01, SIGN-02, IDEM-01, IDEM-02 (this phase's requirements) and the full traceability table
- `.planning/ROADMAP.md` § Phase 1 — goal, success criteria, and the phase-specific "Open technical decisions for this phase" note

</canonical_refs>

<deferred>
## Deferred Ideas

- Queue/broker choice, retry limits/backoff parameters, dead-letter handling — Phase 2
- Full audit datastore choice, retention period, manual replay interface — Phase 3 (may revisit Phase 1's minimal persistence choice)
- Tenant isolation enforcement — Phase 4
- Observability tooling, end-to-end acceptance test suite — Phase 5
- Cloud provider / multi-region failover — project-wide open question, not resolved by any single phase; see `PROJECT.md` § Open Questions

</deferred>

---

*Phase: 01-signed-idempotent-delivery*
*Context gathered: 2026-07-19*
