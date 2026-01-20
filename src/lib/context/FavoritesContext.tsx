'use client';

import * as PlaylistAPI from '@/lib/api/playlist.api';
import type { AddTrackToPlaylistRequest, Playlist } from '@/type/playlist';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const FAVORITES_PLAYLIST_NAME = 'Coups de cœur';

type FavoritesContextType = {
  favoritesPlaylist: Playlist | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  isTrackLiked: (trackId: string) => boolean;
  toggleLike: (track: AddTrackToPlaylistRequest) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoritesPlaylist, setFavoritesPlaylist] = useState<Playlist | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadFavoritesPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { lists } = await PlaylistAPI.getUserPlaylists();

      let favorites = lists.find((p) => p.name === FAVORITES_PLAYLIST_NAME);

      if (!favorites) {
        favorites = await PlaylistAPI.createPlaylist({
          name: FAVORITES_PLAYLIST_NAME,
          description: 'Mes titres préférés',
        });
      }

      setFavoritesPlaylist(favorites);
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavoritesPlaylist();
  }, [loadFavoritesPlaylist]);

  const isTrackLiked = useCallback(
    (trackId: string): boolean => {
      if (!favoritesPlaylist?.tracks) return false;
      return favoritesPlaylist.tracks.some((track) => track.id === trackId);
    },
    [favoritesPlaylist],
  );

  const toggleLike = useCallback(
    async (track: AddTrackToPlaylistRequest): Promise<boolean> => {
      if (!favoritesPlaylist) {
        throw new Error('Playlist non chargée');
      }

      const isLiked = isTrackLiked(track.trackId);

      try {
        if (isLiked) {
          const updated = await PlaylistAPI.removeTrackFromPlaylist(
            favoritesPlaylist.id,
            track.trackId,
          );
          setFavoritesPlaylist(updated);
          return false;
        } else {
          const updated = await PlaylistAPI.addTrackToPlaylist(
            favoritesPlaylist.id,
            track,
          );
          setFavoritesPlaylist(updated);
          return true;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        throw err;
      }
    },
    [favoritesPlaylist, isTrackLiked],
  );

  const value: FavoritesContextType = {
    favoritesPlaylist,
    loading,
    error,
    isInitialized,
    isTrackLiked,
    toggleLike,
    refreshFavorites: loadFavoritesPlaylist,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
