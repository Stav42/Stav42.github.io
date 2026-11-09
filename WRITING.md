# Writing for the homepage

Write in a plain text file, save it, and refresh the local website. The site handles the HTML, typography, spacing, and media layout. There is no build command and no formatting toolbar to learn.

## Where to write

| Story | File |
| --- | --- |
| xTerra Robotics | `content/xterra.txt` |
| E&C | `content/ec.txt` |
| Research and ideas at Penn | `content/penn.txt` |

These appear under **Projects**, in the order above. The story title is supplied automatically; don't repeat it at the top of the file. Empty files, or files containing only comments, stay hidden. The existing “More soon” placeholder disappears once a story has content.

Start with `content/xterra.txt`. Replace the comment there, or write below it. Preview at http://localhost:8000/#projects while the local server is running. Save and refresh after each edit. Publishing still requires committing and pushing the changes.

Use a plain text editor, such as VS Code. The `.txt` extension is intentional: the site reads your text directly.

## The small set of formatting markers

### Paragraphs

Just write. Put a blank line between paragraphs. A single line break within a paragraph is treated as a space, so you can wrap long lines while editing.

```text
[Your first paragraph goes here.]

[Your next paragraph goes here.]
```

### Headings

Use `##` for a section within your story and `###` for a smaller subsection. Put a space after the markers.

```text
## What are quadruped robots?

[Your explanation.]

### A couple of examples

[Your examples.]
```

### Bold and italic

```text
This is **bold** and this is *italic*.
```

Keep these simple: don't nest bold, italic, or links inside one another.

### Links

Put the visible words in square brackets, followed immediately by the address in parentheses.

```text
[Name of a robot](https://example.com/robot)

You can also place [a link](https://example.com) inside a sentence.
```

Use the full `https://...` address for external links. Email links work too: `[Email me](mailto:you@example.com)`. Plain addresses remain plain text; use the bracket format to make them clickable.

Web links open in a new tab automatically; no extra syntax is needed. Links to a section on this page, such as `[Projects](#projects)`, scroll within the current tab. Email links open your email application.

### Lists

```text
- First item
- Second item
- Third item

1. First step
2. Next step
3. Final step
```

Put a blank line before and after a list. Keep each item on one line. Lists have one level; nested lists aren't supported.

### A quotation or a sentence to set apart

```text
> [A sentence you want to give its own space.]
```

This gets a subtle vertical rule and italic styling. Consecutive `>` lines form one quotation.

### Images

Add the image file to the repository, for example in `resources/projects/xterra/`. Then put this on its own line:

```text
![A short description of the photo](resources/projects/xterra/robot.jpg)
```

The words in brackets become the caption and the accessible image description. Images fit the reading column automatically. Use descriptive words rather than “image” or “photo.”

Paths start from the website root, **not** from the `content` folder. Use filenames with hyphens instead of spaces. If the folder doesn't exist yet, create it when adding your first image. An external `https://...` image address works as well.

To place an image on the **right with text wrapping around it**, use this instead:

```text
@image-right https://xterrarobotics.com/robot/svan_m2_front_cam_lidar_PTZ_cam.jpg | svan M2
```

Put this line before the paragraph you want beside the image. Text below it wraps on larger screens; on mobile the image stacks above the text. The caption after `|` is optional. Local image paths work here too.

### Videos

For a video file, use one line:

```text
@video resources/projects/xterra/demo.mp4 | A short caption for the video
```

The caption is optional:

```text
@video resources/projects/xterra/demo.mp4
```

Keep spaces around `|`. The video gets a player with controls, fits the reading column, and does not autoplay. An MP4 that plays in browsers is a good starting point. Upload the actual video file to that path; keep large videos on a video host instead of adding them to Git.

For a YouTube or Vimeo page, use a normal link:

```text
[Watch the robot in action](https://www.youtube.com/watch?v=VIDEO_ID)
```

Google Drive sharing links work with `@video` too:

```text
@video https://drive.google.com/file/d/FILE_ID/view?usp=sharing | A short caption
```

The site automatically uses Drive's embedded player and adds an “Open video in Google Drive” link underneath. To let visitors watch, the video must be shared with the intended audience; for a public website, use “Anyone with the link.”

For a smaller player on the **right with text wrapping around it**, use `@video-right`:

```text
@video-right https://drive.google.com/file/d/FILE_ID/view?usp=sharing | A short caption
```

Place it before the paragraph you want alongside it. This works for local video files too. Like `@image-right`, it takes up to 40% of the reading column (maximum 360px) on larger screens and stacks above the text on mobile.

`@video` expects a direct video file address or a Google Drive file link, not a YouTube/Vimeo watch-page address. Captions beneath the player describe the video; subtitle tracks aren't part of this format.

### Equations

For math **inside a sentence**, put dollar signs around each expression:

```text
We had to find $I_a$, $d$, $\tau_{\mathrm{comp}}$ and $\tau_f$.
```

This also works in bullet points. Use `\tau` for the Greek letter tau, and `_` for subscripts. The alternative `\(I_a\)` notation works too.

Put `@math` followed by a LaTeX equation on its own line:

```text
@math I_a\ddot{q} + d\dot{q} = \tau
```

The site displays `@math` as a centered equation; keep this marker at the start of its own line. Don't add dollar signs or HTML to an `@math` line. Keep the equation on one line in the text file; leave a blank line before and after it. Wide equations scroll horizontally on small screens. Math rendering uses the same external MathJax service as the blog.

### A dropdown the reader can open

Put the title after `@details`, write the contents below it, and close with `@enddetails`:

```text
@details What I learned from the human aspect of this role

[Your introductory paragraph.]

- **First lesson** Your explanation.
- **Another lesson** Your explanation.

@enddetails
```

Only the title shows at first. Readers click it (or focus it and press Enter/Space) to expand or collapse the contents. Paragraphs, lists, links, and your other formatting work inside. Keep the opening and closing markers on separate lines.

### Notes to yourself

```text
<!-- Find the old demo video before publishing this part. -->
```

These comments don't appear in the rendered story. They can span multiple lines. They are still present in the publicly downloadable text file, so use them for ordinary drafting notes.

## An optional outline for xTerra

This is only a structure to copy into `content/xterra.txt` if useful. It contains no biography or invented details. Each heading will appear as soon as you add it to the file; the comments won't.

```text
## What are quadruped robots?

<!-- Explain what they are, then add links to a couple of examples. -->

## How I got started

<!-- When you started, how it happened, and what drew you to them. -->

## Why I chose this

<!-- The mission, the uncertainty, the risks, and why they felt worthwhile.
     A concrete decision can show your values without needing to state them. -->

## What I worked on

<!-- What you personally did, why it mattered, what was hard,
     and what changed as a result. Use ### for individual pieces of work. -->

## Seeing it in motion

<!-- Add the video here if you find it, and explain what the viewer is seeing. -->
```

## A few boundaries

- This is a deliberately small Markdown-style format, not full Markdown. Tables, nested lists, code fences, inline code, and raw HTML aren't interpreted in story files.
- Put headings, lists, quotations, images, and video lines on their own lines; use blank lines to keep your draft readable.
- For addresses containing spaces, use `%20` or rename local files with hyphens. Links support ordinary parentheses in addresses; for unusually nested parentheses, use `%28` and `%29`.
- Every non-comment paragraph in a story file appears on the website after saving and refreshing. There is no separate draft/publish switch per story.
- Opening `index.html` directly as a file won't load the stories. Use the local HTTP preview or the deployed website.
