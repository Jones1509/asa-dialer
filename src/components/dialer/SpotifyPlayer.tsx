import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, List, LogOut, ChevronDown, Plus, ArrowLeft, ListPlus, Check, GripHorizontal, Maximize2, Minimize2, X } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { Slider } from '@/components/ui/slider';

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

type Tab = 'player' | 'search' | 'playlists';
type PlayerSize = 'compact' | 'normal' | 'large';

interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
  duration_ms: number;
}

const SIZE_CONFIG: Record<PlayerSize, { width: number; maxHeight: number }> = {
  compact: { width: 280, maxHeight: 380 },
  normal: { width: 340, maxHeight: 500 },
  large: { width: 420, maxHeight: 640 },
};

export const SpotifyPlayer: React.FC = () => {
  const spotify = useSpotify();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [addingTrack, setAddingTrack] = useState<{ uri: string; name: string } | null>(null);
  const [addedToPlaylist, setAddedToPlaylist] = useState<string | null>(null);

  // Draggable + resizable state
  const [playerSize, setPlayerSize] = useState<PlayerSize>('normal');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Default position: left of sidebar, bottom
  const getDefaultPosition = useCallback(() => {
    return { x: 78, y: window.innerHeight - SIZE_CONFIG[playerSize].maxHeight - 16 };
  }, [playerSize]);

  useEffect(() => {
    if (expanded && !position) {
      setPosition(getDefaultPosition());
    }
  }, [expanded]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    const rect = dragRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - SIZE_CONFIG[playerSize].width));
      const y = Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - 100));
      setPosition({ x, y });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, playerSize]);

  const cycleSize = () => {
    const order: PlayerSize[] = ['compact', 'normal', 'large'];
    const idx = order.indexOf(playerSize);
    setPlayerSize(order[(idx + 1) % order.length]);
  };

  const closePlayer = () => {
    setExpanded(false);
    setPosition(null);
  };

  if (spotify.loading) return null;

  if (!spotify.isConnected) {
    return (
      <button
        onClick={spotify.login}
        title="Forbind Spotify"
        className="w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center bg-transparent text-[#1DB954] hover:bg-[#1DB954]/10 transition-all duration-200 ease-out group relative"
      >
        <Music size={18} strokeWidth={1.8} />
        <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
          Forbind Spotify
        </span>
      </button>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        title={spotify.currentTrack ? `${spotify.currentTrack.name} - ${spotify.currentTrack.artist}` : 'Spotify'}
        className="w-10 h-10 rounded-xl border-none cursor-pointer flex items-center justify-center bg-[#1DB954]/10 text-[#1DB954] hover:bg-[#1DB954]/20 transition-all duration-200 ease-out group relative"
      >
        {spotify.currentTrack ? (
          spotify.isPlaying ? <Pause size={16} /> : <Play size={16} />
        ) : (
          <Music size={18} strokeWidth={1.8} />
        )}
        <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg max-w-[200px] truncate">
          {spotify.currentTrack ? `${spotify.currentTrack.name} - ${spotify.currentTrack.artist}` : 'Spotify'}
        </span>
      </button>
    );
  }

  const handleOpenPlaylist = async (playlistId: string) => {
    setOpenPlaylistId(playlistId);
    setLoadingTracks(true);
    try {
      const tracks = await spotify.fetchPlaylistTracks(playlistId);
      setPlaylistTracks(tracks);
    } catch (e) {
      console.error('Failed to load playlist tracks:', e);
      setPlaylistTracks([]);
    }
    setLoadingTracks(false);
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
  const sizeConf = SIZE_CONFIG[playerSize];
  const pos = position || getDefaultPosition();

  return (
    <div
      ref={dragRef}
      className="fixed z-[300] flex flex-col overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: sizeConf.width,
        maxHeight: sizeConf.maxHeight,
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.25), 0 2px 12px rgba(0,0,0,0.1)',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border) / 0.5)',
        cursor: isDragging ? 'grabbing' : 'default',
        transition: isDragging ? 'none' : 'width 0.2s ease, max-height 0.2s ease',
      }}
    >
      {/* Drag handle + header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border/30 select-none"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <GripHorizontal size={12} className="text-muted-foreground/40 shrink-0" />
          <Music size={13} className="text-[#1DB954] shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-foreground">Spotify</span>
            {spotify.spotifyDisplayName && (
              <p className="text-[9px] text-muted-foreground/60 truncate leading-tight">{spotify.spotifyDisplayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={cycleSize}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
            title={`Størrelse: ${playerSize === 'compact' ? 'Kompakt' : playerSize === 'normal' ? 'Normal' : 'Stor'}`}
          >
            {playerSize === 'large' ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
          </button>
          <button
            onClick={spotify.disconnect}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer border-none bg-transparent"
            title="Afbryd Spotify"
          >
            <LogOut size={11} />
          </button>
          <button
            onClick={closePlayer}
            className="p-1 rounded-md hover:bg-secondary text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer border-none bg-transparent"
            title="Luk"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* "Add to playlist" overlay */}
      {addingTrack && (
        <div className="absolute inset-0 bg-card z-10 flex flex-col" style={{ borderRadius: 16 }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
            <button onClick={() => setAddingTrack(null)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground cursor-pointer border-none bg-transparent">
              <ArrowLeft size={13} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">Tilføj til playliste</p>
              <p className="text-[11px] font-medium text-foreground truncate">{addingTrack.name}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-0.5">
            {spotify.playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                disabled={addedToPlaylist === pl.id}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border-none bg-transparent text-left w-full group disabled:opacity-60"
              >
                {pl.image ? (
                  <img src={pl.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                    <Music size={11} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{pl.name}</p>
                </div>
                {addedToPlaylist === pl.id ? (
                  <Check size={13} className="text-[#1DB954] shrink-0" />
                ) : (
                  <Plus size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border/30">
        {[
          { id: 'player' as Tab, icon: Music, label: 'Afspiller' },
          { id: 'search' as Tab, icon: Search, label: 'Søg' },
          { id: 'playlists' as Tab, icon: List, label: 'Playlister' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setOpenPlaylistId(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium border-none cursor-pointer transition-colors
              ${tab === t.id ? 'text-[#1DB954] bg-[#1DB954]/5' : 'text-muted-foreground bg-transparent hover:text-foreground'}`}
          >
            <t.icon size={11} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === 'player' && (
          <div className="p-4 flex flex-col items-center gap-3">
            {spotify.currentTrack ? (
              <>
                {spotify.currentTrack.albumArt && (
                  <img
                    src={spotify.currentTrack.albumArt}
                    alt={spotify.currentTrack.album}
                    className="rounded-xl object-cover shadow-lg"
                    style={{
                      width: playerSize === 'compact' ? 100 : playerSize === 'normal' ? 140 : 180,
                      height: playerSize === 'compact' ? 100 : playerSize === 'normal' ? 140 : 180,
                    }}
                  />
                )}
                <div className="text-center w-full">
                  <p className="text-sm font-semibold text-foreground truncate">{spotify.currentTrack.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{spotify.currentTrack.artist}</p>
                </div>
                <div className="w-full flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{formatMs(spotify.progress)}</span>
                  <Slider value={[spotify.progress]} max={spotify.duration || 1} step={1000} onValueChange={([v]) => spotify.seek(v)} className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-[#1DB954]" />
                  <span className="text-[10px] text-muted-foreground w-8 tabular-nums">{formatMs(spotify.duration)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={spotify.prevTrack} className="p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent text-foreground">
                    <SkipBack size={16} />
                  </button>
                  <button onClick={spotify.togglePlay} className="w-10 h-10 rounded-full bg-[#1DB954] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer border-none shadow-md">
                    {spotify.isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button onClick={spotify.nextTrack} className="p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent text-foreground">
                    <SkipForward size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-2 w-full px-4">
                  {spotify.volume === 0 ? <VolumeX size={14} className="text-muted-foreground" /> : <Volume2 size={14} className="text-muted-foreground" />}
                  <Slider value={[spotify.volume]} max={100} step={1} onValueChange={([v]) => spotify.setVolume(v)} className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5" />
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <Music size={28} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Ingen sang afspilles</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Søg efter musik eller vælg en playliste</p>
              </div>
            )}
          </div>
        )}

        {tab === 'search' && (
          <div className="p-3">
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  spotify.search(e.target.value);
                }}
                placeholder="Søg efter sange..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary/50 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#1DB954]/50 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              {spotify.searchResults.map((track) => (
                <div key={track.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors group">
                  <button onClick={() => spotify.play(track.uri)} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer border-none bg-transparent text-left p-0">
                    {track.albumArt && <img src={track.albumArt} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setAddingTrack({ uri: track.uri, name: track.name })}
                      title="Tilføj til playliste"
                      className="p-1 rounded-md hover:bg-[#1DB954]/10 text-muted-foreground hover:text-[#1DB954] opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent"
                    >
                      <ListPlus size={13} />
                    </button>
                    <button
                      onClick={() => spotify.play(track.uri)}
                      className="p-1 rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent"
                    >
                      <Play size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {searchQuery && spotify.searchResults.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-4">Ingen resultater</p>
              )}
            </div>
          </div>
        )}

        {tab === 'playlists' && !openPlaylistId && (
          <div className="p-3 flex flex-col gap-0.5">
            {showCreatePlaylist ? (
              <div className="flex items-center gap-2 p-2 mb-1">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  placeholder="Playliste-navn..."
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#1DB954]/50"
                />
                <button
                  onClick={handleCreatePlaylist}
                  disabled={creatingPlaylist || !newPlaylistName.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1DB954] text-white text-[10px] font-medium cursor-pointer border-none hover:bg-[#1DB954]/90 disabled:opacity-50"
                >
                  {creatingPlaylist ? '...' : 'Opret'}
                </button>
                <button onClick={() => { setShowCreatePlaylist(false); setNewPlaylistName(''); }} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent">
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreatePlaylist(true)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1DB954]/5 transition-colors cursor-pointer border border-dashed border-border/50 bg-transparent text-left w-full mb-1"
              >
                <div className="w-9 h-9 rounded bg-[#1DB954]/10 flex items-center justify-center shrink-0">
                  <Plus size={15} className="text-[#1DB954]" />
                </div>
                <p className="text-[11px] font-medium text-[#1DB954]">Opret ny playliste</p>
              </button>
            )}

            {spotify.playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleOpenPlaylist(pl.id)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border-none bg-transparent text-left w-full group"
              >
                {pl.image ? (
                  <img src={pl.image} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-secondary flex items-center justify-center shrink-0">
                    <Music size={13} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{pl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pl.trackCount} sange</p>
                </div>
                <ChevronDown size={13} className="text-muted-foreground/40 -rotate-90 shrink-0" />
              </button>
            ))}
            {spotify.playlists.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">Ingen playlister fundet</p>
            )}
          </div>
        )}

        {/* Playlist detail view */}
        {tab === 'playlists' && openPlaylistId && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
              <button onClick={() => { setOpenPlaylistId(null); setPlaylistTracks([]); }} className="p-1 rounded-md hover:bg-secondary text-muted-foreground cursor-pointer border-none bg-transparent">
                <ArrowLeft size={13} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{openPlaylist?.name}</p>
                <p className="text-[10px] text-muted-foreground">{playlistTracks.length} sange</p>
              </div>
              <button
                onClick={() => spotify.playPlaylist(openPlaylistId)}
                className="px-2.5 py-1 rounded-lg bg-[#1DB954] text-white text-[10px] font-medium cursor-pointer border-none hover:bg-[#1DB954]/90 flex items-center gap-1"
              >
                <Play size={10} /> Afspil alle
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
              {loadingTracks ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <div className="w-4 h-4 border-2 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin" />
                  <p className="text-[11px] text-muted-foreground">Indlæser sange...</p>
                </div>
              ) : (
                playlistTracks.map((track, i) => (
                  <button
                    key={`${track.id}-${i}`}
                    onClick={() => spotify.play(track.uri)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border-none bg-transparent text-left w-full group"
                  >
                    <span className="text-[10px] text-muted-foreground/50 w-5 text-right tabular-nums shrink-0">{i + 1}</span>
                    {track.albumArt && <img src={track.albumArt} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">{formatMs(track.duration_ms)}</span>
                    <Play size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))
              )}
              {!loadingTracks && playlistTracks.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-4">Ingen sange i playlisten</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Now playing mini-bar when not on player tab */}
      {tab !== 'player' && spotify.currentTrack && (
        <div className="border-t border-border/30 px-3 py-2 flex items-center gap-2.5">
          {spotify.currentTrack.albumArt && (
            <img src={spotify.currentTrack.albumArt} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-foreground truncate">{spotify.currentTrack.name}</p>
            <p className="text-[9px] text-muted-foreground truncate">{spotify.currentTrack.artist}</p>
          </div>
          <button onClick={spotify.togglePlay} className="p-1 rounded-full hover:bg-secondary transition-colors cursor-pointer border-none bg-transparent text-foreground shrink-0">
            {spotify.isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>
      )}
    </div>
  );
};
