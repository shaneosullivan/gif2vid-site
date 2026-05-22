# GIF to Video Converter

A simple web application that converts GIF animations to MP4 videos directly in the browser using Web Workers. No backend required!

## Features

- 🎬 Convert GIF files to MP4 videos entirely in the browser
- 📱 **Installable as a Progressive Web App (PWA)**
- 💾 **Works offline with Service Worker caching**
- 🚀 Uses Web Workers for non-blocking conversion
- 📊 Side-by-side comparison of original GIF and converted MP4
- 🎨 Modern, attractive UI with responsive design
- 🖱️ Drag and drop support
- 💾 Direct download of converted videos
- ⚡ No server-side processing - all work happens locally

## Getting Started

### Installing as a PWA

1. Visit the site in your browser
2. Look for the "Install" or "Add to Home Screen" prompt
3. Click Install to add the app to your device

**Mobile (iOS/Android):**

- Tap the share button and select "Add to Home Screen"

**Desktop (Chrome/Edge):**

- Click the install icon in the address bar
- Or go to Menu → Install GIF to MP4 Converter

### Development Setup

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Serve locally on port 3340
npm run serve
```

### Scripts

- `npm run build` - Build main.js and worker.js
- `npm run build:main` - Build main application
- `npm run build:worker` - Build web worker
- `bun run build:site` - Generate all HTML pages from `pages/` Markdown sources
- `OPENAI_API_KEY=... bun run scripts/translate-pages.ts` - Translate English pages to all other locales
- `npm run watch` - Watch mode for development
- `npm run serve` - Serve the app locally on port 3340
- `npm run generate-icons` - Regenerate PWA icons from SVG

### Localisation

The site is fully localised. Each page is authored once in English and then machine-translated into the languages listed in `config/locale.ts`. The build step turns the Markdown sources into finished HTML.

#### Supported languages

Defined in `config/locale.ts` as `LOCALE_NAMES`. Currently: Czech, German, English, Spanish, French, Hindi, Korean, Polish, Latvian, Lithuanian, and Chinese.

#### Authoring pages

Page content lives in `pages/en/` as Markdown files. Each file has YAML frontmatter followed by the body:

```markdown
---
title: "Free GIF to MP4 Converter | Gif2Vid"   # <title> tag and OG title
header: "Free GIF to Video Converter"           # visible <h1>
description: "Convert GIFs to MP4 in your browser."  # subtitle above the form
legend: ""                                      # short label (used for nav)
version: 1                                      # increment to force re-translation
---

# Section heading

Paragraph text shown below the form.

# FAQ-style section

## Question / sub-item title
Answer or description text.

## Another question
Another answer.
```

- `#` headings become `<h2>` section headings with a horizontal rule between them.
- `##` headings under a `#` section render as `<dt>`/`<dd>` pairs inside a `<dl class="faq-list">`.
- A section with only a `#` heading and paragraph text (no `##` items) renders as a heading + `<p>`.

The four HTML nodes replaced by the build script are identified by `id`: `title`, `header`, `description`, and `page-content`.

#### Adding a new page

1. Create `pages/en/my-new-page.md` with the frontmatter above.
2. Run `bun run build:site` — this generates `my-new-page.html` at the root and `/{locale}/my-new-page.html` for every locale that has a translated copy.
3. Run the translation script (see below) to produce `pages/{locale}/my-new-page.md` for all other languages.

#### Building all pages

```bash
bun run build:site
```

Reads every `pages/{locale}/*.md` file and writes the corresponding HTML:

- `pages/en/index.md` → `index.html`
- `pages/en/my-page.md` → `my-page.html`
- `pages/fr/index.md` → `fr/index.html`
- `pages/fr/my-page.md` → `fr/my-page.html`

Also updates `sitemap.xml` with all generated URLs.

#### Translating pages

```bash
OPENAI_API_KEY=sk-... bun run scripts/translate-pages.ts
```

