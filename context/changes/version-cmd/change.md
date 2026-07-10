---
change_id: version-cmd
title: Add a version command to the installer CLI
status: implemented
created: 2026-07-10
updated: 2026-07-10
archived_at: null
---

## Notes

Add a `version` command to `bin/rafsaw-ai-toolkit.js` that prints the package version (the `getPackageVersion()` helper already exists). Cover it with a Node built-in test (`node --test`, zero new dependencies) and wire a `test` script in `package.json`. Small, self-contained task used to practice the async delegation workflow from lesson m5l5 (`/10x-plan` → `/10x-goal-implement`).
