import { Song } from '@/lib/types';
import { Star, MoreVertical, Edit2, Trash2, Copy, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SongCardProps {
  song: Song;
  onEdit: (song: Song) => void;
  onDelete: (song: Song) => void;
  onToggleFavorite: (song: Song) => void;
  onCopy: (song: Song) => void;
  onPlay?: (song: Song) => void;
  isDragging?: boolean;
}

export function SongCard({
  song,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy,
  onPlay,
  isDragging,
}: SongCardProps) {
  const formattedDate = new Date(song.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'song-card group relative flex items-center gap-3 rounded-lg bg-card p-3 transition-all',
        'hover:bg-surface-hover border border-transparent hover:border-border/50',
        isDragging && 'ring-2 ring-primary shadow-glow'
      )}
    >
      {/* Favorite Star */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onToggleFavorite(song)}
      >
        <Star
          className={cn(
            'h-4 w-4 transition-all favorite-star',
            song.isFavorite && 'active fill-primary'
          )}
        />
      </Button>

      {/* Song Info */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onEdit(song)}>
        <h3 className="truncate font-medium text-foreground">{song.title}</h3>
        <p className="truncate text-sm text-muted-foreground">
          {song.lyrics.split('\n')[0] || 'No lyrics'}
        </p>
      </div>

      {/* Meta Info */}
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
        {song.key && (
          <span className="rounded bg-secondary px-2 py-0.5 font-mono">{song.key}</span>
        )}
        <span>{formattedDate}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {onPlay && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onPlay(song)}
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(song)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopy(song)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy lyrics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleFavorite(song)}>
              <Star className="mr-2 h-4 w-4" />
              {song.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(song)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
