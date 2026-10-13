# Penguins, in proportion

An exploratory data project with an interactive D3 scatterplot.

**Live chart:** https://jieyishang7.github.io/js_data-visualization/js_data%20exploration/

**Open the working chart locally:** download this folder and open `index.html` in a browser. No installation, server, or internet connection is required. Keep the folder structure intact. GitHub's file viewer shows source code; it does not execute HTML. If using GitHub Pages, publish the containing repository and open `/js_data%20exploration/` under its Pages URL.

## Step 1 — Dataset choice

This project explores how penguin body proportions differ across species. Wildlife measurements are interesting because an apparent relationship in a combined sample may partly reflect differences between groups. This dataset has enough observations and categorical dimensions to explore that issue while remaining manageable for a first D3 chart.

## Step 2 — Dataset documentation

| Item | Details |
|---|---|
| Dataset | Palmer Penguins, simplified `penguins` dataset |
| Original source | Dr. Kristen Gorman and Palmer Station Antarctica Long Term Ecological Research (LTER) |
| Dataset maintainers | Allison Horst, Alison Hill, and Kristen Gorman |
| Project URL | https://allisonhorst.github.io/palmerpenguins/ |
| Download URL | https://raw.githubusercontent.com/allisonhorst/palmerpenguins/main/inst/extdata/penguins.csv |
| Date accessed | October 13, 2026 |
| Description | Body measurements and sample characteristics for three penguin species |
| Time coverage | 2007–2009; year only in this simplified file |
| Geographic coverage | Biscoe, Dream, and Torgersen islands, Palmer Archipelago, Antarctica |
| Rows | 344 observations, excluding header |
| Columns | 8 |
| Format | CSV; frozen local copy in `data/penguins.csv` |
| License | CC0, as documented by the project; the source also links the Palmer Station LTER and US LTER data policies and requests contact with the researcher for publication collaborations |

The local snapshot makes the analysis reproducible even if the upstream CSV changes. The simplified file does not contain individual IDs or precise dates.

## Step 3 — Explore the data

### Variable inventory

| Variable | Type | Meaning / use | Missing |
|---|---|---|---:|
| `species` | Categorical | Adelie, Chinstrap, Gentoo; compare groups | 0 |
| `island` | Categorical / geographic | Island name; no coordinates | 0 |
| `bill_length_mm` | Numerical | Bill length in millimeters | 2 |
| `bill_depth_mm` | Numerical | Bill depth in millimeters | 2 |
| `flipper_length_mm` | Numerical | Flipper length in millimeters; chart x-axis | 2 |
| `body_mass_g` | Numerical | Body mass in grams; chart y-axis | 2 |
| `sex` | Categorical | Female or male, when recorded | 11 |
| `year` | Temporal, integer | Sampling year, 2007, 2008, or 2009 | 0 |

Flipper length and body mass are especially useful for exploring body size. Species helps distinguish overall patterns from within-group patterns. Bill dimensions offer an alternative way to compare shape.

### Descriptive statistics

Calculated directly from the included CSV using `analyze.py`. Missing values are omitted separately for each numerical variable. Each numerical summary below uses **342 observations**. Means and medians are rounded to two decimal places.

| Variable | Minimum | Maximum | Mean | Median | Range | Unique observed values |
|---|---:|---:|---:|---:|---:|---:|
| Bill length (mm) | 32.10 | 59.60 | 43.92 | 44.45 | 27.50 | 164 |
| Bill depth (mm) | 13.10 | 21.50 | 17.15 | 17.30 | 8.40 | 80 |
| Flipper length (mm) | 172 | 231 | 200.92 | 197 | 59 | 55 |
| Body mass (g) | 2,700 | 6,300 | 4,201.75 | 4,050 | 3,600 | 94 |

| Species | Count | Share of all 344 rows | Valid mass observations | Mean mass (g) |
|---|---:|---:|---:|---:|
| Adelie | 152 | 44.19% | 151 | 3,700.66 |
| Chinstrap | 68 | 19.77% | 68 | 3,733.09 |
| Gentoo | 124 | 36.05% | 123 | 5,076.02 |

Percentages may sum to 100.01% due to rounding. Islands: Biscoe 168, Dream 124, Torgersen 52. Years: 2007 has 110 rows, 2008 has 114, and 2009 has 120. Sex: 168 male, 165 female, 11 missing. These variables have 3, 3, and 2 distinct nonmissing values respectively.

### Missing values, unusual patterns, and limitations

