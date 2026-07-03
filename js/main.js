const heroMotion = { current: 0, target: 0, raf: null };
const tideIslands = [];

document.addEventListener('DOMContentLoaded', () => {
    calculateNavTrigger();
    const renderCharts = () => {
        Charts.initSeaLevel();
        Charts.initEmissions();
        Charts.initCoastlines();
        Charts.initContours('#hero-contours', { rows: 5, width: 1440, height: 900, baseY: 560 });
        Charts.initContours('#footer-contours', { rows: 4, width: 1440, height: 420, baseY: 90 });
        Utils.selectAll('.chart-canvas').forEach(c => {
            if (c.dataset.hasAnimated === 'true') triggerChartUpdate(c);
        });
    };
    renderCharts();

    let resizeTimer;
    window.addEventListener('resize', () => {
        calculateNavTrigger();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderCharts, 250);
    });

    Utils.selectAll('.tide-island').forEach((el) => {
        tideIslands.push({ el, threshold: parseFloat(el.getAttribute('data-submerge')) || 0.6 });
    });

    initScrollytellingObserver();
    initNavObserver();
    initUIElements();

    window.addEventListener('scroll', Utils.onRaf(() => {
        updateProgressBar();
        updateHeroTarget();
        updateNavVisibility();
    }));
    updateProgressBar();
    updateHeroTarget();
    updateNavVisibility();
    startHeroLoop();
});

function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    const progressBar = Utils.select('#reading-progress');
    if (progressBar) {
        progressBar.style.width = `${scrolled}%`;
        progressBar.parentElement.setAttribute('aria-valuenow', Math.round(scrolled));
    }
}

function updateHeroTarget() {
    const heroSection = Utils.select('#kinetic-hero');
    if (!heroSection) return;
    heroMotion.target = Utils.getScrollFraction(heroSection);
}

function startHeroLoop() {
    const reduced = Utils.prefersReducedMotion();
    const tick = () => {
        heroMotion.current = reduced
            ? heroMotion.target
            : Utils.lerp(heroMotion.current, heroMotion.target, 0.12);
        renderHero(heroMotion.current);
        updateTide(heroMotion.current);
        heroMotion.raf = window.requestAnimationFrame(tick);
    };
    tick();
}

function renderHero(progress) {
    const f1 = Utils.select('#hero-frame-1');
    const f2 = Utils.select('#hero-frame-2');
    const f3 = Utils.select('#hero-frame-3');
    if (!f1 || !f2 || !f3) return;
    const reduced = Utils.prefersReducedMotion();

    if (progress < 0.33) {
        const localP = progress / 0.33;
        f1.style.opacity = 1 - localP;
        f1.style.transform = reduced ? 'none' : `scale(${1 + localP * 0.1})`;
        f2.style.opacity = 0;
        f3.style.opacity = 0;
    } else if (progress < 0.66) {
        const localP = (progress - 0.33) / 0.33;
        f1.style.opacity = 0;
        f2.style.opacity = Math.sin(localP * Math.PI);
        f2.style.transform = reduced ? 'none' : `translateY(${(1 - localP) * 20}px)`;
        f3.style.opacity = 0;
    } else {
        const localP = (progress - 0.66) / 0.34;
        f1.style.opacity = 0;
        f2.style.opacity = 0;
        f3.style.opacity = Math.min(1, localP * 2);
        f3.style.transform = reduced ? 'none' : `translateY(${(1 - localP) * 20}px)`;
    }
}

/**
 * Drives the hero's signature element: a tide line that rises across the
 * full scroll of the hero runway, with a running readout and a set of
 * island silhouettes that fade as the water passes their threshold.
 * Purely illustrative — mirrors the "Sea level anomalies" dataset in tone,
 * not in exact value.
 */
function updateTide(progress) {
    const svgH = 900;
    const minWater = 90;
    const maxWater = 480;
    const h = Utils.lerp(minWater, maxWater, progress);
    const y = svgH - h;
    const waterEl = Utils.select('#tide-water');
    if (waterEl) {
        waterEl.setAttribute('y', y.toFixed(1));
        waterEl.setAttribute('height', (h + 60).toFixed(1));
    }

    const readout = Utils.select('#tide-readout-value');
    if (readout) {
        const val = Utils.lerp(0, 3.42, progress).toFixed(2);
        readout.textContent = `+${val}mm`;
    }

    tideIslands.forEach(({ el, threshold }) => {
        if (progress <= threshold) {
            el.style.opacity = 1;
        } else {
            const fade = Utils.clamp(1 - (progress - threshold) * 5, 0, 1);
            el.style.opacity = fade;
        }
    });
}

