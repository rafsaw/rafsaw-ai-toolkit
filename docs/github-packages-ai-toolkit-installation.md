# GitHub Packages — AI Toolkit installation guide

Instrukcja dla projektu-konsumenta, który ma pobierać paczkę AI toolkit z GitHub Packages.

Przykład z M5L4:

- source repo: `rafsaw/rafsaw-ai-toolkit`
- package: `@rafsaw/rafsaw-ai-toolkit`
- registry: `https://npm.pkg.github.com`
- consumer repo example: `rafsaw/10xCards`

> Zasada bezpieczeństwa: token nigdy nie trafia do repozytorium. Projektowy `.npmrc` zawiera tylko mapowanie scope → registry. Token zapisujemy lokalnie w user-level npm config albo w sekretach CI/build platformy.

---

## 1. Projekt-konsument: branch roboczy

W repo, które ma konsumować paczkę:

```powershell
cd C:\Users\rafal\repos\10xDevs3\10xCards

git status
git switch main
git pull --ff-only origin main

git switch -c learning/m5l4-github-packages
```

Sprawdzenie:

```powershell
git branch --show-current
git status
```

Oczekiwany branch:

```text
learning/m5l4-github-packages
```

---

## 2. Projekt-konsument: `.npmrc` bez sekretów

Dodaj mapowanie scope `@rafsaw` na GitHub Packages:

```powershell
$line = "@rafsaw:registry=https://npm.pkg.github.com"

if (-not (Test-Path .npmrc)) {
  New-Item .npmrc -ItemType File | Out-Null
}

if (-not (Select-String -Path .npmrc -Pattern ([regex]::Escape($line)) -Quiet)) {
  Add-Content .npmrc $line
}
```

Sprawdź zawartość:

```powershell
Get-Content .npmrc
```

Poprawna zawartość projektowego `.npmrc`:

```text
@rafsaw:registry=https://npm.pkg.github.com
```

Nie dodawaj tutaj tokena. Projektowy `.npmrc` może być commitowany tylko wtedy, gdy nie ma w nim `_authToken`.

---

## 3. Jednorazowa autoryzacja lokalna przez GitHub CLI

Najwygodniejsza opcja, jeśli masz `gh`.

Sprawdź obecne logowanie:

```powershell
gh auth status
```

Dodaj scope `read:packages` do tokena GitHub CLI:

```powershell
gh auth refresh -h github.com -s read:packages
```

Pobierz token z GitHub CLI do zmiennej środowiskowej w bieżącej sesji PowerShell:

```powershell
$env:GH_PKG_TOKEN = gh auth token
```

Zapisz token w user-level npm config, nie w repo:

```powershell
npm config set //npm.pkg.github.com/:_authToken $env:GH_PKG_TOKEN --location user
```

Sprawdź, gdzie npm zapisał user config:

```powershell
npm config get userconfig
```

Na Windows zwykle będzie to:

```text
C:\Users\rafal\.npmrc
```

Tego pliku nie commitujesz do repo.

---

## 4. Alternatywa: login przez PAT classic

Jeśli GitHub CLI nie działa albo chcesz użyć ręcznego tokena:

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Generate new token classic
3. Note: `local-read-github-packages` albo podobna nazwa
4. Expiration: np. 30 / 60 / 90 dni
5. Scope: `read:packages`
6. Skopiuj token tylko raz i nie zapisuj go w repo

Potem lokalnie:

```powershell
npm login --scope=@rafsaw --registry=https://npm.pkg.github.com
```

Wpisz:

```text
Username: rafsaw
Password: <PAT classic z read:packages>
Email: <twój GitHub email>
```

---

## 5. Instalacja paczki w projekcie-konsumencie

Ponieważ AI toolkit jest narzędziem developerskim, instaluj jako `devDependency`:

```powershell
npm install --save-dev @rafsaw/rafsaw-ai-toolkit
```

Sprawdź instalację:

```powershell
npm ls @rafsaw/rafsaw-ai-toolkit
```

Oczekiwany wynik zawiera wersję, np.:

```text
@rafsaw/rafsaw-ai-toolkit@0.1.1
```

Sprawdź zmiany w repo:

```powershell
git status
git diff -- .npmrc package.json package-lock.json
```

Oczekiwane zmiany:

- `.npmrc` — mapowanie `@rafsaw` na GitHub Packages
- `package.json` — `devDependency` na `@rafsaw/rafsaw-ai-toolkit`
- `package-lock.json` — zablokowana wersja paczki

Commit:

```powershell
git add .npmrc package.json package-lock.json
git commit -m "chore: consume shared AI toolkit package"
git push origin learning/m5l4-github-packages
```

---

