function createBarChart(data) {
    const width = 500;
    const height = 120;
    const barHeight = 20;
    const barSpacing = 5;
    const labelWidth = 100;
    const labelOffset = 15;
    const lineX = 200;

    const topGenresSection = d3.select('#top-genres');
    topGenresSection.append('h3').text('Top US genres, by US on-demand audio streams');

    const svgHeight = data.length * (barHeight + barSpacing) + 20;
    
    const svg = topGenresSection.append('svg')
        .attr('width', width)
        .attr('height', svgHeight)
        .style('border', '1px solid #e0e0e0')
        .style('border-radius', '8px')
        .style('background-color', '#fafafa'); 

    const maxVolume = d3.max(data, d => d.audio_streaming_volume);
    const maxBarWidth = width - lineX - 80;
    
    const xScale = d3.scaleLinear()
        .domain([0, maxVolume])
        .range([0, maxBarWidth]);
    
    svg.append('line')
        .attr('x1', lineX)
        .attr('y1', 10)
        .attr('x2', lineX)
        .attr('y2', svgHeight - 10)
        .attr('stroke', '#a0a0a0')
        .attr('stroke-width', 1.5); 
            
    svg.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', lineX + 10)
        .attr('y', (d, i) => i * (barHeight + barSpacing) + 10)
        .attr('width', d => xScale(d.audio_streaming_volume))
        .attr('height', barHeight)
        .attr('fill', '#d3d3d3'); 
        
    svg.selectAll('text.genre-label')
        .data(data)
        .join('text')
        .attr('class', 'genre-label')
        .attr('x', 20)
        .attr('y', (d, i) => i * (barHeight + barSpacing) + barHeight / 2 + 10)
        .attr('text-anchor', 'start')
        .attr('dominant-baseline', 'middle')
        .style('font-family', 'sans-serif')
        .style('font-size', '14px')
        .text(d => d.genre); 
        
    svg.selectAll('text.value-label')
        .data(data)
        .join('text')
        .attr('class', 'value-label')
        .attr('x', width - 20)
        .attr('y', (d, i) => i * (barHeight + barSpacing) + barHeight / 2 + 10)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-family', 'sans-serif')
        .style('font-size', '14px')
        .text(d => d.audio_streaming_volume); 
}