// Minimal SSE client. Yields {event, data} pairs.
//
// Body source compatibility:
//   - Native Node 18+ / browser fetch → WHATWG ReadableStream (has getReader)
//   - cross-fetch polyfill on Node 16 → node-fetch Readable (async-iterable)
// readChunks() abstracts over both shapes.
export interface SseMessage {
  event: string;
  data: string;
}

async function* readChunks(body: any): AsyncGenerator<Uint8Array> {
  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) yield value as Uint8Array;
    }
    return;
  }
  // Node Readable — async iterable since Node 10. Each chunk is a Buffer.
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    yield chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk as any);
  }
}

export async function* streamSse(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<SseMessage> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  for await (const chunk of readChunks(res.body)) {
    buffer += decoder.decode(chunk, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const msg = parseMessage(raw);
      if (msg) yield msg;
    }
  }
}

function parseMessage(raw: string): SseMessage | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
