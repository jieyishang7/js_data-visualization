# Validation record

Tested by OpenAI Codex on October 13, 2026, in the Codex in-app browser against the local HTTP build. Tests were performed incrementally: A before B was implemented, then B before C, then integrated checks. This is not a claim of student review or cross-browser certification.

## Data and reproducibility

- Re-ran `analyze.py`, `build_history.py` and `eda_review.py` successfully.
- `verify_data.py` passed: original XLSX SHA-256 unchanged; all 27,508 CSV data cells matched the workbook; all 2,116 history records and 147 current records matched source values, including nulls and original labels.
- The worksheet has empty trailing header cells. They were excluded from the 13 populated-column count after asserting all cells beyond column 13 are empty.
- No duplicate country/snapshot key after the one documented Swaziland → Eswatini mapping.
- Latest score confidence bounds contain all corresponding scores. Every nonmissing six-factor value is within the fixed heatmap domain 0–2.2.
- Maximum absolute difference between the complete, rounded decomposition sum and reported score is 0.002. No synthetic adjustment was introduced.
- `node --check chart.js` passed.

## A — Happiness over time

- Default four countries × twelve snapshots = 48 plotted observations.
- Selecting 2011–2025 showed 56 points and two path segments per default country, with the break at absent 2013.
- Selecting 2019–2025 gave 28 points; China +0.950 and India +0.963, while Finland −0.045 and United States −0.124. The increasing option faded the two negative-change paths.
- Equal start/end produced a clear invalid-range message and no stale chart/table/legend.
- Selected Eswatini across the alias boundary; 2019–2025 comparison was available (−0.399), while a missing endpoint produced “endpoint comparison unavailable.” Oman’s missing 2019 endpoint likewise remained unavailable.
- Removing all selections showed an empty-state message and zero points. Reset restored the initial countries, dates and emphasis.
- Keyboard Enter revealed country, nominal window, score and confidence-interval availability. Original labels are retained in the time data table.

## B — Happiness & explanatory factors

- Switched all six dropdown options. Counts were 147 for GDP, support, generosity and corruption; 146 for health (State of Palestine missing) and freedom (Tajikistan missing).
- Country substring `China` showed three matches. A nonsensical search showed zero marks, an explicit empty-result message and an explanation when the highlighted country was excluded.
- Highlighting Benin put it in the foreground with a label. Details showed social support 0.087, score 4.393 and interval 4.262–4.525.
- Keyboard details for Finland showed support 1.638, score 7.764 and interval 7.690–7.837.
- Reset restored all 147 social-support pairs and cleared search/highlight.

## C — Happiness contribution profiles

- Default six countries produced 36 cells. Pair button produced 12 cells for Benin and Lesotho.
- Support sort placed Lesotho ahead of Benin, preserving scores 4.375/4.393 and contribution values 1.135/0.087.
- All eight sort options were exercised: name, score and all six factors. Expected leading rows were verified for the default selection.
- Selecting Tajikistan and State of Palestine produced exactly two hatched missing cells. A real zero (Lesotho health) remained 0.000.
- Health sorting put State of Palestine last. Tooltip retained missing residual for Tajikistan and the table retained Sri Lanka’s negative residual (−0.222).
- At eight selected countries, the ninth checkbox was disabled. Selected checkboxes and removal chips remained usable.
- Removing all countries produced zero cells and an explicit empty state. Reset restored six default countries and score sorting.

## Integrated layout and access

- Visually inspected A, B and C at 1280px viewport width. Axis labels, legend, exact heatmap values and country names were readable. Long heatmap country names are abbreviated on the row label, with full names in cell details and the table.
- At 375px viewport width the page did not overflow horizontally; each chart scrolled within its own container (780px drawing width). Native controls remained operable.
- Mobile filtering to Finland and tapping its point showed the correct details; the tooltip fit within the viewport.
- Section navigation uses native anchor links and smooth scrolling. SVG marks support keyboard focus, Enter/Space details and Escape dismissal; each view has a native HTML data table. Reduced-motion preferences disable animations.
- Browser warning/error log was empty during integrated tests.

## Review and limitations

- This build is local and not published. The live GitHub Pages URL still refers to an earlier prototype; it was not used to certify this build.
- No new commit or push was made. Human review and publication approval remain pending.
- The local HTTP workflow was tested. Direct `file://` opening, external browsers, screen-reader output and physical touch devices were not separately certified.
- Numerical comparisons are descriptive, not significance tests. Historical nominal windows do not identify the actual survey years available for each country. Dataset limitations are documented in README.md.
