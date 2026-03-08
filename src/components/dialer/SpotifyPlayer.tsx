import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, List, LogOut, ChevronDown, Plus, ArrowLeft, ListPlus, Check } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { Slider } from '@/components/ui/slider';

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

type Tab = 'player' | 'search' | 'playlists';

interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  uri: string;
  duration_ms: number;
}

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
  // "Add to playlist" flow
  const [addingTrack, setAddingTrack] = useState<{ uri: string; name: string } | null>(null);
  const [addedToPlaylist, setAddedToPlaylist] = useState<string | null>(null);

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

  // Collapsed: single button that toggles play or opens panel
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
    const tracks = await spotify.fetchPlaylistTracks(playlistId);
    setPlaylistTracks(tracks);
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

  return (
    <div className="fixed left-[68px] bottom-4 w-[320px] bg-card border border-border/50 rounded-2xl shadow-2xl z-[300] overflow-hidden flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
        <div className="flex items-center gap-2 min-w-0">
          <Music size={14} className="text-[#1DB954] shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-semibold text-foreground">Spotify</span>
            {spotify.spotifyDisplayName && (
              <p className="text-[9px] text-muted-foreground truncate">Forbundet som: {spotify.spotifyDisplayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={spotify.disconnect} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-none bg-transparent" title="Afbryd Spotify">
            <LogOut size={12} />
          </button>
          <button onClick={() => setExpanded(false)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent">
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* "Add to playlist" overlay */}
      {addingTrack && (
        <div className="absolute inset-0 bg-card z-10 flex flex-col rounded-2xl">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
            <button onClick={() => setAddingTrack(null)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground cursor-pointer border-none bg-transparent">
              <ArrowLeft size={14} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">Tilføj til playliste</p>
              <p className="text-[11px] font-medium text-foreground truncate">{addingTrack.name}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
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
                    <Music size={12} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{pl.name}</p>
                </div>
                {addedToPlaylist === pl.id ? (
                  <Check size={14} className="text-[#1DB954] shrink-0" />
                ) : (
                  <Plus size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
            <t.icon size={12} />
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
                  <img src={spotify.currentTrack.albumArt} alt={spotify.currentTrack.album} className="w-36 h-36 rounded-xl object-cover shadow-lg" />
                )}
                <div className="text-center w-full">
                  <p className="text-sm font-semibold text-foreground truncate">{spotify.currentTrack.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{spotify.currentTrack.artist}</p>
                </div>
                <div className="w-full flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{formatMs(spotify.progress)}</span>
                  <Slider value={[spotify.progress]} max={spotify.duration || 1} step={1000} onValueChange={([v]) => spotify.seek(v)} className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-[#1DB954]" />
                  <span className="text-[10px] text-muted-foreground w-8">{formatMs(spotify.duration)}</span>
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
                <Music size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs text-muted-foreground">Ingen sang afspilles</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Søg efter musik eller vælg en playliste</p>
              </div>
            )}
          </div>
        )}

        {tab === 'search' && (
          <div className="p-3">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
            <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
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
                      <ListPlus size={14} />
                    </button>
                    <button
                      onClick={() => spotify.play(track.uri)}
                      className="p-1 rounded-md hover:bg-secondary text-muted-foreground opacity-0 group-hover:opacity-100 transition-all cursor-pointer border-none bg-transparent"
                    >
                      <Play size={14} />
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
          <div className="p-3 flex flex-col gap-0.5 max-h-[350px] overflow-y-auto">
            {/* Create new playlist */}
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
                  <Plus size={16} className="text-[#1DB954]" />
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
                    <Music size={14} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{pl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{pl.trackCount} sange</p>
                </div>
                <Play size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
            {spotify.playlists.length === 0 && (
              <p className="text-[11px] text-muted-foreground text-center py-4">Ingen playlister fundet</p>
            )}
          </div>
        )}

        {/* Playlist detail view */}
        {tab === 'playlists' && openPlaylistId && (
          <div className="flex flex-col max-h-[350px]">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
              <button onClick={() => setOpenPlaylistId(null)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground cursor-pointer border-none bg-transparent">
                <ArrowLeft size={14} />
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
                <p className="text-[11px] text-muted-foreground text-center py-4">Indlæser...</p>
              ) : (
                playlistTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => spotify.play(track.uri)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border-none bg-transparent text-left w-full group"
                  >
                    {track.albumArt && <img src={track.albumArt} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <Play size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
    </div>
  );
};
