import { useState, useEffect, useRef } from 'react';
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
  const [initError, setInitError] = useState<string | null>(null);

  // Refs to avoid stale closures — never cause re-renders
  const accessTokenRef = useRef<string | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);
  const volumeRef = useRef(50);
  const progressInterval = useRef<number | null>(null);
  const sdkReady = useRef(false);
  const initialized = useRef(false);

  // Keep refs in sync
  useEffect(() => { accessTokenRef.current = accessToken; }, [accessToken]);
  useEffect(() => { deviceIdRef.current = deviceId; }, [deviceId]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  // ---- Token helpers (no deps, use refs) ----

  const doRefreshToken = async (): Promise<string | null> => {
    try {
      console.log('[Spotify] doRefreshToken calling edge function...');
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'refresh' },
      });
      console.log('[Spotify] refresh response:', { data: data ? 'has data' : 'no data', error, hasToken: !!data?.access_token });
      if (!error && data?.access_token) {
        accessTokenRef.current = data.access_token;
        setAccessToken(data.access_token);
        setIsConnected(true);
        return data.access_token;
      }
      console.error('[Spotify] refresh returned no token:', { data, error });
    } catch (e) {
      console.error('[Spotify] Token refresh failed:', e);
    }
    return null;
  };

  const getToken = async (): Promise<string | null> => {
    return accessTokenRef.current ?? doRefreshToken();
  };

  // ---- Playlists ----

  const fetchPlaylists = async (tokenOverride?: string): Promise<void> => {
    let token = tokenOverride ?? accessTokenRef.current;
    if (!token) return;

    const attempt = async (t: string): Promise<Response> => {
      return fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: { Authorization: `Bearer ${t}` },
      });
    };

    try {
      let resp = await attempt(token);

      // Handle 429 rate limit — wait and retry up to 3 times
      for (let i = 0; i < 3 && resp.status === 429; i++) {
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '2', 10);
        await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
        resp = await attempt(token);
      }

      if (resp.status === 401 || resp.status === 403) {
        const newToken = await doRefreshToken();
        if (!newToken) return;
        token = newToken;
        resp = await attempt(token);
      }

      if (!resp.ok) {
        console.error('fetchPlaylists failed:', resp.status);
        return;
      }

      const data = await resp.json();
      const items: SpotifyPlaylist[] = [];

      // Paginate through all playlists
      let nextUrl: string | null = data.next;
      items.push(
        ...(data.items || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url || '',
          trackCount: p.tracks?.total ?? 0,
        }))
      );

      while (nextUrl) {
        const nextResp = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!nextResp.ok) break;
        const nextData = await nextResp.json();
        items.push(
          ...(nextData.items || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            image: p.images?.[0]?.url || '',
            trackCount: p.tracks?.total ?? 0,
          }))
        );
        nextUrl = nextData.next || null;
      }

      setPlaylists(items);
    } catch (e) {
      console.error('Playlists fetch error:', e);
    }
  };

  // ---- Playlist tracks ----

  const fetchPlaylistTracks = async (playlistId: string): Promise<SpotifyTrack[]> => {
    let token = await getToken();
    if (!token) return [];

    const allTracks: SpotifyTrack[] = [];
    let url: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
    let pageCount = 0;

    while (url && pageCount < 50) {
      pageCount++;
      let resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (resp.status === 401 || resp.status === 403) {
        const newToken = await doRefreshToken();
        if (!newToken) break;
        token = newToken;
        resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      }

      if (!resp.ok) {
        console.error(`Tracks error ${resp.status}`);
        break;
      }

      const data = await resp.json();
      const tracks = (data.items || [])
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

    return allTracks;
  };

  // ---- Init on mount ----

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      console.log('[Spotify] init starting...');
      try {
        const { data, error } = await supabase.functions.invoke('spotify-auth', {
          body: { action: 'status' },
        });
        console.log('[Spotify] status response:', { data, error });

        if (error) {
          console.error('[Spotify] status error:', error);
          return;
        }

        if (!data?.connected) {
          console.log('[Spotify] not connected');
          return;
        }

        setIsConnected(true);
        setSpotifyDisplayName(data.spotify_display_name || null);
        console.log('[Spotify] connected, refreshing token...');

        const freshToken = await doRefreshToken();
        console.log('[Spotify] freshToken:', freshToken ? `${freshToken.substring(0, 20)}...` : 'NULL');

        if (freshToken) {
          console.log('[Spotify] fetching playlists...');
          await fetchPlaylists(freshToken);
          console.log('[Spotify] playlists fetch complete');
        } else {
          console.error('[Spotify] No fresh token — cannot fetch playlists');
        }
      } catch (e) {
        console.error('[Spotify] init failed:', e);
      } finally {
        setLoading(false);
        console.log('[Spotify] init done');
      }
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- SDK init ----

  useEffect(() => {
    if (!accessToken || sdkReady.current) return;

    if (!document.getElementById('spotify-sdk')) {
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
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  const initPlayer = (token: string) => {
    const p = new window.Spotify.Player({
      name: 'ASA Dialer',
      getOAuthToken: (cb: (t: string) => void) => cb(token),
      volume: volumeRef.current / 100,
    });

    p.addListener('ready', ({ device_id }: { device_id: string }) => {
      deviceIdRef.current = device_id;
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
    playerRef.current = p;
    setPlayer(p);
  };

  // ---- Progress ticker ----

  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        setProgress((prev) => prev + 1000);
      }, 1000);
    }
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isPlaying]);

  // ---- Controls ----

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
    accessTokenRef.current = data.access_token;
    setAccessToken(data.access_token);
    setSpotifyDisplayName(data.spotify_display_name || null);
    setIsConnected(true);
    await fetchPlaylists(data.access_token);
    return data.access_token;
  };

  const disconnect = async () => {
    playerRef.current?.disconnect();
    setPlayer(null);
    setDeviceId(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setSpotifyDisplayName(null);
    setPlaylists([]);
    await supabase.functions.invoke('spotify-auth', { body: { action: 'disconnect' } });
    accessTokenRef.current = null;
    setAccessToken(null);
    setIsConnected(false);
  };

  const play = async (uri?: string) => {
    const token = await getToken();
    const did = deviceIdRef.current;
    if (!token || !did) return;

    if (uri) {
      const resp = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${did}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [uri] }),
      });
      if (resp.status === 401 || resp.status === 403) {
        const newToken = await doRefreshToken();
        if (newToken) {
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${did}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${newToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uris: [uri] }),
          });
        }
      }
    } else {
      playerRef.current?.resume();
    }
  };

  const pause = () => playerRef.current?.pause();
  const togglePlay = () => { if (isPlaying) pause(); else play(); };
  const nextTrack = () => playerRef.current?.nextTrack();
  const prevTrack = () => playerRef.current?.previousTrack();

  const seek = (ms: number) => {
    playerRef.current?.seek(ms);
    setProgress(ms);
  };

  const setPlayerVolume = (v: number) => {
    setVolume(v);
    volumeRef.current = v;
    playerRef.current?.setVolume(v / 100);
  };

  const search = async (query: string) => {
    const token = accessTokenRef.current;
    if (!token || !query.trim()) { setSearchResults([]); return; }
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
      console.error('Search error:', e);
    }
  };

  const playPlaylist = async (playlistId: string) => {
    const token = await getToken();
    const did = deviceIdRef.current;
    if (!token || !did) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${did}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context_uri: `spotify:playlist:${playlistId}` }),
    });
  };

  const createPlaylist = async (name: string): Promise<string | null> => {
    const token = await getToken();
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
    const token = await getToken();
    if (!token) return false;
    try {
      const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: [trackUri] }),
      });
      if (resp.ok) { await fetchPlaylists(); return true; }
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
