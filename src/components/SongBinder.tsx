import { useState, useCallback } from 'react';
import { Song } from '@/lib/types';
import { SongsTab } from './SongsTab';
import { SetlistsTab } from './SetlistsTab';
import { LyricsTab } from './LyricsTab';
import { PerformanceView } from './PerformanceView';
import { useSettings, useToggleTheme } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Music, ListMusic, Mic2, Settings, Moon, Sun, Download, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { exportLibrary } from '@/lib/db';
import { downloadJson } from '@/lib/export';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TabId = 'songs' | 'setlists' | 'lyrics';

const tabs: { id: TabId; label: string; icon: typeof Music }[] = [
  { id: 'songs', label: 'Songs', icon: Music },
  { id: 'setlists', label: 'Setlists', icon: ListMusic },
  { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
];

export function SongBinder() {
  const { data: settings } = useSettings();
  const toggleTheme = useToggleTheme();
  
  const [activeTab, setActiveTab] = useState<TabId>('songs');
  const [performanceMode, setPerformanceMode] = useState(false);
  const [performanceSongs, setPerformanceSongs] = useState<Song[]>([]);
  const [performanceStartIndex, setPerformanceStartIndex] = useState(0);

  const handleStartPerformance = useCallback((songs: Song[], startIndex = 0) => {
    setPerformanceSongs(songs);
    setPerformanceStartIndex(startIndex);
    setPerformanceMode(true);
  }, []);

  const handleClosePerformance = useCallback(() => {
    setPerformanceMode(false);
    setPerformanceSongs([]);
    setPerformanceStartIndex(0);
  }, []);

  const handleExportBackup = async () => {
    try {
      const library = await exportLibrary();
      const date = new Date().toISOString().split('T')[0];
      downloadJson(library, `songbinder-backup-${date}.json`);
      toast.success('Backup exported successfully');
    } catch (error) {
      toast.error('Failed to export backup');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'songs' && <SongsTab />}
            {activeTab === 'setlists' && <SetlistsTab />}
            {activeTab === 'lyrics' && <LyricsTab onStartPerformance={handleStartPerformance} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-border bg-card/95 backdrop-blur-strong safe-area-inset">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-col items-center gap-1 px-6 py-3 transition-all touch-feedback',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]')} />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 h-0.5 w-12 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
          
          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-col items-center gap-1 px-6 py-3 text-muted-foreground hover:text-foreground transition-all touch-feedback">
                <Settings className="h-5 w-5" />
                <span className="text-xs font-medium">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={toggleTheme}>
                {settings?.theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark Mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportBackup}>
                <Download className="mr-2 h-4 w-4" />
                Export Backup
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Performance Mode */}
      <AnimatePresence>
        {performanceMode && performanceSongs.length > 0 && (
          <PerformanceView
            songs={performanceSongs}
            startIndex={performanceStartIndex}
            onClose={handleClosePerformance}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
