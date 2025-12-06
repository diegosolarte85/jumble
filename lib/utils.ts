import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid();
}

export function parseEmbedding(embedding: string | null): number[] | null {
  if (!embedding) return null;
  try {
    return JSON.parse(embedding);
  } catch {
    return null;
  }
}

export function stringifyEmbedding(embedding: number[] | null): string | null {
  if (!embedding) return null;
  return JSON.stringify(embedding);
}

