import { useState } from 'react';
import { useSongs } from '@/hooks/useSongs';
import { useSetlists, useCreateSetlist, useDeleteSetlist, useSaveSetlist, useDuplicateSetlist } from '@/hooks/useSetlists';
import { Setlist, Song } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBar } from './SearchBar';
import { EmptyState } from './EmptyState';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  ListMusic,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableSongItemProps {
  song: Song;
  index: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function SortableSongItem({ song, index, onRemove, onMoveUp, onMoveDown }: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 group',
        isDragging && 'opacity-50'
      )}
    >
      <button
        className="drag-handle touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted-foreground font-mono w-6">{index + 1}.</span>
      <span className="flex-1 truncate text-sm">{song.title}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
        {onMoveDown && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SetlistCardProps {
  setlist: Setlist;
  songs: Song[];
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: (name: string) => void;
}

function SetlistCard({
  setlist,
  songs,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  onRename,
}: SetlistCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(setlist.name);

  const songCount = setlist.songIds.length;
  const songMap = new Map(songs.map(s => [s.id, s]));
  const previewSongs = setlist.songIds.slice(0, 3).map(id => songMap.get(id)?.title).filter(Boolean);

  const handleSave = () => {
    if (editName.trim()) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-all',
        isSelected
          ? 'border-primary bg-primary/10 shadow-glow'
          : 'border-border bg-card hover:border-border/80 hover:bg-surface-hover'
      )}
      onClick={() => !isEditing && onSelect()}
    >
      <div className="flex items-start justify-between gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="h-8"
              autoFocus
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); handleSave(); }}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditName(setlist.name); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{setlist.name}</h3>
              <p className="text-sm text-muted-foreground">
                {songCount} song{songCount === 1 ? '' : 's'}
              </p>
              {previewSongs.length > 0 && (
                <p className="text-xs text-muted-foreground/60 truncate mt-1">
                  {previewSongs.join(', ')}
                  {setlist.songIds.length > 3 && '...'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function SetlistsTab() {
  const { data: songs = [] } = useSongs();
  const { data: setlists = [], isLoading } = useSetlists();
  const createSetlistMutation = useCreateSetlist();
  const deleteSetlistMutation = useDeleteSetlist();
  const saveSetlistMutation = useSaveSetlist();
  const duplicateSetlistMutation = useDuplicateSetlist();

  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const selectedSetlist = setlists.find(s => s.id === selectedSetlistId);
  const songMap = new Map(songs.map(s => [s.id, s]));

  // Songs in current setlist
  const setlistSongs = selectedSetlist
    ? selectedSetlist.songIds.map(id => songMap.get(id)).filter(Boolean) as Song[]
    : [];

  // Available songs (not in setlist)
  const availableSongs = songs.filter(
    s => !selectedSetlist?.songIds.includes(s.id) &&
      (s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.lyrics.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || !selectedSetlist) return;

    if (active.id !== over.id) {
      const oldIndex = selectedSetlist.songIds.indexOf(active.id as string);
      const newIndex = selectedSetlist.songIds.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(selectedSetlist.songIds, oldIndex, newIndex);
        saveSetlistMutation.mutate({
          ...selectedSetlist,
          songIds: newOrder,
          updatedAt: Date.now(),
        });
      }
    }
  };

  const handleAddSong = (songId: string) => {
    if (!selectedSetlist) return;
    saveSetlistMutation.mutate({
      ...selectedSetlist,
      songIds: [...selectedSetlist.songIds, songId],
      updatedAt: Date.now(),
    });
  };

  const handleRemoveSong = (songId: string) => {
    if (!selectedSetlist) return;
    saveSetlistMutation.mutate({
      ...selectedSetlist,
      songIds: selectedSetlist.songIds.filter(id => id !== songId),
      updatedAt: Date.now(),
    });
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    if (!selectedSetlist) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedSetlist.songIds.length) return;
    
    const newOrder = arrayMove(selectedSetlist.songIds, index, newIndex);
    saveSetlistMutation.mutate({
      ...selectedSetlist,
      songIds: newOrder,
      updatedAt: Date.now(),
    });
  };

  const handleRenameSetlist = (name: string) => {
    if (!selectedSetlist) return;
    saveSetlistMutation.mutate({
      ...selectedSetlist,
      name,
      updatedAt: Date.now(),
    });
  };

  const handleCreateSetlist = async () => {
    const setlist = await createSetlistMutation.mutateAsync('New Setlist');
    setSelectedSetlistId(setlist.id);
  };

  const handleDeleteSetlist = (setlist: Setlist) => {
    if (confirm(`Delete "${setlist.name}"?`)) {
      deleteSetlistMutation.mutate(setlist.id);
      if (selectedSetlistId === setlist.id) {
        setSelectedSetlistId(null);
      }
    }
  };

  const activeSong = activeDragId ? songMap.get(activeDragId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading setlists...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full lg:flex-row">
      {/* Setlists Panel */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Setlists</h2>
          <Button size="sm" onClick={handleCreateSetlist} className="btn-glow">
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>

        {setlists.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<ListMusic className="w-full h-full" />}
              title="No setlists"
              description="Create your first setlist to organize songs for performances."
              action={{ label: 'Create Setlist', onClick: handleCreateSetlist }}
            />
          </div>
        ) : (
          <div className="space-y-2 overflow-auto flex-1">
            <AnimatePresence mode="popLayout">
              {setlists.map((setlist) => (
                <SetlistCard
                  key={setlist.id}
                  setlist={setlist}
                  songs={songs}
                  isSelected={setlist.id === selectedSetlistId}
                  onSelect={() => setSelectedSetlistId(setlist.id)}
                  onDelete={() => handleDeleteSetlist(setlist)}
                  onDuplicate={() => duplicateSetlistMutation.mutate(setlist)}
                  onRename={handleRenameSetlist}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Setlist Editor Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {selectedSetlist ? (
          <>
            {/* Current Setlist */}
            <div className="flex-1 p-4 flex flex-col min-h-0">
              <h3 className="font-semibold mb-4 text-lg">{selectedSetlist.name}</h3>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedSetlist.songIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 overflow-auto flex-1">
                    {setlistSongs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No songs in this setlist.</p>
                        <p className="text-sm">Add songs from the right panel.</p>
                      </div>
                    ) : (
                      setlistSongs.map((song, index) => (
                        <SortableSongItem
                          key={song.id}
                          song={song}
                          index={index}
                          onRemove={() => handleRemoveSong(song.id)}
                          onMoveUp={index > 0 ? () => handleMoveSong(index, 'up') : undefined}
                          onMoveDown={index < setlistSongs.length - 1 ? () => handleMoveSong(index, 'down') : undefined}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeSong && (
                    <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 shadow-elevated">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{activeSong.title}</span>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </div>

            {/* Available Songs */}
            <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 flex flex-col min-h-0">
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Available Songs
              </h3>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
                className="mb-3"
                enableVoice={false}
              />
              <div className="space-y-1 overflow-auto flex-1">
                {availableSongs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleAddSong(song.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-surface-hover transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-3 w-3 text-primary shrink-0" />
                    <span className="truncate">{song.title}</span>
                  </button>
                ))}
                {availableSongs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {songs.length === 0 ? 'No songs available.' : 'All songs added.'}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Select a setlist to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
