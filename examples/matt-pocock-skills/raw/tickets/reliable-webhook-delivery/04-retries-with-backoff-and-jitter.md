# 04 — Retries with exponential backoff and jitter

**What to build:** A delivery whose attempt fails with a retryable outcome (timeout, connection error, 5xx, or 429) is automatically retried with exponential-backoff-with-full-jitter delays, up to a bounded maximum attempt count or total retry window, while a non-retryable outcome (a 4xx other than 429) is recorded as a completed failed attempt without consuming retry budget. Each retried attempt is still signed and carries the same stable idempotency key and an incrementing attempt number.

**Blocked by:** 01 — Foundational delivery pipeline & acceptance-test harness, 02 — Signed webhook requests, 03 — Idempotency key and attempt-number on outbound requests

**Status:** ready-for-agent

- [ ] A delivery whose attempt fails with a timeout, connection error, 5xx, or 429 response schedules a next attempt rather than terminating.
- [ ] A delivery whose attempt fails with a 4xx response (other than 429) does not schedule a retry, but the attempt is still recorded as a completed failed attempt in the audit log.
- [ ] Successive retry delays grow exponentially and fall within the full-jitter bound (`random_between(0, min(cap, base * 2^attempt))`), verified deterministically using the controllable clock across a forced sequence of failures.
- [ ] Retries stop once a configured maximum attempt count or total retry window is reached, whichever comes first.
- [ ] Every retried attempt carries the same idempotency key as the delivery's first attempt and a correctly incrementing attempt number, and is independently signed with its own timestamp.
- [ ] An acceptance test forces a sequence of failures against the mock endpoint and asserts on the observed attempt count, delay bounds (via the fake clock), and retryable-vs-non-retryable branching, using only the publish entry point, mock endpoint, and audit query.
