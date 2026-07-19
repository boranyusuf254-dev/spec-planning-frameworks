# BMad Method provenance

- Retrieval and run date: 2026-07-19
- Status: technical spec generated
- Upstream: [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- npm package: `bmad-method@6.10.0`
- npm `gitHead`: `081e64ee5aab2316b912883f7bee528ee143ce36`
- License: MIT
- Agent host: Claude Code `2.1.214`, model `sonnet`

## Commands

```sh
npx -y bmad-method@6.10.0 install \
  --directory . --modules bmm --tools claude-code --yes \
  --user-name Plannotator --communication-language English \
  --document-output-language English --output-folder _bmad-output \
  --set bmm.user_skill_level=expert
```

The installed headless spec workflow then ran from the same brief:

```sh
claude -p "/bmad-spec

Read brief.md as the complete input. Run headless express mode. Use reliable-webhook-delivery as the slug. Produce the technical spec only; do not implement code, add product requirements, or ask follow-up questions." \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 3 --output-format text
```

## Preserved output

```text
_bmad-output/specs/spec-reliable-webhook-delivery/
├── .memlog.md
└── SPEC.md
```

Both files under `examples/bmad-method/raw/` are copied byte-for-byte from the isolated run. No editorial normalization was applied. The spec contains nine capabilities, one explicit TypeScript constraint, two non-goals, one success signal, four interpretive assumptions, and 12 open questions. Its memory log is included because it records the workflow's internal progress and choices.

## Primary sources

- [BMad Method repository](https://github.com/bmad-code-org/BMAD-METHOD)
- [npm registry manifest for 6.10.0](https://registry.npmjs.org/bmad-method/6.10.0)
- [MIT license](https://github.com/bmad-code-org/BMAD-METHOD/blob/081e64ee5aab2316b912883f7bee528ee143ce36/LICENSE)
