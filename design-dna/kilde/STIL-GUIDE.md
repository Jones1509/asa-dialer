> **KILDE — ordret kopi fra asa-el.dk-repoet (Jones1509/asa-hjemmeside, 2026-09-27).** Kun DESIGN-reglerne gælder i ASA Univers.
> Hjemmeside-specifikke dele gælder IKKE her: MapLibre-kortet, Elio/FloatingAiAssistant, React-bibliotekerne (framer-motion,
> gsap, lenis, three), auto-push/rollback-hooks, .env-reglerne, fredet-filer, sider/forsiden, context-procenter. Følg repoets egen CLAUDE.md
> for arbejdsgang (branch + PR — aldrig direkte push). Aktuel app-stil: `../JARVIS-STIL.md`.

---

> ⛔ FORÆLDET — følg MASTER-DESIGN-PROTOKOL.md i stedet.

# STIL-GUIDE.md — Den fælles røde tråd for hele ASA-sitet

> **Denne fil er MÅL-stilen for HELE sitet — inkl. forsiden.**
>
> Sub-sider SKAL følge guiden 100 %. Forsiden skal også, men den er
> låst for Claude Code — Jonas opdaterer selv forsiden til denne guide,
> så alt hænger sammen. **Indtil forsiden er opdateret bruger den fortsat
> Geist + tesla-blå; det er ikke en undtagelse fra reglen, kun en
> midlertidig tilstand der retter sig selv når Jonas opdaterer.**
>
> Hvis denne fil og en anden regel-fil siger noget forskelligt, **vinder
> STIL-GUIDE.md**. Den er den eneste sandhed om udseendet.
>
> Relateret: [CLAUDE.md](./CLAUDE.md) · [UI-DESIGN-REGEL.md](./UI-DESIGN-REGEL.md) · [BYGGE-BRIEF.md](./BYGGE-BRIEF.md) · [WORLDCLASS-DESIGN-PROCESS.md](./WORLDCLASS-DESIGN-PROCESS.md).

---

## 🅰️ TYPOGRAFI

To fonte — ikke flere. Hver har én rolle.

### Font-roller

| Rolle | Font | Hvor |
|---|---|---|
| **Overskrifter** | **Fraunces** (Google Fonts, serif) | `h1`, `h2`, `h3`, `h4`, blockquotes, store CTA-overskrifter |
| **Brødtekst + UI** | **Geist** (Google Fonts, sans-serif) | Alt andet: paragraf, knapper, labels, navigation, tal/statistik, små billedtekster |
| **Mono** | `ui-monospace` system-stack | Code-snippets (sjælden) |

Forsiden bruger pt. Geist til alt — det rettes af Jonas, ikke af Claude Code.

### Forbudte fonts
Inter, Roboto, Arial, system-ui (som **valgt** stack), Manrope, Helvetica, Open Sans, Lato.

### Loaded weights
- **Fraunces**: 400, 500, 600, 700 (alle loaded via Google Fonts)
- **Geist**: 300, 400, 500, 600, 700

### Heading-skala (Fraunces)

| Tag | Size desktop | Line-height | Weight | Letter-spacing | Note |
|---|---|---|---|---|---|
| `h1` | `clamp(40px, 5vw, 64px)` | `1.05` | `500` | `-0.025em` | Brug `font-['Fraunces']` i Tailwind v4 |
| `h2` | `clamp(32px, 4vw, 48px)` | `1.1` | `500` | `-0.02em` | |
| `h3` | `clamp(24px, 3vw, 32px)` | `1.15` | `500` | `-0.015em` | |
| `h4` | `20px` | `1.25` | `600` | `-0.01em` | |
| Blockquote | `clamp(28px, 4vw, 44px)` | `1.2` | `400` italic | `-0.01em` | Fraunces italic er signaturen |

### Body-skala (Geist)

| Brug | Size | Line-height | Weight |
|---|---|---|---|
| Body / `p` | `16px` (`text-base`) | `1.5` | `400` |
| Lead / intro-paragraf | `20px` (`text-xl`) | `1.4` | `400` |
| Småtekst / caption | `14px` (`text-sm`) | `1.5` | `400`-`500` |
| Mikrotekst / disclaimer | `12px` (`text-xs`) | `1.5` | `500` |
| CTA-tekst | `14px`-`16px` | `1.2` | `500` |

