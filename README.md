# Ilona Napopil — fotografka

Statyczne portfolio w języku polskim. Zawiera stronę główną, portfolio z czterema galeriami, szczegóły sesji i kontakt.

## Podgląd lokalny

W katalogu repozytorium uruchom:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Otwórz [http://127.0.0.1:8000/](http://127.0.0.1:8000/). Pliki HTML są gotowe do udostępnienia na hostingu statycznym bez procesu budowania. Linki względne pozwalają umieścić stronę również w podkatalogu.

- `assets/photos/` zawiera 63 pliki JPEG w największym rozmiarze udostępnionym publicznie przez źródłową witrynę. Kadr używany na kilku stronach ma jeden wspólny plik.
- `assets/previews/` zawiera lżejsze wersje JPEG do wyświetlania na stronie.
- `assets/site.css` i `assets/site.js` zawierają wspólne style i interakcje.
- Formularz kontaktowy wysyła zapytania przez Cloudflare Worker do kanału Telegram. Wymaga numeru telefonu albo adresu e-mail. Polskie numery można podać bez kodu kraju, a zagraniczne z `+` lub `00`. Lokalna kopia `libphonenumber-js` 1.13.16 w `assets/vendor/` sprawdza numer i zapisuje go w wiadomości w formacie międzynarodowym. Gotowa wiadomość może mieć maksymalnie 512 znaków wraz z podpisami pól.
- Tekst używa Sofia Pro Light, jeśli font jest zainstalowany na urządzeniu. Na pozostałych urządzeniach używa Avenir Next lub fontu systemowego. Aby udostępnić Sofia Pro wszystkim odwiedzającym, dodaj licencjonowany font webowy w deklaracji `@font-face` w `assets/site.css`.

## Formularz kontaktowy

Formularz na [ilonanapopil.com/contact/](https://ilonanapopil.com/contact/) wysyła JSON do Workera `ilonanapopil-contact` pod adresem `https://contact.ilonanapopil.com/`. Kod Workera i metadane wdrożenia przez API Cloudflare znajdują się w `_worker/`. Przy aktualizacji prześlij `contact.mjs` jako moduł i zachowaj istniejące powiązania z sekretami zgodnie z `metadata.json`.

W Cloudflare przechowuj `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` i `TURNSTILE_SECRET_KEY` jako sekrety Workera. Jeśli poprzedni token znajdował się w kodzie strony, unieważnij go poleceniem `/revoke` w `@BotFather`. Klucz publiczny Turnstile jest w `contact/index.html`. Produkcja dopuszcza pochodzenie `https://ilonanapopil.com`, a Siteverify sprawdza również domenę i akcję `contact`. Powiązanie `CONTACT_RATE_LIMITER` ogranicza żądania POST do pięciu na 60 sekund na IP w danej lokalizacji Cloudflare.

Po publikacji wyślij oznaczone zgłoszenie testowe z opublikowanej strony. Sprawdź komunikat powodzenia i komplet pól w Telegramie. Żądanie z obcego `Origin` lub bez poprawnego tokenu Turnstile ma zwracać `403`, a seria żądań z jednego IP ma doprowadzić do `429`. Wypełnione ukryte pole `website` zwraca `200` i pomija wysyłkę. W narzędziach deweloperskich sprawdź, że żądanie formularza trafia do Workera i nie zawiera danych logowania bota ani identyfikatora kanału.

## Zachowanie i lokalizacja

- Nawigacja, galerie i formularz używają polskich etykiet.
- Stopka ma link do Instagrama oraz strzałkę powrotu na górę. Oznaczenie platformy Pixieset dotyczy oryginalnego hostingu.
- Zdjęcia na stronie głównej przewija się w karuzeli. Powiększenie w galeriach działa na białym tle i obsługuje strzałki oraz Escape.
