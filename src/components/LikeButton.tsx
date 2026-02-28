'use client';

import { useFavorites } from '@/hooks/useFavorites';
import type { AddTrackToPlaylistRequest } from '@/type/playlist';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

type LikeButtonProps = {
  track: AddTrackToPlaylistRequest;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
};

export default function LikeButton({
  track,
  size = 'medium',
  disabled = false,
}: LikeButtonProps) {
  const {
    isTrackLiked,
    toggleLike,
    isInitialized,
    favoritesPlaylist,
    loading,
    error,
  } = useFavorites();
  const [isLoading, setIsLoading] = useState(false);

  const liked = isTrackLiked(track.spotifyId);
  const isDisabled =
    disabled || isLoading || loading || !isInitialized || !favoritesPlaylist;
  const authError = error && /401|403|unauthorized|token|auth/i.test(error);

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (isDisabled) return;

    setIsLoading(true);
    try {
      await toggleLike(track);
    } catch (error) {
      console.error('Erreur lors du like/unlike:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip
      title={
        loading || !isInitialized
          ? 'Chargement...'
          : authError || !favoritesPlaylist
            ? 'Connexion requise'
            : error
              ? error
              : liked
                ? 'Retirer des favoris'
                : 'Ajouter aux favoris'
      }
    >
      <span>
        <IconButton
          onClick={handleClick}
          disabled={isDisabled}
          size={size}
          sx={{
            color: liked ? '#e11d48' : '#64748b',
            '&:hover': {
              color: liked ? '#be123c' : '#e11d48',
              backgroundColor: 'rgba(225, 29, 72, 0.08)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {liked ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