### Implementation (Tailwind v4)

Forsiden indlæser begge fonte via `index.html`. På sub-sider:

```jsx
<h1 className="font-['Fraunces'] font-medium tracking-tight">…</h1>
<p className="font-sans">…</p>  {/* font-sans = Geist via --font-sans */}
```

`--font-sans` er allerede sat til `"Geist", ui-sans-serif, system-ui, sans-serif` i `:root`. Brug `font-sans` (Tailwind default) til alt der ikke er overskrift.

---

## 🎨 FARVER — Brand-palette

### Primær brand-palette (Spor B — facit)

| Navn | Hex | Tailwind-arbitrary | OKLCH (≈) | Bruges til |
|---|---|---|---|---|
| **Navy** | `#0E3A5D` | `bg-[#0E3A5D]` / `text-[#0E3A5D]` | `oklch(33.5% 0.072 245)` | **Primær brand**: knap-bg, headings, ikon-fill |
| **Navy dyb** | `#082843` | `bg-[#082843]` | `oklch(24.8% 0.066 248)` | Hover på primær CTA, mørke fullbleed-sektioner |
| **Blå** | `#2F80C9` | `bg-[#2F80C9]` | `oklch(58.7% 0.143 248)` | Sekundær accent, links, infografik |
| **Lyseblå** | `#82B3DF` | `bg-[#82B3DF]` | `oklch(74.7% 0.083 246)` | Tertiær accent, badges, ikon-baggrund |
| **Lys** | `#D5E6F4` | `bg-[#D5E6F4]` | `oklch(91.5% 0.029 245)` | Bløde fullbleed-sektioner, hero-baggrund (alternativ), card-tint |
| **Knækket hvid** | `#F2F4F7` | `bg-[#F2F4F7]` | `oklch(96.4% 0.005 246)` | Sektion-baggrund, default surface, mellem-rytme |

### Neutralt grundlag

| Brug | Værdi | Hvor |
|---|---|---|
| Sidebaggrund | `#FFFFFF` | Default på sub-sider |
| Tekst (body) | `#0F172A` (slate-900) eller Navy `#0E3A5D` | Body-tekst |
| Tekst sekundær | `#475569` (slate-600) | Captions, meta-info |
| Border | `#E2E8F0` (slate-200) | Divides, card-borders |
| Focus-ring | Navy `#0E3A5D` @ 30% opacity | Tab-focus |

### Hero-baggrund — LYS (ikke sort)

Forsidens nuværende sorte hero er midlertidigt. **Sub-sider bruger LYSE heroes:**

- Default: `bg-[#F2F4F7]` (knækket hvid) eller `bg-white`
- Alternativ med kulør: `bg-[#D5E6F4]` (Lys) — bruges sjældent, til signatur-sider
- Mørkt indslag tilladt **kun** som accent-sektion (fx Navy-rounded-3xl CTA-boks), ikke som hero

Tekst på lys hero: Navy `#0E3A5D` (heading) + slate-900 (body).

### Forbudte farver
- ❌ Purple/violet gradients (AI-cliché)
- ❌ Pure black (`#000`) som hero-bg — selv om forsiden bruger det pt.
- ❌ `oklch(...tesla-blue...)` — er forsidens midlertidige token, ikke brand
- ❌ Cyan-400 (forsidens accent — ikke en del af brand-paletten)

---

## 🔘 KNAPPER

### Primær CTA

Navy-fyldt, hvid tekst. Klassisk og rolig.

```jsx
<button className="bg-[#0E3A5D] hover:bg-[#082843] text-white rounded-md px-6 py-3 text-sm font-medium font-sans transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E3A5D]">
  Få elektrikere
</button>
```

| Property | Værdi |
|---|---|
| `background-color` | `#0E3A5D` (Navy) |
| Hover `background-color` | `#082843` (Navy dyb) |
| `color` | `white` |
| `padding` | `12px 24px` (`px-6 py-3`) |
| `border-radius` | `6px` (`rounded-md`) |
| `font` | Geist, `500`, `14px` |
| `transition` | `0.15s cubic-bezier(0.4,0,0.2,1)` |
| Min-bredde (når det giver mening) | `180px` |

### Sekundær CTA

Hvid baggrund, Navy tekst, Navy/30 border.

