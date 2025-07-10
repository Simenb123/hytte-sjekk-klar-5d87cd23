export function processBase64Chunks(base64String: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  let position = 0;

  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    let binaryChunk: string;

    if (typeof atob === 'function') {
      binaryChunk = atob(chunk);
    } else {
      binaryChunk = Buffer.from(chunk, 'base64').toString('binary');
    }

    const bytes = new Uint8Array(binaryChunk.length);
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }

    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }

  return result;
}
