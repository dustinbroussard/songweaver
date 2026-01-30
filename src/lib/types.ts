export interface Song {
  id: string;
  title: string;
  lyrics: string;
  chords?: string;
  key?: string;
  tempo?: number;
  timeSignature?: string;
  tags?: string[];
  notes?: string;
  isFavorite: boolean;
  fontSize?: number;
  autoscrollSpeed?: number;
  autoscrollDelay?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  defaultFontSize: number;
  defaultAutoscrollSpeed: number;
  defaultAutoscrollDelay: number;
  showChords: boolean;
  lastBackupDate?: number;
  backupReminderDays: number;
  lastSetlistId?: string;
  lastSongIndex?: number;
}

export interface SongLibrary {
  songs: Song[];
  setlists: Setlist[];
  settings: AppSettings;
  version: number;
}

export type SortOption = 'title-asc' | 'title-desc' | 'updated-desc' | 'updated-asc';

export type TabId = 'songs' | 'setlists' | 'lyrics';

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ExportOptions {
  format: 'json' | 'json-library' | 'csv' | 'txt' | 'txt-separate' | 'pdf';
  includeSetlists?: boolean;
  includeLyrics?: boolean;
}
