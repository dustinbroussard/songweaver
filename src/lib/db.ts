import { openDB, IDBPDatabase } from 'idb';
import { Song, Setlist, AppSettings, SongLibrary } from './types';

const DB_NAME = 'songbinder';
const DB_VERSION = 1;

interface SongBinderDB {
  songs: Song;
  setlists: Setlist;
  settings: AppSettings;
}

let dbInstance: IDBPDatabase<SongBinderDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<SongBinderDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SongBinderDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Songs store
      if (!db.objectStoreNames.contains('songs')) {
        const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
        songsStore.createIndex('title', 'title');
        songsStore.createIndex('updatedAt', 'updatedAt');
        songsStore.createIndex('isFavorite', 'isFavorite');
      }

      // Setlists store
      if (!db.objectStoreNames.contains('setlists')) {
        const setlistsStore = db.createObjectStore('setlists', { keyPath: 'id' });
        setlistsStore.createIndex('name', 'name');
        setlistsStore.createIndex('updatedAt', 'updatedAt');
      }

      // Settings store (single record)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  // Request persistent storage
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(console.error);
  }

  return dbInstance;
}

// Songs CRUD
export async function getAllSongs(): Promise<Song[]> {
  const db = await getDB();
  return db.getAll('songs');
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await getDB();
  return db.get('songs', id);
}

export async function saveSong(song: Song): Promise<void> {
  const db = await getDB();
  await db.put('songs', song);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('songs', id);

  // Remove from all setlists
  const setlists = await getAllSetlists();
  for (const setlist of setlists) {
    if (setlist.songIds.includes(id)) {
      setlist.songIds = setlist.songIds.filter(sid => sid !== id);
      await saveSetlist(setlist);
    }
  }
}

export async function bulkSaveSongs(songs: Song[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('songs', 'readwrite');
  await Promise.all([
    ...songs.map(song => tx.store.put(song)),
    tx.done,
  ]);
}

// Setlists CRUD
export async function getAllSetlists(): Promise<Setlist[]> {
  const db = await getDB();
  return db.getAll('setlists');
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
  const db = await getDB();
  return db.get('setlists', id);
}

export async function saveSetlist(setlist: Setlist): Promise<void> {
  const db = await getDB();
  await db.put('setlists', setlist);
}

export async function deleteSetlist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('setlists', id);
}

// Settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultFontSize: 24,
  defaultAutoscrollSpeed: 30,
  defaultAutoscrollDelay: 3,
  showChords: true,
  backupReminderDays: 7,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'main');
}

// Export/Import
export async function exportLibrary(): Promise<SongLibrary> {
  const [songs, setlists, settings] = await Promise.all([
    getAllSongs(),
    getAllSetlists(),
    getSettings(),
  ]);

  return {
    songs,
    setlists,
    settings,
    version: 1,
  };
}

export async function importLibrary(library: SongLibrary): Promise<void> {
  const db = await getDB();

  // Clear existing data
  const txSongs = db.transaction('songs', 'readwrite');
  await txSongs.store.clear();
  await txSongs.done;

  const txSetlists = db.transaction('setlists', 'readwrite');
  await txSetlists.store.clear();
  await txSetlists.done;

  // Import new data
  await bulkSaveSongs(library.songs);

  const setlistTx = db.transaction('setlists', 'readwrite');
  await Promise.all([
    ...library.setlists.map(setlist => setlistTx.store.put(setlist)),
    setlistTx.done,
  ]);

  if (library.settings) {
    await saveSettings(library.settings);
  }
}

// Utility
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptySong(title = 'Untitled Song'): Song {
  const now = Date.now();
  return {
    id: generateId(),
    title,
    lyrics: '',
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptySetlist(name = 'New Setlist'): Setlist {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    songIds: [],
    createdAt: now,
    updatedAt: now,
  };
}
