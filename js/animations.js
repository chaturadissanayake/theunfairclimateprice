const Charts = {
    state: {},
    initSeaLevel() {
        const container = Utils.select('#sea-level-canvas');
        container.innerHTML = '';
        const width = 800;
        const height = 600;
        const margin = { top: 60, right: 120, bottom: 60, left: 60 };
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        const xScale = d3.scaleLinear().domain([1990, 2025]).range([margin.left, width - margin.right]);
        const yScale = d3.scaleLinear().domain([-2, 14]).range([height - margin.bottom, margin.top]);
        const yAxisGrid = d3.axisLeft(yScale).tickSize(-(width - margin.left - margin.right)).tickFormat(d => `${d}mm`).ticks(6);
        svg.append('g')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(yAxisGrid)
            .selectAll('line').attr('stroke', '#e5e5e5').attr('stroke-dasharray', '2,4');
        svg.append('line')
            .attr('x1', margin.left)
            .attr('x2', width - margin.right)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0))
            .attr('stroke', '#111111')
            .attr('stroke-width', 1);
        svg.selectAll('.domain').remove();
        svg.selectAll('text').attr('fill', '#888888').style('font-size', '12px');
        const line = d3.line().x(d => xScale(d.year)).y(d => yScale(d.anomaly)).curve(d3.curveMonotoneX);
        const paths = svg.selectAll('.trend-line')
            .data(AppData.seaLevel)
            .enter()
            .append('path')
            .attr('fill', 'none')
            .attr('stroke', d => d.isExtreme ? '#d92323' : '#cccccc')
            .attr('stroke-width', d => d.isExtreme ? 2.5 : 1)
            .attr('opacity', 0)
            .attr('d', d => line(d.coordinates));
        const labels = svg.selectAll('.extreme-label')
            .data(AppData.seaLevel.filter(d => d.isExtreme))
            .enter()
            .append('text')
            .attr('x', d => xScale(2025) + 10)
            .attr('y', d => yScale(d.coordinates[35].anomaly))
            .attr('fill', '#d92323')
            .style('font-size', '13px')
            .style('font-weight', '600')
            .text(d => d.name)
            .attr('opacity', 0);
        this.state.seaLevel = { paths, labels };
    },
    updateSeaLevel(step) {
        if (!this.state.seaLevel) return;
        const { paths, labels } = this.state.seaLevel;
        if (step === 0) {
            paths.transition().duration(800).ease(d3.easeCubicInOut)
                .attr('opacity', d => d.isExtreme ? 0 : 0.8);
            labels.transition().duration(400).attr('opacity', 0);
        } else if (step === 1) {
            paths.transition().duration(800).ease(d3.easeCubicInOut)
                .attr('opacity', d => d.isExtreme ? 1 : 0.1);
            labels.transition().delay(400).duration(600).attr('opacity', 1);
        }
    },
    initEmissions() {
        const container = Utils.select('#emissions-canvas');
        container.innerHTML = '';
        const width = 800;
        const height = 600;
        const cols = 3;
        const rows = 2;
        const cellW = width / cols;
        const cellH = height / rows;
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        const sizeScale = d3.scaleSqrt().domain([0, 500]).range([0, Math.min(cellW, cellH) * 0.7]);
        const groups = svg.selectAll('.emm-group')
            .data(AppData.emissionsLoss)
            .enter()
            .append('g')
            .attr('transform', (d, i) => `translate(${(i % cols) * cellW + cellW/2}, ${Math.floor(i / cols) * cellH})`);
        const baseline = cellH - 40;
        groups.append('rect')
            .attr('class', 'base-loss')
            .attr('x', d => -sizeScale(d.loss)/2)
            .attr('y', d => baseline - sizeScale(d.loss))
            .attr('width', d => sizeScale(d.loss))
            .attr('height', d => sizeScale(d.loss))
            .attr('fill', '#fdf2f2')
            .attr('stroke', '#d92323')
            .attr('stroke-dasharray', '4,4')
            .attr('opacity', 0);
        groups.append('rect')
            .attr('class', 'emission-sq')
            .attr('x', d => -sizeScale(d.loss)/2)
            .attr('y', baseline)
            .attr('width', d => sizeScale(d.emm * 10))
            .attr('height', 0)
            .attr('fill', '#d92323');
        groups.append('line')
            .attr('x1', -cellW/2 + 20)
            .attr('x2', cellW/2 - 20)
            .attr('y1', baseline)
            .attr('y2', baseline)
            .attr('stroke', '#e5e5e5')
            .attr('stroke-width', 2);
        groups.append('text')
            .attr('x', 0)
            .attr('y', baseline + 20)
            .attr('fill', '#111111')
            .style('font-size', '13px')
            .style('font-weight', '600')
            .attr('text-anchor', 'middle')
            .text(d => d.territory);
        this.state.emissions = { groups, sizeScale, baseline };
    },
    updateEmissions(step) {
        if (!this.state.emissions) return;
        const { groups, sizeScale, baseline } = this.state.emissions;
        if (step === 0) {
            groups.selectAll('.base-loss').transition().duration(800).ease(d3.easeCubicOut).attr('opacity', 1);
            groups.selectAll('.emission-sq').transition().duration(800).ease(d3.easeCubicOut)
                .attr('y', baseline)
                .attr('height', 0);
        } else if (step === 1) {
            groups.selectAll('.emission-sq').transition().duration(800).delay((d,i) => i * 150).ease(d3.easeCubicOut)
                .attr('y', d => baseline - sizeScale(d.emm * 10))
                .attr('height', d => sizeScale(d.emm * 10));
        }
    },
    initCoastlines() {
        const container = Utils.select('#coastline-canvas');
        container.innerHTML = '';
        const width = 800;
        const height = 600;
        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
        const sectionW = width / 3;
        const lineGen = d3.line().x(d=>d[0]).y(d=>d[1]).curve(d3.curveBasisClosed);
        const groups = svg.selectAll('.island-g')
            .data(AppData.coastlines)
            .enter()
            .append('g')
            .attr('transform', (d, i) => `translate(${i * sectionW + (sectionW/2)}, ${height/2})`);
        groups.append('path')
            .attr('d', d => lineGen(d.base))
            .attr('fill', '#f0f0f0')
            .attr('stroke', '#e5e5e5')
            .attr('opacity', 1);
        groups.append('path')
            .attr('class', 'primary-forest')
            .attr('d', d => lineGen(d.base.map(p => [p[0]*0.95, p[1]*0.95])))
            .attr('fill', '#10a37f')
            .attr('opacity', 0);
        const lossDots = groups.selectAll('.loss-dot')
            .data(d => d.loss)
            .enter()
            .append('circle')
            .attr('class', 'loss-dot')
            .attr('cx', d => d[0])
            .attr('cy', d => d[1])
            .attr('r', 0)
            .attr('fill', '#d92323')
            .attr('opacity', 0.85);
        groups.append('text')
            .attr('x', 0)
            .attr('y', 160)
            .attr('fill', '#111111')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .attr('text-anchor', 'middle')
            .text(d => d.name);
        this.state.coastlines = { groups, lossDots };
    },
    updateCoastlines(step) {
        if (!this.state.coastlines) return;
        const { groups, lossDots } = this.state.coastlines;
        if (step === 0) {
            groups.selectAll('.primary-forest').transition().duration(800).ease(d3.easeCubicInOut).attr('opacity', 0.9);
            lossDots.transition().duration(400).ease(d3.easeCubicInOut).attr('r', 0);
        } else if (step === 1) {
            lossDots.transition().duration(800).delay((d,i) => i * 15).ease(d3.easeBackOut)
                .attr('r', () => Math.random() * 6 + 3);
        }
    }
};