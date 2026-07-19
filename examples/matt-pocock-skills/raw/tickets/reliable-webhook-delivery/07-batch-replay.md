# 07 — Batch replay

**What to build:** A tenant developer (or operator) can replay a bounded, filtered batch of dead-lettered deliveries in one call — e.g. all dead-lettered deliveries for an endpoint within a time range — rather than replaying one at a time, with each replayed delivery tracked separately.

**Blocked by:** 06 — Manual replay of a single delivery

**Status:** ready-for-agent

- [ ] The replay API accepts a filter (e.g. endpoint plus time range, restricted to dead-lettered deliveries) and replays every matching delivery in one request.
- [ ] Each delivery in the batch produces its own separately tracked new delivery attempt chain, following the same rules as a single-delivery replay (same idempotency key per delivery, original history untouched).
- [ ] The batch is bounded by the filter — there is no unfiltered "replay everything" action.
- [ ] An acceptance test creates multiple dead-lettered deliveries, replays them as one batch via the replay API, and asserts the mock endpoint receives one new attempt per delivery with the correct idempotency keys.
