const AppData = {
    seaLevel: (() => {
        const paths = [];
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
                name: isExtreme ? ['Tuvalu Basin', 'Kiribati Coast', 'Fiji Outer'][i] : '',
                coordinates: path
            });
        }
        return paths;
    })(),
    emissionsLoss: [
        { territory: "Fiji", drop: 0.12, loss: 450.5, emm: 12.4 },
        { territory: "Vanuatu", drop: 0.08, loss: 280.2, emm: 8.1 },
        { territory: "Solomon Islands", drop: 0.09, loss: 310.8, emm: 9.2 },
        { territory: "Kiribati", drop: 0.04, loss: 185.4, emm: 3.5 },
        { territory: "Samoa", drop: 0.15, loss: 210.6, emm: 14.2 },
        { territory: "Tonga", drop: 0.11, loss: 165.3, emm: 11.8 }
    ],
    coastlines: (() => {
        const islands = [];
        for(let i=0; i<3; i++) {
            const points = [];
            const lossPoints = [];
            for(let a=0; a<Math.PI*2; a+=0.1) {
                const r = 80 + Math.random() * 30 + Math.sin(a*3)*15;
                points.push([Math.cos(a)*r, Math.sin(a)*r]);
                if (Math.random() > 0.6) {
                    const lr = r * (0.8 + Math.random()*0.2);
                    lossPoints.push([Math.cos(a)*lr, Math.sin(a)*lr]);
                }
            }
            islands.push({ 
                name: ["Viti Levu", "Espiritu Santo", "Guadalcanal"][i],
                base: points, 
                loss: lossPoints 
            });
        }
        return islands;
    })()
};