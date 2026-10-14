"""Export all original score snapshots for Concept A. No interpolation or imputation.
Only Swaziland → Eswatini is matched; original country labels remain in country.
"""
from pathlib import Path
import csv,json
p=Path(__file__).resolve().parent
raw=list(csv.DictReader((p/'data/whr_figure_2_1.csv').open()))
history=[dict(country=r['Country name'],name='Eswatini' if r['Country name']=='Swaziland' else r['Country name'],year=int(r['Year']),score=float(r['Life evaluation (3-year average)']),low=float(r['Lower whisker']) if r['Lower whisker'] else None,high=float(r['Upper whisker']) if r['Upper whisker'] else None) for r in raw]
(p/'data/history.js').write_text('// Generated from the unchanged official CSV by build_history.py.\nwindow.HAPPINESS_HISTORY = '+json.dumps(history,ensure_ascii=False,allow_nan=False)+';\n')