For every `.md` file in `pages/en/` and every non-English locale in `config/locale.ts`, the script:

1. Checks whether a translated file already exists at `pages/{locale}/{name}.md`.
2. Compares the `version:` field — if the target version is already equal to or higher than the source, the file is skipped.
3. Otherwise sends the entire Markdown file (frontmatter + body) to GPT-4o and asks it to translate the text while preserving YAML keys and Markdown structure.
4. Writes the result to `pages/{locale}/{name}.md`, creating the directory if needed.

To force a re-translation of a page, increment its `version:` number in the English source and re-run the script.

#### Adding a new language

1. Add an entry to both `LOCALES` and `LOCALE_NAMES` in `config/locale.ts`.
2. Add the flag image as `images/locale/{code}.png`.
3. Run the translation script to generate the Markdown files.
4. Run `bun run build:site` to generate the HTML.

## How It Works

1. **File Selection**: User selects or drags a GIF file
2. **Worker Processing**: The GIF data is sent to a Web Worker as a transferable ArrayBuffer
3. **Conversion**: The worker uses the `gif2vid` library (WebAssembly) to convert the GIF to MP4
4. **Display**: Both original GIF and converted MP4 are displayed side-by-side with file size statistics
5. **Offline Support**: Service Worker caches assets for offline use

## PWA Features

### Service Worker

- Caches static assets for offline use
- Network-first strategy for fresh content
- Automatic cache cleanup

### Icons & Manifest

- Multiple icon sizes (72x72 to 512x512)
- Apple Touch Icon support
- Favicon included
- Standalone display mode
- Custom theme colors

## Project Structure

```
gif2vid-site/
├── index.html              # Root English page (generated by build:site)
├── {locale}/               # Generated locale directories (fr/, de/, …)
│   ├── index.html
│   └── *.html
├── styles.css              # Styling
├── main.ts                 # UI logic and worker communication
├── worker.ts               # Web Worker for GIF to MP4 conversion
├── sw.js                   # Service Worker for offline support
├── manifest.json           # PWA manifest
├── sitemap.xml             # Generated by build:site
├── robots.txt
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config for browser code
├── config/
│   └── locale.ts           # LOCALES and LOCALE_NAMES arrays
├── pages/                  # Markdown page sources
│   ├── en/                 # English originals
│   │   ├── index.md
│   │   └── *.md
│   └── {locale}/           # Translated copies (generated by translate-pages.ts)
│       └── *.md
├── scripts/
│   ├── tsconfig.json       # TypeScript config for scripts
│   ├── build-site.ts       # Generates HTML from pages/ Markdown
│   ├── translate-pages.ts  # Translates pages/en/ into other locales via OpenAI
│   └── generate-icons.js   # PWA icon generation
├── images/
│   ├── locale/             # Flag images ({code}.png) for the locale switcher
│   ├── hero.jpg
│   └── github.svg
├── icons/                  # PWA icons
│   ├── icon.svg
│   └── icon-*.png
├── favicon.png
└── dist/                   # Built JS (generated)
    ├── main.js
    └── worker.js
```

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **esbuild** - Fast bundler for browser code
- **Bun** - Runtime for build scripts
- **Web Workers** - Non-blocking background processing
- **Service Worker** - Offline support and caching
- **gif2vid** - GIF to MP4 conversion library (WebAssembly)
- **node-html-parser** - HTML manipulation in the build script
- **OpenAI GPT-4o** - Machine translation of page content
- **Sharp** - Icon generation

## Browser Support

- Chrome/Edge (Desktop & Mobile)
- Safari (Desktop & iOS)
- Firefox (Desktop & Mobile)

Requires support for:

- Web Workers
- Service Workers
- ES Modules
- ArrayBuffer and Transferable objects

## Author

Built by [Shane O'Sullivan](https://chofter.com)

Powered by [gif2vid](https://www.npmjs.com/package/gif2vid)
