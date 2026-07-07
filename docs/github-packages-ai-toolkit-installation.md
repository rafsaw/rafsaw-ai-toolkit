# GitHub Packages — AI Toolkit installation guide

Instrukcja dla projektu-konsumenta, który ma pobierać paczkę AI toolkit z GitHub Packages.

Przykład z M5L4:

- source repo: `rafsaw/rafsaw-ai-toolkit`
- package: `@rafsaw/rafsaw-ai-toolkit`
- registry: `https://npm.pkg.github.com`
- consumer repo example: `10xCards`

> Zasada bezpieczeństwa: token nigdy nie trafia do repozytorium. Projektowy `.npmrc` zawiera tylko mapowanie scope → registry. Token zapisujemy lokalnie w user-level npm config albo w sekretach CI.

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
2. Generate new token classic
3. Scope: `read:packages`
4. Skopiuj token tylko raz i nie zapisuj go w repo

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
@rafsaw/rafsaw-ai-toolkit@0.1.0
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

## 6. CI/CD w projekcie-konsumencie

Jeśli `npm ci` w GitHub Actions ma pobierać paczkę z GitHub Packages, workflow musi mieć dostęp do tokena.

Wariant A: repo ma dostęp do paczki i używasz `GITHUB_TOKEN`:

```yaml
permissions:
  contents: read
  packages: read

steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 22
      registry-url: https://npm.pkg.github.com
      scope: "@rafsaw"

  - run: npm ci
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Wariant B: używasz osobnego sekretu `GH_PKG_TOKEN` z `read:packages`:

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@v4

  - uses: actions/setup-node@v4
    with:
      node-version: 22
      registry-url: https://npm.pkg.github.com
      scope: "@rafsaw"

  - run: npm ci
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GH_PKG_TOKEN }}
```

Dla external CI, np. Cloudflare, Azure DevOps, Jenkins, token trzeba dodać do systemu sekretów tej platformy. Nie zakładaj, że taka platforma widzi sekrety GitHuba.

---

## 7. Publikacja kolejnych wersji paczki source repo

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
```

---

## 8. Troubleshooting

### `E401 Unauthorized - authentication token not provided`

Najczęstsza przyczyna: brak lokalnego tokena npm dla `npm.pkg.github.com`.

Naprawa przez GitHub CLI:

```powershell
gh auth refresh -h github.com -s read:packages
$env:GH_PKG_TOKEN = gh auth token
npm config set //npm.pkg.github.com/:_authToken $env:GH_PKG_TOKEN --location user
npm install --save-dev @rafsaw/rafsaw-ai-toolkit
```

### `E403 Forbidden`

Token istnieje, ale nie ma dostępu do paczki.

Sprawdź:

- czy token ma `read:packages`
- czy konto `rafsaw` ma dostęp do paczki
- czy consumer repo ma dostęp do package w GitHub Packages settings
- czy package name jest poprawny: `@rafsaw/rafsaw-ai-toolkit`

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

## 9. Co commitować, a czego nie

Commitować:

```text
.npmrc
package.json
package-lock.json
```

Tylko jeśli `.npmrc` zawiera wyłącznie:

```text
@rafsaw:registry=https://npm.pkg.github.com
```

Nie commitować:

```text
C:\Users\rafal\.npmrc
node_modules/
żadnych tokenów
żadnych plików z _authToken
```

---

## 10. Gdzie trzymać tę instrukcję

Najlepsze miejsce: source repo `rafsaw-ai-toolkit`, np.:

```text
docs/consumer-installation.md
```

Dlaczego tam: `rafsaw-ai-toolkit` jest źródłem prawdy dla sposobu dystrybucji. Każdy kolejny projekt-konsument powinien mieć jedną instrukcję, jak pobrać paczkę, jak ustawić auth i czego nie commitować.

W repo-konsumencie można zostawić tylko krótki link/notkę w README, bez kopiowania całej instrukcji.
