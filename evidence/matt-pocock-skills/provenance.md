# Matt Pocock's skills provenance

- Retrieval and run date: 2026-07-19
- Status: specification and local ticket breakdown generated
- Upstream: [mattpocock/skills](https://github.com/mattpocock/skills)
- Plugin manifest version: `1.2.0`
- Git commit: `9603c1cc8118d08bc1b3bf34cf714f62178dea3b`
- License: MIT
- Agent host: Claude Code `2.1.214`, model `sonnet`

## Commands

The initial setup command requested the repository's documented local Markdown tracker and single-context layout:

```sh
claude -p "/setup-matt-pocock-skills

Configure this isolated comparison repository with the local Markdown issue tracker, default triage labels, and the single-context domain-doc layout. Create CLAUDE.md if needed. This setup choice is fixed for the experiment; do not ask follow-up questions. Stop after the setup files exist." \
  --plugin-dir /Users/ramos/oss/spec-planning-frameworks/.research/sources/mattpocock-skills \
  --model sonnet --effort medium --dangerously-skip-permissions \
  --max-budget-usd 2 --output-format text
```

It stopped making progress and wrote no files, so it was interrupted after about five minutes. The actual spec skill was then invoked directly with local-only constraints:

```sh
claude -p "/to-spec reliable-webhook-delivery

Read brief.md as the complete product input. Produce and publish a local implementation-ready specification for this controlled comparison. Do not add product requirements. Treat acceptance tests as the main validation seam. Keep every unspecified technology choice explicit as a decision, assumption, or open question. Use local files only, make no remote tickets, do not implement code, and do not ask follow-up questions." \
  --plugin-dir /Users/ramos/oss/spec-planning-frameworks/.research/sources/mattpocock-skills \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 3 --output-format text
```

The ticket step used the real `to-tickets` skill. Normal use asks a human to approve the proposed breakdown; this controlled run pre-approved local-file creation and prohibited remote writes:

```sh
claude -p "/to-tickets specs/reliable-webhook-delivery.md

Use a local Markdown tracker only. Write one ticket per file under tickets/reliable-webhook-delivery/. This controlled comparison pre-approves the proposed breakdown, so create the local tickets after validating their dependencies and acceptance criteria. Do not contact a remote service, do not implement code, do not add requirements, and do not ask follow-up questions." \
  --plugin-dir /Users/ramos/oss/spec-planning-frameworks/.research/sources/mattpocock-skills \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 3 --output-format text
```

## Preserved output

```text
specs/
└── reliable-webhook-delivery.md
tickets/reliable-webhook-delivery/
├── 01-foundational-delivery-pipeline.md
├── 02-signed-webhook-requests.md
├── 03-idempotency-key-and-attempt-number.md
├── 04-retries-with-backoff-and-jitter.md
├── 05-dead-letter-transition-and-querying.md
├── 06-manual-replay-single-delivery.md
├── 07-batch-replay.md
├── 08-audit-log-query-and-retention.md
├── 09-endpoint-management-and-secret-rotation.md
├── 10-tenant-isolation-and-fairness.md
└── 11-observability-logs-metrics-alerting.md
```

All 12 files under `examples/matt-pocock-skills/raw/` are copied byte-for-byte from the isolated run. No editorial normalization was applied. The spec contains 42 user stories and makes firm signing, jitter, state, and tenant-boundary decisions while leaving the queue, database, hosting, HTTP framework, exact retry limits, and retention open. The 11 tickets form a dependency graph; only ticket 01 starts unblocked.

## Primary sources

- [Skills repository](https://github.com/mattpocock/skills)
- [`to-spec` at the tested commit](https://github.com/mattpocock/skills/tree/9603c1cc8118d08bc1b3bf34cf714f62178dea3b/skills/engineering/to-spec)
- [`to-tickets` at the tested commit](https://github.com/mattpocock/skills/tree/9603c1cc8118d08bc1b3bf34cf714f62178dea3b/skills/engineering/to-tickets)
- [MIT license](https://github.com/mattpocock/skills/blob/9603c1cc8118d08bc1b3bf34cf714f62178dea3b/LICENSE)
