# GIF to MP4 Converter

A simple, modern web application that converts GIF animations to MP4 videos directly in the browser using Web Workers. No backend required!

## Features

- 🎬 Convert GIF files to MP4 videos entirely in the browser
- 🚀 Uses Web Workers for non-blocking conversion
- 📊 Shows file size comparison and compression statistics
- 🎨 Modern, attractive UI with responsive design
- 💾 Direct download of converted videos
- ⚡ No server-side processing - all work happens locally

## Getting Started

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

This will compile the TypeScript files and bundle them with esbuild:
- `main.ts` → `dist/main.js` (UI logic)
- `worker.ts` → `dist/worker.js` (conversion worker)

### Development

To rebuild automatically on file changes:

```bash
npm run watch
```

### Running

Serve the directory with any static file server:

```bash
npm run serve
```

Then open your browser to the provided URL (usually `http://localhost:3000`).

## How It Works

1. **File Selection**: User selects a GIF file using the file input
2. **Worker Processing**: The GIF data is sent to a Web Worker as a transferable ArrayBuffer
3. **Conversion**: The worker uses the `gif2vid` library to convert the GIF to MP4
4. **Display**: The converted video is displayed with a download link and file size statistics

## Project Structure

```
gif2vid-site/
├── index.html      # Main HTML page
├── styles.css      # Styling
├── main.ts         # UI logic and worker communication
├── worker.ts       # Web Worker for GIF to MP4 conversion
├── package.json    # Dependencies and scripts
├── tsconfig.json   # TypeScript configuration
└── dist/           # Built files (generated)
    ├── main.js
    └── worker.js
```

## Technologies Used

- **TypeScript**: Type-safe JavaScript
- **esbuild**: Fast bundler
- **Web Workers**: Non-blocking background processing
- **gif2vid**: GIF to MP4 conversion library

## Browser Support

Works in all modern browsers that support:
- Web Workers
- ES Modules
- ArrayBuffer and Transferable objects
