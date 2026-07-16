import { createHash } from "node:crypto";

const CHUNK_SIZE = 1024 * 1024; // 1 MB

export async function sha256FromBuffer(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function sha256FromUint8Array(data: Uint8Array): Promise<string> {
  return createHash("sha256").update(data).digest("hex");
}

export async function sha256FromArrayBuffer(data: ArrayBuffer): Promise<string> {
  return createHash("sha256").update(Buffer.from(data)).digest("hex");
}

export async function sha256FromBlob(blob: Blob): Promise<string> {
  const hash = createHash("sha256");

  let offset = 0;

  while (offset < blob.size) {
    const chunk = blob.slice(offset, offset + CHUNK_SIZE);

    hash.update(Buffer.from(await chunk.arrayBuffer()));

    offset += CHUNK_SIZE;
  }

  return hash.digest("hex");
}

export async function sha256FromFile(file: File): Promise<string> {
  return sha256FromBlob(file);
}