## 6. GitHub Packages: dodanie repo-konsumenta do paczki

Jeśli consumer repository ma instalować paczkę w GitHub Actions przez `GITHUB_TOKEN`, trzeba dać temu repo dostęp do paczki.

W source package:

```text
GitHub → Profile → Packages
→ @rafsaw/rafsaw-ai-toolkit
→ Package settings
→ Manage Actions access
→ Add repository
→ rafsaw/<consumer-repo>
```

Dla przykładu:

```text
Add repository → rafsaw/10xCards
```

To uprawnienie jest potrzebne dla GitHub Actions w repo-konsumencie. Nie rozwiązuje ono dostępu dla zewnętrznych platform buildów, np. Cloudflare, Azure DevOps albo Jenkins.

---

## 7. GitHub Actions w projekcie-konsumencie

Jeśli `npm ci` w GitHub Actions ma pobierać paczkę z GitHub Packages, workflow musi mieć dostęp do tokena.

Minimalny wariant z `GITHUB_TOKEN`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  packages: read

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          registry-url: https://npm.pkg.github.com
          scope: "@rafsaw"

      - run: npm ci
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - run: npm run build
```

Jeśli workflow ma więcej niż jeden krok `npm ci`, np. sub-project:

```yaml
      - run: npm ci --prefix packages/code-reviewer
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Każdy krok, który może czytać GitHub Packages, powinien dostać `NODE_AUTH_TOKEN`.

Wariant z osobnym sekretem `GH_PKG_TOKEN`:

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 22
      cache: npm
      registry-url: https://npm.pkg.github.com
      scope: "@rafsaw"

  - run: npm ci
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GH_PKG_TOKEN }}
```

`GH_PKG_TOKEN` powinien być PAT classic z `read:packages`, zapisany jako GitHub Actions secret w repo-konsumencie.

---

## 8. Cloudflare Workers Builds / Pages: osobna autoryzacja build-time

Cloudflare Workers Builds nie widzi automatycznie `GITHUB_TOKEN` z GitHub Actions ani lokalnego `C:\Users\rafal\.npmrc`.

Jeśli Cloudflare robi dependency install, np.:

```text
Installing project dependencies: npm clean-install --progress=false
```

to Cloudflare też musi mieć osobną autoryzację do GitHub Packages.

### 8.1. Dodaj `.npmrc.cloudflare` w repo-konsumencie

W repo-konsumencie:

```powershell
cd C:\Users\rafal\repos\10xDevs3\10xCards
git switch learning/m5l4-github-packages

New-Item .npmrc.cloudflare -ItemType File -Force
```

Zawartość `.npmrc.cloudflare`:

```text
@rafsaw:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${TOKEN_FOR_GITHUB}
```

Ten plik można commitować, bo nie zawiera tokena, tylko nazwę zmiennej środowiskowej.

Commit:

```powershell
git add .npmrc.cloudflare
git commit -m "ci: add Cloudflare npm registry config"
git push origin learning/m5l4-github-packages
```

### 8.2. Dodaj build variables/secrets w Cloudflare

W Cloudflare użyj sekcji build, nie runtime.

```text
Cloudflare → Workers & Pages
→ <project>
→ Settings
→ Build
→ Variables and secrets
```

Dodaj encrypted secret:

```text
Name: TOKEN_FOR_GITHUB
Type: Secret / encrypted
Value: <PAT classic with read:packages>
```

Token tworzysz w GitHub:

```text
GitHub → Settings
→ Developer settings
→ Personal access tokens
→ Tokens (classic)
→ Generate new token classic
→ Scope: read:packages
```

Dodaj build variable:

```text
Name: NPM_CONFIG_USERCONFIG
Type: Text / variable
Value: /opt/buildhome/repo/.npmrc.cloudflare
```

To mówi npm, żeby podczas builda użył pliku `.npmrc.cloudflare`.

### 8.3. Retry Cloudflare build

Po zapisaniu zmiennych zrób retry deployment w Cloudflare albo pusty commit:

```powershell
git commit --allow-empty -m "ci: retry Cloudflare build with package auth"
git push origin learning/m5l4-github-packages
```

W logu Cloudflare błąd powinien zniknąć:

```text
E401 Unauthorized - authentication token not provided
```

Poprawny sygnał:

```text
✨ Success! Build completed.
```

### 8.4. Ważna różnica: runtime variables vs build variables

Sekrety runtime, np. `SUPABASE_URL`, `SENTRY_DSN`, `OPENROUTER_API_KEY`, są dostępne dla uruchomionej aplikacji/workera.

Auth do GitHub Packages musi być dostępny wcześniej, podczas:

```text
npm clean-install
npm ci
```

Dlatego `TOKEN_FOR_GITHUB` i `NPM_CONFIG_USERCONFIG` dodajemy jako build variables/secrets, a nie tylko runtime variables/secrets.

---

## 9. Publikacja kolejnych wersji paczki source repo

W source repo `rafsaw-ai-toolkit` nie publikuj drugi raz tej samej wersji. GitHub Packages odrzuci duplikat wersji.

Przed kolejnym publishem podbij wersję:

```powershell
cd C:\Users\rafal\repos\10xDevs3\rafsaw-ai-toolkit

