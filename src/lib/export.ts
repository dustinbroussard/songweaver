import { Song, Setlist, SongLibrary } from './types';

export function exportAsJson(songs: Song[]): string {
  return JSON.stringify(songs, null, 2);
}

export function exportAsLibraryJson(library: SongLibrary): string {
  return JSON.stringify(library, null, 2);
}

export function exportAsCsv(songs: Song[]): string {
  const header = 'Title,Lyrics';
  const rows = songs.map(song => {
    const title = `"${song.title.replace(/"/g, '""')}"`;
    const lyrics = `"${song.lyrics.replace(/"/g, '""')}"`;
    return `${title},${lyrics}`;
  });
  return [header, ...rows].join('\n');
}

export function exportAsTxt(songs: Song[]): string {
  return songs.map(song => `${song.title}\n${'='.repeat(song.title.length)}\n\n${song.lyrics}`).join('\n\n---\n\n');
}

export function exportSetlistAsTxt(setlist: Setlist, songs: Song[], includeLyrics: boolean): string {
  const songMap = new Map(songs.map(s => [s.id, s]));
  const lines = setlist.songIds
    .map((id, index) => {
      const song = songMap.get(id);
      if (!song) return null;
      const line = `${index + 1}. ${song.title}`;
      return includeLyrics ? `${line}\n\n${song.lyrics}\n` : line;
    })
    .filter(Boolean);
  
  return `${setlist.name}\n${'='.repeat(setlist.name.length)}\n\n${lines.join(includeLyrics ? '\n---\n\n' : '\n')}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJson(data: unknown, filename: string): void {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function downloadCsv(content: string, filename: string): void {
  downloadFile(content, filename, 'text/csv');
}

export function downloadTxt(content: string, filename: string): void {
  downloadFile(content, filename, 'text/plain');
}
