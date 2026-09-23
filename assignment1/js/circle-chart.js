function createCircleChart(data) {
    const streamsByReleaseDecadeSection = d3.select('#release-by-decade');
    streamsByReleaseDecadeSection.append('h3').text('US on-demand audio streams, by release decade');

    const width = 550;
    const height = 130;
    const maxCircleRadius = 40;
    const circleY = 20;
    const headerOffset = 5;
    const footerOffset = 30;

    const svg = streamsByReleaseDecadeSection.append('svg')
        .attr('width', width)
        .attr('height', height + 20)
        .style('border', '1px solid #e0e0e0')
        .style('border-radius', '8px')
        .style('background-color', '#fafafa');
    
    const centerY = height / 2 + 5;

    const xScale = d3.scalePoint()
        .domain(data.map(d => d.year))
        .range([maxCircleRadius + 20, width - maxCircleRadius - 20]); 
        
    const maxPct = d3.max(data, d => d.audio_stream_pct);
    const rScale = d3.scaleSqrt()
        .domain([0, maxPct])
        .range([0, maxCircleRadius]); 
    
    svg.append('line')
        .attr('x1', 20)
        .attr('y1', centerY)
        .attr('x2', width - 20)
        .attr('y2', centerY)
        .attr('stroke', '#a0a0a0')
        .attr('stroke-width', 1.5); 
    
    const groups = svg.selectAll('g.decade-group')
        .data(data)
        .join('g')
        .attr('class', 'decade-group')
        .attr('transform', d => `translate(${xScale(d.year)}, ${centerY})`);

    groups.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d => rScale(d.audio_stream_pct))
        .attr('fill', '#b0b0b0');

    groups.append('text')
        .attr('x', 0)
        .attr('y', -maxCircleRadius - headerOffset)
        .attr('text-anchor', 'middle')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', '#333')
        .text(d => `${d.audio_stream_pct}%`);

    groups.append('text')
        .attr('x', 0)
        .attr('y', maxCircleRadius + footerOffset - 15)
        .attr('text-anchor', 'middle')
        .style('font-family', 'sans-serif')
        .style('font-size', '12px')
        .style('fill', '#333')
        .text(d => d.year);
}