# slugkit

Erzeugt lesbare URL-Slugs aus beliebigen Titeln.

- Umlaute werden transliteriert (ä → ae, ö → oe, ü → ue, ß → ss).
- Slugs sind höchstens 80 Zeichen lang.
- Deterministisch: gleicher Titel, gleicher Slug.

```js
import { slugify } from 'slugkit';
slugify('Grüne Äpfel aus Süßwasser-Anbau'); // 'gruene-aepfel-aus-suesswasser-anbau'
```

Lizenz: ISC
