const MAX_CODE_SIZE = 1024 * 1024; // 1MB limit
const STREAM_TIMEOUT = 120000; // 2 minutes

export async function parseStreamWithValidation(
  response: Response,
  onChunk: (text: string) => void,
  onError: (error: Error) => void
): Promise<string> {
  if (!response.body) {
    throw new Error("Response has no body stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";
  let lastChunkTime = Date.now();
  let totalChunksReceived = 0;

  try {
    while (true) {
      // Check for stream timeout
      if (Date.now() - lastChunkTime > STREAM_TIMEOUT) {
        throw new Error("Stream timeout: no data received for 2 minutes");
      }

      const { done, value } = await reader.read();
      lastChunkTime = Date.now();
      totalChunksReceived++;

      if (done) {
        // Process remaining buffer
        if (buffer.trim()) {
          const finalText = processSSELine(buffer);
          if (finalText !== null) {
            accumulated += finalText;
          }
        }
        break;
      }

      // Decode chunk safely
      try {
        buffer += decoder.decode(value, { stream: true });
      } catch (decodeError) {
        console.error("Decode error:", decodeError);
        throw new Error("Failed to decode stream chunk");
      }

      // Split on newlines, keeping incomplete last line in buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Last line might be incomplete

      // Process complete lines
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue; // Skip empty lines

        if (trimmed === "[DONE]") {
          // Validate accumulated code before returning
          if (!accumulated.trim()) {
            throw new Error("No code was generated");
          }
          if (accumulated.length > MAX_CODE_SIZE) {
            throw new Error(`Generated code exceeds maximum size (${accumulated.length} > ${MAX_CODE_SIZE})`);
          }
          return accumulated;
        }

        // Process SSE data line
        if (!trimmed.startsWith("data: ")) {
          console.warn("Unexpected SSE format:", trimmed.slice(0, 50));
          continue;
        }

        const payload = trimmed.slice(6).trim();

        try {
          const parsed = JSON.parse(payload);

          // Check for error in payload
          if (parsed.error) {
            throw new Error(parsed.error);
          }

          // Add text to accumulated
          if (parsed.text && typeof parsed.text === "string") {
            // Check size before adding
            if (accumulated.length + parsed.text.length > MAX_CODE_SIZE) {
              throw new Error(`Code generation exceeds max size limit`);
            }
            accumulated += parsed.text;
            onChunk?.(parsed.text);
          }
        } catch (parseError) {
          if (parseError instanceof SyntaxError) {
            console.warn("JSON parse error in SSE payload:", payload.slice(0, 100));
            // Emit error event but continue
            onError?.(new Error(`Malformed JSON in stream: ${payload.slice(0, 50)}`));
            continue;
          }
          // Re-throw meaningful errors
          throw parseError;
        }
      }
    }

    return accumulated;
  } catch (error) {
    // Add context to error
    const contextError = new Error(
      `Stream processing failed after ${totalChunksReceived} chunks: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw contextError;
  } finally {
    // Ensure reader is cancelled
    try {
      reader.cancel();
    } catch {
      // Already closed
    }
  }
}

function processSSELine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data: ")) {
    return null;
  }
  const payload = trimmed.slice(6).trim();
  try {
    const parsed = JSON.parse(payload);
    return parsed.text || null;
  } catch {
    return null;
  }
}
