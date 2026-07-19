# Plannotator docs cross-link manifest

Prepared 2026-07-19 for the docs owner. Link only where the repository adds a concrete artifact or comparison. Repository base: `https://github.com/plannotator/spec-planning-frameworks`.

## Framework pages

| Canonical docs route | Recommended repository target | Link purpose |
| --- | --- | --- |
| `/frameworks` | [Repository overview](https://github.com/plannotator/spec-planning-frameworks#readme) | Same-case method, matrix, and limits |
| `/frameworks/superpowers` | [Superpowers raw output](https://github.com/plannotator/spec-planning-frameworks/tree/main/examples/superpowers/raw) | Actual completed design and disclosed plan failure |
| `/frameworks/gsd` | [GSD `.planning` output](https://github.com/plannotator/spec-planning-frameworks/tree/main/examples/gsd/raw/.planning) | Actual project ledger and partial phase output |
| `/frameworks/github-spec-kit` | [Spec Kit raw output](https://github.com/plannotator/spec-planning-frameworks/tree/main/examples/github-spec-kit/raw) | Complete constitution-to-tasks tree |
| `/frameworks/kiro-specs` | [Kiro manual example](https://github.com/plannotator/spec-planning-frameworks/tree/main/examples/kiro-specs/manual) | Clearly labeled manual, source-faithful three-file example |
| `/frameworks/matt-pocock-skills` | [Matt Pocock skills raw output](https://github.com/plannotator/spec-planning-frameworks/tree/main/examples/matt-pocock-skills/raw) | Actual spec and 11 local tickets |
| `/frameworks/bmad-method` | [BMad raw output](https://github.com/plannotator/spec-planning-frameworks/tree/main/examples/bmad-method/raw) | Actual express spec and memory log |
| `/frameworks/adr-formats` | No repository link recommended | This corpus treats ADR as an artifact type and does not include a controlled ADR example |

## Comparison pages

| Canonical docs route | Recommended repository target | Link purpose |
| --- | --- | --- |
| `/compare/superpowers-vs-gsd` | Use the direct Superpowers and GSD links above | Let readers inspect the two raw artifact trees behind the editorial comparison |
| `/compare/github-spec-kit-vs-kiro-specs` | Use the direct Spec Kit and Kiro links above | Contrast the generated wide tree with the disclosed manual three-file example |
| `/compare/adr-vs-rfc-vs-technical-specification` | No repository link recommended | No same-case ADR or RFC artifacts exist here |
| `/compare/prd-vs-technical-specification-vs-implementation-plan` | [BMad technical spec](https://github.com/plannotator/spec-planning-frameworks/blob/main/examples/bmad-method/raw/_bmad-output/specs/spec-reliable-webhook-delivery/SPEC.md) | Concrete technical-spec example only; do not imply this run produced a PRD |

## Template pages

| Canonical docs route | Recommended repository target | Link purpose |
| --- | --- | --- |
| `/templates/product-requirements-document` | [GSD requirements ledger](https://github.com/plannotator/spec-planning-frameworks/blob/main/examples/gsd/raw/.planning/REQUIREMENTS.md) | Real requirements ledger example; label it GSD output, not a neutral PRD template |
| `/templates/prfaq` | No repository link recommended | No PRFAQ was produced |
| `/templates/ai-coding-plan` | [Spec Kit task plan](https://github.com/plannotator/spec-planning-frameworks/blob/main/examples/github-spec-kit/raw/specs/001-reliable-webhook-delivery/tasks.md) | Concrete 69-task AI coding plan |
| `/templates/technical-specification` | [BMad technical spec](https://github.com/plannotator/spec-planning-frameworks/blob/main/examples/bmad-method/raw/_bmad-output/specs/spec-reliable-webhook-delivery/SPEC.md) | Compact technical-spec output |
| `/templates/architecture-decision-record` | No repository link recommended | No ADR was produced |
| `/templates/software-rfc` | No repository link recommended | No RFC was produced |
| `/templates/agents-md` | No repository link recommended | Framework installers created agent configuration in isolated runs, but it is not part of the reusable corpus |
| `/templates/agent-handoff` | [GSD project state](https://github.com/plannotator/spec-planning-frameworks/blob/main/examples/gsd/raw/.planning/STATE.md) | Concrete resumable state handoff, labeled as GSD project state |

## Link wording

Prefer contextual text such as “inspect the raw Spec Kit webhook artifact tree” or “see the GSD state handoff from the same-case run.” Do not write “best framework,” claim that Kiro generated its example, or present an interrupted plan stage as complete.