git status
npm version patch
git push origin main --follow-tags
```

Przykład:

```text
0.1.0 → 0.1.1
0.1.1 → 0.1.2
```

Jeśli pracujesz na feature branchu w `rafsaw-ai-toolkit`, najpierw zrób PR do `main`. Publish workflow powinien publikować paczkę dopiero po merge na `main`.

---

## 10. Troubleshooting

### `E401 Unauthorized - authentication token not provided`

Najczęstsza przyczyna: build albo lokalne npm nie widzi tokena dla `npm.pkg.github.com`.

Naprawa lokalna przez GitHub CLI:

```powershell
gh auth refresh -h github.com -s read:packages
$env:GH_PKG_TOKEN = gh auth token
npm config set //npm.pkg.github.com/:_authToken $env:GH_PKG_TOKEN --location user
npm install --save-dev @rafsaw/rafsaw-ai-toolkit
```

GitHub Actions checklist:

- workflow ma `permissions: packages: read`
- `actions/setup-node` ma `registry-url: https://npm.pkg.github.com`
- `actions/setup-node` ma `scope: "@rafsaw"`
- `npm ci` ma `NODE_AUTH_TOKEN`
- package settings mają consumer repo w `Manage Actions access`

Cloudflare checklist:

- `.npmrc.cloudflare` istnieje w repo
- `.npmrc.cloudflare` zawiera `//npm.pkg.github.com/:_authToken=${TOKEN_FOR_GITHUB}`
- Cloudflare ma build secret `TOKEN_FOR_GITHUB`
- Cloudflare ma build variable `NPM_CONFIG_USERCONFIG`
- `NPM_CONFIG_USERCONFIG` wskazuje `/opt/buildhome/repo/.npmrc.cloudflare`
- token jest realnym PAT classic z `read:packages`

### `E403 Forbidden`

Token istnieje, ale nie ma dostępu do paczki.

Sprawdź:

- czy token ma `read:packages`
- czy konto tokena ma dostęp do paczki
- czy consumer repo ma dostęp do package w GitHub Packages settings
- czy package name jest poprawny: `@rafsaw/rafsaw-ai-toolkit`
- czy używasz klasycznego PAT, jeśli zewnętrzna platforma nie obsługuje `GITHUB_TOKEN`

### `E404 Not Found`

Możliwe przyczyny:

- literówka w nazwie paczki
- brak `.npmrc` z mapowaniem scope
- paczka nie została opublikowana
- registry jest ustawione na publiczne npm zamiast GitHub Packages

Sprawdź:

```powershell
Get-Content .npmrc
npm config get @rafsaw:registry
```

Oczekiwane:

```text
https://npm.pkg.github.com
```

### Publish fails because version already exists

GitHub Packages nie pozwala opublikować tej samej wersji drugi raz.

Naprawa:

```powershell
npm version patch
git push origin main --follow-tags
```

---

## 11. Co commitować, a czego nie

Commitować:

```text
.npmrc
.npmrc.cloudflare
package.json
package-lock.json
```

Tylko jeśli `.npmrc` zawiera wyłącznie:

```text
@rafsaw:registry=https://npm.pkg.github.com
```

i `.npmrc.cloudflare` zawiera wyłącznie:

```text
@rafsaw:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${TOKEN_FOR_GITHUB}
```

Nie commitować:

```text
C:\Users\rafal\.npmrc
node_modules/
żadnych tokenów
żadnych plików z realnym _authToken
```

Nigdy nie commituj:

```text
//npm.pkg.github.com/:_authToken=ghp_real_token_here
```

---

## 12. Gdzie trzymać tę instrukcję

Najlepsze miejsce: source repo `rafsaw-ai-toolkit`, np.:

```text
docs/consumer-installation.md
```

Dlaczego tam: `rafsaw-ai-toolkit` jest źródłem prawdy dla sposobu dystrybucji. Każdy kolejny projekt-konsument powinien mieć jedną instrukcję, jak pobrać paczkę, jak ustawić auth i czego nie commitować.

W repo-konsumencie można zostawić tylko krótki link/notkę w README, bez kopiowania całej instrukcji.
