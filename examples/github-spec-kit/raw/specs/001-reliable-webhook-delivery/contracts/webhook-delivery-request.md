# Contract: Outbound Webhook Delivery Request

This is the wire contract between the platform and a tenant's receiving
endpoint — what FR-001/FR-002 require the receiver be able to verify against.
It applies identically to an original attempt, a retry, and a replay
(FR-010), per `research.md` §6 and `data-model.md`'s Delivery Attempt entity.

## Request

```
POST {webhook_endpoint.url}
Content-Type: application/json
Webhook-Id: {delivery.id}                      # stable across all attempts of this delivery
Webhook-Timestamp: {unix_seconds}                # attempt-specific, not delivery-creation time
Webhook-Signature: t={unix_seconds},v1={hex_hmac_sha256}
Idempotency-Key: {delivery.idempotency_key}      # stable across every attempt/replay (FR-003)

{ ...event payload, unchanged across attempts... }
```

## Signature computation (research.md §6)

```
signed_content = "{Webhook-Timestamp}.{Idempotency-Key}.{raw_request_body}"
v1 = hex(HMAC-SHA256(key = webhook_endpoint's active signing secret, message = signed_content))
```

- `raw_request_body` is the exact byte sequence sent — receivers MUST verify
  against the raw body, not a re-serialized parse of it, or signatures will
  legitimately fail to match.
- `Webhook-Timestamp` is the time this specific attempt was sent (not the
  original delivery creation time), so receivers can reject requests outside
  a tolerance window (recommended: 5 minutes) to limit replay-attack surface.
  This is independent of, and does not affect, the idempotency key.

## Receiver verification steps

1. Recompute `v1` using the endpoint's known secret(s) — during a rotation
   grace window (`data-model.md` Signing Secret entity), the receiver should
   accept a signature matching either the current or the grace-period secret.
2. Compare recomputed `v1` to the received `v1` using a constant-time
   comparison.
3. Reject if `Webhook-Timestamp` is outside the receiver's acceptable skew
   window.
4. Check `Idempotency-Key` against previously processed keys; if already
   processed, return success without reprocessing (FR-004) — this is what
   makes retries and replays safe.

## Expected receiver response (drives FR-007 classification)

| Receiver response | Attempt outcome | Delivery.state effect |
|---|---|---|
| 2xx within timeout | `success` | → `delivered` |
| Timeout / connection error | `timeout` | retryable — schedules next attempt |
| 5xx | `retryable_failure` | retryable — schedules next attempt |
| 429 | `retryable_failure` | retryable — schedules next attempt (subject to the same backoff, not a special-cased faster retry, to avoid worsening a rate-limited receiver's load) |
| Other 4xx (e.g. 400, 422) | `non_retryable_failure` | delivery does not retry further; moves directly toward dead-letter accounting without consuming the full retry budget (FR-007) |

## Timeout

A delivery attempt that does not receive a response within the outbound
request timeout is classified `timeout` (retryable). The specific timeout
value is an implementation parameter of the sender (`src/worker/sender.ts`
per `plan.md`'s project structure), not fixed in this contract; it is
recorded alongside the retry policy in `research.md` §7 if/when a concrete
value is chosen during implementation.
