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
- Formularz kontaktowy przygotowuje wiadomość w aplikacji pocztowej odwiedzającego. Dane kontaktowe podano również jako bezpośrednie linki do telefonu i poczty.
