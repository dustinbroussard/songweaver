import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllSongs, 
  getSong, 
  saveSong, 
  deleteSong, 
  bulkSaveSongs,
  createEmptySong 
} from '@/lib/db';
import { Song } from '@/lib/types';
import { toast } from 'sonner';

export function useSongs() {
  return useQuery({
    queryKey: ['songs'],
    queryFn: getAllSongs,
    staleTime: 0, // Always fresh from IndexedDB
  });
}

export function useSong(id: string | undefined) {
  return useQuery({
    queryKey: ['songs', id],
    queryFn: () => (id ? getSong(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function useSaveSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSong,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (error) => {
      console.error('Failed to save song:', error);
      toast.error('Failed to save song');
    },
  });
}

export function useDeleteSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSong,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Song deleted');
    },
    onError: (error) => {
      console.error('Failed to delete song:', error);
      toast.error('Failed to delete song');
    },
  });
}

export function useCreateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title?: string) => {
      const song = createEmptySong(title);
      await saveSong(song);
      return song;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
    },
    onError: (error) => {
      console.error('Failed to create song:', error);
      toast.error('Failed to create song');
    },
  });
}

export function useBulkImportSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkSaveSongs,
    onSuccess: (_, songs) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success(`Imported ${songs.length} song${songs.length === 1 ? '' : 's'}`);
    },
    onError: (error) => {
      console.error('Failed to import songs:', error);
      toast.error('Failed to import songs');
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (song: Song) => {
      const updated = { ...song, isFavorite: !song.isFavorite, updatedAt: Date.now() };
      await saveSong(updated);
      return updated;
    },
    onSuccess: (song) => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success(song.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    },
  });
}
