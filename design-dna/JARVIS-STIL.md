# JARVIS-STIL — ASA Univers' app-æstetik (godkendt af Jonas 28. sep 2026)

> **Hvad er det?** Reglerne for hvordan ASA Univers' apps (hovedapp, kunde-app, marketing, AI-Installatør) skal se ud
> og føles: som Tony Starks assistent — cinematisk, præcis, rolig og levende. Ikke et gammelt Windows-system.
>
> **Rækkefølge ved konflikt:** (1) Jonas' egne regler fra asa-el.dk (`DESIGN-REGLER-JONAS.md`) → (2) denne fil →
> (3) `design-dna/DESIGN-DNA.md` (tokens og komponenter). Denne fil *bygger ovenpå* asa-el.dk-familien — den erstatter den ikke.
>
> **Elektriker-billedet:** asa-el.dk er tavlen — pæn, lys og ordentlig. Jarvis er displayet på tavlen: det samme
> skab, men nu med levende målere, lys der pulserer når der er strøm, og ingen løse ledninger.

---

## 1. Kernefilosofi

1. **Cinematisk** — skærmen skal føles som en scene i en film: tydelig hovedperson (det vigtigste tal/den vigtigste
   handling), rolig baggrund, bevægelse der betyder noget.
2. **Præcision** — hver pixel har et formål. Linjer er 1 px, afstande følger skalaen, tal står under hinanden.
3. **2027, ikke 2015** — ingen tabeller med grå rammer, ingen browser-standardknapper, ingen spinnere.
4. **Elegant enkelthed** — mindre er mere. Kan noget skjules bag "Avanceret" uden at Jonas savner det, så gør det.
5. **Levende, ikke støjende** — alt der arbejder, viser det (puls, glød, scanning). Alt der hviler, er stille.
6. **Feedback på alt** — hover, klik, indlæsning, fejl. Brugeren er aldrig i tvivl om noget skete.
7. **Mørke er et krydderi** — HUD-flader (mørk navy) bruges som *accent* til det levende: status-kort, boblens
   svar, universkortet. Resten er lyst (asa-el.dk-reglen: lyst tema, navy som accent — beslutning B).

## 2. Farver — samme palette, Jarvis-brug

| Token | Hex | Jarvis-brug |
|---|---|---|
| Navy dyb | `#082843` | HUD-flader (status-kort, boblens svar-kort, universkort-lærred), mørke sektioner som accent |
| Navy | `#0E3A5D` | primær tekst på lyst, overskrifter, primærknapper |
| Blå | `#2F80C9` | alt interaktivt: links, fokus-glød, aktive tilstande, "neon"-accent på mørkt |
| Lyseblå | `#82B3DF` | sekundære accenter, grafer, tekst-accent på mørkt |
| Lys | `#D5E6F4` | 1 px-linjer, subtile kanter, skeleton-flader |
| Knækket hvid | `#F2F4F7` | sidebaggrund (med subtil lys gradient — aldrig flad hvid), kort på lyst |
| Grøn / gul / rød | `#1D9E75` · `#D98E04` · `#C23B3B` | kun status (sundheds-prikker, badges) — aldrig pynt |

- **Glød ("neon") = blå `#2F80C9` med lav opacitet**, fx `0 0 0 1px rgba(47,128,201,.35), 0 0 24px rgba(47,128,201,.18)`.
  Kun på ting der er aktive/arbejder eller har fokus.
- **Skygger:** `0 4px 24px rgba(14,58,93,.06)` på kort. Aldrig sorte/tunge skygger, aldrig skygge på knapper.
- **Gradients:** lyst: `#F2F4F7 → #F7F9FB` (næsten usynlig). Mørkt (HUD): `#082843 → #0E3A5D` diagonalt.
  Aldrig lilla/violet, aldrig regnbue.

## 3. Typografi

