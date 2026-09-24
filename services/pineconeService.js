import { Pinecone } from "@pinecone-database/pinecone";

const indexName = () => process.env.PINECONE_INDEX || "whatsapp-personas";
const pinecone = () => {
  if (!process.env.PINECONE_API_KEY) throw new Error("PINECONE_API_KEY is not configured");
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
};

export const ensureIndex = async () => {
  const pc = pinecone();
  const indexes = await pc.listIndexes();
  const found = indexes.indexes?.some((index) => index.name === indexName());
  if (!found) await pc.createIndex({ name: indexName(), dimension: 768, metric: "cosine", spec: { serverless: { cloud: "aws", region: "us-east-1" } }, waitUntilReady: true });
  return pc.index(indexName());
};

export const upsertPersonaChunks = async (namespace, chunks, vectors) => {
  const index = await ensureIndex();
  for (let offset = 0; offset < chunks.length; offset += 100) {
    await index.namespace(namespace).upsert(chunks.slice(offset, offset + 100).map((chunk, i) => ({ id: chunk.id, values: vectors[offset + i], metadata: { text: chunk.text, response: chunk.response } })));
  }
};

export const queryPersonaChunks = async (namespace, vector, topK = 5) => {
  const index = await ensureIndex();
  const result = await index.namespace(namespace).query({ vector, topK, includeMetadata: true });
  return result.matches || [];
};

export const deletePersonaNamespace = async (namespace) => (await ensureIndex()).namespace(namespace).deleteAll();
