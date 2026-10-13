/* World Happiness Report 2026: Year=2025 rows are the 2023–2025 averages.
 * Source ranks are preserved. The six factors are MODEL CONTRIBUTIONS,
 * measured in score points, not the raw economic or survey variables.
 */

// 1. Keep configuration and input data at the top.
const data = window.HAPPINESS_DATA.slice().sort((a, b) => a.rank - b.rank);
const width = 770;
const margin = {top: 74, right: 65, bottom: 20, left: 210};
const rowHeight = 33;
const format = d3.format('.3f');
const x = d3.scaleLinear().domain([0, 10]).range([margin.left, width - margin.right]);
const view = document.querySelector('#view');
const search = document.querySelector('#search');
const intervals = document.querySelector('#intervals');
const tooltip = document.querySelector('#tooltip');
let selectedCountry = data[0].country;

// 2. Create one SVG; each update joins the currently displayed countries.
const svg = d3.select('#chart').append('svg')
  .attr('class', 'chart-svg').attr('role', 'group')
  .attr('aria-label', 'Ranked life evaluation bars on a fixed zero to ten axis.');
const grid = svg.append('g').attr('class', 'grid');
const axis = svg.append('g').attr('transform', `translate(0,${margin.top - 18})`);
svg.append('text').attr('class', 'axis-title').attr('x', margin.left).attr('y', 19)
  .text('Average life evaluation (0 = worst possible life; 10 = best)');
svg.append('text').attr('class', 'axis-title').attr('x', 8).attr('y', 42).text('Rank / country or territory');
const bars = svg.append('g');

function describe(d) {
  return `${d.country} · rank ${d.rank} of 147\nLife evaluation: ${format(d.score)} / 10\n95% confidence interval: ${format(d.low)}–${format(d.high)}\nSurvey window: 2023–2025`;
}

// 3. Clicking or keyboard selection reveals the score and model components.
function inspect(d) {
  selectedCountry = d.country;
  bars.selectAll('.country-row').classed('selected', r => r.country === d.country);
  const detail = d3.select('#details');
  detail.selectAll('*').remove();
  detail.append('h2').attr('id', 'detail-title').text(d.country);
  detail.append('p').text(`Rank ${d.rank} of 147 · WHR 2026`);
  const score = detail.append('p').attr('class', 'score').text(format(d.score));
  score.append('small').text(' / 10');
  detail.append('p').text(`95% CI: ${format(d.low)}–${format(d.high)}`);
  detail.append('h3').text('Model decomposition');
  detail.append('p').attr('class', 'small').text('Contributions in life evaluation points, relative to the report’s Dystopia benchmark. These are not causal effects or raw indicator values.');
  const list = detail.append('dl').attr('class', 'factor-list');
  for (const [key, label] of [['gdp','Log GDP per capita'], ['support','Social support'],
    ['health','Healthy life expectancy'], ['freedom','Freedom of choice'],
    ['generosity','Generosity'], ['corruption','Perceptions of corruption'],
    ['residual','Dystopia + residual']]) {
    list.append('dt').text(label);
    list.append('dd').text(d[key] === null ? 'Not available' : format(d[key]));
  }
  detail.append('p').attr('class','small').text('Source values are rounded; components may not sum exactly to the displayed score. Missing values are not replaced with zero.');
}

function hideTooltip() { tooltip.hidden = true; }
function showTooltip(event, d) {
  tooltip.textContent = describe(d);
  tooltip.hidden = false;
  const rect = event.currentTarget.getBoundingClientRect();
  const px = Number.isFinite(event.clientX) ? event.clientX : rect.left + 40;
  const py = Number.isFinite(event.clientY) ? event.clientY : rect.top;
  tooltip.style.left = Math.max(8, Math.min(window.innerWidth - tooltip.offsetWidth - 8, px + 14)) + 'px';
  tooltip.style.top = Math.max(8, Math.min(window.innerHeight - tooltip.offsetHeight - 8, py + 14)) + 'px';
}

