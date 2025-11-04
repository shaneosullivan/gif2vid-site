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

// DOM elements
const fileInput = document.getElementById("gifFile") as HTMLInputElement;
const statusElement = document.getElementById("status") as HTMLDivElement;
const outputContainer = document.getElementById("output") as HTMLDivElement;
const workerStatusIndicator = document.getElementById(
  "workerStatus"
) as HTMLSpanElement;
const fileInputWrapper = document.querySelector(
  ".file-input-wrapper"
) as HTMLDivElement;

// Update worker status indicator
function updateWorkerStatus(ready: boolean) {
  isWorkerReady = ready;
  workerStatusIndicator.className = `worker-status ${
    ready ? "ready" : "loading"
  }`;
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
  // Revoke previous object URL to free memory
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
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

  // Create video element
  const video = document.createElement("video");
  video.src = url;
  video.controls = true;
  video.loop = true;
  video.autoplay = true;
  video.className = "video-preview";

  // Create download link
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "converted-video.mp4";
  downloadLink.textContent = "Download MP4";
  downloadLink.className = "download-button";

  // Create info section
  const info = document.createElement("div");
  info.className = "conversion-info";
  info.innerHTML = `
    <div class="info-item">
      <span class="info-label">Original GIF:</span>
      <span class="info-value">${formatFileSize(inputSize)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Converted MP4:</span>
      <span class="info-value">${formatFileSize(outputSize)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Size Reduction:</span>
      <span class="info-value">${((1 - outputSize / inputSize) * 100).toFixed(
        1
      )}%</span>
    </div>
  `;

  // Append elements to output
  outputContainer.appendChild(video);
  outputContainer.appendChild(downloadLink);
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
    updateStatus("Worker is not ready yet. Please wait...", "error");
    return;
  }

  // Clean up previous conversion resources before processing new file
  cleanupPreviousConversion();

  try {
    updateStatus("Reading file...", "processing");

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

// Initialize status
updateStatus("Initializing worker...", "processing");
