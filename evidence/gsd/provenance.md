# GSD provenance

- Retrieval and run date: 2026-07-19
- Status: project and roadmap generated; phase context generated; phase plan not reproduced
- Upstream: [open-gsd/gsd-core](https://github.com/open-gsd/gsd-core)
- npm package: `@opengsd/gsd-core@1.7.0`
- npm `gitHead`: `b1c9381b7abbf443f16c197118236b45cdd0486a`
- License: MIT
- Agent host: Claude Code `2.1.214`, model `sonnet`

## Commands

```sh
npx -y @opengsd/gsd-core@1.7.0 --claude --local --profile=core
```

The run used standard phase granularity, parallel plans, committed planning documents, adaptive models, and the plan checker, verifier, Nyquist validation, and source grounding. Framework research was disabled so all runs started from the same brief.

```sh
claude -p "/gsd-new-project --auto @brief.md" \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 4 --output-format text
```

During initialization, GSD upgraded the isolated local install to its full profile with the same package version so that the roadmap workflow was available. A later planning-only command was attempted:

```sh
claude -p "/gsd-plan-phase 1

Plan phase 1 only. Do not implement code. Do not add requirements and do not ask follow-up questions." \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 3 --output-format text
```

It produced `01-CONTEXT.md`, then stopped making progress before producing a phase plan. The run was interrupted after about five minutes.

## Preserved output

```text
.planning/
├── PROJECT.md
├── REQUIREMENTS.md
├── ROADMAP.md
├── STATE.md
├── config.json
└── phases/01-signed-idempotent-delivery/01-CONTEXT.md
```

Files under `examples/gsd/raw/` are copied byte-for-byte from the isolated run. No editorial normalization was applied. The roadmap has five phases and the requirements ledger has 18 v1 requirements. The partial phase-context file is included because the real command created it, but there is no completed phase plan.

## Primary sources

- [GSD repository](https://github.com/open-gsd/gsd-core)
- [npm registry manifest for 1.7.0](https://registry.npmjs.org/@opengsd%2Fgsd-core/1.7.0)
- [MIT license](https://github.com/open-gsd/gsd-core/blob/b1c9381b7abbf443f16c197118236b45cdd0486a/LICENSE)
