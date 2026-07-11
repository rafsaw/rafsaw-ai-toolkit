# Add a `version` command to the installer CLI — Plan Brief

> Full plan: `context/changes/version-cmd/plan.md`

## What & Why

The installer CLI has no way to report its own version, even though a `getPackageVersion()` helper already exists. Add a `version` subcommand that prints the bare version number, so users (and scripts) can check which toolkit version is installed.

## Starting Point

`bin/rafsaw-ai-toolkit.js` dispatches `install` / `status` / `uninstall` / `help` via a `switch`. `getPackageVersion()` already reads the version from `package.json`. The repo has no tests and no `test` npm script.

## Desired End State

`node bin/rafsaw-ai-toolkit.js version` prints the current version (e.g. `0.1.8`) and nothing else; `help` lists the command; `npm test` runs a passing end-to-end test asserting the output matches `package.json`.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Command surface | `version` subcommand + help entry | Consistent with existing subcommand style | Plan |
| Output format | Bare version number | Script-friendly, easy to assert | Plan |
| Test approach | E2E subprocess test | Tests real CLI behavior, no refactor | Plan |
| Test runner | Node built-in `node --test` | Keeps the dependency-free invariant (AGENTS.md) | Plan |

## Scope

**In scope:** `version` command, `help` text update, one E2E test, `test` npm script.

**Out of scope:** `--version`/`-v` flags, CLI refactor, changes to other commands, any new dependency.

## Architecture / Approach

Add one `case "version"` calling `console.log(getPackageVersion())`, extend `help()`, and add `test/cli.test.js` that spawns the CLI and compares stdout to the `package.json` version read at runtime.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Add `version` command with test | Working command + help entry + passing test + `test` script | Test-runner file discovery / subprocess wiring on Windows |

**Prerequisites:** Node 18+ (repo runs Node 22/24). On branch `feat/cli-version-command`.
**Estimated effort:** ~1 short session, single phase.

## Open Risks & Assumptions

- Assumes `node --test` auto-discovers `test/cli.test.js` (default discovery includes the `test/` directory).
- Assumes spawning `node` in a subprocess behaves consistently on the developer's Windows shell.

## Success Criteria (Summary)

- `version` prints the correct version; `help` lists it; `npm test` passes.
