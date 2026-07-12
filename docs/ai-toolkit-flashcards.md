# AI Toolkit Flashcards

1. **Q:** Masz kilka projektow klientow, ktore maja uzywac tych samych promptow i regul AI. Dlaczego paczka npm jest lepsza niz reczne kopiowanie plikow?
   **A:** Paczka npm pozwala wersjonowac i dystrybuowac artefakty do wielu projektow w kontrolowany sposob. Reczne kopiowanie szybko prowadzi do rozjazdow miedzy klientami.

2. **Q:** Po `npm install @rafsaw/rafsaw-ai-toolkit` klient nie widzi nowych plikow w `.claude/`. Co najpewniej zostalo pominiete?
   **A:** Pominieto uruchomienie `npx rafsaw-ai-toolkit install`. `npm install` pobiera paczke do `node_modules`, ale nie aplikuje jej artefaktow do projektu.

3. **Q:** Klient ma paczke w `node_modules`, ale Claude Code dalej uzywa starych regul. Dlaczego?
   **A:** Claude Code szuka regul w projekcie klienta, np. w `CLAUDE.md`, a nie bezposrednio w `node_modules`. Trzeba ponownie uruchomic installer.

4. **Q:** Chcesz zmienic reguly, ktore beda dostarczane klientom. Gdzie edytujesz plik?
   **A:** Edytujesz `rules/CLAUDE.md`, bo to jest zrodlo prawdy dla dystrybuowanych regul. Nie edytujesz `.claude/`, bo to lokalna konfiguracja tego repo.

5. **Q:** Dodales nowy folder z artefaktami, ale po publikacji klient go nie dostaje. Co sprawdzasz najpierw?
   **A:** Sprawdzasz, czy folder zostal dodany do `files` w `package.json`. Ta lista decyduje, co faktycznie trafia do opublikowanej paczki.

6. **Q:** Po co `package.json` ma pole `bin` w tej paczce?
   **A:** `bin` mapuje nazwe komendy CLI na plik JavaScript do uruchomienia. Dzieki temu `npx rafsaw-ai-toolkit install` wie, ze ma odpalic `bin/rafsaw-ai-toolkit.js`.

7. **Q:** Co robi `bin/rafsaw-ai-toolkit.js` w tym projekcie?
   **A:** To installer CLI, ktory wie, jakie artefakty skopiowac i gdzie zapisac je u klienta. Obsluguje tez `status`, `uninstall` i `version`.

8. **Q:** Dlaczego installer rozroznia `packageRoot` i `projectRoot`?
   **A:** `packageRoot` wskazuje zrodlo artefaktow w paczce, a `projectRoot` wskazuje projekt klienta, do ktorego instalujemy pliki. Bez tego installer nie wiedzialby, skad kopiowac i dokad zapisywac.

9. **Q:** Klient odpalil `npx rafsaw-ai-toolkit install` z podfolderu repo. Jaki moze byc problem?
   **A:** Installer uzywa `process.cwd()`, wiec moze uznac podfolder za root projektu. Wtedy pliki moga trafic w zle miejsce.

10. **Q:** Po co installer zapisuje `.claude/.rafsaw-ai-toolkit-manifest.json`?
    **A:** Manifest pamieta, co zostalo zainstalowane, w jakiej wersji i ktore pliki sa zarzadzane. Dzieki temu `status` i `uninstall` maja zrodlo informacji.

11. **Q:** Dlaczego `CLAUDE.md` nie jest po prostu nadpisywany podczas instalacji?
    **A:** Klient moze miec wlasne instrukcje przed albo po bloku toolkitu. Sentinel markers pozwalaja zarzadzac tylko fragmentem nalezacym do paczki.

12. **Q:** Co moze oznaczac blad o "Broken sentinel block" w `CLAUDE.md`?
    **A:** W pliku istnieje tylko marker `BEGIN` albo tylko `END`. Installer nie wie wtedy bezpiecznie, gdzie zaczyna sie i konczy zarzadzany blok.

