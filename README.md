# World Population — Visual Reverse Engineering

This project recreates the original World Population visualization using HTML, CSS, JavaScript, and D3.js.

## Original reference

[Information is Beautiful – World Population](https://informationisbeautiful.net/visualizations/world-population/)

Original design: David McCandless. Research: Nell Simon-Batsford. Original implementation: Tom Evans and Paul Barton / VizSweet. A [reference screenshot](assets/original-reference.jpg) is included for educational comparison.

The live visualization is independently written SVG and JavaScript. It does not iframe the original, embed its visualization, display a screenshot as the chart, or reuse its implementation code.

## Dataset source

The original dataset **is publicly available**, so no substitute or fabricated data is used:

- [Original dataset linked by Information is Beautiful](https://geni.us/IIBWorldPop23)
- [Published CSV](https://docs.google.com/spreadsheets/d/e/2PACX-1vT5LYpGvA7I5Oaifd4_tu5oG4sXYr2tXSKlNU3BDh5FLKy52qfV-c78z3NTnLiG4cZjExb1gsgNWg6h/pub?gid=1900052514&single=true&output=csv)
- Underlying source: United Nations mid-2023 population projections, as cited by the original visualization.
- `data/original_population_2023.csv` preserves the downloaded source, retrieved October 2, 2026 (UTC).
- `data/population.csv` contains `country,population,region,rank`.

Source values in millions are multiplied by 1,000,000, filtered to **at least 20 million**, sorted descending, and ranked. This yields **62 countries**, matching the original’s “nations with 20m+ people” scope rather than arbitrarily truncating to 30–50. The displayed population is approximately 7.26 billion; it is not the entire world total. The source is rounded to 100,000 people and describes projections for 2023, not current census counts.

Country names such as USA, UK, S. Korea, N. Korea, S. Africa, and Congo DRC are expanded in the CSV; short names are used in the diagram where useful. Original region assignments are preserved, including Central Asia, East Asia, Middle East (including Egypt), and Europe (including Russia). The eight-region legend follows the reference more closely than merging all Asian regions. The source’s `5,7` value for African Republic is read as 5.7 million, so it does not pass the 20-million threshold; apparent source-image inconsistencies are not converted into invented population values.

## Part 3 — Reverse engineering

The reproduction attempts to match:

- **Composition and positioning:** a single compact circular silhouette filled with irregular country polygons. India sits on the left, China in the upper right, Africa to the right, and the Americas, Europe, and Middle East occupy the lower areas.
- **Size encoding:** polygon area is proportional to population, with no compressed scale. Every country shares the same area-per-person conversion.
- **Color encoding:** pastel peach for Central Asia, taupe for East Asia, yellow for Africa, blue for Central & North America, green for Europe, mint for Middle East, orange for Oceania, and pale cream for South America.
- **Typography and labels:** light sans-serif country names, bold population values in the same sans-serif family, comma-separated whole millions for large countries, and one decimal for smaller values. All 62 countries show horizontal country names above bold population values. Region-colored text halos keep labels readable across boundaries, as in the reference. A label-only collision pass separates neighboring labels without changing polygon geometry; a thin leader connects displaced labels when necessary.
- **Visual hierarchy:** dark background, centered two-line headline and subtitle, fine country boundaries, heavier regional boundaries, and a compact colored legend below the diagram.

### Independently written layout

`script.js` implements convex half-plane clipping to construct a **weighted Voronoi / power diagram**. A damped Newton solver adjusts the weights until cell areas match their population targets. It first partitions the circular boundary into regions, then partitions each region into countries. A few centroid-relaxation steps reduce narrow cells. Hand-authored starting anchors approximate observed country neighborhoods; they are not copied from the original website’s code.

The circular boundary is a 256-sided polygon, visually approximating a circle. The generated country cells exactly cover that boundary without overlapping interiors. The implementation checks maximum relative area error before rendering and reports it under “About this reproduction & data.” Border strokes slightly reduce visible fill near edges, as in the reference.

**Limits:** this is a close structural reproduction, not a pixel-identical copy. Individual boundaries and some country positions differ. All labels, bold numbers, and page text use Manrope via Google Fonts, with a sans-serif fallback. Small-cell labels can extend beyond their polygons, with halos and collision avoidance for readability. The original public dataset is authoritative when its values differ from what appears in the reference screenshot.

## Part 4 — Interactions added

1. **Hover / focus tooltip:** highlights the country border and displays country, formatted population, original region, and rank. Keyboard focus also opens details. Enter/Space or a click zooms to the country; Escape returns to the full view.
2. **Clickable region filter:** keeps the selected region visible and dims others. All restores the whole diagram. Filtering changes opacity only; polygon positions, sizes, and page layout remain fixed.

3. **Click-to-zoom:** click a country to animate the entire SVG camera group over 650ms. Its original regional fill is preserved, a pale outline marks selection, and other countries and labels fade. The camera fits both the polygon and its label, up to 6× magnification. Click another country to move the camera, or click chart background / page whitespace, use Reset view, or press Escape to return. Reduced-motion preferences disable the animation.

Zoom and filtering use coordinated state: filtering to a different region resets the camera; clicking a country outside the active region clears the old region filter. Reset view clears the search, region filter, and population threshold. Background clicks and Escape clear country focus and search while preserving filters. All restores the region filter without discarding an active country focus. Interrupted camera transitions resume from their current view, with no polygon deformation or data-color changes.

4. **Search country:** native autocomplete suggestions list all 62 displayed countries. Choose a suggestion, press Enter, or click Find to use the same camera and selection behavior as clicking a polygon. Search ignores capitalization, accents, and punctuation, and accepts chart abbreviations. Unknown names show “Country not found” without changing the diagram. Selected details include population, region, and rank.
5. **Population threshold:** a 0–1.5B slider, in 10M increments, dims countries below the minimum with a 300ms opacity transition and displays the qualifying count across all regions. It combines with the region filter without recomputing geometry or moving the camera. An explicitly selected country stays highlighted even below the threshold; a visible note explains this exception. Reduced-motion preferences disable the fade.

The original itself includes a regional legend; this project independently implements the legend behavior and adds a detailed tooltip with rank and full population. The layout is computed once; only the SVG camera animates. An expandable data table provides a text alternative for small countries.

## Project structure

- `index.html` — headline, SVG, legend, notes, and data table
- `style.css` — reference-inspired dark styling and responsive layout
- `script.js` — independent area solver, SVG rendering, and interactions
- `data/population.csv` — cleaned chart dataset
- `data/original_population_2023.csv` — original source snapshot
- `assets/original-reference.jpg` — original visualization screenshot
- `assets/reproduction-preview.jpg` — local reproduction preview
- `tests/validate-layout.cjs` — data and geometry validation

Previous hexagon, circle, and organic-blob design code has been replaced. The independent earlier `anscombes-quartet/` assignment is preserved, with its typography also updated to Manrope.

## Run locally

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Use a local server because browsers restrict CSV loading from `file://`. No npm install, build step, runtime API, or original website is needed. Manrope loads from Google Fonts and requires an internet connection; if it is unavailable, the chart uses a sans-serif fallback. D3 v7 loads from https://cdn.jsdelivr.net/npm/d3@7 and requires an internet connection. Chart data remains local.

Optional geometry verification (Node.js 18+ and internet access to the same D3 CDN):

```sh
node tests/validate-layout.cjs
```

This checks country count, ranks, the threshold, circular boundary coverage, no overlapping country interiors, and a maximum relative area error below 0.01%.

## Deploy with GitHub Pages

1. Commit and push the project to `main` in [this repository](https://github.com/jieyishang7/js_data-visualization).
2. Open **Settings → Pages** in GitHub.
3. Set **Deploy from a branch → main → / (root)** and save.
4. Once deployment completes, visit `https://jieyishang7.github.io/js_data-visualization/`.
5. Submit the public page URL and repository URL to Courseworks.

All asset URLs are relative and work beneath a GitHub Pages project path. This local rebuild does not itself publish or push changes.

## AI Assistance

AI-assisted coding was used in this project.

Tool:
OpenAI Codex

Purpose:
Codex was used to assist with D3.js syntax, interaction logic,
debugging, and implementation of the visualization.

I reviewed and tested the generated code and am responsible for
the final implementation and data handling.