```jsx
<button className="bg-white text-[#0E3A5D] border border-[#0E3A5D]/30 hover:bg-[#F2F4F7] rounded-md px-6 py-3 text-sm font-medium font-sans transition-colors duration-150">
  Læs mere
</button>
```

### Tekstlink (subtil CTA)

```jsx
<a className="text-[#2F80C9] hover:text-[#0E3A5D] underline underline-offset-4 decoration-1 font-sans">
  Se hvordan det virker →
</a>
```

### Accent / fullbleed-CTA

På Navy-fullbleed CTA-bokse: hvid knap med Navy tekst.

```jsx
<button className="bg-white text-[#0E3A5D] hover:bg-[#F2F4F7] rounded-md px-6 py-3 text-sm font-medium font-sans shadow-sm">
  Få elektrikere
</button>
```

### Hover-regler
- Farveskift (bg / text-color) er den primære hover-signatur
- **ALDRIG** `hover:scale-*` (AI-cliché)
- Transitions: `0.15s cubic-bezier(0.4,0,0.2,1)` på relevante properties
- Focus-ring synlig — brug `focus-visible:outline-2 focus-visible:outline-[#0E3A5D]` eller tilsvarende

---

## 📐 LAYOUT & SPACING (stil-neutralt — beholdt fra forsidens mønster)

### Sektion-baseline

```jsx
<section id="…" className="scroll-mt-20 px-5 lg:px-10 pt-10">
  <div className="mx-auto max-w-7xl">…</div>
</section>
```

| Token | Værdi | Forklaring |
|---|---|---|
| Horizontal padding (mobil) | `px-5` (`20px`) | Tæt på kanten — ANL-mobile-spec |
| Horizontal padding (desktop) | `lg:px-10` (`40px`) | `lg` = `≥1024px` |
| Top padding (kompakt) | `pt-4` (`16px`) | Tæt på forrige sektion |
| Top padding (standard) | `pt-10` (`40px`) | Almindelig sektion-start |
| Top padding (stor) | `pt-16` (`64px`) | Markeret start (efter mørk sektion eller skift) |
| Anchor offset | `scroll-mt-20` (`80px`) | Til in-page anchors under sticky header |
| Container max-bredde | `max-w-7xl` (`80rem`) | Standard indholds-container |

Forsiden bruger primært `pt-N` (top-only) — IKKE symmetrisk `py-N`. Rytmen skabes af forskellige `pt`-værdier + skiftende baggrundsfarver. Brug samme mønster på sub-sider.

### Container-bredder

| Variabel | Værdi | Brug |
|---|---|---|
| `--container-xs` | `20rem` (`320px`) | Modal / dialog |
| `--container-sm` | `24rem` (`384px`) | Smal text-column |
| `--container-md` | `28rem` (`448px`) | Form |
| `--container-lg` | `32rem` (`512px`) | Lead text |
| `--container-xl` | `36rem` (`576px`) | Article body |
| `max-w-7xl` | `80rem` (`1280px`) | Default page |

### Hero-mønster (LYS hero)

```jsx
<section className="relative w-full overflow-hidden bg-[#F2F4F7]">
  {/* Hero-content placerer sig selv. Eventuelle parallax-billeder absolut-positioneres bag. */}
  <div className="mx-auto max-w-7xl px-5 lg:px-10 pt-24 pb-20">
    <h1 className="font-['Fraunces'] font-medium tracking-tight text-[#0E3A5D]">…</h1>
  </div>
</section>
```

Forsiden bruger pt. `bg-black` — det rettes af Jonas. Sub-sider gør **ikke** det samme.

---

## 📏 RADIUS & SHADOWS

