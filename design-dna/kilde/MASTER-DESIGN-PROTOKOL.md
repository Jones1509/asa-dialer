> **KILDE — ordret kopi fra asa-el.dk-repoet (Jones1509/asa-hjemmeside, 2026-09-27).** Kun DESIGN-reglerne gælder i ASA Univers.
> Hjemmeside-specifikke dele gælder IKKE her: MapLibre-kortet, Elio/FloatingAiAssistant, React-bibliotekerne (framer-motion,
> gsap, lenis, three), auto-push/rollback-hooks, .env-reglerne, fredet-filer, sider/forsiden, context-procenter. Følg repoets egen CLAUDE.md
> for arbejdsgang (branch + PR — aldrig direkte push). Aktuel app-stil: `../JARVIS-STIL.md`.

---

# MASTER-DESIGN-PROTOKOL.md — ENESTE GYLDIGE DESIGN-LOV FOR ASA-HJEMMESIDEN

> **🔴 LÆS [DESIGN-REGLER-JONAS.md](./DESIGN-REGLER-JONAS.md) FØRST** — Jonas' konkrete
> krav (lyst tema, geografisk korrekt kort, Manrope/ingen serif, 100vh, Elio fredet m.m.),
> opdateres løbende. Ved konflikt vinder Jonas' regel-fil.
>
> **🔴 CONTEXT-TJEK:** følg **[CLAUDE.md § AUTO-STATUS-PROTOKOL](./CLAUDE.md#-auto-status-protokol-absolut-regel)** — soft-warn ved 60 %, HARD STOP + fuld status til DONE.md ved 70 %. Må aldrig nå 95 %.

> **Denne fil erstatter ALLE tidligere design-regel-filer.** Hvis en gammel fil
> (UI-DESIGN-REGEL, STIL-GUIDE, WORLDCLASS-DESIGN-PROCESS, BYGGE-BRIEF,
> tesla-design-mentor, BROWSE-PROTOKOL, KVALITETS-GATE, LIVE-PREVIEW-PROTOKOL)
> siger noget andet — **denne fil vinder.** De gamle er markeret FORÆLDET.
>
> Gælder kun **hjemmesiden** (`C:\Users\Jonas\ASA\hjemmeside`). KLS har sit eget.

---

## ⚖️ DE UFRAVIGELIGE LOVE (kritikeren gater HÅRDT — én fejl = FAIL)

### LOV 1 — DU BESTEMMER SELV SIDERNE (mange, professionelt)
Et elektriker-udlejningsfirma som ASA skal have et **rigtigt, fuldt website** —
ikke 3 kedelige sider. Du finder **SELV** ud af hvilke sider der skal til,
foreslår listen, og **bygger dem alle**.

- Tænk som en B2B-virksomhed der udlejer autoriserede elektrikere til større
  virksomheder og installatørfirmaer. Hvilke sider forventer en seriøs kunde?
- Forslag til side-univers (udvid selv hvis det giver mening):
  Forside (LÅST), Sådan virker det, Ydelser/Kompetencer, Priser, Projekter/Cases,
  Om os, Karriere/Bliv lejet ud, Brancher vi løser, FAQ, Kontakt, 404.
- **Header, footer og navigation opdateres AUTOMATISK** når en side tilføjes —
  ingen døde links, ingen manuel glemte menupunkter.
- Byg hele universet sammenhængende — samme stil-DNA på tværs.

### LOV 2 — ALDRIG HVID A4-SIDE
Ingen sektion må være "sort tekst på hvid baggrund". **Hver** sektion skal have
visuel dybde: **baggrundsbilleder, farveflader (navy/gradienter), eller 3D.**
Skiftende sektion-baggrunde — aldrig alt hvidt i træk. Tom/hvid side = **FAIL**.

### LOV 3 — VISUELT PÅ HVER SEKTION
**Hver** sektion skal have rigtige billeder eller visuelle elementer
(hero-foto, baggrundsfoto, foto af elektrikere/arbejde, ikoner, 3D, grafik).
Mangler ASA egne billeder: brug **Unsplash-placeholder** (professionelt B2B /
el-branche) og **notér i koden** at billedet skal skiftes til ASA's eget.

### LOV 4 — ALLE SKILLS OG BIBLIOTEKER SKAL BRUGES (verificeres i koden)
Alle agenter SKAL bruge og efterlade spor i koden af:
- **framer-motion** — komponent-animationer (fade, stagger, hover, layout)
- **gsap + ScrollTrigger** — scroll-baserede effekter og timelines
- **parallax via lenis** — smooth scroll + parallax-dybde
- **ui-ux-pro-max** skill — systematisk design (paletter, font-pairing, UX)
- **frontend-design** skill — moderne best-practices
- **three / @react-three/fiber / spline + lottie-react** — hvor det LØFTER
  oplevelsen (hero, blikfang). Ikke pynt for pyntens skyld, men brug det hvor
  det hæver siden til Tesla-niveau.

**Mangler bare ét af disse spor i den færdige kode = FAIL.** Kritikeren tjekker
imports og faktisk brug — ikke kun at pakken er installeret.

### LOV 5 — SEKTION ≤ SKÆRMEN (max 100vh)
Hver sektion skal kunne ses **helt på én skærm uden at scrolle.** En sektion må
ALDRIG være højere end viewporten eller strække sig udover skærmen. Små,
fokuserede sektioner — ikke store sektioner man skal scrolle igennem. Gælder
mobil, tablet OG desktop. En for høj sektion = **FAIL**.

### LOV 6 — FULDT RESPONSIVT (testes i Chrome før færdig)
Test i 3 viewports i Chrome **før** noget meldes færdigt:
- **375px** (mobil) · **768px** (tablet) · **1440px** (desktop)
Intet må overlappe, stikke ud, eller kræve horisontal scroll i nogen bredde.
Ikke testet i alle 3 = **FAIL**.

### LOV 7 — TESLA/APPLE-NIVEAU ELLER BYG OM
Standarden er Tesla.com / Apple / Stripe / Linear. Minimalistisk, smooth,
masser af whitespace, rolige elegante animationer, premium feel.
Ser det "AI-genereret", generisk eller billigt ud → byg om.
**Forsidens struktur er LÅST** — rør den ikke. Men byg alle andre sider i
nøjagtig samme ånd og stil-DNA.

### LOV 8 — BYG OM AUTOMATISK INDTIL GODKENDT (vis kun færdige sider)
Efter byg: kør kritikeren (`DESIGN-CRITIC-AGENT.md`). Hvis ikke **9+/10 OG alle
love opfyldt** → byg om automatisk og kør kritikeren igen. Gentag indtil den
består. **Jonas ser kun færdige, godkendte sider** — aldrig halvfærdigt.

---

## 🎨 BRAND (uændret — fra CLAUDE.md designsystem)
- **Farver:** Navy `#0E3A5D`, Navy dyb `#082843`, Blå `#2F80C9`,
  Lyseblå `#82B3DF`, Lys `#D5E6F4`, Hvid `#F2F4F7`
- **Fonte:** Moderne, ren **sans-serif i Apple/Tesla-stil** (kandidater: Inter,
  Manrope, Plus Jakarta Sans, Sora — endelig font vælges af designer og
  VERIFICERES af kritiker mod ægte Apple/Tesla-look på screenshot).
  **FORBUDT:** alle serif-fonte (inkl. Fraunces), Times New Roman-look,
  Geist-serif-agtigt, Roboto, Arial, system-ui.
  *(Opdateret 2026-05-30: Jonas vurderede Fraunces/Geist som Times-agtigt — serif er nu forbudt på forsiden.)*

## 🔁 ARBEJDS-LOOP (kort)
1. Find/foreslå siderne (Lov 1) → 2. ui-ux-pro-max + 21st.dev layout →
3. Byg med fuld animations-stack (Lov 4) → 4. Billeder + baggrunde (Lov 2-3) →
5. Sektioner ≤ 100vh (Lov 5) → 6. Test 375/768/1440 i Chrome (Lov 6) →
7. Kritiker 9+/10 (Lov 8) → byg om til den består → 8. Vis Jonas færdig side
   + preview-link + commit-hash.

---

*Oprettet: 30. maj 2026. Erstatter alle tidligere design-regel-filer for hjemmesiden.*

---

## ⚖️ LOV 8 — ALDRIG GENTAGELSE (kritiker + vagt gater HÅRDT)
Hver side skal være 100% unik: unik struktur, unik tekst, unikt layout, unikke
sektioner. En side må ALDRIG genbruge tekst, sektioner eller layout fra en
tidligere bygget side. Har holdet allerede skrevet/lavet noget på én side, skal
en ny side have HELT ny tænkning og HELT nyt indhold.
- Kritikeren sammenligner mod ALLE tidligere byggede sider.
- Den automatiske vagt logger hver sides sektion-struktur (overskrifter,
  sætninger, layout-fingeraftryk) i `scripts/.design-manifest.json` og FEJLER
  hvis en ny side genbruger overskrifter, sætninger eller layout fra en anden side.
- Gentagelse = FAIL.

## ⚖️ LOV 9 — INGEN HALVE LØSNINGER (kritiker gater; vagt fanger stubs)
Hver side bygges med ALLE relevante skills, evner og kompetencer FULDT udnyttet
— gennemtænkt hele vejen rundt, hver detalje perfekt. Det bedst mulige produkt
agenten kan lave, hver gang. Et 0,5-færdigt produkt = FAIL.
- Ingen stubs, ingen "vi bygger resten senere", ingen pladsholder-sektioner.
- Vagten fanger åbenlyse stubs (for kort indhold / manglende smooth-scroll).
- Kritikeren dømmer helheden: er ALT gennemført til Tesla/Apple-niveau? Hvis ikke
  100% — FAIL og byg videre.
