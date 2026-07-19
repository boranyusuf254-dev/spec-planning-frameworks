# Status — 2026-07-19

## Current state

- Local Git repository initialized on `main`.
- Neutral `reliable-webhook-delivery` brief fixed and reused across every run.
- Six framework profiles, 37 inspectable example files, and six provenance records complete.
- Static site builds 54 routes under `site/out/`, including framework profiles, every deep file, three comparisons, the shared case, sitemap, robots, and 404.
- Desktop and mobile layouts checked at 1440×1000 and 390×844 in light and dark themes.
- Public GitHub repository creation and push remain the final release step for this build task.

## Tool runs

| Framework | Version or commit | Output | Limit |
| --- | --- | --- | --- |
| Superpowers | plugin `6.1.1`, `d884ae04` | one design | plan stage stalled twice and was interrupted |
| GSD | npm `1.7.0`, `gitHead b1c9381b` | project, 18 requirements, five-phase roadmap, state, config, phase context | phase plan stalled and was interrupted |
| GitHub Spec Kit | source `0.13.1.dev0`, `57cc518d` | constitution, spec, checklist, plan, research, model, four contracts, quickstart, 69 tasks | source checkout identifies as a development version |
| Kiro Specs | stable CLI manifest `2.13.0` observed | four manual files | vendor browser authentication unavailable; no Kiro output claimed |
| Matt Pocock's skills | plugin manifest `1.2.0`, `9603c1cc` | one spec and 11 local tickets | setup command stalled; real spec and ticket skills worked when invoked directly |
| BMad Method | npm `6.10.0`, `gitHead 081e64e` | express spec and memory log | full PRD/architecture/epic path not run |

All agent-backed runs used Claude Code `2.1.214` with the isolated brief and prohibited product implementation. Exact commands are in `evidence/<framework>/provenance.md`.

## Verification completed

- `npm run lint`
- `npm run typecheck`
- `npm test` (static build plus four test groups)
- production dependency audit: zero known vulnerabilities
- raw GSD roadmap byte comparison between source corpus and static output
- browser route, deep-link, source toggle, file selector, query update, raw-link, theme, mobile overflow, and console-error checks
- license and provenance review for all included upstream-generated material

## Open limits and owner decisions

- Do not call the Kiro files generated. They are original, manual, source-faithful examples based on public docs.
- Do not call the Superpowers or GSD plan stages complete.
- The comparison uses one backend-heavy TypeScript case. A UI feature or brownfield refactor could expose different strengths.
- GitHub Pages is not enabled. Root-origin static output is ready; project-path Pages needs a base-path change. See `docs/STATIC_RELEASE.md`.
- No production origin exists, so the committed build configuration does not claim a canonical public website.

## Lessons for later Codex tasks

- Preserve run failures beside successes; retrying until every framework looks complete would erase useful friction evidence.
- Keep generator choices separate from shared requirements. Several agents chose HMAC, PostgreSQL, Fastify, Prisma, or policy numbers that the brief never required.
- Prefer local tracker modes for comparisons. They expose the artifact without creating external issues or involving other people.
- Re-run `npm run sync-content` after any example or evidence change; development and production scripts already do this automatically.
