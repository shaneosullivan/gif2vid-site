interface ConversionResponse {
  type: "ready" | "progress" | "success" | "error";
  id?: number;
  message?: string;
  mp4Buffer?: ArrayBuffer;
  inputSize?: number;
  outputSize?: number;
  error?: string;
}

// Initialize worker
const worker = new Worker("./dist/worker.js", { type: "module" });
let messageId = 0;
let isWorkerReady = false;
let currentObjectUrl: string | null = null;
let currentGifUrl: string | null = null;

// DOM elements
const fileInput = document.getElementById("gifFile") as HTMLInputElement;
const statusElement = document.getElementById("status") as HTMLDivElement;
const outputContainer = document.getElementById("output") as HTMLDivElement;

const fileInputWrapper = document.querySelector(
  ".file-input-wrapper"
) as HTMLDivElement;

// Update worker status indicator
function updateWorkerStatus(ready: boolean) {
  isWorkerReady = ready;

  if (ready) {
    updateStatus("Select a GIF file to convert.", "info");
  }
}

// Update status message
function updateStatus(
  message: string,
  type: "info" | "error" | "success" | "processing" = "info"
) {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Clean up previous conversion resources
function cleanupPreviousConversion() {
  // Revoke previous object URLs to free memory
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  if (currentGifUrl) {
    URL.revokeObjectURL(currentGifUrl);
    currentGifUrl = null;
  }

  // Clear output container (removes video element references)
  outputContainer.innerHTML = "";
}

// Handle worker messages
worker.onmessage = (event: MessageEvent<ConversionResponse>) => {
  const { type, message, mp4Buffer, inputSize, outputSize, error } = event.data;

  switch (type) {
    case "ready":
      updateWorkerStatus(true);
      break;

    case "progress":
      updateStatus(message || "Processing...", "processing");
      break;

    case "success":
      if (mp4Buffer && inputSize && outputSize) {
        handleConversionSuccess(mp4Buffer, inputSize, outputSize);
      }
      break;

    case "error":
      updateStatus(error || "Conversion failed", "error");
      break;
  }
};

// Handle conversion success
function handleConversionSuccess(
  mp4Buffer: ArrayBuffer,
  inputSize: number,
  outputSize: number
) {
  // Create a blob from the MP4 buffer
  const blob = new Blob([mp4Buffer], { type: "video/mp4" });
  const url = URL.createObjectURL(blob);
  currentObjectUrl = url;

  // Create comparison container
  const comparisonContainer = document.createElement("div");
  comparisonContainer.className = "comparison-container";

  // Create GIF container
  const gifContainer = document.createElement("div");
  gifContainer.className = "media-container";
  const gifTitle = document.createElement("h3");
  gifTitle.className = "media-title";
  gifTitle.textContent = "Original GIF";
  const gifImage = document.createElement("img");
  gifImage.src = currentGifUrl!;
  gifImage.className = "media-preview";
  gifImage.alt = "Original GIF";
  const gifSize = document.createElement("div");
  gifSize.className = "media-size";
  gifSize.textContent = formatFileSize(inputSize);
  gifContainer.appendChild(gifTitle);
  gifContainer.appendChild(gifImage);
  gifContainer.appendChild(gifSize);

  // Create video container
  const videoContainer = document.createElement("div");
  videoContainer.className = "media-container";
  const videoTitle = document.createElement("h3");
  videoTitle.className = "media-title";
  videoTitle.textContent = "Converted MP4";
  const video = document.createElement("video");
  video.src = url;
  video.controls = true;
  video.loop = true;
  video.autoplay = true;
  video.className = "media-preview";
  const videoSize = document.createElement("div");
  videoSize.className = "media-size";
  videoSize.textContent = formatFileSize(outputSize);
  videoContainer.appendChild(videoTitle);
  videoContainer.appendChild(video);
  videoContainer.appendChild(videoSize);

  // Add both containers to comparison
  comparisonContainer.appendChild(gifContainer);
  comparisonContainer.appendChild(videoContainer);

  // Create download link/button
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS) {
    // On iOS, create a button that triggers the share dialog
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Share/Save Video";
    downloadButton.className = "download-button";
    downloadButton.onclick = async () => {
      try {
        const file = new File([blob], "converted-video.mp4", { type: "video/mp4" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Converted Video",
            text: "GIF converted to MP4"
          });
        } else {
          // Fallback: open video in new tab
          window.open(url, "_blank");
        }
      } catch (error) {
        console.error("Share failed:", error);
        // Fallback: open video in new tab
        window.open(url, "_blank");
      }
    };

    // Add iOS-specific instructions
    const iosInstructions = document.createElement("div");
    iosInstructions.className = "ios-instructions";
    iosInstructions.innerHTML = `
      <p>💡 Tap the button above to save to Photos or Files</p>
      <p>Or long-press the video below and select "Save Video"</p>
    `;

    outputContainer.appendChild(downloadButton);
    outputContainer.appendChild(iosInstructions);
  } else {
    // Standard download link for other platforms
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "converted-video.mp4";
    downloadLink.textContent = "Download MP4";
    downloadLink.className = "download-button";
    outputContainer.appendChild(downloadLink);
  }

  // Create info section
  const info = document.createElement("div");
  info.className = "conversion-info";
  info.innerHTML = `
    <div class="info-item">
      <span class="info-label">Size Reduction:</span>
      <span class="info-value">${((1 - outputSize / inputSize) * 100).toFixed(
        1
      )}%</span>
    </div>
  `;

  // Append comparison and info
  outputContainer.appendChild(comparisonContainer);
  outputContainer.appendChild(info);

  updateStatus("Conversion completed successfully!", "success");
}

// Process a GIF file
async function processGifFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".gif")) {
    updateStatus("Please select a valid GIF file", "error");
    return;
  }

  if (!isWorkerReady) {
    updateStatus("App is not ready yet. Please wait...", "error");
    return;
  }

  // Clean up previous conversion resources before processing new file
  cleanupPreviousConversion();

  try {
    updateStatus("Reading file...", "processing");

    // Create object URL for the GIF to display
    const gifBlob = new Blob([file], { type: "image/gif" });
    currentGifUrl = URL.createObjectURL(gifBlob);

    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const gifBuffer = new Uint8Array(arrayBuffer);

    updateStatus("Converting GIF to MP4...", "processing");

    // Send to worker for conversion
    worker.postMessage(
      {
        id: messageId++,
        gifBuffer: gifBuffer.buffer,
      },
      [gifBuffer.buffer]
    );
  } catch (error) {
    updateStatus(
      error instanceof Error ? error.message : "Failed to read file",
      "error"
    );
  }
}

// Handle file selection
fileInput.addEventListener("change", async (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  await processGifFile(file);
});

// Drag and drop handlers
fileInputWrapper.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.stopPropagation();
  fileInputWrapper.classList.add("drag-over");
});

fileInputWrapper.addEventListener("dragleave", (event) => {
  event.preventDefault();
  event.stopPropagation();
  fileInputWrapper.classList.remove("drag-over");
});

fileInputWrapper.addEventListener("drop", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  fileInputWrapper.classList.remove("drag-over");

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  await processGifFile(file);
});

// Register service worker for PWA support
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

// Initialize status
updateStatus("Initializing app...", "processing");
