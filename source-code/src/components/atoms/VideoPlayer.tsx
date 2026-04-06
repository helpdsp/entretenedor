import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize } from 'lucide-react';
import { clsx } from 'clsx';

interface VideoPlayerProps {
  url: string;
  onComplete: () => void;
  title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, onComplete, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Mark complete at 80%
  useEffect(() => {
    if (progress >= 80 && !hasCompleted) {
      setHasCompleted(true);
      onComplete();
    }
  }, [progress, hasCompleted, onComplete]);

  // Simulate progress for the purpose of the demo/prototype
  // In a real scenario, we'd use the YouTube/Vimeo API
  useEffect(() => {
    let interval: number;
    if (isPlaying && progress < 100) {
      interval = window.setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 100));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const toggleMute = () => setIsMuted(!isMuted);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div 
      className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Content */}
      <iframe
        ref={iframeRef}
        src={url}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {/* Glassmorphism Overlays */}
      <div className={clsx(
        "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-500",
        isPlaying ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <button 
          onClick={togglePlay}
          className="w-20 h-20 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
        >
          <Play className="w-10 h-10 fill-current ml-1" />
        </button>
      </div>

      {/* Progress Bar (Always visible or based on hover) */}
      <div className={clsx(
        "absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 transition-all duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        <div 
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Video Controls */}
      <div className={clsx(
        "absolute bottom-1.5 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-4 transition-all duration-300",
        showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}>
        <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <div className="flex-1">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter truncate">
            {title || 'Playing Content'}
          </p>
        </div>

        <button onClick={toggleMute} className="text-white hover:text-cyan-400 transition-colors">
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        
        <button className="text-white hover:text-cyan-400 transition-colors">
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* Completion Indicator */}
      {hasCompleted && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/90 text-white text-[10px] font-bold rounded-full animate-bounce shadow-lg">
          80% COMPLETED
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
