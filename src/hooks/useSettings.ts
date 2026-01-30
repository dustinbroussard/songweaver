import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, saveSettings } from '@/lib/db';
import { AppSettings } from '@/lib/types';
import { useEffect } from 'react';

export function useSettings() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: Infinity,
  });

  // Apply theme on settings load
  useEffect(() => {
    if (query.data?.theme) {
      document.documentElement.classList.toggle('light', query.data.theme === 'light');
    }
  }, [query.data?.theme]);

  return query;
}

export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveSettings,
    onSuccess: (_, settings) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      
      // Apply theme immediately
      document.documentElement.classList.toggle('light', settings.theme === 'light');
    },
  });
}

export function useToggleTheme() {
  const { data: settings } = useSettings();
  const saveSettingsMutation = useSaveSettings();

  return () => {
    if (!settings) return;
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSettingsMutation.mutate({ ...settings, theme: newTheme });
  };
}
