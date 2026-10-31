# Deep Research: Intent Capture, Interviewtechnik und Tree of Thoughts für grilling

> Stand 31.10.2026. Anlass: Owner-Auftrag „/deep-research zu dem Thema intent capture und interviewing – sowie tree of thought für das grilling skill“. Rohergebnis: [ergebnis-2026-10-31.json](ergebnis-2026-10-31.json).
>
> Verfahren: Der Workflow `deep-research` umfasste 5 Suchwinkel, 23 abgerufene Quellen und 114 extrahierte Aussagen. 25 davon wurden mit je drei gegnerischen Prüfern geprüft. Bestätigt wurden 18, widerlegt 7, ungeprüft blieb keine. Danach wurden die Aussagen zu 8 Befunden zusammengeführt.
>
> Die Einordnung für grilling und die Kandidaten in §3 sind meine eigene Bewertung. Clean-Room: übernommen werden nur Konzepte aus Veröffentlichungen, kein Fremdcode, kein Prompttext.

## 1. Befunde (geprüft)

| # | Befund | Quellen | Evidenz |
|---|---|---|---|
| B1 | **Fragen-oder-Handeln braucht eine ausdrückliche Regel.**<br>Ohne sie fragen Agenten bei unterspezifizierten Aufgaben fast nie nach und erfinden fehlende Pflichtangaben. Eine reine Prompt-Prüfung vor jedem Schritt („fehlt etwas, ist etwas falsch, liegt es außerhalb meiner Möglichkeiten?“) hebt die Quote passender Rückfragen stark, etwa bei gpt-4o von 0,52 auf 0,90. | [Ambig-SWE](https://arxiv.org/abs/2502.13069), [Learning to Ask](https://aclanthology.org/2025.emnlp-main.1104) | hoch, 3:0 |
| B2 | **Fehlkalibrierung in beide Richtungen.**<br>Je nach Modell und Formulierung fragen Agenten zu viel oder zu wenig. Ermutigung kann schaden: Bei Deepseek-v2 stieg die FNR von 0,31 auf 0,94. Nötig sind Kriterien, nicht der Appell, mehr zu fragen. | Ambig-SWE, [Ask-before-Plan](https://arxiv.org/abs/2406.12639) | hoch, 3:0 |
| B3 | **Abweichung zwischen mehreren Deutungen als Fragesignal.**<br>Stimmen mehrere unabhängige Deutungen überein, wird gehandelt; weichen sie ab, wird gefragt. Belegt ist das nur für Code mit Ausführung, bei etwa 25-fachen Kosten. Semantisch ohne Code ist es nicht getestet. | [ClarifyGPT](https://arxiv.org/abs/2310.10996) | mittel, eine Quelle |
| B4 | **Erkennen und Fragen-Wählen sind getrennte Fehlerquellen.**<br>CoT oder Few-Shot verbessern die Erkennung nur wenig und uneinheitlich. | [CLAMBER](https://arxiv.org/abs/2405.12063) | mittel, eine Quelle, Modelle von 2023 |
| B5 | **Fragenwahl nach Informationsgewinn ist der stärkste Befund.**<br>Das Verfahren in drei Schritten:<ol><li>eine ausdrückliche Menge von Hypothesen führen,</li><li>mehrere Kandidatenfragen erzeugen,</li><li>die Frage wählen, deren mögliche Antworten die Hypothesen am gleichmäßigsten teilen.</li></ol>Drei Verfahren ohne Training schlagen damit direktes Prompting deutlich, oft mit weniger Fragen. | [BED-LLM](https://arxiv.org/abs/2508.21184), [Active Task Disambiguation](https://arxiv.org/abs/2502.04485), [UoT](https://arxiv.org/abs/2402.03271) | hoch, 3:0 |
| B6 | **Tree of Thoughts allein reicht nicht.**<br>ToT und Selbstauswahl bleiben deutlich hinter der expliziten Bewertung zurück und kosten mehr. Entscheidend ist das Bewertungssignal („teilt die Frage die Kandidaten?“), nicht die Baumsuche. Eine Prompt-Variante mit Halbierungshinweis kommt in 2 von 3 Domänen bis auf 2–6 Prozentpunkte heran. | BED-LLM, ATD, UoT | hoch, 3:0 |
| B7 | **Hypothesen gegen alle bisherigen Antworten prüfen.**<br>Ohne diese Prüfung entstehen widersprüchliche Hypothesen und vorzeitige Festlegungen. Ohne Filterung fiel GPT-4o in einem Benchmark von 93 % auf 25 %. | BED-LLM | mittel, eine Quelle |
| B8 | **Formulierung nach GATE:**<ul><li>je Runde die informativste nächste Frage zu einem neuen Aspekt,</li><li>nur eine Sache je Frage,</li><li>kein unerklärter Jargon.</li></ul>Für die einzelnen Regeln gibt es keinen Wirksamkeitsnachweis; Bündeln wurde nicht getestet. | [GATE](https://arxiv.org/abs/2310.11589) | niedrig |

**Widerlegt und nicht verwendet:**
- INTENT-SIM, das Clustern simulierter Antworten (1:2 bzw. 0:3);
- „nur bei Mehrdeutigkeit fragen schlägt immer fragen“ (0:3);
- „erst die Umgebung erkunden, dann nur Unauffindbares fragen“ (0:3);
- Umgebungsbeobachtungen verbessern die Fragenentscheidung (0:3);
- die UoT-Belohnungsablation (0:3).

Daraus folgt: Die Regel von grilling „Fakten selbst recherchieren, nur Unauffindbares fragen“ (Schritt 1) ist **plausibel, aber durch diese Recherche nicht belegt**. Sie bleibt, weil sie aus den Projektregeln kommt und nicht aus der Literatur.

**Nicht gedeckt:** Zu klassischen Erhebungstechniken (Laddering, Five Whys, Jobs-to-be-done, Kontextinterview) hat die Prüfung keine einzige Aussage bestätigt. Sie fließen nicht ein.

## 2. Abgleich mit grilling (B1-Stand)

| Befund | grilling heute | Lücke |
|---|---|---|
| B1/B2 Fragen-oder-Handeln mit Kriterien | Schritt 1 trennt Fakten (selbst recherchieren) von Präferenzen (fragen). Schritt 3 verlangt je Frage „Folgen unterschiedlicher Antworten“. | Gering. grilling *ist* der Frageschritt; das Kriterium existiert, wird aber nur notiert und nicht als Filter genutzt. |
| B5/B6 Wahl nach Aufteilung | Schritt 4 wählt fragbare Fragen und priorisiert Blockierendes; unabhängige Fragen werden gebündelt. | **Groß.** Es gibt keine Regel, welche Frage zuerst kommt und welche entfällt, weil jede plausible Antwort dieselbe Entscheidung ergibt. |
| B7 Annahmen gegen Antworten prüfen | Schritt 7 markiert Folgefragen nach Korrekturen als prüfpflichtig. | Mittel. Ausdrücklich markierte Annahmen werden nach neuen Antworten nicht systematisch gegengeprüft. |
| B8 eine Sache je Frage | Schritt 5 verlangt unterscheidbare Optionen. | Gering. |
| Kosten (Dev-Befund) | 11–16 Turns je Lauf, 0,18–0,30 USD ([dev-ergebnis](../dev-ergebnis.md)) | B5/B6 versprechen *weniger* Fragen bei gleichem Ergebnis; das passt zum Kostenbefund. |

## 3. Kandidaten für E3 (eigene Bewertung)

Alle Kandidaten durchlaufen das E3-Verfahren mit **B1-Vorlauf** (SLV0-EVAL-25, PR #23).

| Kandidat | Mechanismus | Herkunft | Trennende Familie muss zeigen |
|---|---|---|---|
| **K-AUFTEILUNG** (neu) | In Schritt 4 nennt grilling je fragbarer Frage kurz die plausiblen Antworten und ob sie zu unterschiedlichen Entscheidungen führen. Eine Frage, bei der jede plausible Antwort dieselbe Entscheidung ergibt, wird nicht gestellt, sondern als markierte Annahme festgehalten. Zuerst kommt die Frage, deren Antworten die verbleibenden Optionen und abhängigen Fragen am stärksten aufteilen. Nach jeder Antwort werden widerlegte Annahmen und Optionen gestrichen. | B5, B6, B7; die Reihenfolge ist eine Prompt-Näherung (B6: Halbierungshinweis) | (a) Eine Frage ohne Entscheidungsfolge wird nicht gestellt (B1 stellt sie). (b) Die Weichenfrage, die abhängige Fragen erledigt, kommt vor ihnen. (c) Gegenkriterium: Keine entscheidungsrelevante Frage entfällt. |
| **K-LADESTUFEN** (P7) | Weiche zwischen Neuanlage und Fortsetzung; die Fortsetzung liest nur Index, betroffene Fragen und eine kompakte Zustandstabelle. | prompt-engineering-skill | weniger Turns und USD bei unveränderten trennenden Prüfungen |
| **K-RUECKWAERTS** (P8) | Rückwärtsabgleich vor der Zusammenfassung: Welche Entscheidungen setzt die Zusammenfassung voraus, die nie gestellt wurden? | prompt-architect; passt zu B7 | Eine nie gestellte Entscheidung wird `open`; eine Empfehlungsfrage bleibt nicht `answered`. |

**Nicht als Kandidat übernommen:**
- **Explizite ToT- oder MCTS-Baumsuche über Interviewfragen.** B6 zeigt mehr Kosten bei weniger Wirkung als das reine Bewertungssignal. Eine Baumsuche über Interviewfragen hat keine Quelle getestet.
- **ClarifyGPT-artiges Sampling vieler Deutungen.** Es kostet etwa das 25-Fache, ist ohne Code ungetestet und widerspricht dem Kostenbefund.
- **Eine Ermutigung zu mehr Rückfragen.** Laut B2 ist ihre Wirkung modellabhängig und teils schädlich.

**Grenzen für die Übertragung:**
- Alle Belege für B5–B7 stammen aus 20-Questions-, Code- oder Diagnoseaufgaben mit simulierten Antwortenden.
- Die Verfahren nutzen Logits oder viele Samples. Ein Prompt-Skill kann sie nur annähern, und gerade die Selbsteinschätzung schneidet in den Belegen schwächer ab.
- Ob K-AUFTEILUNG in Anforderungsinterviews wirkt, zeigt deshalb erst die Messung. Die Literatur begründet nur die Hypothese.

## 4. Offene Fragen aus der Recherche

1. Ist die EIG-Näherung ohne Logits in echten Anforderungsinterviews messbar besser als die Selbstauswahl? K-AUFTEILUNG prüft das.
2. Wie bündelt und ordnet man abhängige Fragen? Dazu gibt es keine bestätigte Evidenz.
3. Gibt es belastbare Belege für klassische Erhebungstechniken? Diese Recherche hat keine gefunden.
4. Wie lässt sich die Fragenschwelle bei aktuellen Modellen kalibrieren?
