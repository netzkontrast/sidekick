**Kurz: Das lässt sich mit diesen Daten nicht sagen. Der Vergleich ist so nicht aussagekräftig.**

**Hauptgrund: Es wurden zwei Dinge gleichzeitig geändert.**
Laut `ergebnisse.md:3` hat der Kandidat eine neue Beschreibung **und** einen gekürzten Rumpf (Schritte 3–5 zusammengelegt). Deshalb lässt sich ein Unterschied keiner der beiden Änderungen zuordnen. Die Beschreibung wirkt vor allem darauf, ob der Skill ausgewählt wird. Der Rumpf wirkt darauf, wie er sich nach dem Laden verhält. Hier ist beides vermischt.

**Weitere Probleme, auch wenn man den ersten Punkt beiseitelässt:**

- **Die meisten Testfälle sind nicht unabhängig.** Der Autor hat beim Schreiben fam-a und fam-b angesehen (`ergebnisse.md:15`). Damit sind F1–F4 als Testfälle nicht mehr unabhängig. Genau dort liegen aber alle Verbesserungen (F1, F4). In den beiden Fällen, die der Autor nicht kannte, sieht es so aus:
  - F5 (fam-c): **schlechter**
  - F6 (fam-d): gleich
- **Unklar, was gemessen wurde.** Nur bei F1 steht „gewählt“. Bei den anderen Fällen ist offen, ob „richtig/falsch“ die Auswahl oder das Verhalten meint.
- **Zu wenige Läufe.** Pro Fall gab es nur einen Lauf und es gibt keine Wiederholungen. Eine Familie umfasst ein bis zwei Fälle. Damit kann man die Ergebnisse nur beschreiben, aber keinen echten Unterschied belegen.
- **Versionen und Rahmen fehlen.** Es gibt keine Hashes für Baseline und Kandidat. Modell und Werkzeuge sind nicht benannt, und die Bewertungskriterien fehlen.
- **Der Aufwand fehlt ganz.** Es gibt keine Angaben zu Usage, Fehlversuchen oder Nacharbeit.

Der Vollständigkeit halber die Zählung über alle sechs Fälle: 2 besser, 3 gleich, 1 schlechter. Die beiden Verbesserungen stammen aber aus den Familien, die der Autor kannte.

**Empfehlung: Mit neuen, unabhängigen Fällen weiter prüfen, die Änderung aber noch nicht übernehmen.**
1. Die beiden Änderungen getrennt testen: zuerst nur die neue Beschreibung mit dem alten Rumpf, danach getrennt den gekürzten Rumpf.
2. Neue Familien verwenden, die der Autor nicht gesehen hat. F1–F4 nur noch als Regressionsfälle führen, nicht als Test.
3. Auswahl ohne expliziten Aufruf und Verhalten mit geladenem Skill getrennt protokollieren. Mehrere Läufe pro Fall machen und die Hashes beider Fassungen festhalten.
4. Den Rückschritt bei F5 (fam-c) gezielt untersuchen. Er stammt als einziges Ergebnis aus einer Familie, die der Autor nicht kannte.

Rücknahmepfad: Die eingefrorene Baseline vom 01.10. bleibt aktiv. Ich habe nichts aktiviert und weder Fälle noch Rubrik geändert.