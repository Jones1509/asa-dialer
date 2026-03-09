import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SPOTIFY_CLIENT_ID = 'f554930a88254934b21c11e02ef5ba4c';
const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
].join(' ');

const REDIRECT_URI = `${window.location.origin}/callback`;

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
  duration_ms: number;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  image: string;
  trackCount: number;
}

export function useSpotify() {
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const progressInterval = useRef<number | null>(null);
  const sdkReady = useRef(false);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'status' },
      });
      if (!error && data?.connected) {
        setIsConnected(true);
        await refreshToken();
      }
    } catch (e) {
      console.error('Spotify status check failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES,
      redirect_uri: REDIRECT_URI,
      show_dialog: 'true',
    });
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    // Open in new window to avoid iframe restrictions
    window.open(authUrl, '_blank', 'noopener,noreferrer');
  };

  const exchangeCode = async (code: string) => {
    const { data, error } = await supabase.functions.invoke('spotify-auth', {
      body: { action: 'exchange', code, redirect_uri: REDIRECT_URI },
    });
    if (error) throw error;
    setAccessToken(data.access_token);
    setIsConnected(true);
    return data.access_token;
  };

  const refreshToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'refresh' },
      });
      if (!error && data?.access_token) {
        setAccessToken(data.access_token);
        setIsConnected(true);
        return data.access_token;
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
    }
    return null;
  };

  const disconnect = async () => {
    player?.disconnect();
    setPlayer(null);
    setDeviceId(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    await supabase.functions.invoke('spotify-auth', {
      body: { action: 'disconnect' },
    });
    setAccessToken(null);
    setIsConnected(false);
  };

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken || sdkReady.current) return;

    const script = document.getElementById('spotify-sdk') as HTMLScriptElement;
    if (!script) {
      const s = document.createElement('script');
      s.id = 'spotify-sdk';
      s.src = 'https://sdk.scdn.co/spotify-player.js';
      s.async = true;
      document.body.appendChild(s);
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      sdkReady.current = true;
      initPlayer(accessToken);
    };

    if (window.Spotify) {
      sdkReady.current = true;
      initPlayer(accessToken);
    }
  }, [accessToken]);

  const initPlayer = (token: string) => {
    const p = new window.Spotify.Player({
      name: 'ASA Dialer',
      getOAuthToken: (cb: (token: string) => void) => cb(token),
      volume: volume / 100,
    });

    p.addListener('ready', ({ device_id }: { device_id: string }) => {
      setDeviceId(device_id);
    });

    p.addListener('player_state_changed', (state: Spotify.PlaybackState | null) => {
      if (!state) return;
      const track = state.track_window.current_track;
      if (track) {
        setCurrentTrack({
          id: track.id || '',
          name: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images[0]?.url || '',
          uri: track.uri,
          duration_ms: track.duration_ms,
        });
      }
      setIsPlaying(!state.paused);
      setProgress(state.position);
      setDuration(state.duration);
    });

    p.connect();
    setPlayer(p);
  };

  // Progress ticker
  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + 1000, duration));
      }, 1000);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, duration]);

  const play = async (uri?: string) => {
    if (!accessToken || !deviceId) return;
    if (uri) {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [uri] }),
      });
    } else {
      player?.resume();
    }
  };

  const pause = () => player?.pause();

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const nextTrack = () => player?.nextTrack();
  const prevTrack = () => player?.previousTrack();

  const seek = (ms: number) => {
    player?.seek(ms);
    setProgress(ms);
  };

  const setPlayerVolume = (v: number) => {
    setVolume(v);
    player?.setVolume(v / 100);
  };

  const search = async (query: string) => {
    if (!accessToken || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const resp = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await resp.json();
      setSearchResults(
        (data.tracks?.items || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          artist: t.artists.map((a: any) => a.name).join(', '),
          album: t.album.name,
          albumArt: t.album.images[2]?.url || t.album.images[0]?.url || '',
          uri: t.uri,
          duration_ms: t.duration_ms,
        }))
      );
    } catch (e) {
      console.error('Spotify search error:', e);
    }
  };

  const fetchPlaylists = useCallback(async () => {
    if (!accessToken) return;
    try {
      const resp = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await resp.json();
      setPlaylists(
        (data.items || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url || '',
          trackCount: p.tracks?.total || 0,
        }))
      );
    } catch (e) {
      console.error('Playlists fetch error:', e);
    }
  }, [accessToken]);

  const playPlaylist = async (playlistId: string) => {
    if (!accessToken || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
    });
  };

  useEffect(() => {
    if (accessToken) fetchPlaylists();
  }, [accessToken, fetchPlaylists]);

  return {
    isConnected,
    loading,
    login,
    exchangeCode,
    disconnect,
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume: setPlayerVolume,
    play,
    pause,
    search,
    searchResults,
    playlists,
    playPlaylist,
    accessToken,
    deviceId,
  };
}
