'use client';

import LikeButton from '@/components/LikeButton';
import { useAuth } from '@/hooks/useAuth';
import type { AddTrackToPlaylistRequest } from '@/type/playlist';
import { Box, Stack, Typography } from '@mui/material';

type AlbumArtist = {
  id?: string;
  name: string;
};

type AlbumTrack = {
  id?: string;
  name: string;
};

type AlbumDetail = {
  id: string;
  name: string;
  image?: string | null;
  artists?: AlbumArtist[];
};

type AlbumTracksProps = {
  tracks: AlbumTrack[];
  album: AlbumDetail;
};

export default function AlbumTracks({ tracks, album }: AlbumTracksProps) {
  const { user } = useAuth();

  const createTrackData = (track: AlbumTrack): AddTrackToPlaylistRequest => ({
    type: 'TRACK',
    spotifyId: track.id ?? '',
    title: track.name,
    imageUrl: album.image ?? null,
  });

  return (
    <Stack spacing={1}>
      {tracks.map((track, index) => (
        <Box
          key={track.id ?? `${track.name}-${index}`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          <Typography>
            {index + 1}. {track.name}
          </Typography>
          {user && track.id && (
            <LikeButton track={createTrackData(track)} size="small" />
          )}
        </Box>
      ))}
    </Stack>
  );
}
