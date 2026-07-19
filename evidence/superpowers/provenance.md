# Superpowers provenance

- Retrieval and run date: 2026-07-19
- Status: design generated; implementation plan not reproduced
- Upstream: [obra/superpowers](https://github.com/obra/superpowers)
- Plugin version: `6.1.1`
- Git commit: `d884ae04edebef577e82ff7c4e143debd0bbec99`
- License: MIT
- Agent host: Claude Code `2.1.214`, model `sonnet`

## Commands

The upstream repository was cloned at the commit above. The comparison then ran:

```sh
claude -p "Use the Superpowers brainstorming and writing-plans skills. Read brief.md as the complete input. Produce the design and implementation-plan artifacts for this comparison. Do not implement code and do not ask follow-up questions. Finish only after both artifacts exist." \
  --plugin-dir /Users/ramos/oss/spec-planning-frameworks/.research/sources/superpowers \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 4 --output-format text
```

The command wrote `docs/superpowers/specs/2026-07-19-reliable-webhook-delivery-design.md`, then stopped making progress. It was interrupted after about eight minutes. A second bounded attempt invoked the `writing-plans` skill against the accepted design:

```sh
claude -p "Use the Superpowers writing-plans skill on the accepted reliable-webhook-delivery design. Write the implementation plan only. Do not implement code or ask questions." \
  --plugin-dir /Users/ramos/oss/spec-planning-frameworks/.research/sources/superpowers \
  --model sonnet --effort high --dangerously-skip-permissions \
  --max-budget-usd 3 --output-format text
```

That attempt also stopped making progress and produced no plan. It was interrupted after about eight minutes.

## Preserved output

```text
docs/superpowers/specs/
└── 2026-07-19-reliable-webhook-delivery-design.md
```

The file under `examples/superpowers/raw/` is the byte-for-byte generated design. No editorial normalization was applied. It chose HMAC signing, PostgreSQL, REST administration, and other technical details that the neutral brief left open; treat those as framework-run assumptions, not shared requirements.

## Primary sources

- [Superpowers README and installation](https://github.com/obra/superpowers)
- [Plugin manifest at the tested commit](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/.claude-plugin/plugin.json)
- [MIT license](https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/LICENSE)
