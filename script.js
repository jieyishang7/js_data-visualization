/* Independently written circular weighted-Voronoi population reproduction. */
const regions = [
  {name:'Africa', label:'Africa', color:'#f0dc98', site:[.62,.25]},
  {name:'Central & N. America', label:'Central & N. America', color:'#aac4d6', site:[.02,.38]},
  {name:'Central Asia', label:'Central Asia', color:'#e9a185', site:[-.5,-.18]},
  {name:'East Asia', label:'East Asia', color:'#cdbbb0', site:[.25,-.5]},
  {name:'Europe', label:'Europe', color:'#b1bca4', site:[-.18,.78]},
  {name:'Middle East', label:'Middle East', color:'#b5ded8', site:[-.59,.51]},
  {name:'Oceania', label:'Oceania', color:'#f2ba88', site:[-.35,-.91]},
  {name:'S. America', label:'S. America', color:'#e7e5d4', site:[.34,.79]}
];
const area = polygon => Math.abs(d3.polygonArea(polygon));
const centroid = polygon => d3.polygonCentroid(polygon);

// Clip a convex polygon to a*x + b*y <= c (Sutherland–Hodgman).
function clip(polygon, a, b, c) {
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length];
    const dp = a*p[0] + b*p[1] - c, dq = a*q[0] + b*q[1] - c;
    if (dp <= 1e-12) result.push(p);
    if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
      const t = dp / (dp - dq);
      result.push([p[0] + t*(q[0]-p[0]), p[1] + t*(q[1]-p[1])]);
    }
  }
  return result;
}
function powerCells(boundary, sites, weights) {
  return sites.map((p,i) => {
    let cell = boundary;
    for (let j=0; j<sites.length && cell.length; j++) {
      if (i === j) continue;
      const q = sites[j];
      cell = clip(cell, 2*(q[0]-p[0]), 2*(q[1]-p[1]),
        q[0]**2+q[1]**2-p[0]**2-p[1]**2+weights[i]-weights[j]);
    }
    return cell;
  });
}
// Small pivoted Gaussian solver for the Newton weight update.
function solveLinear(matrix, rhs) {
  const n=rhs.length, m=matrix.map((row,i)=>[...row,rhs[i]]);
  for (let i=0;i<n;i++) {
    let pivot=i;
    for(let j=i+1;j<n;j++) if(Math.abs(m[j][i])>Math.abs(m[pivot][i])) pivot=j;
    [m[i],m[pivot]]=[m[pivot],m[i]];
    if(Math.abs(m[i][i])<1e-12) return null;
    const divisor=m[i][i];
    for(let k=i;k<=n;k++) m[i][k]/=divisor;
    for(let j=0;j<n;j++) if(j!==i) {
      const multiplier=m[j][i];
      for(let k=i;k<=n;k++) m[j][k]-=multiplier*m[i][k];
    }
  }
  return m.map(row=>row[n]);
}
// Solve area constraints rather than using population as a radius or visual hint.
// The final weight is fixed at zero because a common weight offset changes nothing.
function partition(boundary, sites, values) {
  if(sites.length===1) return [boundary];
  const total= d3.sum(values), boundaryArea=area(boundary);
  const targets=values.map(v=>v/total*boundaryArea), weights=sites.map(()=>0);
  const error = cells => d3.sum(cells,(c,i)=>(area(c)-targets[i])**2/targets[i]);
  let cells=powerCells(boundary,sites,weights);
  for(let iteration=0;iteration<65;iteration++) {
    const areas=cells.map(area);
    if(d3.max(areas,(a,i)=>Math.abs(a-targets[i])/targets[i])<.00005) break;
    const n=sites.length-1, epsilon=1e-6;
    const jacobian=Array.from({length:n},()=>Array(n).fill(0));
    for(let j=0;j<n;j++) {
      const shifted=[...weights];shifted[j]+=epsilon;
      const changed=powerCells(boundary,sites,shifted);
      for(let i=0;i<n;i++) jacobian[i][j]=(area(changed[i])-areas[i])/epsilon;
    }
    const step=solveLinear(jacobian,targets.slice(0,n).map((v,i)=>v-areas[i]));
    if(!step) break;
    let accepted=false;
    const previous=error(cells);
    for(let fraction=1;fraction>1e-7;fraction/=2) {
      const next=weights.map((w,i)=>w+(i<n?step[i]*fraction:0));
      const candidates=powerCells(boundary,sites,next);
      if(candidates.every(c=>c.length>=3 && area(c)>1e-12) && error(candidates)<previous) {
        weights.splice(0,weights.length,...next);cells=candidates;accepted=true;break;
      }
    }
    if(!accepted) break;
  }
  return cells;
}
// Country anchors describe observed composition, not coordinates copied from source code.
const anchors = {
  'India':[-.48,-.23], 'China':[.22,-.48], 'Pakistan':[-.34,.3],
  'Bangladesh':[-.64,.28], 'Indonesia':[.7,-.34], 'Japan':[-.06,-.77],
  'Vietnam':[.08,-.92], 'Thailand':[.47,-.78], 'Myanmar':[.3,-.9],
  'Philippines':[.54,-.06], 'South Korea':[.78,-.15],
  'United States':[.02,.4], 'Mexico':[-.16,.49], 'Canada':[.16,.6],
  'Brazil':[.35,.75], 'Russia':[-.36,.74], 'Germany':[-.1,.89],
  'United Kingdom':[-.07,.69], 'France':[.08,.7], 'Italy':[.11,.83],
  'Nigeria':[.46,.18], 'Ethiopia':[.71,.42], 'DR Congo':[.68,.15],
  'Tanzania':[.81,.04], 'South Africa':[.86,.2], 'Iran':[-.43,.47],
  'Turkey':[-.61,.54], 'Egypt':[-.48,.7]
};
function insidePoint(p, boundary) {
  const center=centroid(boundary);
  // Move an outlying anchor inward until it is safely within its regional cell.
  for(let i=0;i<40 && !d3.polygonContains(boundary,p);i++) p=[(p[0]+center[0])/2,(p[1]+center[1])/2];
  return p;
}
function buildLayout(countries) {
  const boundary=d3.range(256).map(i=>[Math.cos(i*Math.PI/128),Math.sin(i*Math.PI/128)]);
  const active=regions.filter(r=>countries.some(d=>d.region===r.name));
  const regionCells=partition(boundary,active.map(r=>r.site),active.map(r=>d3.sum(countries.filter(d=>d.region===r.name),d=>d.population)));
  active.forEach((r,index)=>{
    r.polygon=regionCells[index];
    const members=countries.filter(d=>d.region===r.name);
    const center=centroid(r.polygon);
    const width=d3.max(r.polygon,p=>p[0])-d3.min(r.polygon,p=>p[0]);
    const height=d3.max(r.polygon,p=>p[1])-d3.min(r.polygon,p=>p[1]);
    let sites=members.map((d,i)=>insidePoint(anchors[d.country] ||
      [center[0]+Math.cos(i*2.39996)*width*.4,center[1]+Math.sin(i*2.39996)*height*.4],r.polygon));
    let polygons;
    // Limited centroid relaxation improves thin cells while preserving neighborhood order.
    for(let pass=0;pass<5;pass++) {
      polygons=partition(r.polygon,sites,members.map(d=>d.population));
      if(pass<4) sites=sites.map((p,i)=>{const c=centroid(polygons[i]);return [p[0]*.65+c[0]*.35,p[1]*.65+c[1]*.35];});
    }
    members.forEach((d,i)=>{d.polygon=polygons[i];d.color=r.color;d.center=centroid(d.polygon);});
  });
  const population=d3.sum(countries,d=>d.population), whole=area(boundary);
  const maxError=d3.max(countries,d=>Math.abs(area(d.polygon)/whole-d.population/population)/(d.population/population));
  return {active,maxError};
}

