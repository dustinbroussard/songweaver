import { Song } from './types';
import { generateId } from './db';

export function cleanTitle(title: string): string {
  return title
    .replace(/\.(txt|docx|json|csv)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLyrics(lyrics: string): string {
  return lyrics
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parseTxtFile(content: string, filename: string): Song {
  const now = Date.now();
  return {
    id: generateId(),
    title: cleanTitle(filename),
    lyrics: normalizeLyrics(content),
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function parseCsvFile(content: string): Song[] {
  const lines = content.split('\n');
  const songs: Song[] = [];
  const now = Date.now();

  // Skip header if present
  const startIndex = lines[0]?.toLowerCase().includes('title') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV values
    const match = line.match(/^"?([^"]*)"?,\s*"?([\s\S]*)"?$/);
    if (match) {
      const [, title, lyrics] = match;
      if (title) {
        songs.push({
          id: generateId(),
          title: cleanTitle(title),
          lyrics: normalizeLyrics(lyrics || ''),
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }

  return songs;
}

export function parseJsonFile(content: string): Song[] {
  const data = JSON.parse(content);
  const now = Date.now();

  // Handle library format { songs: [...] }
  const songsArray = Array.isArray(data) ? data : data.songs;

  if (!Array.isArray(songsArray)) {
    throw new Error('Invalid JSON format');
  }

  return songsArray.map((item: Partial<Song>) => ({
    id: generateId(),
    title: cleanTitle(item.title || 'Untitled'),
    lyrics: normalizeLyrics(item.lyrics || ''),
    chords: item.chords,
    key: item.key,
    tempo: item.tempo,
    timeSignature: item.timeSignature,
    tags: item.tags,
    notes: item.notes,
    isFavorite: item.isFavorite || false,
    fontSize: item.fontSize,
    autoscrollSpeed: item.autoscrollSpeed,
    autoscrollDelay: item.autoscrollDelay,
    createdAt: now,
    updatedAt: now,
  }));
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function importSongFiles(files: File[]): Promise<{ songs: Song[]; errors: string[] }> {
  const songs: Song[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const content = await readFileAsText(file);
      const ext = file.name.split('.').pop()?.toLowerCase();

      switch (ext) {
        case 'txt':
          songs.push(parseTxtFile(content, file.name));
          break;
        case 'csv':
          songs.push(...parseCsvFile(content));
          break;
        case 'json':
          songs.push(...parseJsonFile(content));
          break;
        default:
          errors.push(`Unsupported file type: ${file.name}`);
      }
    } catch (err) {
      errors.push(`Failed to import ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { songs, errors };
}
