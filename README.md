# Rafsaw AI Toolkit

Shared AI toolkit for distributing reusable AI workflow artifacts across projects.

This package contains:

- Claude Code skills
- shared prompts
- shared AI rules
- promptfoo evaluation starter
- installer CLI for applying the toolkit to a consumer project

## Package

```text
@rafsaw/rafsaw-ai-toolkit
````

Published to GitHub Packages:

```text
https://npm.pkg.github.com
```

## Consumer installation

In a consumer project, configure GitHub Packages for the `@rafsaw` scope:

```text
@rafsaw:registry=https://npm.pkg.github.com
```

Then install the package as a development dependency:

```powershell
npm install --save-dev @rafsaw/rafsaw-ai-toolkit
```

Full installation and authentication guide:

```text
docs/consumer-installation.md
```

## Usage in a consumer project

Apply shared AI artifacts to the current project:

```powershell
npx rafsaw-ai-toolkit install
```

Check installed files:

```powershell
npx rafsaw-ai-toolkit status
```

Remove installed files:

```powershell
npx rafsaw-ai-toolkit uninstall
```

## What the installer writes

The installer copies shared artifacts into the consumer project:

```text
.claude/skills/code-review/SKILL.md
.claude/prompts/code-review.md
evals/rafsaw-ai-toolkit.promptfooconfig.yaml
CLAUDE.md
.claude/.rafsaw-ai-toolkit-manifest.json
```

Rules are injected into `CLAUDE.md` between sentinel markers:

```text
<!-- BEGIN @rafsaw/rafsaw-ai-toolkit -->
...
<!-- END @rafsaw/rafsaw-ai-toolkit -->
```

Local project-specific content outside that managed block is preserved.

## M5L4 context

This repository demonstrates the Shared AI Registry model:

```text
source repo → GitHub Actions → GitHub Packages → consumer repo
```

The goal is to treat AI artifacts as code: versioned, reviewed, published and consumed through a controlled distribution path.

````

## Potem wróć do toola

Po dodaniu `bin/rafsaw-ai-toolkit.js` i zmianie `package.json`, commit będzie taki:

```powershell
git status
git add package.json README.md bin\rafsaw-ai-toolkit.js
git commit -m "feat: add AI toolkit installer CLI"
````

Jeśli wcześniej dodałeś też docs update, możesz mieć osobny commit docs, np.:

```powershell
git add docs\consumer-installation.md
git commit -m "docs: document GitHub and Cloudflare package auth"
```