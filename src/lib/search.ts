import Fuse, { IFuseOptions } from 'fuse.js';
import { Song, SortOption } from './types';

const fuseOptions: IFuseOptions<Song> = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'lyrics', weight: 1 },
    { name: 'tags', weight: 0.5 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
};

export function searchSongs(songs: Song[], query: string): Song[] {
  if (!query.trim()) return songs;
  
  const fuse = new Fuse(songs, fuseOptions);
  const results = fuse.search(query);
  return results.map(result => result.item);
}

export function sortSongs(songs: Song[], sortOption: SortOption): Song[] {
  const sorted = [...songs];
  
  switch (sortOption) {
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'updated-desc':
      return sorted.sort((a, b) => b.updatedAt - a.updatedAt);
    case 'updated-asc':
      return sorted.sort((a, b) => a.updatedAt - b.updatedAt);
    default:
      return sorted;
  }
}

export function filterFavorites(songs: Song[], showOnlyFavorites: boolean): Song[] {
  if (!showOnlyFavorites) return songs;
  return songs.filter(song => song.isFavorite);
}
