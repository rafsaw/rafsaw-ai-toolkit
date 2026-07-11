# Add a `version` command to the installer CLI — Implementation Plan

## Overview

Add a `version` subcommand to `bin/rafsaw-ai-toolkit.js` that prints the package version to stdout, document it in the `help` output, and cover it with a Node built-in test (`node --test`) wired through a new `test` npm script. This is the first automated test in the repository.

## Current State Analysis

- `bin/rafsaw-ai-toolkit.js` is a dependency-free ESM CLI. Commands are dispatched by a `switch` on `process.argv[2]` (`bin/rafsaw-ai-toolkit.js:231`), defaulting to `help`.
- `getPackageVersion()` already exists (`bin/rafsaw-ai-toolkit.js:42`) and reads `version` from the package's own `package.json`. It is already used by `install` and `status`. The new command only needs to print its return value.
- `help()` (`bin/rafsaw-ai-toolkit.js:212`) prints a usage block listing `install` / `status` / `uninstall`. It does not mention `version`.
- The repo has **no tests** and **no `test` script** in `package.json`. `AGENTS.md` requires the installer to stay dependency-free (`node:` built-ins only), so tests use Node's built-in `node:test` + `node:assert` runner — no new dependency.

## Desired End State

Running `node bin/rafsaw-ai-toolkit.js version` prints the current package version (e.g. `0.1.8`) and nothing else. `help` lists the `version` command. `npm test` runs a passing test that asserts the command's output equals the `version` field in `package.json`.

### Key Discoveries:

- `getPackageVersion()` at `bin/rafsaw-ai-toolkit.js:42` — reuse verbatim, no new version-reading logic.
- Command dispatch `switch` at `bin/rafsaw-ai-toolkit.js:231` — add one `case`.
- `help()` usage text at `bin/rafsaw-ai-toolkit.js:212` — add `version` to the usage and commands lists.
- Node's built-in test runner (`node --test`) keeps the dependency-free invariant from `AGENTS.md`.

## What We're NOT Doing

- No `--version` / `-v` flag aliases — only the `version` subcommand.
- No refactor of the CLI to export functions — the test exercises the CLI end-to-end via a subprocess.
- No change to `install` / `status` / `uninstall` behavior.
- No decorative output (no package name, no `Version:` label) — bare version number only.
- Not adding a test framework or any dependency.

## Implementation Approach

One phase. Add the `case "version"` that prints `getPackageVersion()`, extend `help()` text, add a subprocess-based test under `test/`, and wire `"test": "node --test"` into `package.json`. The test reads the expected version from `package.json` at runtime (never hardcoded) so version bumps don't break it.

## Phase 1: Add `version` command with test

### Overview

Add the command, document it in help, and lock its behavior with an end-to-end test.

### Changes Required:

#### 1. Version command + help text

**File**: `bin/rafsaw-ai-toolkit.js`

**Intent**: Add a `version` command that prints the bare package version, and list it in the `help` usage/commands text so it is discoverable.

**Contract**: New `case "version"` in the dispatch `switch` (around `bin/rafsaw-ai-toolkit.js:231`) that calls `console.log(getPackageVersion())` and breaks. `help()` (around `bin/rafsaw-ai-toolkit.js:212`) gains a `rafsaw-ai-toolkit version` usage line and a `version   Print the installed toolkit version` command line. Output is the version string only, followed by a single newline (standard `console.log`).

#### 2. End-to-end CLI test

**File**: `test/cli.test.js` (new)

**Intent**: Assert that invoking the CLI with `version` prints exactly the version declared in `package.json`.

**Contract**: A `node:test` file that reads `version` from the package `package.json`, spawns `node bin/rafsaw-ai-toolkit.js version` via `node:child_process`, and asserts the trimmed stdout equals that version. Uses only `node:` built-ins (`node:test`, `node:assert`, `node:child_process`, `node:fs`, `node:path`, `node:url`).

#### 3. Test script

**File**: `package.json`

**Intent**: Provide a standard `npm test` entry point so the test runs in CI and locally.

**Contract**: Add `"test": "node --test"` to the `scripts` object. No new `dependencies` or `devDependencies`.

### Success Criteria:

#### Automated Verification:

- [ ] Test suite passes: `npm test`
- [ ] Version command prints the package version: `node bin/rafsaw-ai-toolkit.js version` outputs the `version` field from `package.json`

#### Manual Verification:

- [ ] `node bin/rafsaw-ai-toolkit.js help` lists the new `version` command

---

## Testing Strategy

### Unit / E2E Tests:

- E2E: spawn the CLI with `version` and assert stdout equals the `package.json` version.
- Edge case covered implicitly: the test reads the expected value from `package.json`, so it stays correct across version bumps.

### Manual Testing Steps:

1. Run `node bin/rafsaw-ai-toolkit.js version` and confirm it prints the current version (e.g. `0.1.8`).
2. Run `node bin/rafsaw-ai-toolkit.js help` and confirm `version` appears in the command list.

## References

- Change identity: `context/changes/version-cmd/change.md`
- Reused helper: `bin/rafsaw-ai-toolkit.js:42` (`getPackageVersion`)
- Command dispatch: `bin/rafsaw-ai-toolkit.js:231`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.
c
### Phase 1: Add `version` command with test

#### Automated

- [x] 1.1 Test suite passes: `npm test` — df64ca5
- [x] 1.2 Version command prints the package version: `node bin/rafsaw-ai-toolkit.js version` outputs the `version` field from `package.json` — df64ca5

#### Manual

- [x] 1.3 `node bin/rafsaw-ai-toolkit.js help` lists the new `version` command
