import { useState, useMemo, useCallback } from 'react';
import { useSongs } from '@/hooks/useSongs';
import { useSetlists } from '@/hooks/useSetlists';
import { Song, Setlist } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LyricsTabProps {
  onStartPerformance: (songs: Song[], startIndex?: number) => void;
}

export function LyricsTab({ onStartPerformance }: LyricsTabProps) {
  const { data: songs = [] } = useSongs();
  const { data: setlists = [] } = useSetlists();

  const [selectedSetlistId, setSelectedSetlistId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const songMap = useMemo(() => new Map(songs.map(s => [s.id, s])), [songs]);

  const displaySongs = useMemo(() => {
    let result: Song[];
    
    if (selectedSetlistId === 'all') {
      result = songs;
    } else {
      const setlist = setlists.find(s => s.id === selectedSetlistId);
      result = setlist
        ? setlist.songIds.map(id => songMap.get(id)).filter(Boolean) as Song[]
        : [];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        s => s.title.toLowerCase().includes(query) ||
             s.lyrics.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedSetlistId, songs, setlists, songMap, searchQuery]);

  const handleStartPerformance = useCallback((index = 0) => {
    if (displaySongs.length > 0) {
      onStartPerformance(displaySongs, index);
    }
  }, [displaySongs, onStartPerformance]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-strong border-b border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Lyrics</h1>
          <Button
            onClick={() => handleStartPerformance()}
            disabled={displaySongs.length === 0}
            className="btn-glow"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedSetlistId} onValueChange={setSelectedSetlistId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Songs</SelectItem>
              {setlists.map(setlist => (
                <SelectItem key={setlist.id} value={setlist.id}>
                  {setlist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="flex-1"
            placeholder="Search in list..."
          />
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-auto p-4">
        {displaySongs.length === 0 ? (
          <EmptyState
            icon={<Music className="w-full h-full" />}
            title={selectedSetlistId === 'all' ? 'No songs yet' : 'Empty setlist'}
            description={selectedSetlistId === 'all' 
              ? 'Add some songs to get started.'
              : 'Add songs to this setlist from the Setlists tab.'}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              {displaySongs.length} song{displaySongs.length === 1 ? '' : 's'}
            </p>
            <AnimatePresence mode="popLayout">
              {displaySongs.map((song, index) => (
                <motion.button
                  key={song.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => handleStartPerformance(index)}
                  className={cn(
                    'w-full text-left rounded-lg bg-card p-4 transition-all',
                    'hover:bg-surface-hover border border-transparent hover:border-border/50',
                    'group'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{song.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {song.lyrics.split('\n')[0] || 'No lyrics'}
                      </p>
                    </div>
                    <Play className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
