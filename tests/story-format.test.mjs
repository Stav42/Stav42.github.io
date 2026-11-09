import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStory, renderStory } from '../story-format.mjs';
import { loadStories } from '../stories.mjs';
import { typesetStoryMath } from '../story-math.mjs';

// A minimal DOM adapter keeps these tests dependency-free.
class Element {
    constructor(tagName, text = '') {
        this.tagName = tagName;
        this.children = [];
        this.text = text;
        this.hidden = true;
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    set textContent(value) { this.text = value; this.children = []; }
    get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
    scrollIntoView() { this.scrolled = true; }
}

function makeDocument() {
    return {
        baseURI: 'https://example.com/',
        defaultView: { location: { hash: '' } },
        createElement: tag => new Element(tag),
        createTextNode: text => new Element('#text', text),
        createDocumentFragment: () => new Element('#fragment'),
    };
}

function render(source) {
    return renderStory(parseStory(source), makeDocument());
}

function descendants(element, tag) {
    return element.children.flatMap(child => [
        ...(child.tagName === tag ? [child] : []), ...descendants(child, tag)
    ]);
}

test('paragraph wrapping, blank lines, headings, and Windows newlines', () => {
    const blocks = parseStory('First line\r\ncontinued.\r\n\r\nNext paragraph.\r\n## Heading\r\n### Smaller heading');
    assert.deepEqual(blocks, [
        { type: 'paragraph', text: 'First line continued.' },
        { type: 'paragraph', text: 'Next paragraph.' },
        { type: 'heading', level: 2, text: 'Heading' },
        { type: 'heading', level: 3, text: 'Smaller heading' },
    ]);
    assert.deepEqual(render('## Heading\n### Smaller heading').children.map(node => node.tagName), ['h4', 'h5']);
});

test('empty drafts and drafting comments produce no blocks', () => {
    assert.deepEqual(parseStory('  \n<!-- notes\nacross multiple lines -->\n'), []);
    assert.deepEqual(parseStory('<!-- unfinished note'), []);
    assert.equal(parseStory('Visible <!-- note --> text.')[0].text, 'Visible  text.');
});

test('lists and quotations remain distinct from surrounding paragraphs', () => {
    const fragment = render('Before.\n\n- One\n- Two\n\n3. Three\n4. Four\n\n> A quotation\n> continued.\n\nAfter.');
    assert.deepEqual(fragment.children.map(node => node.tagName), ['p', 'ul', 'ol', 'blockquote', 'p']);
    assert.deepEqual(fragment.children[1].children.map(item => item.textContent), ['One', 'Two']);
    assert.equal(fragment.children[2].start, 3);
    assert.equal(fragment.children[3].textContent, 'A quotation continued.');
});

test('a reflection dropdown starts closed and keeps its paragraph and formatted bullets', () => {
    const fragment = render('Before.\n\n@details What I learned\n\nMy reflection.\n\n- **Kindness** First lesson.\n- Persistence.\n- Teamwork.\n\n@enddetails\n\nAfter.');
    assert.deepEqual(fragment.children.map(node => node.tagName), ['p', 'details', 'p']);
    const details = fragment.children[1];
    assert.equal(details.open ?? false, false);
    assert.equal(details.className, 'story-details');
    assert.equal(details.children[0].tagName, 'summary');
    assert.equal(details.children[0].textContent, 'What I learned');
    assert.equal(descendants(details, 'li').length, 3);
    assert.equal(descendants(details, 'strong')[0].textContent, 'Kindness');
    assert.equal(fragment.children[2].textContent, 'After.');
});

test('dropdown boundaries work beside lists and keep nested content inside', () => {
    const fragment = render('- Outside\n@details Outer\nText.\n@details Inner\n- Inside\n@enddetails\nMore.\n@enddetails\nFollowing.');
    assert.deepEqual(fragment.children.map(node => node.tagName), ['ul', 'details', 'p']);
    assert.equal(descendants(fragment, 'details').length, 2);
    assert.equal(descendants(fragment.children[1], 'li')[0].textContent, 'Inside');
    assert.equal(fragment.children[2].textContent, 'Following.');
    assert.equal(render('@details Unfinished\n\nA draft.').children[0].textContent, 'UnfinishedA draft.');
});

test('an equation after a list keeps LaTeX intact and follows the bullet points', () => {
    const latex = String.raw`I_a\ddot{q}+d\dot{q}=\operatorname{sat}(P_\tau(\hat q-q))+\tau_f`;
    const fragment = render(`- First point\n- Second point\n\n@math ${latex}\n\nAfter.`);
    assert.deepEqual(fragment.children.map(node => node.tagName), ['ul', 'div', 'p']);
    assert.equal(fragment.children[1].className, 'story-equation');
    assert.equal(fragment.children[1].textContent, `\\[${latex}\\]`);
    assert.equal(descendants(fragment.children[1], 'em').length, 0);
});

test('emphasis and multiple links render without consuming neighbouring text', () => {
    const fragment = render('Some **bold**, *italic*, [one](https://example.com/robot_(machine)) and [two](https://example.com/other).\n\n[Email](mailto:hello@example.com)');
    assert.equal(descendants(fragment, 'strong')[0].textContent, 'bold');
    assert.equal(descendants(fragment, 'em')[0].textContent, 'italic');
    assert.deepEqual(descendants(fragment, 'a').map(link => link.href), [
        'https://example.com/robot_(machine)', 'https://example.com/other', 'mailto:hello@example.com'
    ]);
    assert.equal(fragment.children[0].textContent, 'Some bold, italic, one and two.');
});

test('inline parameter math in a bullet keeps subscripts and Greek commands intact', () => {
    const fragment = render(String.raw`- We had to find $I_a$, $d$, $\tau_{\mathrm{comp}}$ and $\tau_f$, with **known gains**.`);
    const spans = descendants(fragment, 'span');
    assert.equal(spans.length, 4);
    assert(spans.every(span => span.className === 'story-inline-math'));
    assert.deepEqual(spans.map(span => span.textContent), [
        String.raw`\(I_a\)`, String.raw`\(d\)`, String.raw`\(\tau_{\mathrm{comp}}\)`, String.raw`\(\tau_f\)`
    ]);
    assert.equal(descendants(fragment, 'strong')[0].textContent, 'known gains');
    assert.equal(fragment.children[0].tagName, 'ul');
});

test('math is protected from emphasis parsing and also supports bracket delimiters', () => {
    const fragment = render(String.raw`A product $a * b * c$ and \(q_i\), followed by *normal emphasis*.`);
    assert.deepEqual(descendants(fragment, 'span').map(span => span.textContent), [
        String.raw`\(a * b * c\)`, String.raw`\(q_i\)`
    ]);
    assert.equal(descendants(fragment, 'em').length, 1);
    assert.equal(descendants(fragment, 'em')[0].textContent, 'normal emphasis');
});

test('web links open a new tab while section and email links retain their behaviour', () => {
    const fragment = render('[Robot](https://example.org/robot) [Projects](#projects) [Email](mailto:hello@example.com)');
    const [web, section, email] = descendants(fragment, 'a');
    assert.equal(web.target, '_blank');
    assert.equal(web.rel, 'noopener noreferrer');
    assert.equal(section.href, 'https://example.com/#projects');
    assert.equal(section.target, undefined);
    assert.equal(email.target, undefined);
});

test('HTML stays literal and executable links/media are not created', () => {
    const source = '<script>alert(1)</script> [bad](javascript:alert(1))\n\n![bad](data:image/png;base64,abc)\n\n@video javascript:alert(1)';
    const fragment = render(source);
    assert.equal(descendants(fragment, 'script').length, 0);
    assert.equal(descendants(fragment, 'a').length, 0);
    assert.equal(descendants(fragment, 'img').length, 0);
    assert.equal(descendants(fragment, 'video').length, 0);
    assert.match(fragment.textContent, /<script>/);
});

test('right-wrapped image keeps its caption and the following text in order', () => {
    const fragment = render('@image-right https://xterrarobotics.com/robot/svan_m2_front_cam_lidar_PTZ_cam.jpg | svan M2\n\nThe article continues here.');
    assert.deepEqual(fragment.children.map(node => node.tagName), ['figure', 'p']);
    assert.equal(fragment.children[0].className, 'story-image-right');
    assert.equal(descendants(fragment, 'img')[0].src, 'https://xterrarobotics.com/robot/svan_m2_front_cam_lidar_PTZ_cam.jpg');
    assert.equal(descendants(fragment, 'img')[0].alt, 'svan M2');
    assert.equal(descendants(fragment, 'figcaption')[0].textContent, 'svan M2');
    assert.equal(fragment.children[1].textContent, 'The article continues here.');
    assert.equal(render('![Normal](resources/photo.jpg)').children[0].className, undefined);
});

test('image captions, site-relative paths, and video controls', () => {
    const fragment = render('![Robot on a trail](resources/projects/xterra/robot.jpg)\n\n@video resources/projects/xterra/demo.mp4 | The first demo\n\n@video https://media.example.com/demo.mp4');
    const image = descendants(fragment, 'img')[0];
    assert.equal(image.src, 'https://example.com/resources/projects/xterra/robot.jpg');
    assert.equal(image.alt, 'Robot on a trail');
    assert.equal(image.loading, 'lazy');
    const videos = descendants(fragment, 'video');
    assert.equal(videos.length, 2);
    assert.equal(videos[0].src, 'https://example.com/resources/projects/xterra/demo.mp4');
    assert.equal(videos[0].controls, true);
    assert.equal(videos[0].preload, 'metadata');
    assert.equal(videos[0].autoplay, undefined);
    assert.equal(videos[0].playsInline, true);
    assert.deepEqual(descendants(fragment, 'figcaption').map(caption => caption.textContent), ['Robot on a trail', 'The first demo']);
});

function loaderFixture(hash = '') {
    const document = makeDocument();
    document.defaultView.location.hash = hash;
    const container = new Element('div');
    const placeholder = new Element('div');
    placeholder.hidden = false;
    const stories = ['xterra', 'ec', 'penn'].map(id => {
        const story = new Element('article');
        story.id = id;
        story.dataset = { storySource: `content/${id}.txt` };
        const body = new Element('div');
        story.append(body);
        story.querySelector = () => body;
        return story;
    });
    document.querySelectorAll = selector => selector === '[data-story-source]' ? stories : [];
    document.getElementById = id => id === 'project-stories' ? container : placeholder;
    return { document, stories, container, placeholder };
}

test('Drive sharing links render a preview player with a direct-link fallback', () => {
    const url = 'https://drive.google.com/file/d/1Aged-IxzXXpzRyzeittjEYcQ3P6QyswG/view?usp=sharing';
    const fragment = render(`@video ${url} | xTerra Robotics demo`);
    const iframe = descendants(fragment, 'iframe')[0];
    assert.equal(iframe.src, 'https://drive.google.com/file/d/1Aged-IxzXXpzRyzeittjEYcQ3P6QyswG/preview');
    assert.equal(iframe.title, 'xTerra Robotics demo');
    assert.equal(iframe.allowFullscreen, true);
    assert.equal(descendants(fragment, 'video').length, 0);
    const link = descendants(fragment, 'a')[0];
    assert.equal(link.href, url);
    assert.equal(link.target, '_blank');
    assert.equal(descendants(fragment, 'figcaption')[0].textContent, 'xTerra Robotics demo');
});

test('Drive resource keys are preserved and other hosts are not embedded', () => {
    const keyed = render('@video https://drive.google.com/file/d/abc123/view?resourcekey=test-key');
    assert.equal(descendants(keyed, 'iframe')[0].src, 'https://drive.google.com/file/d/abc123/preview?resourcekey=test-key');
    const other = render('@video https://example.com/file/d/abc123/view');
    assert.equal(descendants(other, 'iframe').length, 0);
    assert.equal(descendants(other, 'video').length, 1);
});

test('right-wrapped video supports Drive and local files with text following it', () => {
    for (const [url, tag] of [
        ['https://drive.google.com/file/d/abc123/view', 'iframe'],
        ['resources/projects/xterra/demo.mp4', 'video']
    ]) {
        const fragment = render(`@video-right ${url} | Demo\n\nThe closing paragraph.`);
        assert.deepEqual(fragment.children.map(node => node.tagName), ['figure', 'p']);
        assert.equal(fragment.children[0].className, 'story-video-right');
        assert.equal(descendants(fragment, tag).length, 1);
        assert.equal(descendants(fragment, 'figcaption')[0].textContent, 'Demo');
        assert.equal(fragment.children[1].textContent, 'The closing paragraph.');
    }
    assert.equal(render('@video resources/demo.mp4').children[0].className, undefined);
});

test('blank story files keep the existing homepage placeholder', async () => {
    const fixture = loaderFixture();
    await loadStories(fixture.document, async () => ({ ok: true, text: async () => '<!-- draft -->' }));
    assert.equal(fixture.container.hidden, true);
    assert.equal(fixture.placeholder.hidden, false);
    assert(fixture.stories.every(story => story.hidden));
});

test('only written stories appear and direct story links scroll after loading', async () => {
    const fixture = loaderFixture('#xterra');
    await loadStories(fixture.document, async (path, options) => {
        assert.equal(options.cache, 'no-cache');
        return { ok: true, text: async () => path.includes('xterra') ? '## A heading\n\nA paragraph.' : '' };
    });
    assert.equal(fixture.container.hidden, false);
    assert.equal(fixture.placeholder.hidden, true);
    assert.deepEqual(fixture.stories.map(story => story.hidden), [false, true, true]);
    assert.equal(fixture.stories[0].scrolled, true);
    assert.match(fixture.stories[0].textContent, /A paragraph\./);
});

test('a failed fetch is visible and does not prevent another story loading', async t => {
    t.mock.method(console, 'error', () => {});
    const fixture = loaderFixture();
    await loadStories(fixture.document, async path => {
        if (path.includes('xterra')) return { ok: false, status: 404 };
        return { ok: true, text: async () => path.includes('ec') ? 'A paragraph.' : '' };
    });
    assert.match(fixture.stories[0].textContent, /couldn't be loaded/);
    assert.match(fixture.stories[1].textContent, /A paragraph\./);
    assert.equal(fixture.stories[2].hidden, true);
});

test('math is typeset only after MathJax startup has completed', async () => {
    const document = makeDocument();
    const equation = new Element('div');
    document.querySelectorAll = () => [equation];
    let ready = false;
    let calls = 0;
    document.defaultView.MathJax = {
        startup: { promise: Promise.resolve().then(() => { ready = true; }) },
        async typesetPromise(nodes) {
            assert.equal(ready, true);
            assert.deepEqual(nodes, [equation]);
            calls++;
        }
    };
    await typesetStoryMath(document);
    assert.equal(calls, 1);
});

test('pages without equations do not load MathJax', async () => {
    const document = makeDocument();
    document.querySelectorAll = () => [];
    await typesetStoryMath(document);
    assert.equal(document.defaultView.MathJax, undefined);
});

test('inline-only math is sent to MathJax without requiring a display equation', async () => {
    const document = makeDocument();
    const inline = new Element('span');
    inline.className = 'story-inline-math';
    document.querySelectorAll = selector => {
        assert.equal(selector, '.story-equation, .story-inline-math');
        return [inline];
    };
    let typeset = false;
    document.defaultView.MathJax = {
        startup: { promise: Promise.resolve() },
        async typesetPromise(nodes) { assert.deepEqual(nodes, [inline]); typeset = true; }
    };
    await typesetStoryMath(document);
    assert.equal(typeset, true);
});

test('MathJax is downloaded once and a load failure is reported', async () => {
    const document = makeDocument();
    document.querySelectorAll = () => [new Element('div')];
    let downloads = 0;
    document.head = { append(script) { downloads++; queueMicrotask(() => script.onerror()); } };
    await assert.rejects(typesetStoryMath(document), /Could not load MathJax/);
    await assert.rejects(typesetStoryMath(document), /Could not load MathJax/);
    assert.equal(downloads, 1);
});