| Rolle | Font | Detaljer |
|---|---|---|
| Overskrifter | Manrope 700 | letter-spacing −0.02em, store og selvsikre (H1 32–40 px på mobil, 48–56 px desktop) |
| Brødtekst | Manrope 500 | line-height 1.6, 15–16 px (16 px i felter = ingen iOS-zoom) |
| Tal/målinger | Manrope + `font-variant-numeric: tabular-nums` | tal står under hinanden og "hopper" ikke når de tæller |
| Meta/tidsstempler | Manrope 500, 12–13 px, varm grå `#78716C` | mikro-tekst |
| Display-citater | Manrope 300 | stor (28–40 px), letter-spacing −0.03em — aldrig serif (beslutning A) |

## 4. Bevægelse (micro-interaktioner)

| Hvad | Regel |
|---|---|
| Hover | 100 ms ease-out — farve/ring/skygge/brightness. **Aldrig `scale(1.05)`** (asa-el.dk-reglen) |
| Klik | 80 ms `scale(.98)` + tilbage (føles som et fysisk tryk). `navigator.vibrate(8)` på mobil hvor tilladt |
| Sideskift | 200 ms fade (+ 4 px glid op) |
| Standard-overgang | 250 ms `cubic-bezier(.2,.7,.3,1)` |
| Beskeder/kort ind | fade + 6 px glid, stagger 30 ms i lister |
| Toasts | glider ned fra toppen, forsvinder selv efter 4 s |
| Modaler / bottom sheets | fade + scale fra .98 (modal) · glid op m. fjeder (sheet) |
| Menuer | kaskade: punkterne kommer 20 ms efter hinanden |
| Indlæsning | **skeletons** (lyse flader der "ånder") — aldrig spinnere. Venter vi på en agent: vis *hvad* den laver ("Læser universkort.js …") |
| Tal der ændres | tæller op/ned over 400 ms (kun ægte tal) |
| `prefers-reduced-motion` | alt ovenstående slås fra — kun farveskift |

Aldrig ryk, aldrig hop, aldrig layout der skubber sig selv. Aldrig scroll-jacking.

## 5. Komponenter

### 5.1 Boblen (vigtigst — mest brugt)
- **Kort:** glassmorphism på lyst — `background: rgba(255,255,255,.72); backdrop-filter: blur(20px) saturate(1.4);`
  1 px kant `rgba(14,58,93,.08)`, radius 20 px, skygge som §2. Bagved: subtil navy-gradient i hjørnet.
- **Jonas' beskeder:** højre, blå gradient `#2F80C9 → #0E3A5D`, hvid tekst, radius 18/18/4/18.
- **Boblens svar:** venstre, mørkt navy HUD-kort (`#082843`), lys tekst `#F2F4F7`, radius 18/18/18/4 (et af de tre mørke steder — beslutning B).
- **Model-badge** diskret nederst til højre i svaret (fx "Sonnet 5") i 11 px lyseblå.
- **Skriver…:** 3 prikker der pulserer (opacitet 0.3→1, 1,2 s, forskudt 150 ms).
- **Fremdrift fra agenter:** tynd "scanning"-linje (blå glød der glider venstre→højre) + teksten for hvad der sker.
  Aldrig en spinner.
- **Kø:** vises kun hvis noget faktisk venter — "2 foran dig" som lille pille, ikke en tabel.
- **Kode:** syntax-highlight (mørk HUD-baggrund, monospace 13 px), kopier-knap i hjørnet.
- **Links:** blå, understreg ved hover. **Kopier-knap** på hver besked (vises ved hover/tryk). **Tidsstempler** som mikro-tekst.
- **Input:** 64 px høj, radius 16 px, blå fokus-glød, vokser glidende til flere linjer (max 40 % af skærmen),
  mikrofon og vedhæft som line-ikoner, model-vælger, Send med lyseblå gradient (`#82B3DF → #2F80C9`), 48 px.
- **Sidebar** (samtaler) glider sammen/ud 250 ms.

