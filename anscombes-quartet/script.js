// Based on the course starter code. Each call creates a separate chart.
d3.csv("anscombe.csv").then(function(data) {
  // CSV values start as strings; convert the coordinates to numbers.
  data.forEach(function(d) {
    d.x = +d.x;
    d.y = +d.y;
  });

  const dataset1 = data.filter(d => d.dataset === "I");
  const dataset2 = data.filter(d => d.dataset === "II");
  const dataset3 = data.filter(d => d.dataset === "III");
  const dataset4 = data.filter(d => d.dataset === "IV");

  function drawScatterplot(dataset, color, label) {
    const width = 500;
    const height = 500;
    const svg = d3.select("#chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", `${label}: scatter plot of 11 observations`);

    svg.append("title").text(label);
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", 50)
      .attr("y", 30)
      .text(label);

    const xScale = d3.scaleLinear()
      .domain([0, 20])
      .range([50, 450]);

    // Include the values above 12, using the same scale for every chart.
    const yScale = d3.scaleLinear()
      .domain([0, 14])
      .range([450, 50]);

    svg.selectAll("circle")
      .data(dataset)
      .join("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 5)
      .attr("fill", color);

    svg.append("g")
      .attr("transform", "translate(0, 450)")
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", "translate(50, 0)")
      .call(d3.axisLeft(yScale));

    svg.append("text")
      .attr("x", 250)
      .attr("y", 487)
      .attr("text-anchor", "middle")
      .text("x");

    svg.append("text")
      .attr("transform", "translate(16, 250) rotate(-90)")
      .attr("text-anchor", "middle")
      .text("y");
  }

  drawScatterplot(dataset1, "#123257", "Dataset I");
  drawScatterplot(dataset2, "#1769d2", "Dataset II");
  drawScatterplot(dataset3, "#008795", "Dataset III");
  drawScatterplot(dataset4, "#6954ba", "Dataset IV");
  document.querySelector("#status").textContent = "";
}).catch(function(error) {
  document.querySelector("#status").textContent = "Could not load the data. Open this page with Live Server and check that anscombe.csv is in the same folder.";
  console.error(error);
});
