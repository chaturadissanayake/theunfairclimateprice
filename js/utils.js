const Utils = {
    select: (s) => document.querySelector(s),
    selectAll: (s) => document.querySelectorAll(s),
    getScrollFraction: (el) => {
        const rect = el.getBoundingClientRect();
        const progress = -rect.top / (rect.height - window.innerHeight);
        return Math.max(0, Math.min(1, progress));
    },
    tooltip: {
        el: null,
        init() {
            this.el = document.querySelector('#global-tooltip');
        },
        show(event, content) {
            if (!this.el) this.init();
            this.el.innerHTML = content;
            this.el.style.opacity = '1';
            this.move(event);
        },
        move(event) {
            if (!this.el) return;
            this.el.style.left = `${event.pageX + 15}px`;
            this.el.style.top = `${event.pageY + 15}px`;
        },
        hide() {
            if (this.el) this.el.style.opacity = '0';
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Utils.tooltip.init();
});