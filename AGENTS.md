# Repository Guidelines

`@rafsaw/rafsaw-ai-toolkit` is a dependency-free ESM Node package that distributes reusable AI artifacts — a Claude Code skill, prompts, shared rules, and a promptfoo eval starter — into consumer projects through an installer CLI, published to GitHub Packages. See @README.md for the consumer-facing guide.

## Hard rules

- Distributed artifacts have one source of truth in the **top-level** dirs: `rules/`, `prompts/`, `skills/`, `evals/`. Edit those — never `.claude/`, which is this repo's own local install plus 10xDevs course content, not package source.
- Never place the sentinel markers `<!-- BEGIN/END @rafsaw/rafsaw-ai-toolkit -->` inside any delivered rule content; the installer aborts on them (`bin/rafsaw-ai-toolkit.js:47`).
- Any new distributed file must be added to the `files` array in @package.json, or it won't ship.
- Pushing to `main` auto-publishes to GitHub Packages (@.github/workflows/publish-ai-toolkit.yml). Bump `version` in @package.json to cut a release; don't push to `main` unless you intend to publish.

## Project Structure

- `bin/rafsaw-ai-toolkit.js` — installer CLI (`install`/`status`/`uninstall`/`help`); all logic lives here.
- `rules/`, `prompts/`, `skills/rafsaw-code-review/`, `evals/` — the artifacts the installer copies into consumers.
- `docs/` — installation and auth guides. `.claude/` — local install output plus course skills, not package source.

## Commands

- `npx rafsaw-ai-toolkit install` — copy artifacts into the current project.
- `npx rafsaw-ai-toolkit status` — show installed version and managed files.
- `npx rafsaw-ai-toolkit uninstall` — remove installed files and the `CLAUDE.md` block.
- `npm run status:toolkit` — same via package script (also `install:toolkit`, `uninstall:toolkit`).

## Coding Style

- ES modules only (`"type": "module"`), Node 22 in CI, `node:` built-ins only — keep the installer dependency-free. No lint/format/test tooling is configured.
- The installer manages the consumer `CLAUDE.md` between sentinels and preserves content outside the block; keep that invariant when editing `bin/`.

## Commit & PR Guidelines

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:` (see `git log`). Release commits are the bare version, e.g. `0.1.5`.
- Work on a branch, open a PR to `main` (repo: `rafsaw/rafsaw-ai-toolkit`); merging triggers publish. CI runs `npm install --ignore-scripts` then `npm publish` — there are no test or lint gates.