- `NA` marks missing data. The same two observations lack all four body measurements (2/344 = 0.58%). Sex is missing in 11 observations (3.20%). Nine of those still have usable chart measurements and remain in the chart.
- The chart excludes only rows without both plotted measurements, leaving 342 points before filtering. It displays the matching sample size and exclusions for each filter combination.
- Gentoo penguins have a substantially higher mean body mass in this sample. Adelie and Chinstrap means are relatively similar. These are descriptive sample findings, not significance tests or population estimates.
- Species and island are intertwined: all 124 Gentoo rows are from Biscoe, and all 68 Chinstrap rows are from Dream. Adelie appears on all three islands (44 Biscoe, 56 Dream, 52 Torgersen). An island comparison would therefore also reflect species composition.
- Species sample sizes are unequal. Counts describe sampling, not the relative abundance of wild penguin populations.
- Rounded measurements can overlap in a scatterplot. Partial transparency helps, but identical points can still hide one another; the record selector exposes every plotted row.
- Extreme observed measurements are retained. Being unusually large or small does not itself demonstrate a data error.
- This is a regional, three-year observational sample. It cannot establish causal effects, long-term climate trends, or patterns for all penguins. Year comparisons could reflect changes in the sampled groups.
- The simplified file has no stable individual identifier. Displayed row numbers identify CSV observations only, and cannot support tracking individuals over time.

## Step 4 — Questions

1. **Relationship:** Does body mass tend to rise with flipper length within each species, and how does that compare with the combined sample? The first chart supports visual inspection; correlation or regression would be a follow-up.
2. **Comparison and distribution:** Which species has the highest median body mass, and how much do the species distributions overlap? Compare medians and distribution shapes instead of relying only on means.
3. **Differences between groups:** Within each species, how do male and female body-mass distributions differ? Report the 11 missing sex values and denominators explicitly.
4. **Geography:** Among Adelie penguins only, how do measurements differ across the three islands? Restricting species reduces one source of confounding, though sex and year could still differ.
5. **Change over time:** Within a species and sex, how do measured body masses vary across 2007–2009? Treat the result as a comparison of sampled groups, not individual growth or a long-term trend.

## Step 5 — Three proposed uses and visual sketches

![Three labeled design sketches](sketches.svg)

These are conceptual wireframes; their marks illustrate layouts, not additional calculated results.

| Proposal | What it would show / do | Audience | Why it matters |
|---|---|---|---|
| 1. Body-size explorer — implemented | Scatterplot of flipper length versus mass; species/year filters and observation details | Students and wildlife enthusiasts | Helps distinguish between-species separation from within-species variation |
| 2. Distribution comparison | Box plots with individual points for mass by species; optional sex split | Biology students and researchers exploring the sample | Shows spread and overlap that a mean alone conceals; missing-sex rows need a separate category or explicit exclusion |
| 3. Island sample profile | Stacked count bars for species within each island, with a count/percentage toggle | Readers evaluating sampling coverage | Reveals the uneven geographic composition and cautions against interpreting counts as population abundance |

## Step 6 — Interactive chart

**Title:** Penguins, in proportion.  
**Subtitle:** How does flipper length relate to body mass? Explore measurements of three penguin species sampled in Antarctica, 2007–2009.

- D3 v7.9.0 parses the CSV snapshot, creates linear scales and labeled axes, and binds observations to SVG marks.
- The x-axis is flipper length (mm); the y-axis is body mass (g). Both use fixed, nonzero domains for consistent comparisons across filters.
- Species uses both color and shape. A legend identifies the encodings.
- Species and year dropdowns filter the data; Reset restores all 342 complete observations.
- Hover or tap reveals species, year, island, sex, flipper length, mass, and CSV row number. The native record dropdown supports keyboard inspection of every plotted row. Escape dismisses the tooltip.
- Data source, access date, exclusion rules, and license appear with the chart. The layout adapts to screen width.

### Files and reproducibility

- `index.html`, `style.css`, `chart.js`: working chart.
- `data/penguins.csv`: downloaded source snapshot.
- `data/penguins.js`: generated embedded copy for direct, offline opening.
- `data/summary.json`: machine-readable calculated statistics.
- `analyze.py`: rerun using `python3 analyze.py` from this folder; rebuilds both generated data files using only Python's standard library.
- `sketches.svg`: three design proposals.
- `vendor/d3.v7.min.js` and `vendor/LICENSE-d3`: vendored D3 and its ISC license.

### References

Horst, A. M., Hill, A. P., & Gorman, K. B. (2020). *palmerpenguins: Palmer Archipelago (Antarctica) penguin data*. https://doi.org/10.5281/zenodo.3960218

Gorman, K. B., Williams, T. D., & Fraser, W. R. (2014). *Ecological sexual dimorphism and environmental variability within a community of Antarctic penguins (genus Pygoscelis).* PLOS ONE, 9(3), e90081. https://doi.org/10.1371/journal.pone.0090081

### Browser checks

Verified in a browser on October 13, 2026: initial view shows 342 / 344 records; Gentoo filter shows 123 / 124; Gentoo + 2009 shows 43 / 44; selecting row 269 reveals its unknown sex and 4,875 g mass; Reset restores 342 points. On small screens the chart can be scrolled horizontally to keep labels legible.
