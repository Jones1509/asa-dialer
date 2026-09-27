> **KILDE — ordret kopi fra asa-el.dk-repoet (Jones1509/asa-hjemmeside, 2026-09-27).** Kun DESIGN-reglerne gælder i ASA Univers.
> Hjemmeside-specifikke dele gælder IKKE her: MapLibre-kortet, Elio/FloatingAiAssistant, React-bibliotekerne (framer-motion,
> gsap, lenis, three), auto-push/rollback-hooks, .env-reglerne, fredet-filer, sider/forsiden, context-procenter. Følg repoets egen CLAUDE.md
> for arbejdsgang (branch + PR — aldrig direkte push). Aktuel app-stil: `../JARVIS-STIL.md`.

---

# DESIGN-REGLER — ASA HJEMMESIDE (Jonas' krav)

> **Læs FØR du bygger noget.** Opdateres hver gang Jonas siger noget vi skal huske.
> Denne fil er ufravigelig for ALLE agenter (research, arkitekt, designer, billed,
> animation, udvikler, copywriter, kritiker). Den supplerer MASTER-DESIGN-PROTOKOL.md.

---

## 🎨 LYST TEMA — KRITISK REGEL
ASA er et **LYST tema**. ALDRIG mørkt domineret.
- INGEN flade mørkeblå/navy baggrunde der dækker hele sektioner.
- INGEN flad hvid baggrund heller — det er kedeligt.
- Brug i stedet:
  - Lys grå (`#F2F4F7`, `#F5F6F8` eller lignende)
  - Subtile gradienter (lys grå → lidt lysere grå)
  - Visuelle elementer der ERSTATTER baggrundsfarven (billeder, kort, grafik der fylder pladsen)
- **Navy bruges KUN som accent** (knapper, fremhævninger, header når scrolled) — ALDRIG som dominerende baggrund.
- Mørke sektioner må gerne være der MEN sparsomt og med omtanke (fx hero med foto-overlay, footer som kontrast).
- **Princip:** Hvis du tænker "skal jeg bare smide en baggrundsfarve på?" → TÆNK IGEN. Find på noget kreativt. Baggrundsfarve = sidste udvej.

