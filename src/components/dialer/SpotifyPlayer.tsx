import React, { useState } from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, List, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useSpotify } from '@/hooks/useSpotify';
import { Slider } from '@/components/ui/slider';

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

type Tab = 'player' | 'search' | 'playlists';

export const SpotifyPlayer: React.FC = () => {
  const spotify = useSpotify();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>('player');
  const [searchQuery, setSearchQuery] = useState('');

  if (spotify.loading) return null;

  // Not connected — show connect button
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

  // Mini player (collapsed)
  if (!expanded) {
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => setExpanded(true)}
          title={spotify.currentTrack ? spotify.currentTrack.name : 'Spotify'}
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
        {spotify.currentTrack && (
          <button
            onClick={spotify.togglePlay}
            className="w-6 h-6 rounded-full flex items-center justify-center bg-transparent text-[#1DB954] hover:scale-110 transition-transform cursor-pointer border-none"
          >
            {spotify.isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
        )}
      </div>
    );
  }

  // Expanded panel
  return (
    <div className="fixed left-[68px] bottom-4 w-[320px] bg-card border border-border/50 rounded-2xl shadow-2xl z-[300] overflow-hidden flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Music size={14} className="text-[#1DB954]" />
          <span className="text-xs font-semibold text-foreground">Spotify</span>
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

      {/* Tabs */}
      <div className="flex border-b border-border/30">
        {[
          { id: 'player' as Tab, icon: Music, label: 'Afspiller' },
          { id: 'search' as Tab, icon: Search, label: 'Søg' },
          { id: 'playlists' as Tab, icon: List, label: 'Playlister' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium border-none cursor-pointer transition-colors
              ${tab === t.id ? 'text-[#1DB954] bg-[#1DB954]/5 border-b-2 border-[#1DB954]' : 'text-muted-foreground bg-transparent hover:text-foreground'}`}
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
                {/* Progress */}
                <div className="w-full flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-8 text-right">{formatMs(spotify.progress)}</span>
                  <Slider
                    value={[spotify.progress]}
                    max={spotify.duration || 1}
                    step={1000}
                    onValueChange={([v]) => spotify.seek(v)}
                    className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5 [&_[role=slider]]:bg-[#1DB954]"
                  />
                  <span className="text-[10px] text-muted-foreground w-8">{formatMs(spotify.duration)}</span>
                </div>
                {/* Controls */}
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
                {/* Volume */}
                <div className="flex items-center gap-2 w-full px-4">
                  {spotify.volume === 0 ? <VolumeX size={14} className="text-muted-foreground" /> : <Volume2 size={14} className="text-muted-foreground" />}
                  <Slider
                    value={[spotify.volume]}
                    max={100}
                    step={1}
                    onValueChange={([v]) => spotify.setVolume(v)}
                    className="flex-1 [&_[role=slider]]:h-2.5 [&_[role=slider]]:w-2.5"
                  />
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
              ))}
              {searchQuery && spotify.searchResults.length === 0 && (
                <p className="text-[11px] text-muted-foreground text-center py-4">Ingen resultater</p>
              )}
            </div>
          </div>
        )}

        {tab === 'playlists' && (
          <div className="p-3 flex flex-col gap-0.5 max-h-[350px] overflow-y-auto">
            {spotify.playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => spotify.playPlaylist(pl.id)}
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
      </div>
    </div>
  );
};
