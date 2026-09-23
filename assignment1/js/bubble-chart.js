function createBubbleChart(data) {
    const metrics = [
        'total_album_consumption_millions',
        'album_sales',
        'song_sales_thousands',
        'on_demand_audio_streams_billions',
        'on_demand_video_streams_millions'
    ];

    data.forEach(d => {
        metrics.forEach(metric => {
            if (d[metric] !== undefined) {
                d[metric] = +String(d[metric]).replace(/,/g, '');
            }
        });
    });

    const width = 1160;
    const height = 380;
    const margin = { top: 40, right: 0, bottom: 60, left: 50 };

    d3.select('#bubble-chart').selectAll('*').remove();

    const svg = d3.select('#bubble-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const maxAudio = d3.max(data, d => d.on_demand_audio_streams_billions) || 6.5;
    const maxVideo = d3.max(data, d => d.on_demand_video_streams_millions) || 250;
    const maxSales = d3.max(data, d => d.album_sales) || 1500000;

    const xScale = d3.scaleLinear()
        .domain([0, maxAudio * 1.1])
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, maxVideo * 1.1])
        .range([height - margin.bottom, margin.top]);

    const rScale = d3.scaleSqrt()
        .domain([0, maxSales])
        .range([0, 40]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(data.map(d => d.title));

    svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(7))
        .call(g => g.select('.domain').attr('stroke', '#a0a0a0'))
        .call(g => g.selectAll('.tick line').attr('stroke', '#a0a0a0'))
        .call(g => g.selectAll('text').style('fill', '#666'));

    svg.append('text')
        .attr('x', width - margin.right)
        .attr('y', height - 20)
        .attr('text-anchor', 'end')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('On-demand Audio streams (billions)');

    svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(6))
        .call(g => g.select('.domain').attr('stroke', '#a0a0a0'))
        .call(g => g.selectAll('.tick line').attr('stroke', '#a0a0a0'))
        .call(g => g.selectAll('text').style('fill', '#666'));

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -margin.top)
        .attr('y', 8)
        .attr('text-anchor', 'end')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text('On-demand Video streams (millions)');

    svg.selectAll('.bubble')
        .data(data)
        .join('circle')
        .attr('class', 'bubble')
        .attr('cx', d => xScale(d.on_demand_audio_streams_billions))
        .attr('cy', d => yScale(d.on_demand_video_streams_millions))
        .attr('r', d => rScale(d.album_sales) || 0)
        .attr('fill', d => colorScale(d.title))
        .attr('opacity', 0.8)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

    d3.select('.legend-color').selectAll('svg').remove();
    const colorLegendSvg = d3.select('.legend-color')
        .append('svg')
        .attr('width', '100%')
        .attr('height', data.length * 20 + 20);

    const legendItems = colorLegendSvg.selectAll('.legend-item')
        .data(data)
        .join('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20 + 10})`);

    legendItems.append('circle')
        .attr('cx', 10)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', d => colorScale(d.title));

    legendItems.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', '#666')
        .text(d => d.title);

    d3.select('.legend-area').selectAll('svg').remove();

    const sizeLegendValues = rScale.ticks(3).filter(v => v > 0).reverse();
    const legendValues = sizeLegendValues.length ? sizeLegendValues : [maxSales];
    const legendRadii = legendValues.map(v => rScale(v) || 0);
    const legendHeight = d3.sum(legendRadii, r => r * 2 + 15) + 10;
    const formatValue = d3.format('~s');

    const sizeLegendSvg = d3.select('.legend-area')
        .append('svg')
        .attr('width', '100%')
        .attr('height', Math.max(legendHeight, 180));

    let yOffset = 10;

    legendValues.forEach(val => {
        const r = rScale(val) || 0;

        sizeLegendSvg.append('circle')
            .attr('cx', 45)
            .attr('cy', yOffset + r)
            .attr('r', r)
            .attr('fill', '#cccccc')
            .attr('opacity', 0.8);

        sizeLegendSvg.append('line')
            .attr('x1', 45 + r + 10)
            .attr('y1', yOffset + r)
            .attr('x2', 120)
            .attr('y2', yOffset + r)
            .attr('stroke', '#999999')
            .attr('stroke-dasharray', '4,4');

        sizeLegendSvg.append('text')
            .attr('x', 130)
            .attr('y', yOffset + r + 4)
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .style('fill', '#333')
            .text(formatValue(val));

        yOffset += (r * 2) + 15;
    });
}