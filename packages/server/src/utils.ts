import { Redis } from "@upstash/redis";

export interface TensionPODData {
  name: { type: "string"; value: string };
  zupass_title: { type: "string"; value: string };
  zupass_image_url: { type: "string"; value: string };
  source: { type: "string"; value: string };
  zupass_display: { type: "string"; value: "collectable" };
  owner: { type: "cryptographic"; value: bigint };
  timestamp: { type: "int"; value: bigint };
}

export interface TensionData {
  name: string;
  base64Image: string;
  imageFileName: string;
  source: string | undefined;
}

export interface TensionPODRequest extends TensionData {
  podFolder: string;
  podEntries: string;
  owner?: bigint;
}

export interface TensionPOD extends TensionPODRequest {
  serializedPOD: string;
}

export interface PODMintRequest {
  pod: string;
}

export const MAX_REDIS_COMMAND_SIZE = 1000000; // ~1MB
const CHUNK_SIZE = 100 * 1024; // 100KB
const MAX_CHUNKS_PER_BATCH = Math.floor(MAX_REDIS_COMMAND_SIZE / CHUNK_SIZE);

export async function setLargeData(redis: Redis, key: string, value: string) {
  const valueSize = Buffer.byteLength(value, 'utf8');

  if (valueSize <= MAX_REDIS_COMMAND_SIZE) {
    await redis.set(key, value);
  } else {
    const chunks = [];

    // Split the value into smaller chunks
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    const pipeline = redis.pipeline();

    pipeline.del(key);
    chunks.forEach((chunk) => {
      pipeline.rpush(key, chunk);
    });

    await pipeline.exec();
  }
}

export async function getLargeData(redis: Redis, key: string): Promise<string | null> {
  const type = await redis.type(key);

  if (type === 'list') {
    let fullData = '';
    let start = 0;

    // Use the calculated maximum number of chunks per batch
    const batchSize = MAX_CHUNKS_PER_BATCH;

    while (true) {
      const chunks = await redis.lrange(key, start, start + batchSize - 1);

      if (chunks.length === 0) {
        break; // No more chunks to retrieve
      }

      fullData += chunks.join('');

      if (chunks.length < batchSize) {
        break; // We've retrieved all chunks
      }

      start += batchSize;
    }

    return fullData;
  } else if (type === 'string') {
    return redis.get(key);
  } else {
    console.log("Unexpected data type for key", key, ":", type);
    return null;
  }
}
