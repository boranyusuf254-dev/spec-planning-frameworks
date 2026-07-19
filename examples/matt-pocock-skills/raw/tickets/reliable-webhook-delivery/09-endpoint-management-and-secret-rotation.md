# 09 — Endpoint/subscription management API and secret rotation

**What to build:** A tenant-facing CRUD API for managing their own endpoints (destination URL, subscribed event types) and rotating an endpoint's signing secret with an overlapping old-plus-new-secret grace period, scoped so a tenant can only manage their own endpoints.

**Blocked by:** 02 — Signed webhook requests

**Status:** ready-for-agent

- [ ] A tenant can create, list, update, and delete their own endpoint subscriptions (destination URL and subscribed event types) via the API.
- [ ] A tenant can rotate an endpoint's signing secret; during the rotation's grace period, an attempt signed with either the old or the new secret verifies successfully.
- [ ] After the grace period elapses, only the new secret verifies successfully.
- [ ] A tenant's endpoint-management API calls cannot read, modify, or delete another tenant's endpoints.
- [ ] An acceptance test creates an endpoint, publishes a delivery, rotates its secret, and asserts deliveries during the grace window verify under both secrets while a cross-tenant management attempt is rejected.
