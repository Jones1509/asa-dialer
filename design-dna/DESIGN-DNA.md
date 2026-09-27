# ASA DESIGN-DNA — det visuelle sprog fra asa-el.dk (gælder ALLE ASA Univers-repos)

> **Læs FØR du skriver én linje UI.** Dette er "træningen": de samme regler, tokens og eksempler som gør
> asa-el.dk smuk, oversat til ASA Univers' vanilla HTML/CSS. Kilde: `~/ASA/hjemmeside` (CLAUDE.md, DESIGN-REGLER-JONAS.md,
> MASTER-DESIGN-PROTOKOL.md, `src/styles.css`). Analyse: se nederst.
>
> Filerne i denne mappe er ens i alle repos: `DESIGN-DNA.md` (denne), **`JARVIS-STIL.md` (app-æstetikken — boble, HUD,
> bevægelse, tomme tilstande; godkendt af Jonas 28. sep)**, `asa-tokens.css` (tokens), `eksempler/` (5 konkrete
> komponenter) og `kilde/` (Jonas' originale regel-filer fra asa-el.dk, ordret).
> **Ved konflikt:** Jonas' regler (`kilde/DESIGN-REGLER-JONAS.md`) → `JARVIS-STIL.md` → denne fil. Repo-specifikke tokens (`public/styles/tokens.css`) SKAL have samme værdier som `asa-tokens.css`.

## 1. Filosofi (Jonas' smag — kort)

- **Tesla / Apple / Stripe / Linear-niveau.** Clean, professionel, moderne. Premium, ikke maximalistisk.
- **Lyst tema med dybde.** Sidebaggrund knækket hvid `#F2F4F7` med en subtil lys gradient — **aldrig flad hvid/grå**
  (Jonas: "kedeligt"); dybde kommer fra kort, grafik og lag. **Navy kun som accent** (knapper, fremhævning, hero).
  Mørke navy-flader KUN de tre levende steder i `JARVIS-STIL.md` (boblens svar, HUD-status-kort, universkort-lærred).
- **Generøs whitespace.** Rytmisk vertikal spacing (8 / 16 / 24 / 32 / 48 / 64). Kompakte sektioner — overblik > fylde.
- **Hvert element har et formål.** Ingen dekoration uden funktion. Hierarki skal være tydeligt på 3 sekunder.
- **Interaktive elementer er tydelige:** hover OG focus-state på alt klikbart, `cursor: pointer`, synlige focus-ringe.
- **Mobile-first:** design til 375–390 px først, skalér op. Aldrig horisontal scroll. Touch-mål ≥ 48 px på mobil.
- **Feedback på alt:** hover, klik (kort `scale(.98)`), indlæsning (skeletons — aldrig spinnere), fejl (beroligende og
  konkret), tomme tilstande (ikon + én sætning + én handling).
- **Kun det relevante:** ingen ubrugte widgets, døde links, debug-info eller test-værktøjer i produktion.
- **Menneskesprog i alt Jonas ser** (ingen fagord — se repoets CLAUDE.md).

## 2. Tokens (facit — ligger i `asa-tokens.css`)

| Hvad | Værdi |
|---|---|
| Font | **Manrope** overalt (300/400/500/600/700). Aldrig serif (Fraunces/Georgia/Times), aldrig Inter/Roboto/Arial/system-ui som primær. |
| Navy (primær) | `#0E3A5D` — knapper, overskrifter, hero |
| Navy dyb | `#082843` — hover, mørke flader |
| Blå (accent) | `#2F80C9` — links, sekundær accent, fokus-glød |
| Lyseblå | `#82B3DF` — tertiær accent, badges |
| Lys tone | `#D5E6F4` — bløde flader |
| Knækket hvid | `#F2F4F7` — sidebaggrund |
| Tekst | `#171717` brødtekst · varm grå `#57534E` sekundær · `#78716C` meta (aldrig kold slate) |
| Grøn / gul / rød | `#1D9E75` · `#D98E04` · `#C23B3B` (lyse flader + mørk tekst til badges, WCAG AA) |
| Knapper | radius **6 px**, højde **40 px** (44 på mobil), **13 px / 500 / letter-spacing .025em**, **ingen skygge** (Tesla). Primær: navy baggrund + hvid tekst. Sekundær: hvid + mørk tekst + hårfin kant. |
| Kort | radius **16 px**, hvid, **24 px padding**, skygge `0 6px 16px -6px rgba(14,58,93,.12), 0 0 0 1px rgba(14,58,93,.04)` |
| Felter | radius 6 px, 16 px tekst (ingen iOS-zoom), kant `#DDE3EA`, fokus = blå glød `0 0 0 4px rgba(47,128,201,.16)` |
| Layout | gutter **24 px** (16 på mobil), max-bredde **1600 px**, header **64 px** hvid m. hårfin kant, logo venstre, tekst-nav centreret (≥ 1280), ikoner højre |
| Typografi | overskrifter 600–700, letter-spacing −0.02em · brødtekst 400, −0.005em, line-height 1.5 · meta 500 i varm grå |
| Bevægelse | hover 100 ms ease-out · standard 250 ms `cubic-bezier(.2,.7,.3,1)` · sideskift 200 ms fade · fuld tabel i `JARVIS-STIL.md` §4; respektér `prefers-reduced-motion` |

## 3. DON'TS (én af disse = byg om)

- Ingen flad hvid/grå side uden dybde — og ingen mørk navy som dominerende flade (kun JARVIS' tre steder). Ingen lilla/violet gradients.
- Intet "gammelt Windows-look": grå rammer om alt, browser-standardknapper/-selects, tabeller med gitter, spinnere.
- Ingen tunge/sorte skygger, ingen skygge på knapper.
- Ingen `scale(1.05)`-hover, ingen overdrevne animationer, ingen scroll-jacking.
- Ingen komplekse borders, ingen dobbelt-rammer, ingen dekorative elementer uden formål.
- Ingen emoji som ikoner i hovedindhold (kun i menneskesprog-knapper hvor Jonas har bedt om det).
- Ingen "generic SaaS-landing" med 3 symmetriske kort-grids uden indhold.
- Ingen fjerde bredde: enten fuld bredde, container (max 1600 + gutter) eller bleed. Aldrig en tilfældig smal midterkolonne.
- Ingen opdigtede tal, cases, citater (LOV 10) — brug `[PLACEHOLDER: Jonas udfylder]`.

## 4. Sådan bruger du DNA'et

1. Læs denne fil + `JARVIS-STIL.md` + kig i `eksempler/` (knap, kort, header, formular, liste) — kopiér mønstret, opfind ikke nyt.
2. Brug KUN tokens (`var(--farve-navy)` osv.) — aldrig rå hex i komponenter.
3. Før du melder færdig: screenshot i 375 / 768 / 1440 px og spørg: **"Ville Tesla/Apple lave det sådan?"** Nej → byg om.
4. Sammenlign side om side med asa-el.dk (`docs/fase5/screenshots/design/asa-el-*.png` i core-repoet).

## 5. Analyse: hvad styrer designet i asa-el.dk-repoet (`~/ASA/hjemmeside`)

| Fil | Indhold | Rolle |
|---|---|---|
| `CLAUDE.md` (761 linjer) | Workflow-regler + **Regel #0.5 "Tænk som senior designer"** (Apple/Tesla/Stripe/Linear-mindset, forbudte AI-æstetikker), **Regel #5 brand-palette + typografi** (6 navy/blå-toner, Manrope, serif forbudt), **Regel #6 designsystem** (whitespace, hover/focus, mobile-first, WCAG AA), Regel #0.7 selvkritik med screenshots | Adfærd: hvordan agenten tænker og verificerer |
| `DESIGN-REGLER-JONAS.md` | Jonas' konkrete krav: **lyst tema** (navy kun accent), **ingen serif**, **kompakte sektioner** (Apple-minimalisme), ingen `scale(1.05)`, **3 bredder** (full / container 1600+24 / bleed), kritiker-regel "Ville Tesla lave det?" | Smag: hvad Jonas kan lide og hader |
| `MASTER-DESIGN-PROTOKOL.md` | De ufravigelige love: aldrig hvid A4-side, visuelt i hver sektion, ≤100vh, responsivt i 3 viewports, Tesla-niveau eller byg om, byg om indtil kritiker ≥ 9/10 | Kvalitetsgate |
| `src/styles.css` (756 linjer) | Tokens: Manrope, radius 4/6/8/12, `--asa-navy/-deep/-blue/-blue-light/-light`, grøn + varm grå, `--asa-gutter 24`, `--asa-max 1600`; komponenter `.tesla-btn*` (6px, 13px/500, tracking-wide, ingen skygge), `.nav-link`, `.container-asa`/`.bleed-right-asa`/`.fullwidth-asa`; blød brand-focus-ring, tynd scrollbar, Apple-selection | Stil: de faktiske værdier |
| `src/components/Header.tsx`, `Footer.tsx`, `ui/*` | Hvid 64px-header, logo venstre, tekst-nav, ikoner højre; kort med navy-tonet blød skygge | Konkrete komponent-mønstre |
| `DESIGN-LOG.md`, `KRITIK-LOG.md`, `FORBEDRING-LOG.md` | Historik: hvorfor Fraunces røg ud, hvorfor bredde-systemet blev til, kritikerens fund | Beslutningshistorik |

**Hvad gør asa-el.dk smuk:** én font med karakter (Manrope), få farver brugt disciplineret (navy som accent på lys flade),
flade Tesla-knapper i lille størrelse med stor luft omkring, kort med navy-tonet (ikke sort) skygge, bred rolig header,
konsistente 6/16-radius, hero med foto og stor statement-overskrift, og en kritiker der afviser alt der "ligner AI".
