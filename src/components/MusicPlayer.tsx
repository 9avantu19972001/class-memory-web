'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Volume2, VolumeX, Disc3, ChevronRight, ChevronLeft } from 'lucide-react'

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [, setIsLoaded] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const autoCollapseTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearAutoCollapse = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = null
    }
  }, [])

  const startAutoCollapse = useCallback((duration = 3500) => {
    clearAutoCollapse()
    autoCollapseTimerRef.current = setTimeout(() => {
      setShowControls(false)
    }, duration)
  }, [clearAutoCollapse])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Handle outside clicks to collapse controls
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowControls(false)
        clearAutoCollapse()
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      clearAutoCollapse()
    }
  }, [clearAutoCollapse])

  const togglePlay = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setShowControls(false)
      clearAutoCollapse()
    } else {
      try {
        // Fade in slightly for smooth acoustic start
        audioRef.current.volume = isMuted ? 0 : volume
        await audioRef.current.play()
        setIsPlaying(true)
        setIsLoaded(true)
        // Show controls briefly on play then auto-collapse
        setShowControls(true)
        startAutoCollapse(3500)
      } catch (err) {
        console.warn('Audio play prevented or interrupted:', err)
        // If local file failed to play, try online CDN fallback
        if (audioRef.current && !audioRef.current.src.includes('incompetech')) {
          audioRef.current.src =
            'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3'
          try {
            await audioRef.current.play()
            setIsPlaying(true)
            setIsLoaded(true)
            setShowControls(true)
            startAutoCollapse(3500)
          } catch (e2) {
            console.error('Fallback audio play failed:', e2)
          }
        }
      }
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    if (newVol > 0 && isMuted) {
      setIsMuted(false)
    }
    startAutoCollapse(4500)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMuted(!isMuted)
    startAutoCollapse(3500)
  }

  // Desktop hover interactions
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      clearAutoCollapse()
      setShowControls(true)
    }
  }

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      setShowControls(false)
      clearAutoCollapse()
    }
  }

  return (
    <aside
      ref={containerRef}
      aria-label="Trình phát nhạc hoài niệm nền"
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 select-none"
    >
      {/* Hidden HTML5 Audio Element (Default paused & muted until user clicks) */}
      <audio
        ref={audioRef}
        src="/audio/hoai-niem.mp3"
        loop
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div
        className="relative flex items-center group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Expanded Controls & Track Info */}
        <div
          onTouchStart={clearAutoCollapse}
          onTouchEnd={() => startAutoCollapse(3500)}
          className={`absolute right-12 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border shadow-lg transition-all duration-300 origin-right ${
            showControls
              ? 'opacity-100 scale-100 pointer-events-auto mr-1.5'
              : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          {/* Track name & author */}
          <div className="flex flex-col min-w-[110px] sm:min-w-[135px] max-w-[160px] leading-tight">
            <span className="text-[11px] font-bold text-foreground font-serif truncate">
              {isPlaying ? '🎶 Đang phát' : '🎵 Nhạc hoài niệm'}
            </span>
            <span className="text-[10px] text-foreground/60 truncate">
              Giai điệu thanh xuân 9A
            </span>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/80">
            <button
              type="button"
              onClick={toggleMute}
              className="text-foreground/70 hover:text-foreground p-1 transition-colors rounded-full hover:bg-muted/60"
              title={isMuted ? 'Bật âm lượng' : 'Tắt tiếng'}
              aria-label={isMuted ? 'Bật âm lượng' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-12 sm:w-16 h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
              title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              aria-label="Điều chỉnh âm lượng"
            />
          </div>

          {/* Close / Collapse button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowControls(false)
              clearAutoCollapse()
            }}
            className="p-1 rounded-full text-foreground/50 hover:text-foreground hover:bg-muted/80 transition-colors ml-0.5"
            title="Thu gọn bảng điều khiển"
            aria-label="Thu gọn bảng điều khiển"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Expand Button (Visible when controls are collapsed so mobile user can easily open them) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowControls(true)
            startAutoCollapse(4000)
          }}
          className={`absolute right-12 w-6 h-6 rounded-full bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md border border-border shadow-xs flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-muted transition-all duration-300 active:scale-90 ${
            showControls
              ? 'opacity-0 scale-75 pointer-events-none'
              : 'opacity-100 scale-100 pointer-events-auto mr-1'
          }`}
          title="Mở bảng điều khiển nhạc"
          aria-label="Mở bảng điều khiển nhạc"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Floating Play / Pause Vinyl Disc Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105 active:scale-95 ${
            isPlaying
              ? 'bg-zinc-900 text-amber-200 border-2 border-amber-300/60 ring-4 ring-primary/20 shadow-primary/20'
              : 'bg-card/95 hover:bg-card text-foreground border border-border hover:border-primary/50'
          }`}
          title={isPlaying ? 'Tạm dừng nhạc (Gymnopédie No. 1)' : 'Bật nhạc hoài niệm 🎵'}
        >
          {isPlaying ? (
            <>
              {/* Rotating Vinyl Record Center */}
              <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
                {/* Vinyl grooved rings */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-zinc-700 border-dashed flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  </div>
                </div>
              </div>

              {/* Animated Soundwave Equalizer overlay */}
              <div className="relative z-10 flex items-end justify-center gap-0.5 w-4 h-4 pb-0.5">
                <span className="w-0.5 bg-amber-300 rounded-full animate-eq-1" />
                <span className="w-0.5 bg-amber-300 rounded-full animate-eq-2" />
                <span className="w-0.5 bg-amber-300 rounded-full animate-eq-3" />
              </div>
            </>
          ) : (
            <>
              {/* Paused State: Disc with small Play icon */}
              <Disc3 className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/70 group-hover:text-primary transition-colors" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                <Play className="w-2 h-2 ml-0.5 fill-current" />
              </div>
            </>
          )}

          {/* Pulse ring when playing */}
          {isPlaying && (
            <span className="absolute -inset-1 rounded-full border border-primary/40 animate-ping pointer-events-none opacity-40" />
          )}
        </button>
      </div>
    </aside>
  )
}
