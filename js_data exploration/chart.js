/* CSV row numbers are display identifiers, not biological individual IDs. */
// 1. Parse the saved data; explicitly preserve missing measurements as null.
const all = d3.csvParse(window.PENGUINS_CSV, (d, i) => ({...d, row:i+1, flipper:d.flipper_length_mm === 'NA' ? null : +d.flipper_length_mm, mass:d.body_mass_g === 'NA' ? null : +d.body_mass_g}));
const valid = all.filter(d => Number.isFinite(d.flipper) && Number.isFinite(d.mass));
// 2. Give every species a consistent color and symbol.
const colors = d3.scaleOrdinal(['Adelie','Chinstrap','Gentoo'], ['#247b78','#ad552c','#745895']);
const shapes = d3.scaleOrdinal(['Adelie','Chinstrap','Gentoo'], [d3.symbolCircle,d3.symbolTriangle,d3.symbolSquare]);
// 3. Define the drawing area and fixed scales for fair filtered comparisons.
const W=980,H=500,m={top:20,right:28,bottom:65,left:78};
const svg=d3.select('#chart').append('svg').attr('class','chart-svg').attr('viewBox',`0 0 ${W} ${H}`).attr('role','group').attr('aria-label','Scatterplot of penguin body mass versus flipper length, with keyboard-accessible records below.');
const x=d3.scaleLinear().domain([165,235]).range([m.left,W-m.right]);
const y=d3.scaleLinear().domain([2500,6500]).range([H-m.bottom,m.top]);
// 4. Draw grid lines, axes, and unit labels once.
svg.append('g').attr('class','grid').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(8).tickSize(-(W-m.left-m.right)).tickFormat(''));
svg.append('g').attr('transform',`translate(0,${H-m.bottom})`).call(d3.axisBottom(x).ticks(7));
svg.append('g').attr('transform',`translate(${m.left},0)`).call(d3.axisLeft(y).ticks(8).tickFormat(d3.format(',')));
svg.append('text').attr('x',(m.left+W-m.right)/2).attr('y',H-14).attr('text-anchor','middle').attr('fill','#203e3b').text('Flipper length (mm)');
svg.append('text').attr('transform','rotate(-90)').attr('x',-(m.top+H-m.bottom)/2).attr('y',19).attr('text-anchor','middle').attr('fill','#203e3b').text('Body mass (g)');
const marks=svg.append('g');
const tooltip=document.querySelector('#tooltip');
const describe=d=>`${d.species} · row ${d.row} · ${d.year} · ${d.island} Island · ${d.sex==='NA'?'sex unknown':d.sex} · flipper ${d.flipper} mm · mass ${d3.format(',')(d.mass)} g`;
function inspect(d){document.querySelector('#details').textContent=describe(d);document.querySelector('#record').value=d.row;}
function hide(){tooltip.hidden=true;}
function show(event,d){inspect(d);tooltip.textContent=describe(d);tooltip.hidden=false;const rect=event.currentTarget.getBoundingClientRect();const px=event.clientX || rect.x;const py=event.clientY || rect.y;tooltip.style.left=Math.max(8,Math.min(window.innerWidth-tooltip.offsetWidth-8,px+14))+'px';tooltip.style.top=Math.max(8,Math.min(window.innerHeight-tooltip.offsetHeight-8,py+14))+'px';}
// 5. Filter observations and update only the marks and record selector.
function render(){
 hide();const species=document.querySelector('#species').value,year=document.querySelector('#year').value;
 const chosen=all.filter(d=>(species==='all'||d.species===species)&&(year==='all'||d.year===year));
 const rows=valid.filter(d=>(species==='all'||d.species===species)&&(year==='all'||d.year===year));
 document.querySelector('#count').textContent=`${rows.length} plotted / ${chosen.length} matching records · ${chosen.length-rows.length} excluded`;
 marks.selectAll('path').data(rows,d=>d.row).join('path').attr('class','point').attr('d',d=>d3.symbol().type(shapes(d.species)).size(62)()).attr('transform',d=>`translate(${x(d.flipper)},${y(d.mass)})`).attr('fill',d=>colors(d.species)).attr('tabindex',-1).attr('aria-label',describe).on('pointerenter',show).on('pointermove',show).on('pointerleave',hide).on('click',show).on('focus',show).on('blur',hide);
 d3.select('#record').selectAll('option').data(rows,d=>d.row).join('option').attr('value',d=>d.row).text(d=>`Row ${d.row} · ${d.species}`);
 if(rows.length) inspect(rows[0]);else document.querySelector('#details').textContent='No records match the filters.';
}
// 6. Connect controls to the update function.
d3.selectAll('#species,#year').on('change',render);
d3.select('#record').on('change',function(){const d=valid.find(d=>d.row===+this.value);if(d)inspect(d);});
d3.select('#reset').on('click',()=>{document.querySelector('#species').value='all';document.querySelector('#year').value='all';render();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
render();
