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
- Formularz kontaktowy wysyła zapytania do skrzynki Ilony przez [FormSubmit](https://formsubmit.co/). Formularz przyjmuje numer telefonu albo adres e-mail.
- Tekst używa Sofia Pro Light, jeśli font jest zainstalowany na urządzeniu. Na pozostałych urządzeniach używa Avenir Next lub fontu systemowego. Aby udostępnić Sofia Pro wszystkim odwiedzającym, dodaj licencjonowany font webowy w deklaracji `@font-face` w `assets/site.css`.

## Aktywacja formularza

Otwórz stronę Kontakt na docelowym adresie i wyślij oznaczone zapytanie testowe. Potwierdź aktywację w wiadomości od FormSubmit na skrzynce odbiorczej, a następnie ponów test i sprawdź potwierdzenie na stronie oraz odbiór wiadomości. Przy zmianie odbiorcy zaktualizuj atrybut `action` formularza w `contact/index.html`.

## Zachowanie i lokalizacja

- Nawigacja, galerie i formularz używają polskich etykiet.
- Stopka ma link do Instagrama oraz strzałkę powrotu na górę. Oznaczenie platformy Pixieset dotyczy oryginalnego hostingu.
- Zdjęcia na stronie głównej przewija się w karuzeli. Powiększenie w galeriach działa na białym tle i obsługuje strzałki oraz Escape.
