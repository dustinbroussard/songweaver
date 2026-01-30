import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllSetlists, 
  getSetlist, 
  saveSetlist, 
  deleteSetlist,
  createEmptySetlist 
} from '@/lib/db';
import { Setlist } from '@/lib/types';
import { toast } from 'sonner';

export function useSetlists() {
  return useQuery({
    queryKey: ['setlists'],
    queryFn: getAllSetlists,
    staleTime: 0,
  });
}

export function useSetlist(id: string | undefined) {
  return useQuery({
    queryKey: ['setlists', id],
    queryFn: () => (id ? getSetlist(id) : Promise.resolve(undefined)),
    enabled: !!id,
  });
}

export function useSaveSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSetlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
    },
    onError: (error) => {
      console.error('Failed to save setlist:', error);
      toast.error('Failed to save setlist');
    },
  });
}

export function useDeleteSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSetlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist deleted');
    },
    onError: (error) => {
      console.error('Failed to delete setlist:', error);
      toast.error('Failed to delete setlist');
    },
  });
}

export function useCreateSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name?: string) => {
      const setlist = createEmptySetlist(name);
      await saveSetlist(setlist);
      return setlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist created');
    },
    onError: (error) => {
      console.error('Failed to create setlist:', error);
      toast.error('Failed to create setlist');
    },
  });
}

export function useDuplicateSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setlist: Setlist) => {
      const duplicate = createEmptySetlist(`${setlist.name} (Copy)`);
      duplicate.songIds = [...setlist.songIds];
      await saveSetlist(duplicate);
      return duplicate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist duplicated');
    },
  });
}

export function useUpdateSetlistSongs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ setlistId, songIds }: { setlistId: string; songIds: string[] }) => {
      const setlist = await getSetlist(setlistId);
      if (!setlist) throw new Error('Setlist not found');
      
      const updated = { ...setlist, songIds, updatedAt: Date.now() };
      await saveSetlist(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
    },
  });
}
