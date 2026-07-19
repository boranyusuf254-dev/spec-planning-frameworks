# Reliable webhook delivery

Case ID: `reliable-webhook-delivery`

Design reliable webhook delivery for a TypeScript SaaS API.

The design must cover:

- signed webhooks;
- idempotency;
- retries with exponential backoff and jitter;
- dead-letter handling;
- manual replay;
- a delivery audit log;
- tenant isolation;
- observability; and
- acceptance tests.

## Comparison boundary

Every framework receives this brief as its product input. A framework may ask
for technical choices or express assumptions, but it does not receive extra
product requirements. The comparison covers the planning artifacts, not an
implementation of the webhook service.

## Deliberately unspecified

The brief does not choose a queue, database, cloud provider, HTTP framework,
signature algorithm, retry limit, retention period, or user interface. Each
artifact must expose such choices as decisions, assumptions, or open questions
instead of treating them as hidden facts.

