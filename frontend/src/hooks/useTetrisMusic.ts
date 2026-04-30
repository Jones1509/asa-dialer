import { useState, useEffect, useRef, useCallback } from 'react';

export function useTetrisMusic() {
  const ytPlayerRef = useRef<any>(null);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const containerIdRef = useRef('yt-music-player-global');

  // Initialize YouTube IFrame API once
  useEffect(() => {
    // Create hidden container if not exists
    if (!document.getElementById(containerIdRef.current)) {
      const div = document.createElement('div');
      div.id = containerIdRef.current;
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) document.head.appendChild(tag);

    const initPlayer = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new (window as any).YT.Player(containerIdRef.current, {
        height: '0',
        width: '0',
        videoId: 'vtNJMAyeP0s',
        playerVars: { autoplay: 0, loop: 1, playlist: 'vtNJMAyeP0s', controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
        events: {
          onReady: (e: any) => { e.target.setVolume(35); setMusicReady(true); },
          onStateChange: (e: any) => {
            if (e.data === (window as any).YT.PlayerState.ENDED) e.target.playVideo();
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        prev?.();
        initPlayer();
      };
    }

    return () => {
      // Don't destroy on unmount - keep playing globally
    };
  }, []);

  // Start music (called when entering Tetris page)
  const startMusic = useCallback(() => {
    if (!musicReady || musicMuted) return;
    setMusicStarted(true);
    try { ytPlayerRef.current?.playVideo(); } catch { }
  }, [musicReady, musicMuted]);

  // Control mute/unmute
  const toggleMusic = useCallback(() => {
    setMusicMuted(prev => {
      const next = !prev;
      try {
        if (next) {
          ytPlayerRef.current?.pauseVideo();
        } else if (musicStarted) {
          ytPlayerRef.current?.playVideo();
        }
      } catch { }
      return next;
    });
  }, [musicStarted]);

  // Stop music completely
  const stopMusic = useCallback(() => {
    setMusicStarted(false);
    try { ytPlayerRef.current?.pauseVideo(); } catch { }
  }, []);

  return { musicMuted, musicReady, musicStarted, startMusic, toggleMusic, stopMusic };
}
