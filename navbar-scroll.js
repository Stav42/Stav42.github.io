(() => {
    const navbar = document.querySelector('.navigation-bar');
    const banner = document.querySelector('.banner');
    if (!navbar || !banner) return;

    let pending = false;

    function updateColor() {
        const bannerBottom = banner.getBoundingClientRect().bottom;
        const navbarBottom = navbar.getBoundingClientRect().bottom;
        const fadeDistance = Math.min(200, window.innerHeight * 0.25);
        const progress = Math.max(0, Math.min(1,
            (navbarBottom + fadeDistance - bannerBottom) / fadeDistance
        ));
        // Ease the endpoints so the color gently leaves white and settles at grey.
        const blend = progress * progress * (3 - 2 * progress);
        const shade = Math.round(255 - 170 * blend);
        navbar.style.setProperty('--nav-text-color', `rgb(${shade}, ${shade}, ${shade})`);
        pending = false;
    }

    function scheduleUpdate() {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(updateColor);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);

    if ('ResizeObserver' in window) {
        const observer = new window.ResizeObserver(scheduleUpdate);
        observer.observe(banner);
        observer.observe(navbar);
    }
    updateColor();
})();
