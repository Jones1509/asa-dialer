import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, List, LogOut, Plus, ArrowLeft, ListPlus, Check, Shuffle, Repeat, Clock } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { Slider } from '@/components/ui/slider';

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

type View = 'home' | 'playlist';

interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
  duration_ms: number;
}

export const SpotifyPage: React.FC = () => {
  const spotify = useSpotify();
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<View>('home');
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [addingTrack, setAddingTrack] = useState<{ uri: string; name: string } | null>(null);
  const [addedToPlaylist, setAddedToPlaylist] = useState<string | null>(null);

  const [loadingPlaylists, setLoadingPlaylists] = useState(false);

  // Lazy-load playlists only when Spotify page is opened
  useEffect(() => {
    const loadPlaylists = async () => {
      if (spotify.isConnected && spotify.playlists.length === 0 && !spotify.loading && !loadingPlaylists) {
        setLoadingPlaylists(true);
        // Ensure we have a fresh token before fetching playlists
        if (!spotify.accessToken) {
          await spotify.refreshToken();
        }
        await spotify.fetchPlaylists();
        setLoadingPlaylists(false);
      }
    };
    loadPlaylists();
  }, [spotify.isConnected, spotify.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenPlaylist = async (playlistId: string) => {
    setOpenPlaylistId(playlistId);
    setView('playlist');
    setLoadingTracks(true);
    setPlaylistTracks([]);
    try {
      const tracks = await spotify.fetchPlaylistTracks(playlistId);
      setPlaylistTracks(tracks);
    } catch (e) {
      console.error('Failed to load playlist tracks:', e);
      setPlaylistTracks([]);
    } finally {
      // ALWAYS stop spinner — even if fetch hangs or throws
      setLoadingTracks(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    setCreatingPlaylist(true);
    await spotify.createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
    setCreatingPlaylist(false);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!addingTrack) return;
    const success = await spotify.addTrackToPlaylist(playlistId, addingTrack.uri);
    if (success) {
      setAddedToPlaylist(playlistId);
      setTimeout(() => {
        setAddedToPlaylist(null);
        setAddingTrack(null);
      }, 1200);
    }
  };

  const openPlaylist = spotify.playlists.find(p => p.id === openPlaylistId);

  if (spotify.loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin" />
      </div>
    );
  }

  if (!spotify.isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-5 max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#1DB954]/10 flex items-center justify-center">
            <Music size={36} className="text-[#1DB954]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg mb-1">Forbind Spotify</h2>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              Forbind din Spotify Premium-konto for at lytte til musik mens du ringer. Din konto er privat og kun synlig for dig.
            </p>
          </div>
          {spotify.initError && (
            <div className="w-full bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-left">
              <p className="text-[11px] font-medium text-destructive mb-0.5">Fejl ved forbindelse:</p>
              <p className="text-[11px] text-destructive/80 font-mono break-all">{spotify.initError}</p>
            </div>
          )}
          <button
            onClick={spotify.login}
            className="px-6 py-2.5 rounded-xl bg-[#1DB954] text-white font-semibold text-sm cursor-pointer border-none hover:bg-[#1DB954]/90 transition-colors shadow-lg shadow-[#1DB954]/20"
          >
            Forbind med Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden animate-fade-in">
      {/* "Add to playlist" overlay */}
      {addingTrack && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setAddingTrack(null)}>
          <div className="bg-card border border-border/50 rounded-2xl w-[360px] max-h-[500px] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
              <button onClick={() => setAddingTrack(null)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground cursor-pointer border-none bg-transparent">
                <ArrowLeft size={16} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">Tilføj til playliste</p>
                <p className="text-[13px] font-semibold text-foreground truncate">{addingTrack.name}</p>
              </div>
            </div>
            <div className="overflow-y-auto p-3 flex flex-col gap-0.5 max-h-[400px]">
              {spotify.playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id)}
                  disabled={addedToPlaylist === pl.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border-none bg-transparent text-left w-full group disabled:opacity-60"
                >
                  {pl.image ? (
                    <img src={pl.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Music size={14} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{pl.name}</p>
                    <p className="text-[11px] text-muted-foreground">{pl.trackCount} sange</p>
                  </div>
                  {addedToPlaylist === pl.id ? (
                    <Check size={16} className="text-[#1DB954] shrink-0" />
                  ) : (
                    <Plus size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Left: Playlists sidebar */}
      <div className="w-[280px] border-r border-border/30 flex flex-col bg-card/50 shrink-0">
        <div className="h-[48px] flex items-center px-5 border-b border-border/30 gap-2">
          <Music size={15} className="text-[#1DB954]" />
          <span className="font-heading font-bold text-[13px]">Spotify</span>
          <div className="flex-1" />
          {spotify.spotifyDisplayName && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{spotify.spotifyDisplayName}</span>
          )}
          <button onClick={spotify.disconnect} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent" title="Afbryd Spotify">
            <LogOut size={13} />
          </button>
        </div>

        <div className="p-3">
          {showCreatePlaylist ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                placeholder="Playliste-navn..."
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#1DB954]/50"
              />
              <button
                onClick={handleCreatePlaylist}
                disabled={creatingPlaylist || !newPlaylistName.trim()}
                className="px-3 py-2 rounded-lg bg-[#1DB954] text-white text-[11px] font-medium cursor-pointer border-none hover:bg-[#1DB954]/90 disabled:opacity-50"
              >
                {creatingPlaylist ? '...' : 'Opret'}
              </button>
              <button onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); }} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent text-sm">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-[#1DB954]/5 transition-colors cursor-pointer border border-dashed border-border/50 bg-transparent text-left w-full mb-2"
            >
              <div className="w-9 h-9 rounded-lg bg-[#1DB954]/10 flex items-center justify-center shrink-0">
                <Plus size={16} className="text-[#1DB954]" />
              </div>
              <p className="text-[12px] font-medium text-[#1DB954]">Opret ny playliste</p>
            </button>
          )}
        </div>

        {/* Error banner */}
        {spotify.initError && (
          <div className="mx-3 mb-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
            <p className="text-[10px] font-medium text-destructive mb-1">Fejl:</p>
            <p className="text-[10px] text-destructive/80 font-mono break-all leading-relaxed">{spotify.initError}</p>
            <button
              onClick={async () => {
                setLoadingPlaylists(true);
                if (!spotify.accessToken) {
                  await spotify.refreshToken();
                }
                await spotify.fetchPlaylists(undefined, true);
                setLoadingPlaylists(false);
              }}
              disabled={loadingPlaylists}
              className="mt-2 text-[10px] text-[#1DB954] underline cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
            >
              {loadingPlaylists ? 'Henter...' : 'Prøv igen'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-0.5">
          {loadingPlaylists && spotify.playlists.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground text-xs">Henter playlister...</div>
            </div>
          )}
          {spotify.playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => handleOpenPlaylist(pl.id)}
              className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer border-none text-left w-full group
                ${openPlaylistId === pl.id ? 'bg-[#1DB954]/10' : 'bg-transparent hover:bg-secondary/50'}`}
            >
              {pl.image ? (
                <img src={pl.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Music size={14} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-foreground truncate">{pl.name}</p>
                <p className="text-[10px] text-muted-foreground">{pl.trackCount} sange</p>
              </div>
            </button>
          ))}
          {spotify.playlists.length === 0 && !spotify.initError && (
            <div className="text-center py-6">
              <p className="text-[11px] text-muted-foreground mb-2">Ingen playlister fundet</p>
              <button
                onClick={() => spotify.fetchPlaylists()}
                className="text-[11px] text-[#1DB954] underline cursor-pointer border-none bg-transparent p-0"
              >
                Genindlæs
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Center: Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="h-[48px] flex items-center px-5 border-b border-border/30 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                spotify.search(e.target.value);
                if (e.target.value) setView('home');
              }}
              placeholder="Søg efter sange, artister..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#1DB954]/50 transition-colors"
            />
          </div>
          {view === 'playlist' && openPlaylist && (
            <button
              onClick={() => { setView('home'); setOpenPlaylistId(null); }}
              className="text-[12px] text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent transition-colors"
            >
              ← Tilbage
            </button>
          )}
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Search results */}
          {searchQuery && view === 'home' && (
            <div>
              <h3 className="font-heading font-bold text-[13px] mb-3">Søgeresultater</h3>
              <div className="flex flex-col gap-0.5">
                {spotify.searchResults.map((track) => (
                  <div key={track.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group">
                    <button onClick={() => spotify.play(track.uri)} className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer border-none bg-transparent text-left p-0">
                      {track.albumArt && <img src={track.albumArt} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{track.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{track.artist} · {track.album}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0">{formatMs(track.duration_ms)}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setAddingTrack({ uri: track.uri, name: track.name })}
                        title="Tilføj til playliste"
                        className="p-1.5 rounded-md hover:bg-[#1DB954]/10 text-muted-foreground hover:text-[#1DB954] opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent"
                      >
                        <ListPlus size={15} />
                      </button>
                      <button
                        onClick={() => spotify.play(track.uri)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent"
                      >
                        <Play size={15} />
                      </button>
                    </div>
                  </div>
                ))}
                {spotify.searchResults.length === 0 && (
                  <p className="text-[12px] text-muted-foreground text-center py-8">Ingen resultater for "{searchQuery}"</p>
                )}
              </div>
            </div>
          )}

          {/* Home view - no search */}
          {!searchQuery && view === 'home' && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1DB954]/10 flex items-center justify-center">
                <Music size={28} className="text-[#1DB954]/50" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-foreground">Vælg en playliste eller søg efter musik</p>
                <p className="text-[12px] text-muted-foreground mt-1">Brug søgefeltet ovenfor eller klik på en playliste i sidebaren</p>
              </div>
            </div>
          )}

          {/* Playlist detail view */}
          {view === 'playlist' && openPlaylistId && (
            <div>
              {/* Playlist header */}
              <div className="flex items-center gap-4 mb-5">
                {openPlaylist?.image ? (
                  <img src={openPlaylist.image} alt="" className="w-24 h-24 rounded-xl object-cover shadow-lg shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Music size={32} className="text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading font-bold text-lg truncate">{openPlaylist?.name}</h2>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{openPlaylist?.trackCount || playlistTracks.length} sange</p>
                  <button
                    onClick={() => spotify.playPlaylist(openPlaylistId)}
                    className="mt-3 px-5 py-2 rounded-full bg-[#1DB954] text-white text-[12px] font-semibold cursor-pointer border-none hover:bg-[#1DB954]/90 transition-colors flex items-center gap-2 shadow-md shadow-[#1DB954]/20"
                  >
                    <Play size={14} /> Afspil alle
                  </button>
                </div>
              </div>

              {/* Track list header */}
              <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium border-b border-border/20 mb-1">
                <span className="w-8 text-right">#</span>
                <span className="w-10" />
                <span className="flex-1">Titel</span>
                <span className="w-[180px]">Album</span>
                <Clock size={12} className="shrink-0" />
              </div>

              {loadingTracks ? (
                <div className="flex items-center justify-center py-12 gap-2">
                  <div className="w-5 h-5 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin" />
                  <p className="text-[12px] text-muted-foreground">Indlæser sange...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {playlistTracks.map((track, i) => (
                    <div
                      key={`${track.id}-${i}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer"
                      onClick={() => spotify.play(track.uri)}
                    >
                      <span className="text-[11px] text-muted-foreground/50 w-8 text-right tabular-nums shrink-0 group-hover:hidden">{i + 1}</span>
                      <Play size={12} className="text-foreground w-8 text-right shrink-0 hidden group-hover:block" />
                      {track.albumArt && <img src={track.albumArt} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{track.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      <span className="w-[180px] text-[11px] text-muted-foreground/60 truncate shrink-0">{track.album}</span>
                      <span className="text-[11px] text-muted-foreground/50 tabular-nums shrink-0">{formatMs(track.duration_ms)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddingTrack({ uri: track.uri, name: track.name }); }}
                        className="p-1 rounded-md hover:bg-[#1DB954]/10 text-muted-foreground hover:text-[#1DB954] opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent shrink-0"
                      >
                        <ListPlus size={14} />
                      </button>
                    </div>
                  ))}
                  {playlistTracks.length === 0 && (
                    <p className="text-[12px] text-muted-foreground text-center py-8">Ingen sange i playlisten</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom player bar */}
        <div className="h-[72px] border-t border-border/30 bg-card/80 backdrop-blur-sm flex items-center px-5 gap-5 shrink-0">
          {/* Track info */}
          <div className="flex items-center gap-3 w-[250px] shrink-0">
            {spotify.currentTrack?.albumArt ? (
              <img src={spotify.currentTrack.albumArt} alt="" className="w-12 h-12 rounded-lg object-cover shadow-md shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Music size={18} className="text-muted-foreground/30" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{spotify.currentTrack?.name || 'Ingen sang'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{spotify.currentTrack?.artist || 'Vælg en sang at afspille'}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-4">
              <button onClick={spotify.prevTrack} className="p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent text-muted-foreground hover:text-foreground">
                <SkipBack size={18} />
              </button>
              <button onClick={spotify.togglePlay} className="w-10 h-10 rounded-full bg-[#1DB954] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer border-none shadow-lg shadow-[#1DB954]/25">
                {spotify.isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>
              <button onClick={spotify.nextTrack} className="p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent text-muted-foreground hover:text-foreground">
                <SkipForward size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-[10px] text-muted-foreground w-9 text-right tabular-nums">{formatMs(spotify.progress)}</span>
              <Slider value={[spotify.progress]} max={spotify.duration || 1} step={1000} onValueChange={([v]) => spotify.seek(v)} className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-[#1DB954]" />
              <span className="text-[10px] text-muted-foreground w-9 tabular-nums">{formatMs(spotify.duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-[160px] shrink-0">
            <button onClick={() => spotify.setVolume(spotify.volume === 0 ? 50 : 0)} className="p-1 cursor-pointer border-none bg-transparent text-muted-foreground hover:text-foreground transition-colors">
              {spotify.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <Slider value={[spotify.volume]} max={100} step={1} onValueChange={([v]) => spotify.setVolume(v)} className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
