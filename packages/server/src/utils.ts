import { Redis } from "@upstash/redis";

export const MAX_REDIS_COMMAND_SIZE = 1000000; // ~1MB
const CHUNK_SIZE = 100 * 1024; // 100KB
const MAX_CHUNKS_PER_BATCH = Math.floor(MAX_REDIS_COMMAND_SIZE / CHUNK_SIZE);

export async function setLargeData(redis: Redis, key: string, value: string) {
  const valueSize = Buffer.byteLength(value, 'utf8');

  // Split the value into smaller chunks regardless of size for consistency
  const chunks = [];

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

export async function getLargeData(redis: Redis, key: string): Promise<string | null> {
  const type = await redis.type(key);
  console.log("Data type for key", key, ":", type);

  if (type === 'list') {
    let fullData = '';
    let start = 0;
    const batchSize = MAX_CHUNKS_PER_BATCH;

    while (true) {
      const end = start + batchSize - 1;
      const chunks = await redis.lrange(key, start, end);

      if (chunks.length === 0) {
        break;
      }

      for (const chunk of chunks) {
        if (typeof chunk === 'string') {
          fullData += chunk;
        } else {
          fullData += JSON.stringify(chunk);
        }
      }

      if (chunks.length < batchSize) {
        break;
      }

      start += batchSize;
    }

    return fullData;
  } else if (type === 'string' || type === 'none') {
    const data = await redis.get<string>(key);
    return data;
  } else {
    console.log("Unexpected data type for key", key, ":", type);
    return null;
  }
}
