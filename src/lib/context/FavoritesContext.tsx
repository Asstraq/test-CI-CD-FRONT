'use client';

import * as PlaylistAPI from '@/lib/api/playlist.api';
import { useUserSession } from '@/lib/auth/userSession';
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
  isTrackLiked: (spotifyId: string) => boolean;
  toggleLike: (track: AddTrackToPlaylistRequest) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useUserSession();
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

      // Ensure we have a playlist to enable likes even if detail fetch fails.
      setFavoritesPlaylist(favorites);

      try {
        const detailed = await PlaylistAPI.getPlaylistById(favorites.id);
        setFavoritesPlaylist(detailed);
      } catch {
        // Ignore detail fetch errors (public endpoint may not return private lists).
      }
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsInitialized(true);
      setFavoritesPlaylist(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoritesPlaylist(null);
      setIsInitialized(true);
      setError(null);
      return;
    }
    loadFavoritesPlaylist();
  }, [loadFavoritesPlaylist, user]);

  const isTrackLiked = useCallback(
    (spotifyId: string): boolean => {
      if (!favoritesPlaylist?.tracks) return false;
      return favoritesPlaylist.tracks.some(
        (track) => track.id === spotifyId || track.spotifyId === spotifyId,
      );
    },
    [favoritesPlaylist],
  );

  const toggleLike = useCallback(
    async (track: AddTrackToPlaylistRequest): Promise<boolean> => {
      if (!favoritesPlaylist) {
        throw new Error('Playlist non chargée');
      }

      const isLiked = isTrackLiked(track.spotifyId);

      try {
        if (isLiked) {
          const updated = await PlaylistAPI.removeTrackFromPlaylist(
            favoritesPlaylist.id,
            track.type,
            track.spotifyId,
          );
          if (updated?.tracks) {
            setFavoritesPlaylist(updated);
          } else {
            setFavoritesPlaylist((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                tracks: (prev.tracks ?? []).filter(
                  (item) =>
                    item.id !== track.spotifyId &&
                    item.spotifyId !== track.spotifyId,
                ),
              };
            });
          }
          setError(null);
          return false;
        } else {
          const updated = await PlaylistAPI.addTrackToPlaylist(
            favoritesPlaylist.id,
            track,
          );
          if (updated?.tracks) {
            setFavoritesPlaylist(updated);
          } else {
            setFavoritesPlaylist((prev) => {
              if (!prev) return prev;
              const current = prev.tracks ?? [];
              const exists = current.some(
                (item) =>
                  item.id === track.spotifyId ||
                  item.spotifyId === track.spotifyId,
              );
              if (exists) return prev;
              return {
                ...prev,
                tracks: [
                  ...current,
                  {
                    id: track.spotifyId,
                    spotifyId: track.spotifyId,
                    name: track.title,
                    album: {
                      image: track.imageUrl ?? null,
                    },
                  },
                ],
              };
            });
          }
          setError(null);
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
