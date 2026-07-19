# Run environment

Recorded 2026-07-19 in `America/Los_Angeles`.

| Tool | Version |
| --- | --- |
| macOS | `26.3`, Apple silicon (`arm64`) |
| Node.js | `24.15.0` |
| npm | `11.12.1` |
| uv | `0.11.19` |
| Claude Code | `2.1.214` |
| Git | `2.50.1` |
| GitHub CLI | `2.92.0` |

Each runnable framework received its own isolated Git repository under the ignored `.research/runs/` directory. The committed brief was copied in unchanged. Runs used Claude Code's Sonnet model in non-interactive planning-only mode, with explicit spending bounds and no product implementation. The corpus then copied only tool outputs useful for comparison; installed framework code and temporary agent configuration are not committed.

“Generated” means a real framework CLI, plugin, skill, or template workflow wrote the file. “Manual, source-faithful example” means Plannotator wrote an original file from primary documentation because the real vendor workflow could not run. No interrupted stage is marked complete.
