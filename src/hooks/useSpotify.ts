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
  'playlist-modify-public',
  'playlist-modify-private',
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
  const [spotifyDisplayName, setSpotifyDisplayName] = useState<string | null>(null);
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

  // ===== KEY FIX: Keep a ref in sync with accessToken state =====
  // This allows callbacks to always read the latest token without stale closures
  const accessTokenRef = useRef<string | null>(null);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Internal token refresh - always returns the new token
  const doRefreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'refresh' },
      });
      if (!error && data?.access_token) {
        setAccessToken(data.access_token);
        accessTokenRef.current = data.access_token;
        setIsConnected(true);
        return data.access_token;
      }
    } catch (e) {
      console.error('Token refresh failed:', e);
    }
    return null;
  }, []);

  // Internal helper: get a valid token (refresh if needed)
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const token = accessTokenRef.current;
    if (token) return token;
    return doRefreshToken();
  }, [doRefreshToken]);

  // Fetch playlists using ref-based token
  const fetchPlaylists = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride ?? accessTokenRef.current;
    if (!token) {
      console.error('fetchPlaylists: no token');
      return;
    }

    try {
      let resp = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Auto-refresh on 401
      if (resp.status === 401 || resp.status === 403) {
        const newToken = await doRefreshToken();
        if (!newToken) return;
        resp = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
          headers: { Authorization: `Bearer ${newToken}` },
        });
      }

      if (!resp.ok) {
        console.error('fetchPlaylists failed:', resp.status, await resp.text().catch(() => ''));
        return;
      }

      const data = await resp.json();
      console.log('Playlists fetched:', data.items?.length);
      setPlaylists(
        (data.items || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url || '',
          trackCount: p.tracks?.total ?? 0,
        }))
      );
    } catch (e) {
      console.error('Playlists fetch error:', e);
    }
  }, [doRefreshToken]);

  // Fetch all tracks for a playlist with pagination
  const fetchPlaylistTracks = useCallback(async (playlistId: string): Promise<SpotifyTrack[]> => {
    let token = await getValidToken();
    if (!token) {
      console.error('fetchPlaylistTracks: no token');
      return [];
    }

    const allTracks: SpotifyTrack[] = [];
    let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    let pageCount = 0;
    const MAX_PAGES = 50;

    while (url && pageCount < MAX_PAGES) {
      pageCount++;
      let resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (resp.status === 401 || resp.status === 403) {
        const newToken = await doRefreshToken();
        if (!newToken) break;
        token = newToken;
        resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      }

      if (!resp.ok) {
        console.error(`Spotify tracks error ${resp.status}:`, await resp.text().catch(() => ''));
        break;
      }

      const data = await resp.json();
      const items: any[] = data.items || [];

      const tracks = items
        .filter((item: any) => item?.track?.id)
        .map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists?.map((a: any) => a.name).join(', ') || '',
          album: item.track.album?.name || '',
          albumArt:
            item.track.album?.images?.[1]?.url ||
            item.track.album?.images?.[0]?.url ||
            '',
          uri: item.track.uri,
          duration_ms: item.track.duration_ms || 0,
        }));

      allTracks.push(...tracks);
      url = data.next || null;
    }

    console.log(`fetchPlaylistTracks: fetched ${allTracks.length} tracks`);
    return allTracks;
  }, [getValidToken, doRefreshToken]);

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('spotify-auth', {
          body: { action: 'status' },
        });
        if (!error && data?.connected) {
          setIsConnected(true);
          setSpotifyDisplayName(data.spotify_display_name || null);
          // Get fresh token and update ref BEFORE fetching playlists
          const freshToken = await doRefreshToken();
          if (freshToken) {
            await fetchPlaylists(freshToken);
          }
        }
      } catch (e) {
        console.error('Spotify status check failed:', e);
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = () => {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES,
      redirect_uri: REDIRECT_URI,
      show_dialog: 'true',
    });
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    window.location.href = `https://accounts.spotify.com/logout?continue=${encodeURIComponent(authUrl)}`;
  };

  const exchangeCode = async (code: string) => {
    const { data, error } = await supabase.functions.invoke('spotify-auth', {
      body: { action: 'exchange', code, redirect_uri: REDIRECT_URI },
    });
    if (error) throw error;
    setAccessToken(data.access_token);
    accessTokenRef.current = data.access_token;
    setSpotifyDisplayName(data.spotify_display_name || null);
    setIsConnected(true);
    await fetchPlaylists(data.access_token);
    return data.access_token;
  };

  const disconnect = async () => {
    player?.disconnect();
    setPlayer(null);
    setDeviceId(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setSpotifyDisplayName(null);
    setPlaylists([]);
    await supabase.functions.invoke('spotify-auth', {
      body: { action: 'disconnect' },
    });
    setAccessToken(null);
    accessTokenRef.current = null;
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
    const token = await getValidToken();
    if (!token || !deviceId) return;
    if (uri) {
      const resp = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [uri] }),
      });
      if (resp.status === 403 || resp.status === 401) {
        const newToken = await doRefreshToken();
        if (newToken) {
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [uri] }),
          });
        }
      }
    } else {
      player?.resume();
    }
  };

  const pause = () => player?.pause();
  const togglePlay = () => { if (isPlaying) pause(); else play(); };
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
    const token = accessTokenRef.current;
    if (!token || !query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const resp = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const playPlaylist = async (playlistId: string) => {
    const token = await getValidToken();
    if (!token || !deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
    });
  };

  const createPlaylist = async (name: string): Promise<string | null> => {
    const token = await getValidToken();
    if (!token) return null;
    try {
      const meResp = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const me = await meResp.json();
      const resp = await fetch(`https://api.spotify.com/v1/users/${me.id}/playlists`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, public: false }),
      });
      const data = await resp.json();
      await fetchPlaylists();
      return data.id || null;
    } catch (e) {
      console.error('Create playlist error:', e);
      return null;
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackUri: string) => {
    const token = await getValidToken();
    if (!token) return false;
    try {
      const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [trackUri] }),
      });
      if (resp.ok) {
        await fetchPlaylists();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Add track error:', e);
      return false;
    }
  };

  return {
    isConnected,
    loading,
    spotifyDisplayName,
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
    fetchPlaylistTracks,
    createPlaylist,
    addTrackToPlaylist,
    fetchPlaylists,
    accessToken,
    deviceId,
    refreshToken: doRefreshToken,
  };
}
