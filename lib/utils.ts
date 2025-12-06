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

/**
 * Generate avatar URL from user's name or use provided URL
 * Falls back to UI Avatars API if no URL provided
 */
export function getAvatarUrl(profilePicture: string | null | undefined, name: string | null | undefined, userId?: string): string {
  if (profilePicture) {
    return profilePicture;
  }
  
  // Generate avatar using UI Avatars API
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userId?.[0]?.toUpperCase() || 'U';
  
  // Use a color based on userId hash for consistency
  const colors = [
    '00ffff', // cyan
    'ff00ff', // magenta
    '8b5cf6', // purple
    '3b82f6', // blue
    '10b981', // green
    'f59e0b', // amber
  ];
  
  const colorIndex = userId 
    ? userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;
  
  const bgColor = colors[colorIndex];
  const textColor = 'ffffff';
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=${textColor}&size=128&bold=true&font-size=0.5`;
}