### 5.2 Kommandocentral (Tony Starks HUD)
- Øverst 3–4 store status-kort på mørk HUD-flade: motor, kvote, aktive agenter, fejl i dag — store tal (tabular-nums)
  der tæller, sundheds-prik (grøn/gul/rød) der pulserer langsomt når noget kører.
- Derunder lyst indhold med meget luft og tydeligt hierarki. Ingen tabeller med rammer — lister med 1 px-skillelinjer.

### 5.3 Universkort
- Node-lærred (mørk HUD) som Figma: zoom/pan glidende (knibe + scroll), noder som afrundede kort.
- Forbindelser som linjer der **pulserer** når der løber arbejde igennem dem.
- Aktive medarbejdere gløder blåt. Pauserede: næsten usynlige (grå, 30 % opacitet). Inaktive vises ALDRIG
  (eksisterende regel) — "Vis alle" er en toggle.
- Hover/tryk på node → lille kort med detaljer.

### 5.4 Tomme tilstande, fejl, indlæsning
- **Tom:** ét line-ikon, én venlig sætning, én handling ("Ingen kunder endnu — opret den første").
- **Fejl:** beroligende og konkret ("Vi kunne ikke hente kunderne lige nu. Vi prøver igen om 10 sekunder.") — aldrig
  tekniske fejlkoder i UI (de logges).
- **Indlæsning:** skeletons i samme form som indholdet.

### 5.5 Ikoner
- Line-ikoner (1,5 px streg, runde ender, 20/24 px) — samme sæt overalt (lucide-stil som inline SVG). Aldrig fyldte
  ikoner, aldrig emoji i hovedindhold.

## 6. Mobil (iPhone først)
- Touch-mål **48 px+**. Safe areas (`env(safe-area-inset-*)`) respekteret top og bund.
- Bottom sheets i stedet for modaler. Swipe-gestus der føles naturlige (fjeder, ikke lineært).
- Aldrig zoom-forvirring (16 px i felter, `viewport` uden `maximum-scale`-hacks), aldrig låst scroll.
- Test altid i 390×844 før noget er færdigt.

## 7. Relevans (fjern det der ikke bruges)
Før en side bygges om: for hver widget — *bruger Jonas den? kan den forenkles? kan den bag "Avanceret"?*
Fjern ubrugte statistikker, døde links, debug-info, test-værktøjer i produktion og ubrugte notifikationer.
Ved tvivl om noget skal væk: spørg Jonas.

## 8. DON'TS (én af disse = byg om)
- Gammelt Windows-look: grå rammer om alt, browser-standardknapper/-selects, tabeller med gitter, spinnere.
- `scale(1.05)`-hover, lilla gradients, tunge skygger, skygge på knapper.
- Flad hvid side uden dybde. Navy som dominerende flade over *hele* sider (HUD-flader er accenter).
- Serif-fonte (inkl. Fraunces — beslutning A), Inter/Roboto/Arial/system-ui som primær.
- Opdigtede tal (LOV 10) — brug `[PLACEHOLDER: Jonas udfylder]`.

## 9. Tjek før "færdig"
1. Screenshot 390×844 + 1440×900. 2. Side om side med asa-el.dk: samme kvalitet? 3. "Ville Tony Stark bruge det?"
og "Ville Tesla/Apple lave det sådan?" — nej → byg om. 4. `prefers-reduced-motion` slået til: stadig brugbart?

---

## BESLUTNINGER (Jonas, 28. sep 2026)

**A. Ingen serif — heller ikke til citater.** Display-stemmen er Manrope 300 i stor størrelse med −0.03em.
Fraunces og al anden serif er forbudt (samme regel som asa-el.dk).

**B. Mørkt KUN tre steder:** boblens svar-kort, kommandocentralens status-kort og universkort-lærredet.
Alt andet er lyst (med subtil dybde — aldrig flad hvid). Mørke flader andre steder = byg om.
