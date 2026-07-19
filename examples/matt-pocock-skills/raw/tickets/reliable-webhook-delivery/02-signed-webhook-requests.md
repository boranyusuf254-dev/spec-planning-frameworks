# 02 — Signed webhook requests

**What to build:** Every outbound delivery attempt carries an HMAC-SHA256 signature header computed over the timestamp and raw request body, using the target endpoint's own signing secret, so a receiver can verify authenticity and reject tampered or stale requests.

**Blocked by:** 01 — Foundational delivery pipeline & acceptance-test harness

**Status:** ready-for-agent

- [ ] Each delivery attempt includes a signature header and a timestamp used in computing that signature.
- [ ] The signature is computed as HMAC-SHA256 over `timestamp + "." + raw request body`, using the endpoint's active signing secret.
- [ ] Two different endpoints (even for the same tenant) produce different, endpoint-specific signatures because each endpoint has its own signing secret.
- [ ] A request with a tampered body or signature is demonstrably invalid per the signature contract (verifiable by a test replaying the algorithm against a captured attempt).
- [ ] A request whose timestamp falls outside the tolerance window is treated as stale/rejectable, verified via the controllable clock.
- [ ] The signature algorithm and header format are documented so a tenant could implement verification independently.
- [ ] An acceptance test asserts the mock endpoint receives a valid, verifiable signature and timestamp header for a normal delivery, and that a stale timestamp is distinguishable as invalid.
