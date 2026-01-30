import { useState, useEffect } from 'react';
import { Song } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Save, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SongEditorProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (song: Song) => void;
}

export function SongEditor({ song, isOpen, onClose, onSave }: SongEditorProps) {
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [key, setKey] = useState('');
  const [tempo, setTempo] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setLyrics(song.lyrics);
      setKey(song.key || '');
      setTempo(song.tempo?.toString() || '');
      setIsFavorite(song.isFavorite);
    } else {
      setTitle('');
      setLyrics('');
      setKey('');
      setTempo('');
      setIsFavorite(false);
    }
  }, [song]);

  const handleSave = () => {
    if (!song) return;
    
    onSave({
      ...song,
      title: title.trim() || 'Untitled Song',
      lyrics: lyrics.trim(),
      key: key.trim() || undefined,
      tempo: tempo ? parseInt(tempo, 10) : undefined,
      isFavorite,
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-card border border-border shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold">
                {song?.id ? 'Edit Song' : 'New Song'}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-all favorite-star',
                      isFavorite && 'active fill-primary'
                    )}
                  />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Song title"
                  className="text-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g., C, Am, G#"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempo">Tempo (BPM)</Label>
                  <Input
                    id="tempo"
                    type="number"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    placeholder="e.g., 120"
                  />
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="lyrics">Lyrics</Label>
                <Textarea
                  id="lyrics"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter lyrics here..."
                  className="min-h-[300px] font-mono text-sm resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="btn-glow">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
