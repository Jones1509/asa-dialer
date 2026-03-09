import React, { createContext, useContext } from 'react';
import { useSpotifyInternal } from '@/hooks/useSpotifyInternal';

type SpotifyContextType = ReturnType<typeof useSpotifyInternal>;

const SpotifyContext = createContext<SpotifyContextType | null>(null);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const spotify = useSpotifyInternal();
  return <SpotifyContext.Provider value={spotify}>{children}</SpotifyContext.Provider>;
};

export function useSpotify(): SpotifyContextType {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error('useSpotify must be used within SpotifyProvider');
  return ctx;
}
