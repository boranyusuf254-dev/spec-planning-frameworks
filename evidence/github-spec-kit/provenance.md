# GitHub Spec Kit provenance

- Retrieval and run date: 2026-07-19
- Status: constitution, specification, plan, research, data model, contracts, quickstart, and tasks generated
- Upstream: [github/spec-kit](https://github.com/github/spec-kit)
- Source version: `0.13.1.dev0`
- Git commit: `57cc518d63d6f10da3dd93df1ebcadda87c59374`
- License: MIT
- Agent host: Claude Code `2.1.214`, model `sonnet`
- CLI runner: `uv 0.11.19`

## Commands

The CLI was run from the pinned source checkout rather than an unpinned package:

```sh
uv run --project /Users/ramos/oss/spec-planning-frameworks/.research/sources/spec-kit specify init \
  --here --force --integration claude --script sh
```

Then the documented stages ran in order:

```text
/speckit-constitution
/speckit-specify Design reliable webhook delivery for a TypeScript SaaS API: signed webhooks, idempotency, retries with exponential backoff and jitter, dead-letter handling, manual replay, delivery audit log, tenant isolation, observability, and acceptance tests.
/speckit-plan
/speckit-tasks
```

Each Claude Code invocation was planning-only, prohibited implementation and extra requirements, and required unspecified technology choices to remain decisions, assumptions, or open questions.

## Preserved output

```text
.specify/memory/constitution.md
specs/001-reliable-webhook-delivery/
├── checklists/requirements.md
├── contracts/
│   ├── dead-letter-replay-api.yaml
│   ├── deliveries-audit-api.yaml
│   ├── webhook-delivery-request.md
│   └── webhook-endpoints-api.yaml
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── spec.md
└── tasks.md
```

Files under `examples/github-spec-kit/raw/` are copied byte-for-byte from the isolated run. No editorial normalization was applied. The plan resolved several technical choices, including Fastify, PostgreSQL, and Prisma; these are run decisions, not shared requirements. Hosting and dashboard UI remained open.

## Primary sources

- [Spec Kit repository and workflow](https://github.com/github/spec-kit)
- [Specify CLI source at the tested commit](https://github.com/github/spec-kit/tree/57cc518d63d6f10da3dd93df1ebcadda87c59374/src/specify_cli)
- [MIT license](https://github.com/github/spec-kit/blob/57cc518d63d6f10da3dd93df1ebcadda87c59374/LICENSE)
