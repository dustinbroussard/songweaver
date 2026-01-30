import { useState, useEffect, useRef, useCallback } from 'react';
import { Song } from '@/lib/types';
import { useSettings, useSaveSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Sun,
  Moon,
  Play,
  Pause,
  Music,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface PerformanceViewProps {
  songs: Song[];
  startIndex: number;
  onClose: () => void;
}

const FONT_SIZES = [18, 22, 28, 36, 48, 64];

export function PerformanceView({ songs, startIndex, onClose }: PerformanceViewProps) {
  const { data: settings } = useSettings();
  const saveSettingsMutation = useSaveSettings();

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [fontSize, setFontSize] = useState(settings?.defaultFontSize || 28);
  const [isLightMode, setIsLightMode] = useState(false);
  const [isAutoscrolling, setIsAutoscrolling] = useState(false);
  const [autoscrollSpeed, setAutoscrollSpeed] = useState(settings?.defaultAutoscrollSpeed || 30);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  const autoscrollRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const currentSong = songs[currentIndex];
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          navigatePrev();
          break;
        case 'ArrowRight':
          navigateNext();
          break;
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setIsAutoscrolling(prev => !prev);
          break;
        case '+':
        case '=':
          adjustFontSize(1);
          break;
        case '-':
          adjustFontSize(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, songs.length]);

  // Autoscroll logic
  useEffect(() => {
    if (isAutoscrolling && lyricsRef.current) {
      const scroll = () => {
        if (lyricsRef.current) {
          lyricsRef.current.scrollTop += autoscrollSpeed / 60;
          
          // Stop at bottom
          if (lyricsRef.current.scrollTop >= lyricsRef.current.scrollHeight - lyricsRef.current.clientHeight) {
            setIsAutoscrolling(false);
          }
        }
        autoscrollRef.current = requestAnimationFrame(scroll);
      };
      
      autoscrollRef.current = requestAnimationFrame(scroll);
    }

    return () => {
      if (autoscrollRef.current) {
        cancelAnimationFrame(autoscrollRef.current);
      }
    };
  }, [isAutoscrolling, autoscrollSpeed]);

  // Reset scroll on song change
  useEffect(() => {
    if (lyricsRef.current) {
      lyricsRef.current.scrollTop = 0;
    }
    setIsAutoscrolling(false);
  }, [currentIndex]);

  // Hide controls after inactivity
  useEffect(() => {
    const showControlsTemporarily = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (!showSettings) {
          setShowControls(false);
        }
      }, 3000);
    };

    showControlsTemporarily();
    window.addEventListener('mousemove', showControlsTemporarily);
    window.addEventListener('touchstart', showControlsTemporarily);

    return () => {
      window.removeEventListener('mousemove', showControlsTemporarily);
      window.removeEventListener('touchstart', showControlsTemporarily);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showSettings]);

  const navigatePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const navigateNext = useCallback(() => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, songs.length]);

  const adjustFontSize = (direction: number) => {
    const currentIdx = FONT_SIZES.indexOf(fontSize);
    const newIdx = Math.max(0, Math.min(FONT_SIZES.length - 1, currentIdx + direction));
    setFontSize(FONT_SIZES[newIdx]);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && currentIndex > 0) {
      navigatePrev();
    } else if (info.offset.x < -threshold && currentIndex < songs.length - 1) {
      navigateNext();
    }
  };

  const handleTapZone = (zone: 'left' | 'right') => {
    if (zone === 'left') {
      navigatePrev();
    } else {
      navigateNext();
    }
  };

  const toggleTheme = () => {
    setIsLightMode(prev => !prev);
  };

  if (!currentSong) {
    return null;
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        isLightMode ? 'bg-white text-gray-900' : 'performance-container bg-lyrics-bg text-lyrics-text'
      )}
    >
      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              'absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between',
              'bg-gradient-to-b from-black/50 to-transparent'
            )}
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="text-white">
                <h2 className="font-semibold truncate max-w-[200px] sm:max-w-none">
                  {currentSong.title}
                </h2>
                <p className="text-sm text-white/70">
                  {currentIndex + 1} of {songs.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-white hover:bg-white/20"
              >
                {isLightMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-white/20"
              >
                <Settings2 className="h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap zones */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1/4 z-5 cursor-pointer"
        onClick={() => handleTapZone('left')}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-1/4 z-5 cursor-pointer"
        onClick={() => handleTapZone('right')}
      />

      {/* Lyrics */}
      <motion.div
        ref={lyricsRef}
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="flex-1 overflow-auto px-6 py-20 lyrics-display scrollbar-hide"
      >
        <div className="max-w-4xl mx-auto">
          <pre
            className="whitespace-pre-wrap font-sans"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            {currentSong.lyrics || 'No lyrics available'}
          </pre>
        </div>
      </motion.div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'absolute bottom-24 left-1/2 -translate-x-1/2 w-80 p-4 rounded-xl',
              isLightMode ? 'bg-gray-100' : 'bg-card/95 backdrop-blur-strong'
            )}
          >
            {/* Font Size */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Font Size</span>
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustFontSize(-1)}
                  disabled={fontSize <= FONT_SIZES[0]}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Slider
                  value={[FONT_SIZES.indexOf(fontSize)]}
                  min={0}
                  max={FONT_SIZES.length - 1}
                  step={1}
                  onValueChange={([v]) => setFontSize(FONT_SIZES[v])}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => adjustFontSize(1)}
                  disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Autoscroll Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Scroll Speed</span>
                <span className="text-sm text-muted-foreground">{autoscrollSpeed}</span>
              </div>
              <Slider
                value={[autoscrollSpeed]}
                min={10}
                max={100}
                step={5}
                onValueChange={([v]) => setAutoscrollSpeed(v)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'absolute bottom-0 left-0 right-0 z-10 p-4',
              'bg-gradient-to-t from-black/50 to-transparent'
            )}
          >
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={navigatePrev}
                disabled={currentIndex === 0}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAutoscrolling(!isAutoscrolling)}
                className={cn(
                  'h-14 w-14 rounded-full text-white',
                  isAutoscrolling ? 'bg-primary hover:bg-primary/80' : 'bg-white/20 hover:bg-white/30'
                )}
              >
                {isAutoscrolling ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={navigateNext}
                disabled={currentIndex === songs.length - 1}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>

            {/* Song list indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {songs.slice(Math.max(0, currentIndex - 3), Math.min(songs.length, currentIndex + 4)).map((song, i) => {
                const actualIndex = Math.max(0, currentIndex - 3) + i;
                return (
                  <button
                    key={song.id}
                    onClick={() => setCurrentIndex(actualIndex)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      actualIndex === currentIndex
                        ? 'w-6 bg-primary'
                        : 'w-1.5 bg-white/40 hover:bg-white/60'
                    )}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
