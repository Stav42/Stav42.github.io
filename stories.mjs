import { parseStory, renderStory } from './story-format.mjs';
import { typesetStoryMath } from './story-math.mjs';

export async function loadStories(document, fetchText) {
    const stories = [...document.querySelectorAll('[data-story-source]')];
    const container = document.getElementById('project-stories');
    const placeholder = document.getElementById('projects-placeholder');

    await Promise.all(stories.map(async story => {
        const body = story.querySelector('.story-body');
        try {
            const response = await fetchText(story.dataset.storySource, { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Story request returned ${response.status}`);
            const blocks = parseStory(await response.text());
            if (!blocks.length) return;
            body.replaceChildren(renderStory(blocks, document));
        } catch (error) {
            const message = document.createElement('p');
            message.textContent = "This story couldn't be loaded. Please try refreshing the page.";
            body.replaceChildren(message);
            console.error('Could not load story:', story.dataset.storySource, error);
        }
        story.hidden = false;
        container.hidden = false;
        placeholder.hidden = true;
    }));

    try {
        await typesetStoryMath(document);
    } catch (error) {
        // Keep the story readable if the external math renderer is unavailable.
        console.error('Could not typeset story equations:', error);
    }

    // A direct link may target a story that was hidden during initial navigation.
    const hash = document.defaultView.location.hash.slice(1);
    const target = stories.find(story => story.id === hash);
    if (target && !target.hidden) target.scrollIntoView({ behavior: 'instant' });
}

if (typeof document !== 'undefined') {
    loadStories(document, window.fetch.bind(window));
}
