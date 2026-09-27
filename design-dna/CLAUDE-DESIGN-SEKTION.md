## DESIGN-DNA (ufravigelig — samme i alle ASA Univers-repos)

**KRITISK: Læs `design-dna/DESIGN-DNA.md` og `design-dna/JARVIS-STIL.md` før ALT design-arbejde.** Design skal matche
asa-el.dk-familien 1:1 og følge JARVIS-STIL. Boblen/agenter må aldrig lave design der ligner et "gammelt Windows-system"
(grå rammer, browser-standardknapper, tabel-gitter, spinnere). Reference: asa-el.dk-designfamilien 1:1
(Jonas' originale regler ligger ordret i `design-dna/kilde/`). **Ved tvivl: spørg Jonas før implementering.**

- Kig i `design-dna/eksempler/` (knap, kort, header, formular, liste) og kopiér mønstret — opfind ikke nyt.
- Tokens skal matche `design-dna/asa-tokens.css` (facit) — brug kun tokens, aldrig rå hex i komponenter.
- **Fonts:** Manrope overalt. ALDRIG serif (heller ikke Fraunces), ingen Inter/Roboto/Arial/system-ui som primær.
- **Farver:** Navy `#0E3A5D` · Navy dyb `#082843` · Blå `#2F80C9` (interaktivt/glød) · Lyseblå `#82B3DF` · Lys `#D5E6F4` ·
  Knækket hvid `#F2F4F7`. Lyst tema med dybde (aldrig flad hvid); mørk navy KUN tre steder: boblens svar-kort,
  kommandocentralens status-kort, universkort-lærredet.
- **Bevægelse:** hover 100 ms, standard 250 ms ease-out, klik `scale(.98)`, skeletons (aldrig spinnere), aldrig
  `scale(1.05)`-hover, respektér `prefers-reduced-motion`.
- **Mobil:** iPhone først (390×844), touch-mål ≥ 48 px, safe areas, bottom sheets.
- **Før "færdig":** screenshot 390×844 + 1440×900, sammenlign med asa-el.dk — "Ville Tony Stark/Tesla/Apple lave det sådan?" Nej → byg om.
