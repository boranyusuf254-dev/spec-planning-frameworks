<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first concrete version; template placeholders replaced)
- Added sections:
  - Core Principles: I. Reliable, Idempotent Delivery; II. Signed Requests;
    III. Resilient Retries; IV. Dead-Letter Recovery & Manual Replay;
    V. Auditability; VI. Tenant Isolation; VII. Observability;
    VIII. Acceptance-Test Evidence; IX. Explicit Scope Boundary
  - Scope Constraints (deliberately unspecified product/infrastructure choices)
  - Quality Gates
  - Governance
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check
    gate is generic and reads from this file at plan time)
  - .specify/templates/spec-template.md ✅ no changes needed (NEEDS
    CLARIFICATION / Assumptions sections already support Principle IX)
  - .specify/templates/tasks-template.md ✅ no changes needed (generic phase
    structure; principle-driven tasks are generated per feature)
  - .specify/templates/checklist-template.md ✅ no changes needed (generated
    per request)
  - .claude/skills/speckit-*/SKILL.md ✅ reviewed, no outdated or
    agent-specific references found requiring correction
- Follow-up TODOs: none
-->

# Reliable Webhook Delivery Constitution

## Core Principles

### I. Reliable, Idempotent Delivery

The system MUST treat every webhook event as owed a delivery outcome: delivered,
exhausted into the dead letter state, or explicitly replayed — never silently
dropped. Every delivery attempt MUST carry an idempotency key or equivalent
mechanism so that receivers processing the same event more than once (due to a
retry, a replay, or a duplicate send) produce the same result as processing it
once. Delivery logic MUST NOT assume a receiver is reachable, fast, or free of
transient failure.

**Rationale**: The brief's product is a delivery guarantee, not a single
request/response call. Idempotency is what makes retries and replay safe rather
than dangerous, so it is inseparable from reliability.

### II. Signed Requests

Every webhook request sent to a receiver MUST be signed so the receiver can
verify it originated from this system and was not altered in transit. The
specific signature algorithm and key management approach are technical choices
that MUST be recorded as explicit decisions in the relevant planning artifact,
not assumed.

**Rationale**: The brief requires signed webhooks as a non-negotiable capability
of the delivery design; it does not select an algorithm.

### III. Resilient Retries

Failed delivery attempts MUST be retried using exponential backoff with jitter.
The retry policy MUST be bounded (a maximum attempt count or time window) so
that retries terminate into the dead-letter state rather than continuing
indefinitely. The specific base delay, backoff multiplier, jitter strategy, and
retry limit are technical choices that MUST be recorded as explicit decisions,
not assumed.

**Rationale**: The brief specifies the retry behavior class (exponential
backoff with jitter) but leaves the numeric parameters open; those parameters
are still decisions the design must surface.

### IV. Dead-Letter Recovery & Manual Replay

Deliveries that exhaust their retry policy MUST move to a dead-letter state
that preserves enough information (payload, target, attempt history) to
diagnose and recover them. Operators MUST be able to manually trigger replay of
a dead-lettered or previously delivered event. Replay MUST reuse the same
signing and idempotency guarantees as an original delivery.

**Rationale**: The brief requires both dead-letter handling and manual replay
as distinct, connected capabilities — recovery is only useful if the recovered
event can be safely resent.

### V. Auditability

Every delivery attempt, retry, dead-letter transition, and replay MUST be
recorded in a delivery audit log sufficient to reconstruct the full history of
an event's delivery lifecycle. The audit log's retention period and storage
medium are technical choices that MUST be recorded as explicit decisions, not
assumed.

**Rationale**: The brief requires a delivery audit log as a first-class
capability, distinct from general-purpose observability.

### VI. Tenant Isolation

Webhook configuration, delivery data, audit logs, and replay actions for one
tenant MUST NOT be visible to, modifiable by, or otherwise reachable from
another tenant. Any shared infrastructure (queues, workers, storage) MUST
enforce tenant boundaries at the data and access-control level, not by
convention alone.

**Rationale**: The brief is explicit that this is a multi-tenant SaaS API;
isolation is a delivery-correctness requirement, not an add-on.

### VII. Observability

The delivery pipeline MUST expose metrics, logs, and/or traces sufficient to
detect delivery failures, growing backlogs, retry storms, and latency
degradation without inspecting the audit log by hand. Observability signals are
distinct from the audit log (Principle V): the audit log answers "what happened
to this event," observability answers "is the system healthy right now."

**Rationale**: The brief lists observability as its own requirement alongside,
not instead of, the audit log.

### VIII. Acceptance-Test Evidence

Every requirement in this system's specification MUST be traceable to at least
one acceptance test that demonstrates it is met. Planning artifacts MUST
identify what acceptance evidence will be produced before implementation is
considered planned; a requirement without a corresponding acceptance criterion
is incomplete.

**Rationale**: The brief requires acceptance tests as a deliverable, and the
comparison this project is part of evaluates planning artifacts, not just
prose — evidence must be plannable, not retrofitted.

### IX. Explicit Scope Boundary

This constitution and any specification, plan, or task list built under it
MUST NOT invent product or infrastructure choices the brief left open. Every
such choice MUST be surfaced as a **Decision** (with rationale), an
**Assumption** (with what happens if it's wrong), or an **Open Question** (with
who/what resolves it) in the relevant artifact — never as a fact asserted
without attribution. This applies in particular to the choices the brief names
as deliberately unspecified (see Scope Constraints below), and to any other
product or infrastructure choice not stated in the brief.

**Rationale**: The comparison this project supports depends on frameworks
showing their reasoning about unresolved choices rather than papering over
gaps with silent defaults.

## Scope Constraints

The brief deliberately does not choose: a queue technology, a database, a
cloud provider, an HTTP framework, a signature algorithm, a retry limit, a
retention period, or a user interface. This constitution does not choose them
either. Specifications, plans, and tasks MUST carry these forward as open
choices under Principle IX rather than resolving them here or silently
defaulting to a specific product. Only the product brief may add new product
requirements; planning artifacts may ask clarifying questions but MUST NOT
receive or assume requirements beyond what the brief states.

## Quality Gates

Every specification, plan, and task list produced under this constitution MUST
be checked against the nine Core Principles before it is considered complete.
A gate fails, and the artifact MUST be revised, when: a requirement lacks
acceptance-test traceability (Principle VIII), a technical choice from Scope
Constraints is asserted as fact rather than surfaced as a decision/assumption/
open question (Principle IX), or any of Principles I–VII is contradicted or
silently dropped. Reviewers MUST reject artifacts that pass by omission (i.e.,
by never mentioning a principle) as readily as those that fail by
contradiction.

## Governance

This constitution supersedes ad hoc practice for this project. Amendments
require: (1) a written proposal describing the change and its rationale, (2)
an explicit version bump following semantic versioning — MAJOR for backward
incompatible principle removals or redefinitions, MINOR for new principles or
materially expanded guidance, PATCH for clarifications and wording fixes — and
(3) propagation of the change to any dependent template or planning artifact
in the same change set. All specifications, plans, and task lists MUST be
reviewed for compliance with this constitution before being considered
complete; complexity or deviation from a principle MUST be justified in the
artifact, not silently introduced.

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
