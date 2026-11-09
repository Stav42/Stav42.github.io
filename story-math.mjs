const loaders = new WeakMap();

export async function typesetStoryMath(document) {
    const equations = [...document.querySelectorAll('.story-equation, .story-inline-math')];
    if (!equations.length) return;

    const window = document.defaultView;
    if (!loaders.has(document)) {
        if (window.MathJax?.typesetPromise) {
            loaders.set(document, Promise.resolve(window.MathJax.startup.promise)
                .then(() => window.MathJax));
        } else {
            // Match the MathJax version already used by the blog.
            window.MathJax = { startup: { typeset: false } };
            loaders.set(document, new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-mml-chtml.js';
                script.crossOrigin = 'anonymous';
                script.async = true;
                script.onload = () => Promise.resolve(window.MathJax.startup.promise)
                    .then(() => resolve(window.MathJax), reject);
                script.onerror = () => reject(new Error('Could not load MathJax'));
                document.head.append(script);
            }));
        }
    }

    const mathJax = await loaders.get(document);
    await mathJax.typesetPromise(equations);
}
