"""Audit all exported data against the original workbook. Requires openpyxl."""

from pathlib import Path
import csv, json, math, hashlib
import openpyxl

p = Path(__file__).resolve().parent
xlsx = p / "data/WHR26_Data_Figure_2.1.xlsx"
assert (
    hashlib.sha256(xlsx.read_bytes()).hexdigest()
    == "576e382655cec3ae704a0b41cd2c04465b87cd84b7f131a0c4fa26d41f6d8028"
)
w = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
values = list(w.active.values)
headers = tuple(h for h in values[0] if h is not None)
assert all(all(v is None for v in row[13:]) for row in values)
original = [
    dict(zip(headers, list(row[:13]) + [None] * max(0, 13 - len(row)))) for row in values[1:]
]
raw = list(csv.DictReader((p / "data/whr_figure_2_1.csv").open()))
assert len(original) == len(raw) == 2116 and len(headers) == 13
assert list(raw[0]) == list(headers)
for source, row in zip(original, raw):
    for k, v in source.items():
        if v is None:
            assert row[k] == "", (k, v, row[k])
        elif isinstance(v, str):
            assert v == row[k]
        else:
            assert math.isclose(v, float(row[k]), rel_tol=1e-14, abs_tol=1e-14), (k, v, row[k])


def js(name):
    text = (p / "data" / name).read_text()
    return json.loads(text.split(" = ", 1)[1].strip().removesuffix(";"))


history = js("history.js")
latest = js("happiness.js")
lookup = {(r["Country name"], int(r["Year"])): r for r in original}
assert len(history) == len(lookup) == 2116
assert len({(r["name"], r["year"]) for r in history}) == 2116
for r in history:
    s = lookup[r["country"], r["year"]]
    assert r["name"] == ({"Swaziland": "Eswatini"}.get(r["country"], r["country"]))
    for key, col in [
        ("score", "Life evaluation (3-year average)"),
        ("low", "Lower whisker"),
        ("high", "Upper whisker"),
    ]:
        assert r[key] == s[col]
assert len(latest) == 147
fields = {
    "score": "Life evaluation (3-year average)",
    "low": "Lower whisker",
    "high": "Upper whisker",
    "gdp": "Explained by: Log GDP per capita",
    "support": "Explained by: Social support",
    "health": "Explained by: Healthy life expectancy",
    "freedom": "Explained by: Freedom to make life choices",
    "generosity": "Explained by: Generosity",
    "corruption": "Explained by: Perceptions of corruption",
    "residual": "Dystopia + residual",
}
for r in latest:
    assert r["year"] == 2025
    s = lookup[r["country"], 2025]
    assert r["rank"] == s["Rank"]
    for key, col in fields.items():
        assert r[key] == s[col], (r["country"], key)
    assert r["low"] <= r["score"] <= r["high"]
    for key in ["gdp", "support", "health", "freedom", "generosity", "corruption"]:
        assert r[key] is None or 0 <= r[key] <= 2.2
residual_errors = [
    abs(
        sum(
            r[k]
            for k in ["gdp", "support", "health", "freedom", "generosity", "corruption", "residual"]
        )
        - r["score"]
    )
    for r in latest
    if all(
        r[k] is not None
        for k in ["gdp", "support", "health", "freedom", "generosity", "corruption", "residual"]
    )
]
assert max(residual_errors) < 0.004
print(
    "PASS: original XLSX hash; all 27,508 CSV data cells; 2,116 historical records; 147 latest records; nulls, alias uniqueness, CI bounds and common color domain."
)
print("Maximum score vs rounded decomposition difference:", round(max(residual_errors), 6))