function initScrollytellingObserver() {
    const canvases = Utils.selectAll('.chart-canvas');
    const options = { root: null, rootMargin: '0px 0px -20% 0px', threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const canvas = entry.target;
            if (canvas.dataset.hasAnimated) return;
            canvas.dataset.hasAnimated = 'true';
            triggerChartUpdate(canvas);
        });
    }, options);

    canvases.forEach((canvas) => observer.observe(canvas));
}

function initNavObserver() {
    const navLinks = Utils.selectAll('.nav-links a[href^="#"]:not([href="#"])');
    const targets = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const id = `#${entry.target.id}`;
            const link = navLinks.find((a) => a.getAttribute('href') === id);
            if (!link) return;

            if (entry.isIntersecting) {
                navLinks.forEach((a) => {
                    a.removeAttribute('aria-current');
                    a.classList.remove('nav-link-primary');
                    a.classList.add('nav-link-secondary');
                });
                link.setAttribute('aria-current', 'true');
                link.classList.remove('nav-link-secondary');
                link.classList.add('nav-link-primary');
            }
        });
    }, { root: null, rootMargin: '-10% 0px -80% 0px', threshold: 0 });

    targets.forEach((target) => observer.observe(target));
}

function triggerChartUpdate(canvas) {
    const scene = canvas.getAttribute('data-scene');
    if (scene === 'sea-level') Charts.updateSeaLevel();
    if (scene === 'emissions') Charts.updateEmissions();
    if (scene === 'coastline') Charts.updateCoastlines();
}

let navTriggerPoint = 0;
function calculateNavTrigger() {
    const hero = Utils.select('#kinetic-hero');
    if (hero) navTriggerPoint = hero.offsetHeight - 50;
}

function updateNavVisibility() {
    const nav = Utils.select('.editorial-nav');
    const langSwitch = Utils.select('.global-lang-switch');
    if (!nav) return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    if (scrollY > navTriggerPoint) {
        nav.classList.add('is-visible');
        if (langSwitch) langSwitch.classList.add('in-nav-mode');
    } else {
        nav.classList.remove('is-visible');
        if (langSwitch) langSwitch.classList.remove('in-nav-mode');
    }
}

function initUIElements() {
    Utils.selectAll('.flip-card').forEach(card => {
        const toggleCard = () => {
            const isFlipped = card.classList.toggle('flipped');
            card.setAttribute('aria-pressed', isFlipped);
        };
        card.addEventListener('click', toggleCard);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCard();
            }
        });
    });

    const tabs = Utils.selectAll('.citation-tab');
    const citeText = Utils.select('.citation-content p');
    const citations = {
        'APA': 'Dissanayake, C. (2026). The Unfair Climate Price: how six climate datasets reveal an unequal ocean [Data story]. Pacific Dataviz Challenge 2026. Retrieved from https://theunfairclimateprice.vercel.app',
        'Journalistic': 'Chatura Dissanayake, "The Unfair Climate Price," Pacific Dataviz Challenge 2026, July 3, 2026, https://theunfairclimateprice.vercel.app.',
        'BibTeX': '@misc{dissanayake2026paradox,\n  author = {Dissanayake, Chatura},\n  title = {The Unfair Climate Price},\n  year = {2026},\n  url = {https://theunfairclimateprice.vercel.app}\n}'
    };

    tabs.forEach(tab => {
        const selectTab = () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
                t.setAttribute('tabindex', '-1');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            tab.setAttribute('tabindex', '0');
            if (citeText && citations[tab.innerText]) {
                citeText.innerText = citations[tab.innerText];
            }
        };
        tab.addEventListener('click', selectTab);
        tab.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectTab();
            }
        });
    });

    const copyCiteBtn = Utils.select('.copy-cite-btn');
    if (copyCiteBtn) {
        copyCiteBtn.addEventListener('click', () => {
            if (citeText && navigator.clipboard) {
                navigator.clipboard.writeText(citeText.innerText).then(() => {
                    const originalText = copyCiteBtn.innerText;
                    copyCiteBtn.innerText = 'Copied!';
                    setTimeout(() => copyCiteBtn.innerText = originalText, 2000);
                }).catch(err => console.error('Clipboard error:', err));
            }
        });
    }

    const shareBtn = Utils.select('.share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const originalText = shareBtn.innerText;
                    shareBtn.innerText = 'Link copied!';
                    setTimeout(() => shareBtn.innerText = originalText, 2000);
                }).catch(err => console.error('Clipboard error:', err));
            }
        });
    }
}