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
- `npm run watch` - Watch mode for development
- `npm run serve` - Serve the app locally on port 3340
- `npm run generate-icons` - Regenerate PWA icons from SVG

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
├── index.html          # Main HTML page
├── styles.css          # Styling
├── main.ts             # UI logic and worker communication
├── worker.ts           # Web Worker for GIF to MP4 conversion
├── sw.js               # Service Worker for offline support
├── manifest.json       # PWA manifest
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── scripts/            # Utility scripts
│   └── generate-icons.js  # Icon generation script
├── images/             # Image assets
│   └── github.svg         # GitHub icon
├── icons/              # PWA icons
│   ├── icon.svg        # Source icon
│   └── icon-*.png      # Generated icons (72x72 to 512x512)
├── favicon.png         # Favicon
└── dist/               # Built files (generated)
    ├── main.js
    └── worker.js
```

## Technologies Used

- **TypeScript** - Type-safe JavaScript
- **esbuild** - Fast bundler
- **Web Workers** - Non-blocking background processing
- **Service Worker** - Offline support and caching
- **gif2vid** - GIF to MP4 conversion library (WebAssembly)
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
