// Run with: node tests/validate-layout.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
async function main() {
const response = await fetch('https://cdn.jsdelivr.net/npm/d3@7');
assert.ok(response.ok, `D3 CDN returned HTTP ${response.status}`);
const libraryContext = vm.createContext({});
vm.runInContext(await response.text(), libraryContext);
const d3 = libraryContext.d3;
const context = { d3, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'script.js'), 'utf8'), context);
const rows = d3.csvParse(fs.readFileSync(path.join(root, 'data/population.csv'), 'utf8'), d =>
  ({ ...d, population: +d.population, rank: +d.rank }));
assert.equal(rows.length, 62);
assert.equal(new Set(rows.map(d => d.country)).size, rows.length);
rows.forEach((d, i) => {
  assert.equal(d.rank, i + 1);
  assert.ok(d.population >= 20e6);
  if (i) assert.ok(rows[i - 1].population >= d.population);
});
context.rows = rows;
const result = vm.runInContext('buildLayout(rows)', context);
assert.ok(result.maxError < .0001, `Area error ${result.maxError} exceeds tolerance`);
const circleArea = 128 * Math.sin(Math.PI / 128);
const totalArea = d3.sum(rows, d => Math.abs(d3.polygonArea(d.polygon)));
assert.ok(Math.abs(totalArea - circleArea) < 1e-8, 'Cells must cover the circle');
for (const d of rows) {
  assert.ok(d.polygon.length >= 3);
  assert.ok(d3.polygonContains(d.polygon, d.center));
  assert.ok(d.polygon.every(p => Math.hypot(...p) <= 1 + 1e-9));
}
// Intersect every pair to ensure that separate country interiors do not overlap.
context.overlapTest = rows;
const overlap = vm.runInContext(`(() => {
  let maximum = 0;
  for (let i=0;i<rows.length;i++) for (let j=i+1;j<rows.length;j++) {
    let cell=rows[i].polygon;
    const boundary=rows[j].polygon, center=centroid(boundary);
    for (let k=0;k<boundary.length && cell.length;k++) {
      const p=boundary[k], q=boundary[(k+1)%boundary.length];
      let a=q[1]-p[1], b=p[0]-q[0], c=a*p[0]+b*p[1];
      if(a*center[0]+b*center[1]>c) {a=-a;b=-b;c=-c;}
      cell=clip(cell,a,b,c);
    }
    maximum=Math.max(maximum,area(cell));
  }
  return maximum;
})()`, context);
assert.ok(overlap < 1e-8, `Overlapping area: ${overlap}`);
console.log(`PASS: ${rows.length} cells; full coverage; no overlapping interiors; maximum relative area error ${(result.maxError * 100).toFixed(6)}%.`);

}
main().catch(error => { console.error(error); process.exitCode = 1; });
