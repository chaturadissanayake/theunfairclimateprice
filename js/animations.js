const Charts = {
    state: {},
    ink: '#0c2024',
    inkSoft: '#48605f',
    gridLine: '#dbe6e1',
    coral: '#c23a5e',
    teal: '#12796f',
    gold: '#c79a3d',

    dur(ms) {
        return Utils.prefersReducedMotion() ? 0 : ms;
    },

    /**
     * Populates an empty <svg><g class="contour-set"></g></svg> with a
     * handful of soft sine-wave lines. Used for the hero backdrop and the
     * footer bookend. CSS (.contour-set path) drives the drift animation.
     */
    initContours(selector, { rows = 5, width = 1440, height = 900, baseY = null } = {}) {
        const host = Utils.select(selector);
        if (!host) return;
        host.innerHTML = '';
        const anchorY = baseY ?? height * 0.62;
        for (let i = 0; i < rows; i++) {
            const amplitude = 18 + i * 6;
            const yOffset = anchorY + i * 34;
            const wavelength = 340 + i * 40;
            let d = `M -260 ${yOffset}`;
            for (let x = -260; x <= width + 260; x += wavelength / 2) {
                const y = yOffset + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
                d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
            }
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            host.appendChild(path);
        }
    },

    addLegend(svg, items, x, y) {
        const legend = svg.append('g')
            .attr('class', 'chart-legend')
            .attr('transform', `translate(${x}, ${y})`);

        let currentX = 0;
        const rows = legend.selectAll('.legend-row')
            .data(items)
            .enter()
            .append('g')
            .attr('class', 'legend-row')
            .attr('transform', (d, i) => {
                const xPos = currentX;
                currentX += 30 + (d.label.length * 6.5);
                return `translate(${xPos}, 0)`;
            });

        rows.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', d => d.color)
            .attr('stroke', d => d.stroke || 'none');

        rows.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .style('font-size', '11px')
            .style('font-weight', '500')
            .attr('fill', this.inkSoft)
            .text(d => d.label);

        return legend;
    },

    initSeaLevel() {
        const container = Utils.select('#sea-level-canvas');
        container.innerHTML = '';
        const width = 800;
        const height = 620;
        const margin = { top: 130, right: 130, bottom: 50, left: 55 };
        const meta = AppData.seaLevelMeta;

        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('role', 'img')
            .attr('aria-label', 'Line chart of sea surface anomalies from 1990 to 2025, highlighting three flagged sites');

        const xScale = d3.scaleLinear().domain(meta.xDomain).range([margin.left, width - margin.right]);
        const yScale = d3.scaleLinear().domain(meta.yDomain).range([height - margin.bottom, margin.top]);

        const yAxisGrid = d3.axisLeft(yScale)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat(d => `${d}${meta.unit}`)
            .ticks(6);
        svg.append('g')
            .attr('class', 'y-grid')
            .attr('transform', `translate(${margin.left}, 0)`)
            .call(yAxisGrid)
            .selectAll('line').attr('stroke', this.gridLine);

        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(8);
        svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height - margin.bottom})`)
            .call(xAxis);

        svg.append('line')
            .attr('x1', margin.left)
            .attr('x2', width - margin.right)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0))
            .attr('stroke', this.ink)
            .attr('stroke-width', 1);

        svg.selectAll('.domain').attr('stroke', this.gridLine);
        svg.selectAll('.y-grid text, .x-axis text').attr('fill', this.inkSoft).style('font-size', '11px').style('font-family', "'IBM Plex Mono', monospace");
        svg.selectAll('.x-axis line').attr('stroke', this.gridLine);

        svg.append('text')
            .attr('x', margin.left)
            .attr('y', margin.top - 65)
            .style('font-size', '14px')
            .style('font-weight', '600')
            .attr('fill', this.ink)
            .text('Sea surface anomaly, relative to 1990 baseline');

        this.addLegend(svg, meta.legend, margin.left, margin.top - 25);

        const line = d3.line().x(d => xScale(d.year)).y(d => yScale(d.anomaly)).curve(d3.curveMonotoneX);

        const paths = svg.selectAll('.trend-line')
            .data(AppData.seaLevel)
            .enter()
            .append('path')
            .attr('class', 'trend-line')
            .attr('fill', 'none')
            .attr('stroke', d => d.isExtreme ? this.coral : '#c3ceca')
            .attr('stroke-width', d => d.isExtreme ? 2.5 : 1)
            .attr('opacity', 0)
            .attr('d', d => line(d.coordinates))
            .style('cursor', d => d.isExtreme ? 'pointer' : 'default')
            .on('mouseenter', function (event, d) {
                if (!d.isExtreme) return;
                d3.select(this).attr('stroke-width', 4);
                const last = d.coordinates[d.coordinates.length - 1];
                Utils.tooltip.show(event, d.name, `${Utils.formatNumber(last.anomaly)}${meta.unit} anomaly in ${last.year}`);
            })
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', function (event, d) {
                d3.select(this).attr('stroke-width', d.isExtreme ? 2.5 : 1);
                Utils.tooltip.hide();
            });

        const labelData = AppData.seaLevel.filter(d => d.isExtreme)
            .sort((a, b) => b.coordinates[35].anomaly - a.coordinates[35].anomaly);

        let currentY = -999;
        const labelPositions = new Map();
        labelData.forEach(d => {
            let yPos = yScale(d.coordinates[35].anomaly);
            if (yPos - currentY < 16) {
                yPos = currentY + 16;
            }
            labelPositions.set(d.id, yPos);
            currentY = yPos;
        });

        const labels = svg.selectAll('.extreme-label')
            .data(labelData)
            .enter()
            .append('text')
            .attr('class', 'extreme-label')
            .attr('x', xScale(2025) + 10)
            .attr('y', d => labelPositions.get(d.id))
            .attr('fill', this.coral)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('font-family', "'IBM Plex Mono', monospace")
            .text(d => d.name)
            .attr('opacity', 0);

        this.state.seaLevel = { paths, labels };
    },

    updateSeaLevel() {
        if (!this.state.seaLevel) return;
        const { paths, labels } = this.state.seaLevel;
        paths.transition().duration(this.dur(1200)).ease(d3.easeCubicInOut)
            .attr('opacity', d => d.isExtreme ? 1 : 0.15);
        labels.transition().delay(this.dur(600)).duration(this.dur(800)).attr('opacity', 1);
    },

    initEmissions() {
        const container = Utils.select('#emissions-canvas');
        container.innerHTML = '';
        const width = 800;
        const height = 640;
        const cols = 3;
        const rows = 2;
        const topPad = 100;
        const cellW = width / cols;
        const cellH = (height - topPad) / rows;
        const meta = AppData.emissionsMeta;

        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('role', 'img')
            .attr('aria-label', 'Grid comparing disaster economic loss against emissions per capita for six Pacific territories');

        const centerX = 400;
        const legendWidth = 350;

        svg.append('text')
            .attr('x', centerX)
            .attr('y', 35)
            .style('font-size', '14px')
            .style('font-weight', '600')
            .attr('text-anchor', 'middle')
            .attr('fill', this.ink)
            .text('Economic impact vs. emissions profile');

        this.addLegend(svg, meta.legend, centerX - (legendWidth / 2), 60);

        const sizeScale = d3.scaleSqrt().domain([0, 500]).range([0, Math.min(cellW, cellH) * 0.6]);

        const groups = svg.selectAll('.emm-group')
            .data(AppData.emissionsLoss)
            .enter()
            .append('g')
            .attr('class', 'emm-group')
            .attr('transform', (d, i) => `translate(${(i % cols) * cellW + cellW / 2}, ${topPad + Math.floor(i / cols) * cellH})`)
            .style('cursor', 'pointer');

        const baseline = cellH - 50;

        groups.append('rect')
            .attr('class', 'base-loss')
            .attr('x', d => -sizeScale(d.loss) / 2)
            .attr('y', d => baseline - sizeScale(d.loss))
            .attr('width', d => sizeScale(d.loss))
            .attr('height', d => sizeScale(d.loss))
            .attr('fill', this.teal)
            .style('transition', 'opacity 0.2s ease')
            .attr('opacity', 0);

        groups.append('rect')
            .attr('class', 'emission-sq')
            .attr('x', d => -sizeScale(d.loss) / 2)
            .attr('y', baseline)
            .attr('width', d => sizeScale(d.emm * 10))
            .attr('height', 0)
            .attr('fill', this.coral);

        groups.append('rect')
            .attr('class', 'hit-target')
            .attr('x', -cellW / 2 + 10)
            .attr('y', -20)
            .attr('width', cellW - 20)
            .attr('height', cellH - 30)
            .attr('fill', 'transparent')
            .on('mouseenter', function (event, d) {
                d3.select(this.parentNode).select('.base-loss').attr('opacity', 0.7);
                Utils.tooltip.show(event, d.territory, `Loss: $${Utils.formatNumber(d.loss)}M/yr`, `Emissions: ${Utils.formatNumber(d.emm)} ${meta.emmUnit}`);
            })
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', function () {
                d3.select(this.parentNode).select('.base-loss').attr('opacity', 1);
                Utils.tooltip.hide();
            });

        groups.append('line')
            .attr('x1', -cellW / 2 + 20)
            .attr('x2', cellW / 2 - 20)
            .attr('y1', baseline)
            .attr('y2', baseline)
            .attr('stroke', this.gridLine)
            .attr('stroke-width', 2);

        groups.append('text')
            .attr('x', 0)
            .attr('y', baseline + 24)
            .attr('fill', this.ink)
            .style('font-size', '13px')
            .style('font-weight', '600')
            .attr('text-anchor', 'middle')
            .text(d => d.territory);

        this.state.emissions = { groups, sizeScale, baseline };
    },

    updateEmissions() {
        if (!this.state.emissions) return;
        const { groups, sizeScale, baseline } = this.state.emissions;
        groups.selectAll('.base-loss').transition().duration(this.dur(1000)).ease(d3.easeCubicOut).attr('opacity', 1);
        groups.selectAll('.emission-sq').transition().duration(this.dur(1000)).delay((d, i) => this.dur(400 + i * 150)).ease(d3.easeCubicOut)
            .attr('y', d => baseline - sizeScale(d.emm * 10))
            .attr('height', d => sizeScale(d.emm * 10));
    },

    initCoastlines() {
        const container = Utils.select('#coastline-canvas');
        container.innerHTML = '';
        const width = 800;
        const height = 640;
        const topPad = 100;
        const meta = AppData.coastlineMeta;

        const svg = d3.select(container).append('svg')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('role', 'img')
            .attr('aria-label', 'Three island coastline diagrams showing forest cover and land loss points');

        const leftAlign = 55;
        svg.append('text')
            .attr('x', leftAlign)
            .attr('y', 35)
            .style('font-size', '14px')
            .style('font-weight', '600')
            .attr('fill', this.ink)
            .text('Coastal ecosystem degradation map');

        this.addLegend(svg, meta.legend, leftAlign, 60);

        const sectionW = width / 3;
        const lineGen = d3.line().x(d => d[0]).y(d => d[1]).curve(d3.curveBasisClosed);

        const groups = svg.selectAll('.island-g')
            .data(AppData.coastlines)
            .enter()
            .append('g')
            .attr('class', 'island-g')
            .attr('transform', (d, i) => `translate(${i * sectionW + (sectionW / 2)}, ${topPad + (height - topPad) / 2 - 20})`);

        groups.append('path')
            .attr('d', d => lineGen(d.base))
            .attr('fill', '#e2ece8')
            .attr('stroke', this.gridLine)
            .attr('opacity', 1);

        groups.append('path')
            .attr('class', 'primary-forest')
            .attr('d', d => lineGen(d.base.map(p => [p[0] * 0.95, p[1] * 0.95])))
            .attr('fill', this.teal)
            .attr('opacity', 0);

        const lossDots = groups.selectAll('.loss-dot')
            .data(d => d.loss)
            .enter()
            .append('circle')
            .attr('class', 'loss-dot')
            .attr('cx', d => d[0])
            .attr('cy', d => d[1])
            .attr('r', 0)
            .attr('fill', this.coral)
            .attr('opacity', 0.9)
            .style('cursor', 'pointer')
            .on('mouseenter', function (event, d) {
                const island = d3.select(this.parentNode).datum();
                Utils.tooltip.show(event, island.name, 'Land cover loss point');
            })
            .on('mousemove', event => Utils.tooltip.move(event))
            .on('mouseleave', () => Utils.tooltip.hide());

        groups.append('text')
            .attr('x', 0)
            .attr('y', 160)
            .attr('fill', this.ink)
            .style('font-size', '14px')
            .style('font-weight', '600')
            .attr('text-anchor', 'middle')
            .text(d => d.name);

        groups.append('text')
            .attr('class', 'loss-stat')
            .attr('x', 0)
            .attr('y', 182)
            .attr('fill', this.coral)
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('font-family', "'IBM Plex Mono', monospace")
            .attr('text-anchor', 'middle')
            .attr('opacity', 0)
            .text(d => `${d.lossPercent}% perimeter affected`);

        this.state.coastlines = { groups, lossDots };
    },

    updateCoastlines() {
        if (!this.state.coastlines) return;
        const { groups, lossDots } = this.state.coastlines;
        groups.selectAll('.primary-forest').transition().duration(this.dur(1000)).ease(d3.easeCubicInOut).attr('opacity', 0.9);
        lossDots.transition().duration(this.dur(800)).delay((d, i) => this.dur(600 + i * 15)).ease(d3.easeBackOut)
            .attr('r', () => Math.random() * 6 + 3);
        groups.selectAll('.loss-stat').transition().delay(this.dur(1000)).duration(this.dur(600)).attr('opacity', 1);
    }
};