// Chart dimensions (margin and innerHeight are also used by tooltip.js)
const width = 1160;
const height = 440;
const margin = { top: 20, right: 30, bottom: 70, left: 80 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const ALL = 'All';
const NON_LOVE = 'Non-love Songs';
const TRANSITION_DURATION = 750;

// Category order as shown in the legend; the stream is stacked in reverse so
// the top layer matches the first legend item.
const songCategories = [
  NON_LOVE,
  'Serenade',
  'Pursuit',
  "It's Complicated",
  'Heartache',
  'Good Riddance',
  'Sexual Confidence',
  'Love Song for the Self'
];

const categoryColors = [
  '#DCDCDC', // Non-love Songs
  '#A9D8BC', // Serenade
  '#C9EAE0', // Pursuit
  '#F4B4B0', // It's Complicated
  '#C1879B', // Heartache
  '#F9D6A5', // Good Riddance
  '#F3A66F', // Sexual Confidence
  '#9DC3E7'  // Love Song for the Self
];

// Load the data here
d3.csv('data/love_song_categories_for_Billboard_Top_10_hits_1958_2023.csv', d => ({
  ...d,
  top_10_debut_date_as_decimal: +d.top_10_debut_date_as_decimal,
  love_song_category: d.love_song_category || NON_LOVE
})).then(data => createViz(data, songCategories));

// Create your visualization
function createViz(data, songCategories) {
  const years = data.map(d => Math.floor(d.top_10_debut_date_as_decimal));
  const minYear = d3.min(years);
  const maxYear = d3.max(years);

  let model = {
    // Include values in the model if it is part of the state needed to render the view
    data: data,
    songCategories: songCategories,
    groupedData: formatDataGroups(data),
    selectedCategory: ALL,
    selectedYears: [minYear, maxYear],
    hoveredYear: null
  }

  // DOM
  function initDOM() {
    return {
      select: d3.select('#selectSongCategory'),
      viz: d3.select('#viz'),
      legend: d3.select('.legend')
    };
  }

  const dom = initDOM();
  const viz = initViz(model);

  function initSlider(model) {
    function onYearsSlider(values) {
      update({ selectedYears: values.split(",").map(Number) });
    }

    const dataYearsArray = Array.from(model.data.map(d => parseInt(d.top_10_debut_date_as_decimal)))
    const yearsRange = d3.range(d3.min(dataYearsArray), d3.max(dataYearsArray) + 1);

    return new rSlider({
      target: '#yearsSlider',
      values: yearsRange,
      range: true,
      tooltip: true,
      scale: true,
      labels: false,
      set: [yearsRange[0], yearsRange[yearsRange.length - 1]],
      onChange: onYearsSlider
    });
  }

  function initLegend(model) {
    const items = dom.legend.append('ul')
      .selectAll('li')
      .data(model.songCategories)
      .join('li');

    items.append('span')
      .attr('class', 'legend-color')
      .style('background-color', d => viz.color(d));

    items.append('span')
      .attr('class', 'legend-label')
      .text(d => d);

    return items;
  }

  function initOptions(model) {
    dom.select.selectAll('option')
      .data([ALL, ...model.songCategories])
      .join('option')
      .attr('value', d => d)
      .text(d => d);
  }

  function formatDataGroups(data) {
    //Use D3 roll-up (group by + aggregate)
    //Parts:
    //data
    //reduceFn --> how to do within each group
    //keyFn --> how to group by
    const counts = d3.rollup(
      data,
      v => v.length,
      d => Math.floor(d.top_10_debut_date_as_decimal),
      d => d.love_song_category
    );

    // One object per year with every category present (0 if missing)
    const groupedArray = d3.range(minYear, maxYear + 1).map(year => {
      const yearCounts = counts.get(year) || new Map();
      const row = { year: year };
      songCategories.forEach(category => {
        row[category] = yearCounts.get(category) || 0;
      });
      row.total = d3.sum(songCategories, category => row[category]);
      return row;
    });

    return groupedArray;
  }

  // Viz
  function initViz(model) {
    const svg = d3.select('#viz')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'streamgraph');

    svg.append('defs')
      .append('clipPath')
      .attr('id', 'chart-clip')
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
      .domain(model.selectedYears)
      .range([0, innerWidth]);

    // Fixed y-domain so categories and periods can be compared at the same scale
    const y = d3.scaleLinear()
      .domain([0, Math.ceil(d3.max(model.groupedData, d => d.total) / 20) * 20])
      .range([innerHeight, 0]);

    const color = d3.scaleOrdinal()
      .domain(model.songCategories)
      .range(categoryColors);

    const stack = d3.stack()
      .keys(model.songCategories.slice().reverse())
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).tickSizeOuter(0);

    const grid = g.append('g').attr('class', 'grid');

    const layers = g.append('g')
      .attr('class', 'layers')
      .attr('clip-path', 'url(#chart-clip)');

    const xAxisG = g.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0, ${innerHeight})`);

    const yAxisG = g.append('g')
      .attr('class', 'axis axis-y');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', innerWidth)
      .attr('y', innerHeight + 55)
      .attr('text-anchor', 'end')
      .text('Year');

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .text('Number of songs');

    // Hover elements (helpers from tooltip.js)
    const tooltipLayer = initializeTooltip(svg).attr('class', 'tooltip').style('display', 'none');
    const tooltipLine = initializeTooltipLine(tooltipLayer)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,4');
    const tooltipCard = tooltipLayer.append('g').attr('class', 'tooltip-card');

    // Transparent overlay that receives the mouse events
    const overlay = g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent');

    return {
      svg, g, x, y, color, stack, area, xAxis, yAxis,
      grid, layers, xAxisG, yAxisG,
      tooltipLayer, tooltipLine, tooltipCard, overlay,
      rendered: null
    };
  }

  // Update
  function update(patch) {
    model = { ...model, ...patch };
    view(dom, model, viz);
  }

  // View
  function view(dom, model, viz) {
    const state = `${model.selectedCategory}|${model.selectedYears.join('-')}`;
    if (viz.rendered !== state) {
      renderChart(model, viz, viz.rendered !== null);
      renderLegend(dom, model);
      viz.rendered = state;
    }
    renderTooltip(model, viz);
  }

  function getVisibleCategories(model) {
    return model.selectedCategory === ALL ? model.songCategories : [model.selectedCategory];
  }

  function renderChart(model, viz, animate) {
    const visible = getVisibleCategories(model);
    const isSingle = model.selectedCategory !== ALL;

    // Hidden categories keep their path but collapse to 0, so the selected
    // category settles onto the baseline and every change can be animated.
    const filteredData = model.groupedData.map(row => {
      const filtered = { year: row.year };
      model.songCategories.forEach(category => {
        filtered[category] = visible.includes(category) ? row[category] : 0;
      });
      return filtered;
    });

    const stackedData = viz.stack(filteredData);

    const [startYear, endYear] = model.selectedYears;
    const span = endYear - startYear;
    // A single selected year still needs a non-empty domain
    viz.x.domain(span > 0 ? [startYear, endYear] : [startYear - 0.5, endYear + 0.5]);

    // Always label the first and last selected year, dropping ticks too close to them
    const minGap = Math.max(1, span / 30);
    const innerTicks = viz.x.ticks(Math.max(1, Math.min(span, 12)))
      .filter(year => Number.isInteger(year) && year - startYear >= minGap && endYear - year >= minGap);
    viz.xAxis.tickValues(span > 0 ? [startYear, ...innerTicks, endYear] : [startYear]);
    viz.yAxis.ticks(isSingle ? 12 : 6);

    const t = viz.svg.transition().duration(animate ? TRANSITION_DURATION : 0);

    viz.layers.selectAll('path.layer')
      .data(stackedData, d => d.key)
      .join(enter => enter.append('path')
        .attr('class', 'layer')
        .attr('fill', d => viz.color(d.key))
        .attr('d', viz.area))
      .transition(t)
      .attr('d', viz.area);

    viz.xAxisG.transition(t).call(viz.xAxis);
    viz.yAxisG.transition(t).call(viz.yAxis);

    // Dashed gridlines are shown in the single-category view
    viz.grid.transition(t)
      .style('opacity', isSingle ? 1 : 0)
      .call(d3.axisLeft(viz.y)
        .ticks(isSingle ? 12 : 6)
        .tickSize(-innerWidth)
        .tickFormat(''));
  }

  function renderLegend(dom, model) {
    const visible = getVisibleCategories(model);
    const isSingle = model.selectedCategory !== ALL;

    dom.legend.selectAll('li')
      .classed('inactive', d => !visible.includes(d))
      .classed('active', d => isSingle && visible.includes(d))
      .select('.legend-color')
      .style('background-color', d => visible.includes(d) ? viz.color(d) : null);
  }

  function renderTooltip(model, viz) {
    if (model.hoveredYear === null) {
      viz.tooltipLayer.style('display', 'none');
      return;
    }

    const row = model.groupedData.find(d => d.year === model.hoveredYear);
    const xPos = viz.x(model.hoveredYear);

    viz.tooltipLayer.style('display', null);
    viz.tooltipLine.attr('x1', xPos).attr('x2', xPos);

    // Lines of the tooltip: [label, value, color]
    let lines;
    if (model.selectedCategory === ALL) {
      lines = model.songCategories.map(c => [c, row[c], viz.color(c)]);
    } else {
      const c = model.selectedCategory;
      const share = row.total ? Math.round(row[c] / row.total * 100) : 0;
      lines = [
        [c, row[c], viz.color(c)],
        ['Share of all songs', `${share}%`, null]
      ];
    }

    const padding = 14;
    const lineHeight = 26;
    const cardWidth = 210;
    const headerHeight = 62;
    const cardHeight = headerHeight + lines.length * lineHeight + padding / 2;

    // Show the card to the right of the guide line unless it would overflow
    const placeRight = xPos + 20 + cardWidth <= innerWidth;
    const cardX = placeRight ? xPos + 20 : xPos - 20 - cardWidth;

    const card = viz.tooltipCard.attr('transform', `translate(${cardX}, 25)`);
    card.selectAll('*').remove();

    card.append('rect')
      .attr('class', 'tooltip-bg')
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', 8);

    card.append('text')
      .attr('class', 'tooltip-title')
      .attr('x', padding)
      .attr('y', padding + 12)
      .text(`Year: ${row.year}`);

    card.append('text')
      .attr('class', 'tooltip-title')
      .attr('x', padding)
      .attr('y', padding + 42)
      .text(`Total songs: ${row.total}`);

    const rows = card.selectAll('g.tooltip-row')
      .data(lines)
      .join('g')
      .attr('class', 'tooltip-row')
      .attr('transform', (d, i) => `translate(${padding}, ${headerHeight + 18 + i * lineHeight})`);

    rows.filter(d => d[2])
      .append('circle')
      .attr('cx', 4)
      .attr('cy', -4)
      .attr('r', 4.5)
      .attr('fill', d => d[2]);

    rows.append('text')
      .attr('x', d => d[2] ? 16 : 0)
      .text(d => `${d[0]}:`);

    rows.append('text')
      .attr('x', cardWidth - padding * 2)
      .attr('text-anchor', 'end')
      .text(d => d[1]);
  }

  // Events
  function initEvents(dom, model, viz) {
    dom.select.on('change', event => {
      update({ selectedCategory: event.target.value });
    });

    viz.overlay
      .on('mousemove', event => {
        const [mouseX] = d3.pointer(event);
        const [start, end] = viz.x.domain();
        const year = Math.max(Math.ceil(start), Math.min(Math.floor(end), Math.round(viz.x.invert(mouseX))));
        update({ hoveredYear: year });
      })
      .on('mouseleave', () => update({ hoveredYear: null }));
  }


  // Init
  function init(model) {
    initSlider(model);
    initEvents(dom, model, viz);
    initLegend(model);
    initOptions(model);
    view(dom, model, viz);
  }

  init(model);
}
