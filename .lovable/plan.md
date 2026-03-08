

## Problem

The dialer's three-panel layout (Leads | Stamdata | Result) looks messy and unstructured. The user wants perfect alignment, symmetry, and visual clarity since salespeople need focus and overview to close deals.

Looking at the screenshot, the main issues are:

1. **Stamdata panel** -- fields are in a 2-column grid but "Kontaktperson" spans full width awkwardly at the bottom. The spacing feels uneven.
2. **Result panel** -- the notes textarea, outcome buttons, and action buttons are stacked without clear visual grouping. The outcome buttons lack consistent sizing.
3. **Overall alignment** -- the three panels don't have consistent internal padding, header alignment, or vertical rhythm.

## Plan

### 1. Redesign StamdataPanel layout (non-Tetris mode)
- Change from 2-column grid to a cleaner **2-column grid where ALL fields are equal width** -- no `col-span-2` for Kontaktperson
- Add consistent field heights and padding
- Add subtle section divider between campaign info and fields
- Ensure all labels are the same size and aligned identically
- Equal gap between all fields (both horizontal and vertical)

### 2. Redesign ResultPanel layout
- Add consistent padding matching StamdataPanel
- Group "Noter" and "Udfald" into visually distinct sections with equal spacing
- Make all outcome buttons exactly the same height and width
- Add a subtle separator between the notes section and outcomes section
- Ensure "Gem & naeste" and "Spring over" buttons are the same width, aligned at the bottom with `mt-auto` to push them down
- Match the header style (font, size, border) with StamdataPanel

### 3. Align panel headers
- Ensure LeadsPanel header ("Emner"), StamdataPanel header ("Stamdata"), and ResultPanel header ("Resultat") all use identical height, padding, font size, and border style
- All three panels should have their top content start at the exact same vertical position

### 4. Consistent panel styling
- Uniform border widths between panels
- Same internal padding (p-5) across all panels
- Consistent background colors

### Files to modify
- `src/components/dialer/StamdataPanel.tsx` -- restructure field grid, align header
- `src/components/dialer/ResultPanel.tsx` -- restructure layout, consistent spacing, push buttons to bottom
- `src/components/dialer/LeadsPanel.tsx` -- align header height to match other panels

