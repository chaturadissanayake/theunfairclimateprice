/**
 * AppData
 * -------
 * Placeholder datasets standing in for extracts from the Pacific Data Hub
 * (stats.pacificdata.org), scoped to the Pacific Dataviz Challenge 2026
 * "Climate change" theme. Shapes mirror the official series named in the
 * methodology section below — swap the generator functions for real
 * fetched/parsed data when the final extracts are ready; the chart layer
 * in animations.js only expects the shapes documented per block.
 */
const AppData = {
    // Mirrors: "Sea level anomalies" + "Mean sea surface temperature anomalies"
    seaLevel: (() => {
        const paths = [];
        const extremeNames = ['Tuvalu Basin', 'Kiribati Coast', 'Fiji Outer'];
        for (let i = 0; i < 40; i++) {
            const isExtreme = i < 3;
            const path = [];
            let currentAnomaly = isExtreme ? (Math.random() * 2 + 1) : (Math.random() * 1.5 - 0.5);
            let currentYear = 1990;
            for (let j = 0; j < 36; j++) {
                path.push({ year: currentYear, anomaly: currentAnomaly });
                currentYear += 1;
                const drift = isExtreme ? (Math.random() * 0.5 + 0.1) : (Math.random() * 0.2 - 0.05);
                currentAnomaly += drift;
            }
            paths.push({
                id: i,
                isExtreme: isExtreme,
                name: isExtreme ? extremeNames[i] : '',
                coordinates: path
            });
        }
        return paths;
    })(),

    seaLevelMeta: {
        unit: 'mm',
        xDomain: [1990, 2025],
        yDomain: [-2, 14],
        legend: [
            { label: 'Flagged high-anomaly sites', color: '#c23a5e' },
            { label: 'Regional baseline', color: '#c3ceca' }
        ]
    },

    // Mirrors: "Greenhouse gas emissions per capita" + "Direct disaster economic loss"
    emissionsLoss: [
        { territory: 'Fiji', drop: 0.12, loss: 450.5, emm: 12.4 },
        { territory: 'Vanuatu', drop: 0.08, loss: 280.2, emm: 8.1 },
        { territory: 'Solomon Islands', drop: 0.09, loss: 310.8, emm: 9.2 },
        { territory: 'Kiribati', drop: 0.04, loss: 185.4, emm: 3.5 },
        { territory: 'Samoa', drop: 0.15, loss: 210.6, emm: 14.2 },
        { territory: 'Tonga', drop: 0.11, loss: 165.3, emm: 11.8 }
    ],

    emissionsMeta: {
        lossUnit: 'USD million / yr',
        emmUnit: 't CO2e per capita',
        legend: [
            { label: 'Disaster economic loss', color: '#12796f' },
            { label: 'Emissions per capita (×10 scale)', color: '#c23a5e' }
        ]
    },

    // Mirrors: "Coastline" + "Climate altering land cover index"
    coastlines: (() => {
        const islands = [];
        const names = ['Viti Levu', 'Espiritu Santo', 'Guadalcanal'];
        for (let i = 0; i < 3; i++) {
            const points = [];
            const lossPoints = [];
            for (let a = 0; a < Math.PI * 2; a += 0.1) {
                const r = 80 + Math.random() * 30 + Math.sin(a * 3) * 15;
                points.push([Math.cos(a) * r, Math.sin(a) * r]);
                if (Math.random() > 0.6) {
                    const lr = r * (0.8 + Math.random() * 0.2);
                    lossPoints.push([Math.cos(a) * lr, Math.sin(a) * lr]);
                }
            }
            islands.push({
                name: names[i],
                base: points,
                loss: lossPoints,
                lossPercent: Math.round((lossPoints.length / (Math.PI * 2 / 0.1)) * 100)
            });
        }
        return islands;
    })(),

    coastlineMeta: {
        legend: [
            { label: 'Primary forest cover', color: '#12796f' },
            { label: 'Land cover loss point', color: '#c23a5e' }
        ]
    }
};