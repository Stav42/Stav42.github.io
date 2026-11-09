(() => {
    const links = [...document.querySelectorAll('.page-contents a')];
    const sections = links.map(link => document.querySelector(link.hash));
    if (!links.length || sections.some(section => !section)) return;

    let pending = false;

    function updateCurrentSection() {
        // Follow the heading that has passed the upper part of the viewport.
        const readingLine = Math.min(window.innerHeight * 0.28, 160);
        let current = 0;

        sections.forEach((section, index) => {
            if (section.getBoundingClientRect().top <= readingLine) {
                current = index;
            }
        });

        links.forEach((link, index) => {
            if (index === current) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
        pending = false;
    }

    function scheduleUpdate() {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(updateCurrentSection);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    window.addEventListener('hashchange', scheduleUpdate);

    // Recheck positions when images, fonts, or future content change the layout.
    if ('ResizeObserver' in window) {
        const observer = new window.ResizeObserver(scheduleUpdate);
        observer.observe(document.body);
    }
    updateCurrentSection();
})();
