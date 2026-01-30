import { useState, useMemo, useRef } from 'react';
import { useSongs, useDeleteSong, useSaveSong, useCreateSong, useToggleFavorite, useBulkImportSongs } from '@/hooks/useSongs';
import { Song, SortOption } from '@/lib/types';
import { searchSongs, sortSongs, filterFavorites } from '@/lib/search';
import { importSongFiles } from '@/lib/import';
import { SongCard } from './SongCard';
import { SearchBar } from './SearchBar';
import { SongEditor } from './SongEditor';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Upload, Star, Music } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function SongsTab() {
  const { data: songs = [], isLoading } = useSongs();
  const deleteSongMutation = useDeleteSong();
  const saveSongMutation = useSaveSong();
  const createSongMutation = useCreateSong();
  const toggleFavoriteMutation = useToggleFavorite();
  const bulkImportMutation = useBulkImportSongs();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('title-asc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSongs = useMemo(() => {
    let result = songs;
    result = filterFavorites(result, showFavoritesOnly);
    result = searchSongs(result, searchQuery);
    result = sortSongs(result, sortOption);
    return result;
  }, [songs, searchQuery, sortOption, showFavoritesOnly]);

  const handleCreateSong = async () => {
    const song = await createSongMutation.mutateAsync('Untitled Song');
    setEditingSong(song);
    setIsEditorOpen(true);
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setIsEditorOpen(true);
  };

  const handleSaveSong = (song: Song) => {
    saveSongMutation.mutate(song);
  };

  const handleDeleteSong = (song: Song) => {
    if (confirm(`Delete "${song.title}"?`)) {
      deleteSongMutation.mutate(song.id);
    }
  };

  const handleCopySong = async (song: Song) => {
    const text = `${song.title}\n\n${song.lyrics}`;
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const { songs: imported, errors } = await importSongFiles(files);
    
    if (imported.length > 0) {
      bulkImportMutation.mutate(imported);
    }
    
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading songs...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-strong border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Songs</h1>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,.json"
              multiple
              className="hidden"
              onChange={handleFileImport}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button size="sm" onClick={handleCreateSong} className="btn-glow">
              <Plus className="mr-2 h-4 w-4" />
              New Song
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
            placeholder="Search songs..."
          />
          
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(showFavoritesOnly && 'bg-primary text-primary-foreground')}
          >
            <Star className={cn('h-4 w-4', showFavoritesOnly && 'fill-current')} />
          </Button>

          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">A → Z</SelectItem>
              <SelectItem value="title-desc">Z → A</SelectItem>
              <SelectItem value="updated-desc">Recently edited</SelectItem>
              <SelectItem value="updated-asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-auto p-4">
        {songs.length === 0 ? (
          <EmptyState
            icon={<Music className="w-full h-full" />}
            title="No songs yet"
            description="Add your first song to get started. You can create a new song or import from files."
            action={{ label: 'New Song', onClick: handleCreateSong }}
            secondaryAction={{ label: 'Upload Files', onClick: () => fileInputRef.current?.click() }}
          />
        ) : filteredSongs.length === 0 ? (
          <EmptyState
            icon={<Music className="w-full h-full" />}
            title="No songs found"
            description={showFavoritesOnly ? "No favorite songs match your search." : "Try a different search term."}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              {filteredSongs.length} song{filteredSongs.length === 1 ? '' : 's'}
            </p>
            <AnimatePresence mode="popLayout">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={handleEditSong}
                  onDelete={handleDeleteSong}
                  onToggleFavorite={(s) => toggleFavoriteMutation.mutate(s)}
                  onCopy={handleCopySong}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <SongEditor
        song={editingSong}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingSong(null);
        }}
        onSave={handleSaveSong}
      />
    </div>
  );
}