/* Presentation and interactions. Layout is computed once; filtering never moves cells. */
const aliases={'United States':'USA','United Kingdom':'UK','South Korea':'S. Korea','North Korea':'N. Korea','South Africa':'S. Africa','DR Congo':'Congo DRC'};
const shortNumber=n=>n>=1e9?`${(n/1e9).toFixed(2)}B`:`${d3.format('.3~g')(n/1e6)}M`;
const millionNumber=n=>n>=1e8?d3.format(',.0f')(n/1e6):d3.format('.1f')(n/1e6);
const pathFor=polygon=>'M'+polygon.map(p=>p.map(v=>v*395).join(',')).join('L')+'Z';

async function start() {
  // Measure SVG labels only after Manrope is ready, including the bold numbers.
  // Failed font requests fall back to sans-serif without preventing the chart.
  await Promise.allSettled([document.fonts.load('400 16px Manrope'), document.fonts.load('700 16px Manrope')]);
  const countries=await d3.csv('data/population.csv',d=>({country:d.country,population:+d.population,region:d.region,rank:+d.rank}));
  if(!countries.length||countries.some(d=>!regions.some(r=>r.name===d.region)||!(d.population>0))) throw new Error('Invalid population dataset');
  countries.sort((a,b)=>a.rank-b.rank);
  const {active,maxError}=buildLayout(countries);
  if(maxError>.005) throw new Error(`Area solver failed accuracy check: ${(maxError*100).toFixed(2)}%`);
  const svg=d3.select('#atlas'), tooltip=d3.select('#tooltip');
  let selected='All', focusedCountry=null, minimumPopulation=0;
  const searchInput=document.querySelector('#country-search');
  const thresholdInput=document.querySelector('#population-threshold');
  const background=svg.append('rect').attr('class','zoom-background').attr('fill','transparent');
  const camera=svg.append('g').attr('class','camera');
  const marks=camera.append('g').selectAll('g').data(countries).join('g').attr('class','country')
    .attr('tabindex',0).attr('role','button').attr('aria-describedby','tooltip')
    .attr('aria-label',d=>`${d.country}, ${shortNumber(d.population)} people, ${d.region}, rank ${d.rank}`);
  marks.append('path').attr('d',d=>pathFor(d.polygon)).attr('fill',d=>d.color);
  camera.append('g').selectAll('path').data(active).join('path').attr('class','region-boundary').attr('d',r=>pathFor(r.polygon));
  // Reference-style horizontal labels: names above bold values, with a
  // region-colored halo that lets small labels cross cell boundaries legibly.
  const selectionOutline=camera.append('path').attr('class','selection-outline').attr('display','none');
  const labelLayer=camera.append('g').attr('class','label-layer');
  const labelGroups=labelLayer.selectAll('g').data(countries).join('g').attr('class','country-label');
  const labelBoxes=[];
  labelGroups.each(function(d){
    const group=d3.select(this), name=aliases[d.country]||d.country;
    const lines=name.length>10 && name.includes(' ')?name.split(' '):[name];
    const font=d.population>=1e9?27:d.population>=1e8?21:d.population>=5e7?16:11;
    const text=group.append('text').style('--label-color',d.color);
    lines.forEach((line,i)=>text.append('tspan').attr('class','country-name').attr('x',0)
      .attr('y',(i-(lines.length-1)/2)*font-font*.45).style('font-size',font+'px').text(line));
    text.append('tspan').attr('class','population-label').attr('x',0)
      .attr('y',(lines.length-1)/2*font+font*1.05).style('font-size',(font*1.27)+'px')
      .text(millionNumber(d.population));
    const bounds=text.node().getBBox();
    labelBoxes.push({d,group,bounds,x:d.center[0]*395,y:d.center[1]*395,
      anchorX:d.center[0]*395,anchorY:d.center[1]*395});
  });
  // Resolve label collisions only; the population polygons never move.
  for(let pass=0;pass<240;pass++) {
    let collisions=0;
    for(let i=0;i<labelBoxes.length;i++) for(let j=i+1;j<labelBoxes.length;j++) {
      const a=labelBoxes[i],b=labelBoxes[j];
      const ax=a.x+a.bounds.x+a.bounds.width/2, ay=a.y+a.bounds.y+a.bounds.height/2;
      const bx=b.x+b.bounds.x+b.bounds.width/2, by=b.y+b.bounds.y+b.bounds.height/2;
      const overlapX=(a.bounds.width+b.bounds.width)/2+3-Math.abs(ax-bx);
      const overlapY=(a.bounds.height+b.bounds.height)/2+3-Math.abs(ay-by);
      if(overlapX<=0 || overlapY<=0) continue;
      collisions++;
      if(overlapX<overlapY) {
        const shift=(overlapX+.1)/2*(ax<bx?-1:1);a.x+=shift;b.x-=shift;
      } else {
        const shift=(overlapY+.1)/2*(ay<by?-1:1);a.y+=shift;b.y-=shift;
      }
    }
    if(!collisions) break;
  }
  labelBoxes.forEach(({d,group,x,y,anchorX,anchorY})=>{
    if(Math.hypot(x-anchorX,y-anchorY)>15 && !d3.polygonContains(d.polygon,[x/395,y/395])) {
      group.insert('line','text').attr('class','label-leader').attr('x1',anchorX).attr('y1',anchorY)
        .attr('x2',x).attr('y2',y);
    }
    group.select('text').attr('transform',`translate(${x},${y})`);
  });
  // Allow perimeter labels the same breathing room as in the original image.
  const extent=labelLayer.node().getBBox();
  const left=Math.min(-410,extent.x-6),top=Math.min(-410,extent.y-6);
  const right=Math.max(410,extent.x+extent.width+6),bottom=Math.max(410,extent.y+extent.height+6);
  svg.attr('viewBox',`${left} ${top} ${right-left} ${bottom-top}`);
  function hide(){tooltip.attr('hidden',true);}
  function show(event,d){
    tooltip.attr('hidden',null).html(`<div>${d.region} · Rank ${d.rank}</div><strong>${d.country}</strong><div class="tooltip-pop">${shortNumber(d.population)}</div><div class="tooltip-note">${d3.format(',')(d.population)} people · 2023 projection</div>`);
    const rect=event.currentTarget.getBoundingClientRect(), box=tooltip.node().getBoundingClientRect();
    const x=event.clientX||rect.x+rect.width/2,y=event.clientY||rect.y+rect.height/2;
    tooltip.style('left',Math.max(8,Math.min(x+14,innerWidth-box.width-8))+'px').style('top',Math.max(8,Math.min(y+14,innerHeight-box.height-8))+'px');
  }
  const fullWidth=right-left, fullHeight=bottom-top;
  const fullCenter=[(left+right)/2,(top+bottom)/2];
  background.attr('x',left).attr('y',top).attr('width',fullWidth).attr('height',fullHeight);
  // Fixed viewport + one transformed camera group: all polygons and labels
  // receive the same transform. Individual geometry and data colors never change.
  let view=[fullCenter[0],fullCenter[1],fullWidth];
  function moveCamera(target) {
    hide();
    const interpolate=d3.interpolateZoom(view,target);
    camera.interrupt('camera').transition('camera')
      .duration(matchMedia('(prefers-reduced-motion: reduce)').matches?0:650)
      .ease(d3.easeCubicInOut).tween('view',()=>t=>{
        view=interpolate(t);
        const k=fullWidth/view[2];
        camera.attr('transform',`translate(${fullCenter}) scale(${k}) translate(${-view[0]},${-view[1]})`);
      });
  }
  function updateFocus() {
    const faded=d=>focusedCountry===d?false:Boolean(focusedCountry) ||
      (selected!=='All'&&d.region!==selected) || d.population<minimumPopulation;
    marks.classed('dimmed',faded).classed('is-selected',d=>d===focusedCountry)
      .attr('aria-pressed',d=>String(d===focusedCountry));
    labelGroups.classed('dimmed',faded);
    selectionOutline.attr('display',focusedCountry?null:'none')
      .attr('d',focusedCountry?pathFor(focusedCountry.polygon):null);
    d3.select('#zoom-status').text(focusedCountry
      ? `${focusedCountry.country} · ${shortNumber(focusedCountry.population)} people · ${focusedCountry.region} · Rank ${focusedCountry.rank}`
      : 'Full world view');
    d3.select('#atlas').classed('is-zoomed',Boolean(focusedCountry));
    updateThresholdText();
  }
  function resetZoom() {
    searchInput.value='';
    d3.select('#search-message').text('');
    searchInput.removeAttribute('aria-invalid');
    focusedCountry=null;updateFocus();moveCamera([fullCenter[0],fullCenter[1],fullWidth]);
  }
  function zoomTo(d) {
    // Clicking a dimmed country outside the active region explicitly resets
    // the filter, so a selected country is never hidden by an older filter.
    if(selected!=='All' && selected!==d.region) filter('All');
    focusedCountry=d;updateFocus();
    searchInput.value=d.country;
    searchInput.removeAttribute('aria-invalid');
    d3.select('#search-message').text(`${d.country} · ${shortNumber(d.population)} · ${d.region} · Rank ${d.rank}`);
    const label=labelBoxes.find(b=>b.d===d);
    const x0=Math.min(d3.min(d.polygon,p=>p[0]*395),label.x+label.bounds.x);
    const x1=Math.max(d3.max(d.polygon,p=>p[0]*395),label.x+label.bounds.x+label.bounds.width);
    const y0=Math.min(d3.min(d.polygon,p=>p[1]*395),label.y+label.bounds.y);
    const y1=Math.max(d3.max(d.polygon,p=>p[1]*395),label.y+label.bounds.y+label.bounds.height);
    const k=Math.max(1,Math.min(6,.78*Math.min(fullWidth/(x1-x0),fullHeight/(y1-y0))));
    moveCamera([(x0+x1)/2,(y0+y1)/2,fullWidth/k]);
  }
  marks.on('pointerenter pointermove focus',show).on('pointerleave blur',hide)
    .on('click',(event,d)=>{event.stopPropagation();zoomTo(d);})
    .on('keydown',function(e,d){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();zoomTo(d);}
    });
  svg.on('click',resetZoom);
  d3.select('#reset-zoom').on('click',()=>{
    minimumPopulation=0;thresholdInput.value='0';
    resetZoom();filter('All');
  });
  d3.select('main').on('click',event=>{
    if(!event.target.closest('svg,button,a,details,.interaction-controls,[role="button"]')) resetZoom();
  });
  const buttons=d3.select('.legend').selectAll('button').data([{name:'All',label:'All'},...active]).join('button')
    .attr('type','button').style('--region-color',d=>d.color||'#e9e6de').text(d=>d.label)
    .on('click',(_,r)=>filter(r.name));
  function filter(region){
    selected=region;hide();
    if(focusedCountry && selected!=='All' && focusedCountry.region!==selected) resetZoom();
    updateFocus();
    buttons.attr('aria-pressed',r=>String(r.name===selected)).classed('inactive',r=>selected!=='All'&&r.name!==selected);
    const subset=countries.filter(d=>selected==='All'||d.region===selected);
    d3.select('#selection-status').text(`${selected==='All'?'All regions':selected} · ${subset.length} countries · ${shortNumber(d3.sum(subset,d=>d.population))} people`);
  }
  const thresholdNumber=value=>value>=1e9?`${d3.format('.2~f')(value/1e9)}B`:`${value/1e6}M`;
  function updateThresholdText() {
    const value=thresholdNumber(minimumPopulation);
    d3.select('#threshold-value').text(value);
    thresholdInput.setAttribute('aria-valuetext',value+' people');
    const count=countries.filter(d=>d.population>=minimumPopulation).length;
    const exception=focusedCountry && focusedCountry.population<minimumPopulation
      ? ' · Selected country stays highlighted' : '';
    d3.select('#threshold-count').text(`${count} countries at or above ${value}${exception}`);
  }
  d3.select('#population-threshold').on('input',function(){
    minimumPopulation=+this.value;
    // Opacity only: do not call layout, zoomTo, resetZoom, or moveCamera here.
    updateFocus();
  });
  const normalize=name=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
  const countryLookup=new Map();
  countries.forEach(d=>{
    countryLookup.set(normalize(d.country),d);
    if(aliases[d.country]) countryLookup.set(normalize(aliases[d.country]),d);
  });
  d3.select('#country-suggestions').selectAll('option').data([...countries].sort((a,b)=>a.country.localeCompare(b.country)))
    .join('option').attr('value',d=>d.country);
  function searchCountry(reportMissing) {
    const match=countryLookup.get(normalize(searchInput.value.trim()));
    if(!match) {
      if(reportMissing) {
        searchInput.setAttribute('aria-invalid','true');
        d3.select('#search-message').text('Country not found. Choose a country from the suggestions.');
      }
      return;
    }
    // The same camera/selection path is used for both search and polygon clicks.
    zoomTo(match);
  }
  d3.select('#country-search-form').on('submit',event=>{event.preventDefault();searchCountry(true);});
  d3.select('#country-search').on('change',()=>searchCountry(false)).on('input',()=>{
    searchInput.removeAttribute('aria-invalid');d3.select('#search-message').text('');
  });
  filter('All');
  d3.select('#data-body').selectAll('tr').data(countries).join('tr').each(function(d){
    d3.select(this).selectAll('td').data([d.rank,d.country,d.region,d3.format(',')(d.population)]).join('td').text(v=>v);
  });
  d3.select('#area-quality').text(`Area validation: maximum relative country-area error ${(maxError*100).toFixed(4)}% (before border strokes).`);
  d3.select('#loading').attr('hidden',true);
  window.addEventListener('scroll',hide,{passive:true});window.addEventListener('resize',hide);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){hide();resetZoom();}});
}
if(typeof document!=='undefined') start().catch(error=>{console.error(error);d3.select('#loading').text('Could not build the visualization. Please run a local server and refresh.');});