| Token | Værdi | Brug |
|---|---|---|
| Default radius | `6px` (`rounded-md`) | Knapper, inputs, cards |
| Stor radius | `12px` (`rounded-xl`) | Statistik-cards, badge-pills |
| Ekstra stor | `1rem` (`rounded-2xl`) | Hero-cards, fullbleed CTA-bokse |
| Skygge (kort) | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)` | Hvide kort på lys baggrund |
| Skygge (løftet) | `0 4px 14px rgba(14,58,93,0.10)` | Hover-løft på primær card |
| Skygge (default) | `box-shadow: none` | Det meste UI |

---

## 🎬 ANIMATIONER (stack — uændret)

### Tidsbase
- Default duration: **`0.15s`**
- Easing: **`cubic-bezier(0.4, 0, 0.2, 1)`** (Tailwind default)
- Slow easing: `cubic-bezier(0, 0, 0.2, 1)` (ease-out)

### Animation-lag

| Lag | Værktøj | Brug |
|---|---|---|
| Scroll / parallax | **GSAP** + ScrollTrigger | Hero-billede-fade, parallax-baggrund, scrub-effekter, page-flow |
| Reveal / fade-in | **Framer Motion** (`whileInView`) | Sektion-reveals on scroll |
| Hover / micro | **Framer Motion** / CSS | Knap-farveskift, link-underline |
| Smooth scroll | **Lenis** | Hele page-scroll, særligt sider med tunge scroll-animationer |
| 3D-mesh (sjælden) | **@react-three/fiber** + drei | Signatur-elementer (fx hero) |
| Lottie (sjælden) | **lottie-react** | Mikro-illustrationer |
| Spline (sjælden) | **@splinetool/react-spline** | Hero-3D embedded |

### Reglerne
- **Mindst** Framer Motion reveal + hover på enhver sub-side
- **GSAP parallax/scroll** på mindst én signatur-sektion pr. side
- Lenis bruges hvor scroll-fornemmelsen ellers vil føles ujævn
- Ingen `scale(1.05)` AI-cliché hover
- Ingen wobble/bounce-keyframes på CTA
- Ingen `>1000ms` page-transitions

---

## 🧪 VERIFICERINGS-VÆRDIER

Når du verificerer en sub-side, kør dette i `chrome-devtools` MCP og bekræft værdierne:

```js
const cs = getComputedStyle;
const root = cs(document.documentElement);
console.log({
  bodyFont: cs(document.body).fontFamily,                 // skal indeholde "Geist"
  h1Font: cs(document.querySelector('h1')).fontFamily,    // skal indeholde "Fraunces"
  fontSans: root.getPropertyValue('--font-sans').trim(),  // "Geist"
  navyButton: cs(document.querySelector('[class*="bg-[#0E3A5D]"]') || document.body).backgroundColor,
  // → skal være "rgb(14, 58, 93)" hvis Navy CTA findes
  hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth, // skal være false på mobil
});
```

Hvis nogen af disse værdier ikke matcher (især H1 ikke er Fraunces, eller Navy ikke findes som hex), har du brudt stilen.

---

## ✅ STIL-TJEKLISTE FOR EN NY SIDE

- [ ] Overskrifter bruger **Fraunces** (`font-['Fraunces']`) — verificeret i chrome-devtools
- [ ] Brødtekst bruger **Geist** (default `font-sans`) — verificeret i chrome-devtools
- [ ] Primær CTA: Navy `#0E3A5D` bg, hvid tekst, `rounded-md`, `px-6 py-3`, weight 500
- [ ] Sekundær CTA: hvid bg, Navy tekst, Navy/30 border
- [ ] Hero er LYS (`#F2F4F7` eller `#D5E6F4` eller hvid) — IKKE `bg-black`
- [ ] Ingen forbudte farver (purple/violet, tesla-blue, cyan-400, pure black hero)
- [ ] Sektioner følger `scroll-mt-20 px-5 lg:px-10 pt-{4|10|16}` mønsteret
- [ ] Container `max-w-7xl mx-auto`
- [ ] H1 størrelse `clamp(40px, 5vw, 64px)`, weight 500, tracking-tight
- [ ] Transitions er `0.15s cubic-bezier(0.4,0,0.2,1)`
- [ ] GSAP brugt på mindst én signatur-sektion (parallax/scroll)
- [ ] Framer Motion brugt til reveal + hover
- [ ] Ingen `hover:scale-*` (AI-cliché)
- [ ] Hex-værdier bruges som Tailwind-arbitrary (`bg-[#0E3A5D]`) — ikke hard-coded i style-prop
- [ ] Focus-rings synlige på alle interaktive elementer

Hvis ÉT punkt mangler → ikke færdig. Loop tilbage til relevant trin.

---

*Skrevet: 2026-05-21. Spor B — Fraunces + Navy som facit for hele sitet. Forsiden følger denne guide når Jonas opdaterer den; sub-sider følger den fra dag 1.*
