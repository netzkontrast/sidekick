Ich habe die Fälle aus `mini-spec.md` abgeleitet. **Ausgeführt ist noch nichts:** Im Repo liegen nur die Spec und die Skills, kein Dienst und kein Fake-Effektdienst, gegen die man testen könnte. Alle Fälle stehen deshalb auf **nicht ausgeführt**.

## Lücken in der Spec

Die Spec hat nur drei Anforderungen. Wo sie schweigt, setze ich das Soll auf „unklar, Abgleich nötig“ oder markiere die Stelle als offen. Erfundene Sollwerte gibt es nicht. Diese Fragen müssen geklärt werden, bevor man die Tests als bestanden oder fehlgeschlagen bewerten kann:

- **L-1 (S-1):** Was bekommt der Aufrufer bei einem Duplikat zurück? Das ursprüngliche Ergebnis, einen Fehler oder „in Bearbeitung“?
- **L-2 (S-1):** Wie lange gilt ein Schlüssel und wofür (Mandant, Befehlstyp)? Was passiert, wenn derselbe Schlüssel mit anderem Inhalt kommt?
- **L-3 (S-2):** Was tut der Dienst, wenn eine Absicht protokolliert, aber nie bestätigt wurde? Abgleich mit dem Effektdienst, Wiederholung oder Fehlerzustand? Kann man den Effektdienst überhaupt nach „Effekt zu Schlüssel X vorhanden?“ fragen?
- **L-4 (S-2):** Nimmt der Effektdienst selbst einen Idempotenz-Schlüssel an? Davon hängt ab, ob F-05 und F-07 ohne Doppelwirkung möglich sind.

## Ausfallmatrix

Alle Fälle laufen in der Umgebung **In-Process-Fake**, wie S-3 es vorgibt. Es werden keine Produktivsysteme berührt und es sind keine Zugangsdaten nötig.

Die Wirkung bewerte ich nur über das Effektbuch des Fakes, nicht über Logs oder Antworten des Dienstes.

| Fall-ID | Anf.-ID | Störungsklasse | Injektionspunkt | Soll Zustellung | Soll Lauf | Soll Wirkung | Assertion | Rohbelegort | Status |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | S-1 | Duplikat, nacheinander | nach Bestätigung | 2. Befehl angenommen, Antwortform offen (L-1) | genau 1 Lauf zum Schlüssel, Zustand „bestätigt“ | genau 1 Effekt | `fake.effects(key) == 1` und `journal.runs(key) == 1` | Effektbuch, Journal-Dump, beide Antworten | nicht ausgeführt |
| F-02 | S-1 | Duplikat, gleichzeitig | vor Zusage (beide Befehle hinter einer Barriere) | beide angenommen, mindestens einer bekommt das Ergebnis oder „in Bearbeitung“ (L-1) | genau 1 Absicht zum Schlüssel | genau 1 Effekt | wie F-01, über 100 Wiederholungen mit festem Seed | wie F-01 plus Seed und Durchlauf-Nr. | nicht ausgeführt |
| F-03 | S-1, S-2 | Duplikat, während der 1. Lauf noch läuft | nach Absicht, vor Wirkung (Fake blockiert) | 2. Befehl löst keinen zweiten Effektaufruf aus | 1 Absicht, nicht bestätigt, bis der Fake freigegeben wird | 1 Effekt nach Freigabe | `fake.calls(key) == 1` vor und nach der Freigabe | Aufrufprotokoll des Fakes mit Zeitpunkten | nicht ausgeführt |
| **F-04** | S-2 | Verlust der Antwort: **Wirkung eingetreten, Bestätigung verloren** | nach Wirkung, vor Bestätigung (Fake führt aus, verwirft die Antwort) | Aufrufer bekommt keine Erfolgsmeldung | **unklar, Abgleich nötig**: Absicht vorhanden, keine Bestätigung, *nicht* als „fehlgeschlagen“ markiert | 1 Effekt | `fake.effects(key) == 1`, `journal.state(key) ∉ {bestätigt, fehlgeschlagen}` | Effektbuch, Journal-Dump, Antwort des Aufrufers | nicht ausgeführt |
| F-05 | S-1, S-2 | wie F-04, danach Wiederholung mit demselben Schlüssel | nach verlorener Bestätigung | Wiederholung angenommen | nach Abgleich „bestätigt“, oder weiter unklar, wenn L-3 offen bleibt | **weiterhin 1 Effekt** | `fake.effects(key) == 1` nach der Wiederholung | wie F-04, plus Antwort auf die Wiederholung | nicht ausgeführt (hängt an L-3/L-4) |
| F-06 | S-2 | Verlust der Anfrage (Gegenprobe zu F-04) | vor Wirkung (Fake verwirft die Anfrage) | Aufrufer sieht dasselbe wie in F-04 | **unklar, Abgleich nötig**: aus Sicht des Dienstes nicht von F-04 unterscheidbar | 0 Effekte | `fake.effects(key) == 0`, Journalzustand wie in F-04 | wie F-04 | nicht ausgeführt |
| F-07 | S-2 | Prozessabsturz | nach Wirkung, vor Bestätigung, danach Neustart des Dienstes mit erhaltenem Journal | – | nach Neustart Abgleich statt blinder Neuausführung | 1 Effekt | `fake.effects(key) == 1` nach Neustart und Wiederaufnahme | Journal vor und nach dem Neustart, Effektbuch | nicht ausgeführt |

F-04 und F-06 gehören zusammen. Für den Dienst sehen beide Fälle gleich aus, nur das Effektbuch unterscheidet sie. Ein Dienst, der in beiden Fällen sicher „fehlgeschlagen“ oder sicher „erfolgreich“ meldet, liegt in einem der beiden Fälle falsch.

## Anforderungen an den Fake

1. Er führt pro Idempotenz-Schlüssel ein Effektbuch und ein Aufrufprotokoll und kann beides als JSON in ein Testartefakt schreiben.
2. Er kann vier Störungen gezielt auslösen: „Anfrage verwerfen“, „ausführen und Antwort verwerfen“, „vor Ausführung blockieren, bis freigegeben wird“ und „Absturz nach Wirkung“.
3. Wenn die Gleichzeitigkeit in F-02 zufallsabhängig ist, braucht er deterministische Barrieren und einen festen Seed.

Für jeden Lauf werden Befehl, Commit (aktuell `2d81243`), Version der Laufzeitumgebung und der Pfad zu den Artefakten festgehalten. Fehlt ein Dump oder ist er abgeschnitten, gilt der Fall als **nicht beobachtbar**, nicht als bestanden.

## Grenzen der Aussage

Selbst wenn alle sieben Fälle bestehen, belegen sie nur diese sieben Szenarien. Ein „genau einmal“ lässt sich daraus nicht ableiten, auch nicht für andere Injektionspunkte, Umordnung oder abgelaufene Schlüssel (L-2).

## Kleinster nächster Schritt

Zuerst L-3 klären. Danach einen minimalen Dienst mit Fake bauen und **F-04** zum Laufen bringen. Er ist der Pflichtfall und braucht nur die Störung „ausführen und Antwort verwerfen“. Die übrigen Fälle bauen auf demselben Fake auf.

Soll ich die Matrix als Datei ablegen oder das Gerüst für Dienst, Fake und F-04 anlegen?