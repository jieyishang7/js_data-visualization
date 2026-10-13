"""Recompute descriptive statistics and the offline data bundle. Python standard library only."""
from pathlib import Path
import csv, json, statistics, collections
root=Path(__file__).resolve().parent
raw=(root/'data/penguins.csv').read_text()
rows=list(csv.DictReader(raw.splitlines()))
report={'rows':len(rows),'columns':len(rows[0]),'variables':{},'species_summary':{}}
for key in rows[0]:
    values=[r[key] for r in rows if r[key] not in ('NA','')]
    entry={'missing':len(rows)-len(values),'unique_nonmissing':len(set(values))}
    if key.endswith(('_mm','_g')):
        nums=list(map(float,values))
        entry.update(n=len(nums),minimum=min(nums),maximum=max(nums),mean=statistics.mean(nums),median=statistics.median(nums),range=max(nums)-min(nums))
    else: entry['counts']=dict(collections.Counter(values))
    report['variables'][key]=entry
for species in sorted(set(r['species'] for r in rows)):
    group=[r for r in rows if r['species']==species]
    mass=[float(r['body_mass_g']) for r in group if r['body_mass_g']!='NA']
    report['species_summary'][species]={'rows':len(group),'percent':100*len(group)/len(rows),'mass_n':len(mass),'mean_mass_g':statistics.mean(mass)}
(root/'data/summary.json').write_text(json.dumps(report,indent=2)+'\n')
(root/'data/penguins.js').write_text('// Embedded CSV snapshot allows index.html to work offline.\nwindow.PENGUINS_CSV = '+json.dumps(raw)+';\n')
print(json.dumps(report,indent=2))
