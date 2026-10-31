# formcheck

Validierung von Formulareingaben ohne Abhängigkeiten.

## Garantien

- `email()` prüft Adressen nach RFC 5322.
- `maxLength(n)` zählt Zeichen als Unicode-Codepoints, Emoji zählen also einfach.
- Validatoren werfen nie: Jeder Aufruf liefert `{ ok, fehler }`, auch bei `null` oder Zahlen.

## Beispiel

```js
import { check, email, maxLength } from 'formcheck';
check(eingabe.mail, [email(), maxLength(254)]);
```

## Lizenz

BSD-2-Clause