## 🗺️ KORT — ALDRIG "BAKTERIE"
- Kort skal være **GEOGRAFISK KORREKT** — folk skal kunne genkende Sjælland/Danmark.
- Brug rigtige kort-værktøjer: **MapLibre** (gratis, ingen konto) eller Mapbox (kræver konto).
- ALDRIG abstrakt SVG der "ligner et kort" — det bliver til en bakterie.
- **Tesla "Find Your Charge"-stil PRIKKER** (IKKE pinpoints/nåle): rene prikker på et lyst kort. Kortet skal være STORT nok til at kunderne ser det tydeligt.
- **To prik-typer:** GRØN (#1D9E75) lidt STØRRE prik = en KOMMUNE (turf.centroid). BLÅ (#2F80C9) lidt MINDRE prik = en BY. Hover/tap → popup "Vi dækker [X] Kommune" / "Vi dækker [Y] By".
- **Kortet = HEADER-BREDDE (.container-asa), IKKE bleed.** Flugter logo→profil-ikon. Høj kort, fitBounds på zonen. Border-radius alle 4 hjørner. *(Zone-fyld: Jonas accepterede nuværende udseende 2026-05-31 — ikke et fail-punkt.)*
- **Zone-grænse = NATIVE MapLibre line+fill-layer** (bundet til kortet, følger zoom korrekt) — IKKE SVG-overlay (det crasher ved zoom). ÉN sammenhængende streg (turf.union).
- **Interaktivt:** +/- knapper + pinch (mobil) + cooperativeGestures (ingen scroll-kapring). INGEN "ctrl+scroll"-hint (forvirrende). INGEN engelsk "Denmark"-label på kortet.
- **Ærlighed:** skriv "Indtil videre dækker vi disse områder" (zonen er ikke permanent).
- Knapper i kort-sektionen: FIRKANTEDE (radius 0-4px), mindre — Tesla-stil.
- **Popup = Tesla-elegant:** afrundet (~12px), hvid m. blur + blød skygge, INGEN firkantet border, INGEN/diskret pil. Tekst = "Vi dækker [X] Kommune".
- **Border-radius KONSISTENT på alle 4 hjørner** af kort-rammen (ikke skarpe kanter i højre side).
- **Kort-sektion-layout = Tesla "Find Your Charge" (eksakt skabelon):** stort interaktivt kort øverst → derunder en række: titel + undertekst (venstre), en LEGEND med tal+prik-ikon der BÅDE forklarer prikkerne OG er stat-band ("[blå prik] 31 Kommuner dækket" + "[rød prik] X Byer dækket"), + CTA-knapper. Generøs luft mellem kort og række.
- **Kort-kontroller:** zoom-knapper (+/−), "ctrl+scroll for at zoome"-hint (cooperative gestures), evt. "Find mig"-knap — Tesla-stil.
- **Dækningszone:** Storkøbenhavn + Nordsjælland, NED TIL Køge, VEST TIL Roskilde, Frederikssund som vestligste grænse. UDELAD: Halsnæs/Hundested-halvøen (nordvest) + Saltholm-øen (øst for København). (Præcis kommune-liste verificeres af research.)

## 🔤 TYPOGRAFI — INGEN SERIF
- ALDRIG serif-fonte (Fraunces, Times, Georgia osv.) — Jonas synes det ligner Times New Roman og hader det.
- ALDRIG Inter/Roboto/Arial — for generisk.
- Brug **Manrope** (eller lignende der ligner Apple SF Pro / Tesla Gotham).
- Moderne, ren sans-serif med karakter.

## 📉 MINIMALISME — KOMPAKTE SEKTIONER (vigtig)
- Sektioner skal være **KOMPAKTE** — overblik > fylde. Ingen sektion må "eksplodere i ansigtet"/føles overvældende.
- Apple/Tesla-minimalisme: hellere lavere/tættere sektioner med klare facts der giver hurtigt overblik, end store fyld-sektioner. Forsiden må ikke føles uendelig lang.
- **HERO = FULL-WIDTH (.fullwidth-asa), ~80vh** (Tesla-stil): begge kanter til skærmkant, centreret indhold (eyebrow + H1 + undertekst + 2 firkantede knapper), carousel-dots + chevrons. Header LIGGER OVENPÅ hero (transparent over hero-billede → hvid ved scroll forbi hero). IKKE 100vh (ikke overvældende), ikke container-smal.
- Tommelfingerregel: kan man ikke overskue en sektion uden at føle sig overvældet, er den for stor → skær højde/bredde.
- Brug `min-height` + `clamp()` — ALDRIG fast `height` og ALDRIG `min-h-[88vh]`+ på indholds-sektioner. Lad helst kort/grid-indhold bestemme højden med moderat `min` + clamp'et padding.
- **"Glimt-reglen"** (målbar for kritiker): i bunden af hver sektion skal toppen af NÆSTE sektion lige akkurat anes ved normal scroll — det beviser sektionen ikke er for høj.

## 📐 HØJDE / 100VH
- Footer (inkl. copyright-bar) = **præcis 100vh på ALLE skærme** (height = innerHeight - headerH - bottombarH). Løsning B (Jonas-godkendt 2026-06-03): &lt;lg skjuler counter/intro-tekst/social (hidden lg:block) så indholdet passer — accordion-kolonner + CTA + cert-badges forbliver synlige på alle bredder.
- Indholds-sektioner: **≤100vh, men sigt KOMPAKT** (ofte 55-80vh) — ikke maks-fyld.
- Brug `min-height: 100svh` (IKKE fast `height`) + `clamp()` på spacing — så indhold aldrig klippes på korte skærme.
- ALDRIG `overflow:hidden` på indholds-containere (kun på dekorative lag).
- Footer over fixed BottomBar: `min-height: calc(100dvh - var(--bottombar-height))` + copyright-padding der altid rydder baren.

## 🎬 ANIMATIONER
- Premium scroll-wow (parallax, blur-to-sharp, counter-up på ÆGTE tal).
- ALDRIG scroll-jacking.
- ALDRIG `scale(1.05)`-hover-cliché — brug ring/shadow/brightness i stedet.
- Respektér `prefers-reduced-motion`.
- Smooth scroll via **lenis**. Animations-stack: framer-motion + gsap/ScrollTrigger + lenis.

## 🚫 LOV 10 — INGEN OPDIGTNING
- ALDRIG opdigt tal, projekter, cases, citater, telefonnumre, CVR, e-mails, årstal.
- Brug `[PLACEHOLDER: Jonas udfylder]` hvor info mangler.
- Aldrig "120+ projekter", "12.000+ opgaver", "25 års erfaring" eller lignende uden Jonas' bekræftelse.

## 💎 DESIGN-NIVEAU
- Apple/Tesla-niveau — premium, men ikke maximalistisk.
- Generøs whitespace.
- Hver sektion skal have visuel dybde (billede/grafik/komponent).
- ALDRIG bare en flad farve som baggrund — find kreativ løsning.

## 🤖 ELIO CHAT — FREDET
- `FloatingAiAssistant.tsx`, `aiChat.open()`, `SplineScene` MÅ IKKE røres funktionelt.
- Kun UI/visuelle rammer omkring må forskønnes.
- Hvis tvivl → spørg Jonas FØR ændring.

## 📱 BOTTOMBAR (Elio)
- **ALTID synlig** fra side-load: `position:fixed; bottom:0`. INGEN scroll-trigger/reveal. (Opdateret 2026-05-31: Jonas vil have den synlig hele tiden.)
- Funktionalitet urørt (Elio fredet). Korrekt z-index så den ikke skjules af content.

## 🚫 ANNOUNCEMENT-BAR — FJERNET
- Den blå top-bjælke ("Til virksomheder...") er SLETTET permanent (Jonas 2026-05-31). Header sidder top:0. Byg den ikke igen.

## 🖼️ LOGO
- ALDRIG invert-filter på logoet (giver forvrængning).
- Brug separate logo-filer hvis hvid/navy nødvendig.
- Hvid version over mørk header, navy version på lys header.

## 🔄 KRITIKER-REGEL
- "Opfylder de tekniske krav" er IKKE nok.
- Spørg: **"Ville Tesla/Apple lave det her sådan?"**
- Hvis svaret er nej → FAIL, uanset om alle tekniske bokse er afkrydsede.
- "Bakterie-form", "kedelig flad farve", "klemt", "ulæseligt" = automatisk FAIL.

## 📏 SEKTION-BREDDE — KRITISK REGEL (Tesla-mønster)
ASA bruger **PRÆCIS 3 bredder** — intet andet. Alt (undtagen full-width) flugter med headerens logo i venstre side:
- **FULL-WIDTH (`.fullwidth-asa`):** hele viewporten, begge kanter til skærmkanten, ingen padding. KUN til hero-style/dramatiske fuldskærms-sektioner.
- **Variant A "Container" (`.container-asa`):** nøjagtigt samme bredde som header-indholdet (logo til menu), centreret. Tekst-sektioner, grids, kontrollerede kort.
- **Variant B "Bleed højre" (`.bleed-right-asa`):** fra logo-linjen (venstre, samme som A) → HELT ud til scrollbaren (højre). Store kort/visuals.
- **ALDRIG en FJERDE bredde.** En smal container der hverken er full-width, matcher headeren eller bleeder = "AI-genereret look" = FAIL.
- **Header må IKKE være sammenpresset.** Tesla bruger en BRED header (reelt fuld bredde m. lille gutter). Vores `--asa-max` skal være bred (≥1600px eller fuld bredde) + lille gutter — ALDRIG en smal midter-container.
- **Header definerer reference-bredden** — alle A/B-sektioner flugter med dens venstre logo-kant (A også dens højre kant).
- Mål pixel-perfekt: hver sektions venstre-kant = headerens logo-venstre-kant.

## ⚡ §PERFORMANCE — MODEL-ROUTING + PARALLEL + CACHING

### Model-routing (fast tabel — ufravigelig)
Hver agent kører på den model der bedst matcher dens opgave. Aldrig Opus 4.8 på agenter — Opus 4.7 er det tungeste vi bruger (4.8 reserveret til Lead Agent / Jonas selv).

| Agent | Model | Hvorfor |
|---|---|---|
| `research-agent` | `claude-haiku-4-5` | Mønster-udvinding fra browser — hurtig, billig, præcis. |
| `arkitekt` | `claude-opus-4-7` | Strukturel planlægning — tung tænkning. |
| `designer` | `claude-sonnet-4-6` | Visuel implementering — balance mellem hastighed og kvalitet. |
| `billed-specialist` | `claude-haiku-4-5` | Billed-valg og placering — mekanisk arbejde. |
| `animations-specialist` | `claude-sonnet-4-6` | Motion-kode — kræver smag + præcision. |
| `udvikler` | `claude-sonnet-4-6` | TSX/React-implementering — solid kodning. |
| `copywriter` | `claude-haiku-4-5` | Korte danske salgstekster — hurtig vendetid. |
| `kritiker` | `claude-opus-4-7` | Dommer — kræver det skarpeste hoved. |

### Parallel-regler
Parallelt **når agenter rører forskellige filer**:
- `research` + `arkitekt`
- `copywriter` + `animations-specialist`
- `designer` + `udvikler` (forskellige filer)

Sekventielt ved samme fil eller hård afhængighed. **Kritiker er ALTID sidst.**

### Caching-strategi (prompt-cache)
- Statiske regler ØVERST i prompts: `DESIGN-REGLER-JONAS.md`, `CLAUDE.md`, `MASTER-DESIGN-PROTOKOL.md`, agent-definitioner.
- Dynamiske beskeder (Jonas' nye besked, agent-output) NEDERST.
- ALDRIG læs hele filer hvis kun én sektion behøves — brug `Grep` / `Read` med `offset`/`limit`.

### Context-grænser (hård gate)
Se **[CLAUDE.md § AUTO-STATUS-PROTOKOL](./CLAUDE.md#-auto-status-protokol-absolut-regel)** for den fulde protokol og DONE.md-skabelonen. Kort resumé — CLAUDE.md er facit:
- **60 %** → tidlig advarsel + kort opsummering-status til DONE.md, fortsæt arbejde.
- **70 %** → HARD STOP for byggende arbejde + KOMPLET detaljeret status til DONE.md (opgave · status · blokker · git-tilstand · filer · verifikation).
- **85 %** → nødbremse: kort nød-status + kør `/clear`.
- **95 %** → må aldrig nås (betyder 60/70/85-tjek fejlede — log som `AUTO-STATUS-FEJL`).

---

## 🚀 §AUTO-PUSH — INGEN MANUEL PUSH

Efter **HVER komplet opgave** Jonas har givet:

1. `bun run build` — verificer den bygger.
2. **Hvis build OK:**
   - `git add -A`
   - `git commit -m "<beskrivende besked om opgaven>"`
   - `git push origin <current-branch>`
   - Bekræft til Jonas: `✅ Pushet: <commit-hash>`
3. **Hvis build fejler:**
   - Rapportér fejl til Jonas (fil, linje, fejltekst).
   - **INGEN push.**
   - **INGEN auto-rollback** (rollback er Jonas' beslutning via `/rollback <hash>`).
   - Vent på Jonas.

Regler:
- Jonas skal ALDRIG bede om push manuelt — hooken sørger for det automatisk når Claude afslutter sin tur (Stop-hook).
- Push efter HVER komplet opgave, ikke per fil eller per tool-kald.
- Push direkte til nuværende branch (hvad end den hedder — typisk `claude/kor-derudaf-sider`).
- Ingen sikkerhedslås. Build grøn = push.

---

## ⏪ §ROLLBACK — UNDER 5 SEKUNDER

`/rollback <hash>` og `/forward <hash>` er **kun git**. Ingen build, ingen typecheck, ingen dev-restart.

- Kommandoen er færdig på **<5 sekunder**.
- ALTID `git tag waypoint-<dato-tid>` FØR `git reset --hard` — så enhver rollback altid kan fortrydes.
- Git reflog gemmer alt i **90 dage** som default — tabt arbejde kan altid genfindes via `git reflog --date=relative`.
- Build/typecheck er Jonas' eget skøn EFTER rollback. Hooks rører ikke arbejdet.
- Auto-push-hooken springer over en clean rollback (intet at committe efter `--hard`).

---

## 🔒 §FREDET-FILER

Disse filer må **aldrig** røres af agenter. PreToolUse-hook (`fredet-vagt.mjs`) blokerer Write/Edit automatisk:

- `src/components/FloatingAiAssistant.tsx` (Elio chat)
- `src/components/SplineScene.tsx`
- `src/lib/aiChatStore.ts`
- Alt der matcher `ModernPricingPage`
- `src/components/ui/animated-glassy-pricing.*`
- **Alle filer Jonas eksplicit siger "rør ikke"** — tilføj dem i `fredet-vagt.mjs`-listen straks.

Hvis en agent forsøger → hook returnerer exit 2 + stderr-besked. Agenten skal stoppe og spørge Jonas FØR ændring.

UI/visuelle rammer **omkring** Elio må gerne forskønnes — kun selve funktionaliteten er fredet.

---

## 🧠 §AGENT-FRIHED — INGEN KUNSTIGE GRÆNSER

- **INGEN tids-grænser** på agenter. De arbejder til de er færdige.
- **INGEN kunstige output-længder.** Korthed er ikke et mål — præcision er.
- Lad agenter arbejde **grundigt**.
- Hurtighed kommer fra at vælge **den rigtige model** (se §PERFORMANCE), ikke fra at presse output.
- **Kritiker** MÅ skrive en detaljeret, nummereret dom hvis nødvendigt — det er bedre at fail-listen er konkret end at den er kort.
- En agent der "skynder sig færdig" leverer dårligt arbejde. En agent der bruger 10 minutter ekstra og rammer 9+/10 er bedre end en der bruger 1 minut og rammer 7/10.

---

## 📝 OPDATERINGS-REGEL
Hver gang Jonas siger noget han ikke kan lide, eller noget vi har lært:
1. Tilføj det her i denne fil.
2. Henvis til den i CLAUDE.md og MASTER-DESIGN-PROTOKOL.md.
3. Alle agenter skal læse den ved opstart.

---

## 📒 LOG — hvad vi har lært (nyeste øverst)
- **2026-06-01:** PERMANENT SYSTEM-OPTIMERING — model-routing pr. agent (Haiku 4.5 / Sonnet 4.6 / Opus 4.7), auto-push efter hver opgave via Stop-hook, 5 slash-kommandoer (`/stop`, `/rollback`, `/forward`, `/deploy`, `/status`), 3 hooks (fredet-vagt, auto-push, context-advarsel). INGEN kunstige tids-/længde-grænser på agenter. Se §PERFORMANCE / §AUTO-PUSH / §ROLLBACK / §FREDET-FILER / §AGENT-FRIHED.
- **2026-05-31:** MINIMALISME — sektioner var for store/høje ("eksploderer i ansigtet"). Kompakt > fyld. Hero → container-bred + lav. Kort-pins ALLE samme størrelse + pinpoint-stil, navn kun på hover ("Vi dækker X Kommune"), border-radius begge sider. Zone: ned til Køge + Roskilde, Frederikssund vestligst, ingen Halsnæs/Saltholm.
- **2026-05-31:** 3 bredder (ikke 2): FULL-WIDTH tilføjet til hero. Header må IKKE være sammenpresset — bred header (≥1600/fuld) m. lille gutter som Tesla. Kort: pins på ALLE dækkede kommuner (5 primary + resten secondary), elegant afrundet popup (ingen pil/border, kun navn), kort-tekst UNDER kortet (Find Your Charge-stil), ikke overlay.
- **2026-05-31:** SEKTION-BREDDE er den vigtigste fejl — Tesla bruger 2 bredder (Container = header-bredde, Bleed = logo→scrollbar). En tredje smal bredde = AI-look. Alt skal flugte med headerens logo.
- **2026-05-31:** Kort-zone = ÉN sammenhængende streg rundt om HELE arbejdszonen (turf.union af kommunerne), IKKE en streg om hver enkelt kommune. Store visuals (kort/hero) skal bleed'e (full-width), ikke sidde i smal tekst+billede-split.
- **2026-05-31:** Lyst tema er KRITISK — navy kun som accent, aldrig dominerende baggrund. (Forsiden v2 havde for mange flade navy-sektioner.)
- **2026-05-31:** Kort må ALDRIG være abstrakt SVG ("bakterie") — skal være geografisk korrekt via MapLibre/Mapbox med læsbare by-navne på kortet.
- **2026-05-30:** Serif/Fraunces forbudt — ligner Times. Manrope i stedet.
- **2026-05-30:** Bund-klip på korte vinduer: skyldes fast `height:100vh` + `overflow:hidden`. Brug `min-height:100svh` + `clamp()`, fjern overflow:hidden fra indhold.
- **2026-05-30:** Logo-invert-filter forvrænger — brug separate logo-filer.
- **2026-05-30:** Elio-chat er fredet — kun UI omkring må forskønnes.

---

## 🚀 AUTO-PUSH — PERMANENT REGEL (Jonas 2026-06-02)

**Auto-push SKAL ALTID pushe ændringer til `main` så de går live på asa-el.dk.**

- Aldrig efterlad arbejde på feature-branches uden merge.
- Jonas skal ALDRIG manuelt bede om merge.
- `.claude/hooks/auto-push.mjs` håndterer hele flowet automatisk efter hver opgave:
  1. Build (bun run build) — fejler den, ingen push/merge
  2. Commit + push current branch (feature-branch beholdes som arbejds-isolation)
  3. Switch til main → pull → merge feature-branch (--no-ff) → push main
  4. Switch tilbage til feature-branch (Jonas' arbejds-state forstyrres ikke)
  5. Verificér at `local main == origin/main`, log commit-hash + GitHub-link + live-tid

**Why:** Netlify deployer KUN fra main. Hvis ændringer kun ligger på `claude/*`, ser Jonas dem aldrig på asa-el.dk — kun på localhost. Han bliver irriteret, og vi spilder tid på at merge manuelt hver gang.

**Edge cases auto-push håndterer:**
- Build fejler → STOP, ingen push/merge, log fejl
- Merge-konflikt → `git merge --abort`, switch tilbage til feature-branch, log fejl
- Push af main fejler (fx protected branch) → log fejl, switch tilbage
- Allerede på main → bare push direkte uden merge-trin

**Feature-branches slettes IKKE** — Jonas bruger dem til isolation. De får bare automatisk merget videre til main.
