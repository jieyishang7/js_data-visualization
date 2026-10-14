/* D3 v7 exploration. Generated with OpenAI Codex assistance; see AI_ASSISTANCE.md.
   Official data are preserved; missing values are never coerced to zero. */
"use strict";
const latest = window.HAPPINESS_DATA,
  history = window.HAPPINESS_HISTORY;
const factors = [
  ["gdp", "Log GDP per capita"],
  ["support", "Social support"],
  ["health", "Healthy life expectancy"],
  ["freedom", "Freedom to make life choices"],
  ["generosity", "Generosity"],
  ["corruption", "Perceptions of corruption"],
];
const years = Array.from(new Set(history.map((d) => d.year))).sort((a, b) => a - b);
const names = Array.from(new Set(history.map((d) => d.name))).sort(d3.ascending);
const byName = new Map(latest.map((d) => [d.country, d]));
const fmt = (v) => (v == null ? "N/A" : d3.format(".3f")(v)),
  signed = d3.format("+.3f");
const period = (y) => (y === 2011 ? "2005–2011" : `${y - 2}–${y}`);
const $ = (id) => document.getElementById(id);
const tip = $("tooltip");
function hideTip() {
  tip.hidden = true;
}
function showTip(event, text) {
  tip.textContent = text;
  tip.hidden = false;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX || rect.x + rect.width / 2,
    y = event.clientY || rect.y;
  tip.style.left = Math.max(8, Math.min(x + 14, innerWidth - tip.offsetWidth - 10)) + "px";
  tip.style.top = Math.max(8, Math.min(y + 14, innerHeight - tip.offsetHeight - 10)) + "px";
}
function inspect(selection, text) {
  selection
    .attr("tabindex", 0)
    .attr("aria-label", text)
    .on("pointerenter", function (e, d) {
      showTip(e, text(d));
    })
    .on("pointerleave", hideTip)
    .on("focus", function (e, d) {
      showTip(e, text(d));
    })
    .on("blur", hideTip)
    .on("click", function (e, d) {
      showTip(e, text(d));
    })
    .on("keydown", function (e, d) {
      if (e.key === "Escape") hideTip();
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showTip(e, text(d));
      }
    });
}
addEventListener("scroll", hideTip, { passive: true });
function options(id, items) {
  d3.select("#" + id)
    .selectAll("option")
    .data(items)
    .join("option")
    .attr("value", (d) => d[0])
    .text((d) => d[1]);
}
function table(id, headers, rows) {
  const host = d3.select("#" + id);
  host.selectAll("*").remove();
  const t = host.append("table");
  t.append("thead")
    .append("tr")
    .selectAll("th")
    .data(headers)
    .join("th")
    .attr("scope", "col")
    .text((d) => d);
  t.append("tbody")
    .selectAll("tr")
    .data(rows)
    .join("tr")
    .selectAll("td")
    .data((d) => d)
    .join("td")
    .text((d) => d);
}
// Reusable accessible checkboxes, search and removable chips; zero selections are valid.
function picker(id, pool, selected, onchange) {
  const host = d3.select("#" + id);
  host.html("");
  const box = host.append("details").attr("class", "picker");
  box.append("summary").text("Choose countries (up to 8)");
  const input = box
    .append("input")
    .attr("type", "search")
    .attr("aria-label", id + " search countries")
    .attr("placeholder", "Search available countries");
  const list = box.append("div").attr("class", "options");
  const chips = host.append("div").attr("class", "chips");
  function refresh() {
    const q = input.property("value").trim().toLowerCase();
    const labels = list
      .selectAll("label")
      .data(
        pool.filter((n) => n.toLowerCase().includes(q)),
        (d) => d,
      )
      .join((enter) => {
        const label = enter.append("label");
        label.append("input").attr("type", "checkbox");
        label.append("span");
        return label;
      });
    labels.select("span").text((d) => d);
    labels
      .select("input")
      .property("checked", (d) => selected.has(d))
      .property("disabled", (d) => selected.size >= 8 && !selected.has(d))
      .on("change", function (e, n) {
        if (this.checked) selected.add(n);
        else selected.delete(n);
        refresh();
        onchange();
      });
    chips
      .selectAll("button")
      .data([...selected], (d) => d)
      .join("button")
      .text((d) => d + " ×")
      .attr("aria-label", (d) => "Remove " + d)
      .on("click", (e, n) => {
        selected.delete(n);
        refresh();
        onchange();
      });
  }
  input.on("input", refresh);
  refresh();
  return function (reset = false) {
    if (reset) input.property("value", "");
    refresh();
  };
}
function frame(id, height = 470) {
  const svg = d3.select("#" + id).attr("viewBox", `0 0 1000 ${height}`);
  svg.selectAll("*").remove();
  return svg;
}
function axes(svg, x, y, xLabel) {
  svg.append("g").attr("transform", "translate(78,0)").call(d3.axisLeft(y).ticks(5).tickSize(-874));
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0,390)")
    .call(d3.axisBottom(x).ticks(7));
  svg
    .append("text")
    .attr("x", 78)
    .attr("y", 21)
    .attr("class", "axis-title")
    .text("Life evaluation (0–10)");
  svg
    .append("text")
    .attr("x", 515)
    .attr("y", 449)
    .attr("text-anchor", "middle")
    .attr("class", "axis-title")
    .text(xLabel);
}
// A: use the real year spacing; line.defined breaks at absent observations.
const aSelected = new Set(["Finland", "United States", "China", "India"]);
options(
  "a-start",
  years.map((y) => [y, `${y} (${period(y)})`]),
);
options(
  "a-end",
  years.map((y) => [y, `${y} (${period(y)})`]),
);
$("a-start").value = "2014";
$("a-end").value = "2025";
function drawA() {
  hideTip();
  const start = +$("a-start").value,
    end = +$("a-end").value,
    trend = $("a-trend").value;
  const svg = frame("chart-a");
  if (start >= end) {
    $("a-status").textContent = "Choose a start snapshot earlier than the end snapshot.";
    $("a-legend").textContent = "";
    table("a-table", ["Country", "Snapshot", "Window", "Score"], []);
    return;
  }
  const x = d3.scaleLinear().domain([start, end]).range([78, 952]),
    y = d3.scaleLinear().domain([0, 10]).range([390, 40]);
  axes(svg, x, y, "Snapshot window-end year (pooled averages)");
  svg.select(".x-axis").call(
    d3
      .axisBottom(x)
      .tickValues(years.filter((v) => v >= start && v <= end))
      .tickFormat(d3.format("d")),
  );
  const data = [],
    legend = [];
  [...aSelected].forEach((name, i) => {
    const records = history
      .filter((d) => d.name === name && d.year >= start && d.year <= end)
      .sort((a, b) => a.year - b.year);
    const first = records.find((d) => d.year === start),
      last = records.find((d) => d.year === end);
    const change = first && last ? last.score - first.score : null;
    const active =
      trend === "all" || (change !== null && (trend === "up" ? change > 0 : change < 0));
    const color = [
      "#58318c",
      "#376fa2",
      "#9a4f99",
      "#7e8bb1",
      "#363563",
      "#9b73c6",
      "#5f79ce",
      "#5c536b",
    ][i];
    const rows = new Map(records.map((d) => [d.year, d]));
    const points = d3.range(start, end + 1).map((year) => rows.get(year) || { year, score: null });
    const group = svg.append("g").attr("opacity", active ? 1 : 0.14);
    group
      .append("path")
      .datum(points)
      .attr("class", "time-line")
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.6)
      .attr(
        "d",
        d3
          .line()
          .defined((d) => d.score !== null)
          .x((d) => x(d.year))
          .y((d) => y(d.score)),
      );
    inspect(
      group
        .selectAll("circle")
        .data(records)
        .join("circle")
        .attr("class", "point time-point")
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(d.score))
        .attr("r", 4.6)
        .attr("fill", color),
      (d) =>
        `${d.name}${d.country !== d.name ? " (source: " + d.country + ")" : ""}\nNominal window ${period(d.year)} · snapshot ${d.year}\nLife evaluation: ${fmt(d.score)}\n95% interval: ${d.low == null ? "not available" : fmt(d.low) + "–" + fmt(d.high)}`,
    );
    legend.push({
      name,
      color,
      text:
        change === null
          ? "endpoint comparison unavailable"
          : `${change > 0 ? "↑" : change < 0 ? "↓" : "="} ${signed(change)} points`,
    });
    data.push(...records);
  });
  $("a-status").textContent = aSelected.size
    ? `${aSelected.size} selected countries · ${period(start)} → ${period(end)} · ${data.length} observed points. ${trend === "all" ? "" : "Nonmatching paths are faded; direction uses the two selected endpoints."}`
    : "Select at least one country to draw a comparison.";
  d3.select("#a-legend")
    .selectAll("span")
    .data(legend)
    .join("span")
    .style("border-color", (d) => d.color)
    .text((d) => `${d.name} · ${d.text}`);
  table(
    "a-table",
    ["Country", "Original label", "Snapshot", "Window", "Score", "95% interval"],
    data.map((d) => [
      d.name,
      d.country,
      d.year,
      period(d.year),
      fmt(d.score),
      d.low == null ? "N/A" : `${fmt(d.low)}–${fmt(d.high)}`,
    ]),
  );
}
const refreshA = picker("a-picker", names, aSelected, drawA);
["a-start", "a-end", "a-trend"].forEach((id) => $(id).addEventListener("change", drawA));
$("a-reset").onclick = () => {
  aSelected.clear();
  ["Finland", "United States", "China", "India"].forEach((n) => aSelected.add(n));
  $("a-start").value = "2014";
  $("a-end").value = "2025";
  $("a-trend").value = "all";
  refreshA(true);
  drawA();
};
drawA();
// B: pairwise omission, fixed factor-specific x domains, and an independent name filter.
options("b-factor", factors);
$("b-factor").value = "support";
options("b-highlight", [
  ["", "None"],
  ...latest.map((d) => [d.country, d.country]).sort((a, b) => d3.ascending(a[0], b[0])),
]);
function drawB() {
  hideTip();
  const key = $("b-factor").value,
    label = factors.find((d) => d[0] === key)[1],
    q = $("b-filter").value.trim().toLowerCase(),
    highlight = $("b-highlight").value;
  const valid = latest.filter((d) => d[key] !== null),
    data = valid.filter((d) => d.country.toLowerCase().includes(q));
  const svg = frame("chart-b");
  const x = d3
      .scaleLinear()
      .domain([0, d3.max(valid, (d) => d[key]) * 1.06])
      .nice()
      .range([78, 952]),
    y = d3.scaleLinear().domain([0, 10]).range([390, 40]);
  axes(svg, x, y, `${label} · modeled contribution (score points)`);
  const ordered = [...data].sort((a, b) => (a.country === highlight) - (b.country === highlight));
  inspect(
    svg
      .append("g")
      .selectAll("circle")
      .data(ordered)
      .join("circle")
      .attr("class", "point scatter-point")
      .attr("cx", (d) => x(d[key]))
      .attr("cy", (d) => y(d.score))
      .attr("r", (d) => (d.country === highlight ? 8 : 5.2))
      .attr("fill", (d) => (d.country === highlight ? "#492075" : "#9978c1"))
      .attr("fill-opacity", (d) => (highlight && d.country !== highlight ? 0.35 : 0.8))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1),
    (d) =>
      `${d.country}\n${label} contribution: ${fmt(d[key])} points\nLife evaluation: ${fmt(d.score)}\n95% interval: ${fmt(d.low)}–${fmt(d.high)}\nWindow: 2023–2025`,
  );
  const focused = data.find((d) => d.country === highlight);
  if (focused)
    svg
      .append("text")
      .attr("x", Math.min(x(focused[key]) + 12, 940))
      .attr("y", y(focused.score) - 13)
      .attr("text-anchor", x(focused[key]) > 800 ? "end" : "start")
      .attr("font-weight", 700)
      .text(focused.country);
  const missing = latest.filter((d) => d[key] === null).map((d) => d.country);
  $("b-status").textContent =
    `${data.length} of ${valid.length} complete pairs shown · ${missing.length} missing${missing.length ? " (" + missing.join(", ") + ")" : ""}.` +
    (highlight && !focused
      ? " Highlighted country is excluded by the filter or has no value for this contribution."
      : "") +
    (data.length === 0 ? " No countries match. Clear the filter to restore the chart." : "");
  table(
    "b-table",
    ["Country", label + " contribution", "Life evaluation", "95% lower", "95% upper"],
    data.map((d) => [d.country, fmt(d[key]), fmt(d.score), fmt(d.low), fmt(d.high)]),
  );
}
["b-factor", "b-highlight"].forEach((id) => $(id).addEventListener("change", drawB));
$("b-filter").addEventListener("input", drawB);
$("b-reset").onclick = () => {
  $("b-factor").value = "support";
  $("b-filter").value = "";
  $("b-highlight").value = "";
  drawB();
};
drawB();
// C: all columns share one absolute scale. N/A remains distinct from a real zero.
const cDefaults = ["Benin", "Lesotho", "China", "Finland", "Costa Rica", "United States"];
const cSelected = new Set(cDefaults);
options("c-sort", [
  ["score", "Life evaluation (high → low)"],
  ["name", "Country name (A → Z)"],
  ...factors.map(([k, n]) => [k, n + " contribution (high → low)"]),
]);
function drawC() {
  hideTip();
  const key = $("c-sort").value;
  const data = [...cSelected]
    .map((n) => byName.get(n))
    .sort((a, b) =>
      key === "name"
        ? d3.ascending(a.country, b.country)
        : (a[key] === null) - (b[key] === null) ||
          (a[key] !== null && b[key] !== null ? b[key] - a[key] : 0) ||
          d3.ascending(a.country, b.country),
    );
  const height = 140 + Math.max(1, data.length) * 53,
    svg = frame("chart-c", height);
  const color = d3.scaleSequential(d3.interpolateRgb("#f1ebfa", "#482277")).domain([0, 2.2]);
  const x = d3
    .scaleBand()
    .domain(factors.map((d) => d[0]))
    .range([270, 977])
    .paddingInner(0.045);
  const y = d3
    .scaleBand()
    .domain(data.map((d) => d.country))
    .range([95, 95 + data.length * 53])
    .paddingInner(0.1);
  const defs = svg.append("defs");
  const pattern = defs
    .append("pattern")
    .attr("id", "missing-hatch")
    .attr("width", 6)
    .attr("height", 6)
    .attr("patternUnits", "userSpaceOnUse");
  pattern.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#f2f0f4");
  pattern.append("path").attr("d", "M0,6L6,0").attr("stroke", "#c4bbce");
  svg
    .append("text")
    .attr("x", 22)
    .attr("y", 75)
    .attr("font-weight", 600)
    .text("Country / territory");
  svg.append("text").attr("x", 249).attr("y", 58).attr("text-anchor", "end").text("Observed");
  svg.append("text").attr("x", 249).attr("y", 75).attr("text-anchor", "end").text("score");
  const short = [
    ["Log GDP", "per capita"],
    ["Social", "support"],
    ["Healthy life", "expectancy"],
    ["Freedom", "to choose"],
    ["Generosity"],
    ["Perceptions", "of corruption"],
  ];
  factors.forEach(([k], i) => {
    const t = svg
      .append("text")
      .attr("x", x(k) + x.bandwidth() / 2)
      .attr("y", short[i].length === 1 ? 66 : 57)
      .attr("text-anchor", "middle");
    short[i].forEach((s, j) =>
      t
        .append("tspan")
        .attr("x", x(k) + x.bandwidth() / 2)
        .attr("dy", j ? 17 : 0)
        .text(s),
    );
  });
  for (const d of data) {
    const pair =
      ["Benin", "Lesotho"].includes(d.country) &&
      cSelected.has("Benin") &&
      cSelected.has("Lesotho");
    if (pair)
      svg
        .append("rect")
        .attr("x", 12)
        .attr("y", y(d.country) - 2)
        .attr("width", 970)
        .attr("height", y.bandwidth() + 4)
        .attr("rx", 5)
        .attr("fill", "#eee6f7");
    const text = svg
      .append("text")
      .attr("x", 22)
      .attr("y", y(d.country) + 29)
      .attr("font-weight", pair ? 700 : 400)
      .text(d.country.length > 25 ? d.country.slice(0, 24) + "…" : d.country);
    text.append("title").text(d.country);
    svg
      .append("text")
      .attr("x", 249)
      .attr("y", y(d.country) + 29)
      .attr("text-anchor", "end")
      .attr("font-weight", 700)
      .text(fmt(d.score));
  }
  const cells = data.flatMap((d) =>
    factors.map(([key, label]) => ({ row: d, key, label, value: d[key] })),
  );
  const groups = svg.append("g").selectAll("g").data(cells).join("g");
  inspect(
    groups
      .append("rect")
      .attr("class", "heat-cell")
      .attr("x", (d) => x(d.key))
      .attr("y", (d) => y(d.row.country))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 4)
      .attr("fill", (d) => (d.value === null ? "url(#missing-hatch)" : color(d.value))),
    (d) =>
      `${d.row.country}\n${d.label} contribution: ${fmt(d.value)}${d.value === null ? " (missing)" : " points"}\nObserved score: ${fmt(d.row.score)}\n95% interval: ${fmt(d.row.low)}–${fmt(d.row.high)}\nDystopia + residual: ${fmt(d.row.residual)}\nWindow: 2023–2025`,
  );
  groups
    .append("text")
    .attr("x", (d) => x(d.key) + x.bandwidth() / 2)
    .attr("y", (d) => y(d.row.country) + 29)
    .attr("text-anchor", "middle")
    .style("fill", (d) => (d.value !== null && d.value >= 1.15 ? "#fff" : "#392449"))
    .style("pointer-events", "none")
    .text((d) => fmt(d.value));
  $("c-status").textContent = data.length
    ? `${data.length} selected countries · ${cells.filter((d) => d.value === null).length} missing cells. Sorted by ${$("c-sort").selectedOptions[0].textContent}.` +
      (cSelected.has("Benin") && cSelected.has("Lesotho")
        ? " Shaded country labels mark the similar-score example."
        : "")
    : "Select at least one country to compare profiles.";
  table(
    "c-table",
    [
      "Country",
      "Observed score",
      ...factors.map((d) => d[1]),
      "Dystopia + residual",
      "95% lower",
      "95% upper",
    ],
    data.map((d) => [
      d.country,
      fmt(d.score),
      ...factors.map(([k]) => fmt(d[k])),
      fmt(d.residual),
      fmt(d.low),
      fmt(d.high),
    ]),
  );
}
const refreshC = picker(
  "c-picker",
  latest.map((d) => d.country).sort(d3.ascending),
  cSelected,
  drawC,
);
$("c-sort").addEventListener("change", drawC);
$("c-pair").onclick = () => {
  cSelected.clear();
  ["Benin", "Lesotho"].forEach((n) => cSelected.add(n));
  refreshC(true);
  drawC();
};
$("c-reset").onclick = () => {
  cSelected.clear();
  cDefaults.forEach((n) => cSelected.add(n));
  $("c-sort").value = "score";
  refreshC(true);
  drawC();
};
drawC();
