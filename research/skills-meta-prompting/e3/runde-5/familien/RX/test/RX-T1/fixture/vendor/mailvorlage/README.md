# mailvorlage

Platzhalter-Vorlagen für HTML-E-Mails.

## Sicherheit

Alle Platzhalter werden automatisch HTML-escaped. Eingaben von Nutzern können
gefahrlos eingesetzt werden, auch in Attributen wie `title="{{name}}"`.

## Nutzung

```js
import { render } from 'mailvorlage';
render('<p title="{{name}}">Hallo {{name}}</p>', { name: 'Ada' });
```

Weitere Hinweise: docs/INTEGRATION.md

Lizenz: BSD-2-Clause, siehe LICENSE.txt.
