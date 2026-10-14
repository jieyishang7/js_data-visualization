"""Read-only EDA of the official WHR workbook; outputs review tables only.
Requires pandas and openpyxl. Does not edit the source workbook or chart.
"""

from pathlib import Path
import json
import pandas as pd

ROOT = Path(__file__).resolve().parent
source = ROOT / "data/WHR26_Data_Figure_2.1.xlsx"
df = pd.read_excel(source)
score = "Life evaluation (3-year average)"
latest = df[df.Year == 2025].copy()
# One verified historical-name alias. Preserve source labels in the workbook.
# https://www.un.org/en/about-us/member-states/eswatini
alias = {"Swaziland": "Eswatini"}
df["comparison_name"] = df["Country name"].replace(alias)
a = df[df.Year == 2019].copy()
b = df[df.Year == 2025].copy()
assert not a.comparison_name.duplicated().any() and not b.comparison_name.duplicated().any()
matched = a[["comparison_name", score]].merge(
    b[["comparison_name", score]],
    on="comparison_name",
    suffixes=("_2019", "_2025"),
    validate="one_to_one",
)
matched["change"] = matched[score + "_2025"] - matched[score + "_2019"]
matched = matched.sort_values("change", ascending=False)
matched.to_csv(ROOT / "matched_changes.csv", index=False)
q1, q3 = latest[score].quantile([0.25, 0.75])
lower = q1 - 1.5 * (q3 - q1)
upper = q3 + 1.5 * (q3 - q1)
bins = [int(((latest[score] >= lo) & (latest[score] < lo + 1)).sum()) for lo in range(10)]
stats = {
    "shape": [len(df), 13],
    "country_labels": int(df["Country name"].nunique()),
    "latest_describe": latest[score].describe().to_dict(),
    "latest_quantiles": latest[score].quantile([0.1, 0.25, 0.5, 0.75, 0.9]).to_dict(),
    "histogram_width_1": bins,
    "iqr_fences": [lower, upper],
    "iqr_outliers": latest.loc[
        (latest[score] < lower) | (latest[score] > upper), ["Country name", score]
    ].to_dict("records"),
    "matched_n": len(matched),
    "name_mapping": alias,
    "only_2019": sorted(set(a.comparison_name) - set(b.comparison_name)),
    "only_2025": sorted(set(b.comparison_name) - set(a.comparison_name)),
    "change_mean": float(matched.change.mean()),
    "increased": int((matched.change > 0).sum()),
    "decreased": int((matched.change < 0).sum()),
    "unchanged": int((matched.change == 0).sum()),
    "gainers": matched.head(5).to_dict("records"),
    "decliners": matched.tail(5).sort_values("change").to_dict("records"),
    "period_stats": {},
    "latest_factor_stats": {},
    "similar_example": latest.loc[latest["Country name"].isin(["Benin", "Lesotho"])].to_dict(
        "records"
    ),
}
for year in [2019, 2025]:
    v = matched[score + "_" + str(year)]
    stats["period_stats"][year] = {
        "n": len(v),
        "mean": float(v.mean()),
        "median": float(v.median()),
        "p10": float(v.quantile(0.1)),
        "p90": float(v.quantile(0.9)),
        "p90_p10_gap": float(v.quantile(0.9) - v.quantile(0.1)),
        "range": float(v.max() - v.min()),
    }
for col in latest.columns:
    if col.startswith("Explained by:") or col == "Dystopia + residual":
        v = latest[col].dropna()
        stats["latest_factor_stats"][col] = {
            "n": len(v),
            "min": float(v.min()),
            "max": float(v.max()),
            "mean": float(v.mean()),
            "median": float(v.median()),
            "range": float(v.max() - v.min()),
        }
(ROOT / "review_statistics.json").write_text(json.dumps(stats, indent=2, allow_nan=False) + "\n")
print(
    json.dumps(
        {k: v for k, v in stats.items() if k not in ["similar_example", "latest_factor_stats"]},
        indent=2,
    )
)