// 4. Search checks the complete latest snapshot. Group filters apply otherwise.
function render() {
  hideTooltip();
  const query = search.value.trim().toLocaleLowerCase();
  view.disabled = Boolean(query);
  let rows = query ? data.filter(d => d.country.toLocaleLowerCase().includes(query))
    : view.value === 'top' ? data.slice(0, 20)
    : view.value === 'bottom' ? data.slice(-20) : data;
  const height = margin.top + rows.length * rowHeight + margin.bottom;
  svg.attr('viewBox', `0 0 ${width} ${height}`).style('display', rows.length ? null : 'none');
  document.querySelector('#empty').hidden = rows.length > 0;
  document.querySelector('#count').textContent = `${rows.length} of 147 countries & territories · ${query ? 'Search results' : view.options[view.selectedIndex].text} · 2023–2025`;
  axis.call(d3.axisTop(x).tickValues(d3.range(0, 11)).tickSizeOuter(0));
  grid.attr('transform', `translate(0,${margin.top - 12})`)
    .call(d3.axisTop(x).tickValues(d3.range(0, 11)).tickFormat('')
      .tickSize(-(rows.length * rowHeight + 12)));

  const groups = bars.selectAll('.country-row').data(rows, d => d.country).join(enter => {
    const g = enter.append('g').attr('class', 'country-row').attr('tabindex', 0).attr('role', 'button');
    g.append('rect').attr('class', 'row-bg');
    g.append('text').attr('class', 'rank');
    g.append('text').attr('class', 'country-name');
    g.append('rect').attr('class', 'bar');
    g.append('path').attr('class', 'whisker');
    g.append('text').attr('class', 'score-label');
    return g;
  });
  groups.attr('transform', (d, i) => `translate(0,${margin.top + i * rowHeight})`)
    .attr('aria-label', d => describe(d).replaceAll('\n', '. ') + '. Select for details.')
    .on('pointerenter', showTooltip).on('pointermove', showTooltip).on('pointerleave', hideTooltip)
    .on('focus', (event, d) => { inspect(d); showTooltip(event, d); }).on('blur', hideTooltip)
    .on('click', (event, d) => { inspect(d); hideTooltip(); })
    .on('keydown', (event, d) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inspect(d); hideTooltip(); } });
  groups.select('.row-bg').attr('width', width).attr('height', rowHeight);
  groups.select('.rank').attr('x', 8).attr('y', 22).text(d => d.rank);
  groups.select('.country-name').attr('x', margin.left - 12).attr('y', 22).attr('text-anchor', 'end').text(d => d.country);
  groups.select('.bar').attr('x', x(0)).attr('y', 8).attr('height', 19).attr('width', d => x(d.score) - x(0));
  groups.select('.whisker').attr('d', d => `M${x(d.low)},12V23M${x(d.low)},17.5H${x(d.high)}M${x(d.high)},12V23`)
    .style('display', intervals.checked ? null : 'none');
  groups.select('.score-label').attr('x', d => x(d.high) + 9).attr('y', 22).text(d => format(d.score));

  // A real HTML table provides a readable alternative to the SVG.
  const tableRows = d3.select('#data-table').selectAll('tr').data(rows, d => d.country).join('tr');
  tableRows.selectAll('td').data(d => [d.rank, d.country, format(d.score), format(d.low), format(d.high)]).join('td').text(d => d);
  if (rows.length) inspect(rows.find(d => d.country === selectedCountry) || rows[0]);
  else {
    d3.select('#details').selectAll('*').remove();
    d3.select('#details').append('h2').attr('id', 'detail-title').text('No matching country');
  }
  document.querySelector('#chart').scrollTop = 0;
}

// 5. Connect native controls to the same update function.
view.addEventListener('change', render);
search.addEventListener('input', render);
intervals.addEventListener('change', render);
document.querySelector('#reset').addEventListener('click', () => {
  view.value = 'top'; search.value = ''; intervals.checked = true;
  selectedCountry = data[0].country; render();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTooltip(); });
render();