13. **Q:** Dlaczego `rules/CLAUDE.md` nie moze zawierac markerow `BEGIN` lub `END` w tresci?
    **A:** Installer moglby pomylic taki marker z granica zarzadzanego bloku. Przy uninstallu albo aktualizacji moglby usunac za malo albo zmienic niewlasciwy fragment.

14. **Q:** Co zrobi ponowne `npx rafsaw-ai-toolkit install`, jesli blok toolkitu juz istnieje w `CLAUDE.md`?
    **A:** Zastapi istniejacy zarzadzany blok nowa wersja. Nie powinien dodawac drugiego takiego samego bloku.

15. **Q:** `version` pokazuje `0.1.10`, a `status` pokazuje `0.1.9`. Co to oznacza?
    **A:** Uruchamiana paczka ma wersje `0.1.10`, ale projekt klienta ma jeszcze artefakty zainstalowane z wersji `0.1.9`. Trzeba odpalic `npx rafsaw-ai-toolkit install`.

16. **Q:** Kiedy uzywasz `status`, a kiedy `version`?
    **A:** `version` mowi, jaka wersje paczki teraz uruchamiasz. `status` mowi, jaka wersja zostala zastosowana w projekcie i jakie pliki sa zarzadzane.

17. **Q:** Dlaczego config promptfoo jest modyfikowany podczas instalacji?
    **A:** Sciezka promptu w paczce jest inna niz sciezka promptu po instalacji u klienta. Installer dopasowuje config do struktury projektu klienta.

18. **Q:** Dlaczego ta paczka unika zewnetrznych dependencies?
    **A:** To maly installer, wiec wbudowane moduly Node wystarczaja. Mniej zaleznosci oznacza mniejsze ryzyko problemow bezpieczenstwa, konfliktow i wolniejszej instalacji.

19. **Q:** Kiedy dependency-free podejscie przestaloby byc dobrym wyborem?
    **A:** Gdyby CLI uroslo i wymagalo skomplikowanego parsowania opcji, YAML, interakcji lub walidacji. Wtedy dobra biblioteka moglaby zmniejszyc ilosc wlasnego kodu.

20. **Q:** Dlaczego `@rafsaw/rafsaw-ai-toolkit` powinien byc w `devDependencies`, a nie w `dependencies`?
    **A:** To narzedzie developerskie do instalowania artefaktow AI, a nie kod potrzebny aplikacji w runtime. Produkcja zwykle nie potrzebuje tej paczki.

21. **Q:** Co jest ryzykowne w pushowaniu do `main` w tym repo?
    **A:** Push albo merge do `main` moze uruchomic publikacje paczki do GitHub Packages. Dlatego zmiana wersji i merge powinny byc swiadoma decyzja release'owa.

22. **Q:** Co jest publicznym kontraktem tej paczki dla klientow?
    **A:** Komendy CLI, sciezki instalowanych plikow, zachowanie manifestu i format zarzadzanego bloku w `CLAUDE.md`. Zmiana tych elementow moze zepsuc workflow klientow.

23. **Q:** Dlaczego test CLI uruchamia proces zamiast tylko sprawdzac funkcje w kodzie?
    **A:** Bo uzytkownik uzywa komendy, a nie wewnetrznej funkcji. Testowanie procesu sprawdza publiczne zachowanie narzedzia.

24. **Q:** Jesli klient chce zaktualizowac toolkit, jaka jest poprawna sekwencja?
    **A:** Najpierw aktualizuje paczke przez `npm install --save-dev @rafsaw/rafsaw-ai-toolkit@latest`. Potem uruchamia `npx rafsaw-ai-toolkit install`, zeby zastosowac nowe artefakty.

25. **Q:** Jaki jest najkrotszy mentalny model calego projektu?
    **A:** To dystrybutor artefaktow AI przez npm. Artefakty sa zrodlem, paczka je dostarcza, a CLI aplikuje je do projektu klienta.
