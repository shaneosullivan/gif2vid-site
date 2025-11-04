import { convertGifBuffer } from "gif2vid/worker";

interface ConversionMessage {
  id: number;
  gifBuffer: ArrayBuffer;
}

interface ConversionResponse {
  type: "ready" | "progress" | "success" | "error";
  id?: number;
  message?: string;
  mp4Buffer?: ArrayBuffer;
  inputSize?: number;
  outputSize?: number;
  error?: string;
}

// Notify that the worker is ready
self.postMessage({
  type: "ready",
  message: "Worker initialized and ready",
} as ConversionResponse);

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent<ConversionMessage>) => {
  const { id, gifBuffer } = event.data;

  try {
    // Notify start of conversion
    self.postMessage({
      type: "progress",
      id,
      message: "Converting GIF to MP4...",
    } as ConversionResponse);

    // Convert the GIF buffer to Uint8Array
    const gifData = new Uint8Array(gifBuffer);

    // Perform the conversion
    const mp4Buffer = await convertGifBuffer(gifData);

    // Send the result back to the main thread
    self.postMessage(
      {
        type: "success",
        id,
        message: "Conversion completed successfully",
        mp4Buffer: mp4Buffer.buffer,
        inputSize: gifBuffer.byteLength,
        outputSize: mp4Buffer.byteLength,
      } as ConversionResponse,
      [mp4Buffer.buffer]
    );
  } catch (error) {
    // Send error message back to main thread
    self.postMessage({
      type: "error",
      id,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      message: "Conversion failed",
    } as ConversionResponse);
  }
};
