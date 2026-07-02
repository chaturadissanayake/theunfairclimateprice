document.addEventListener('DOMContentLoaded', () => {
    Charts.initSeaLevel();
    Charts.initEmissions();
    Charts.initCoastlines();
    window.addEventListener('scroll', handleScroll);
    handleScroll();
});

function handleScroll() {
    handleKineticHero();
    handleScrollytelling();
    updateProgressBar();
}

function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = Utils.select('#reading-progress');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
}

function handleKineticHero() {
    const heroSection = Utils.select('#kinetic-hero');
    if (!heroSection) return;
    const progress = Utils.getScrollFraction(heroSection);
    const f1 = Utils.select('#hero-frame-1');
    const f2 = Utils.select('#hero-frame-2');
    const f3 = Utils.select('#hero-frame-3');
    if (progress < 0.33) {
        const localP = progress / 0.33;
        f1.style.opacity = 1 - localP;
        f1.style.transform = `scale(${1 + localP * 0.1})`;
        f2.style.opacity = 0;
        f3.style.opacity = 0;
    } else if (progress < 0.66) {
        const localP = (progress - 0.33) / 0.33;
        f1.style.opacity = 0;
        f2.style.opacity = Math.sin(localP * Math.PI); 
        f2.style.transform = `translateY(${(1 - localP) * 20}px)`;
        f3.style.opacity = 0;
    } else {
        const localP = (progress - 0.66) / 0.34;
        f1.style.opacity = 0;
        f2.style.opacity = 0;
        f3.style.opacity = Math.min(1, localP * 2); 
        f3.style.transform = `translateY(${(1 - localP) * 20}px)`;
    }
}

function handleScrollytelling() {
    const steps = Utils.selectAll('.scroll-step');
    const viewportMiddle = window.innerHeight / 2;
    steps.forEach(step => {
        const rect = step.getBoundingClientRect();
        if (rect.top <= viewportMiddle && rect.bottom >= viewportMiddle) {
            if (!step.classList.contains('is-active')) {
                const siblings = step.parentElement.querySelectorAll('.scroll-step');
                siblings.forEach(s => s.classList.remove('is-active'));
                step.classList.add('is-active');
                triggerChartUpdate(step);
            }
        }
    });
}

function triggerChartUpdate(step) {
    const scene = step.getAttribute('data-scene');
    const stepIndex = parseInt(step.getAttribute('data-step'), 10);
    if (scene === 'sea-level') Charts.updateSeaLevel(stepIndex);
    if (scene === 'emissions') Charts.updateEmissions(stepIndex);
    if (scene === 'coastline') Charts.updateCoastlines(stepIndex);
}