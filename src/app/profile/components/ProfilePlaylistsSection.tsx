'use client';

import TrackPreviewArtwork from '@/components/TrackPreviewArtwork';
import type { Playlist, PlaylistVisibility } from '@/type/playlist';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

type Props = {
  playlists: Playlist[];
  listsLoading: boolean;
  selectedId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenCreatePlaylist: () => void;
  displayedPlaylist: Playlist | null;
  selectedPlaylistForSettings: Playlist | null;
  selectedPlaylistVisibility: PlaylistVisibility;
  onUpdatePlaylistVisibility: (
    playlist: Playlist,
    visibility: PlaylistVisibility,
  ) => void | Promise<void>;
  playlistActionId: string | null;
  playlistError: string;
  displayedLoading: boolean;
};

export default function ProfilePlaylistsSection({
  playlists,
  listsLoading,
  selectedId,
  onSelectPlaylist,
  onOpenCreatePlaylist,
  displayedPlaylist,
  selectedPlaylistForSettings,
  selectedPlaylistVisibility,
  onUpdatePlaylistVisibility,
  playlistActionId,
  playlistError,
  displayedLoading,
}: Props) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={3}
      alignItems="flex-start"
    >
      <Paper
        variant="outlined"
        sx={{
          width: { xs: '100%', md: 260 },
          borderRadius: 3,
          p: 2,
          bgcolor: 'rgba(248, 249, 255, 0.9)',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: '#1a1d24', mb: 1 }}
        >
          Mes playlists
        </Typography>

        <Button
          variant="contained"
          onClick={onOpenCreatePlaylist}
          sx={{ borderRadius: 2, mb: 2 }}
        >
          Nouvelle playlist
        </Button>

        {listsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : playlists.length > 0 ? (
          <List sx={{ py: 0 }}>
            {playlists.map((playlist) => (
              <ListItem key={playlist.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onSelectPlaylist(playlist.id)}
                  sx={{
                    borderRadius: 2,
                    px: 1.5,
                    bgcolor:
                      selectedId === playlist.id
                        ? 'rgba(59, 130, 246, 0.12)'
                        : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(59, 130, 246, 0.08)',
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: '#1a1d24' }}
                      >
                        {playlist.name}
                      </Typography>
                    }
                    secondary={
                      <Stack spacing={0.25}>
                        {playlist.description ? (
                          <Typography variant="caption" color="text.secondary">
                            {playlist.description}
                          </Typography>
                        ) : null}
                        <Typography variant="caption" color="text.secondary">
                          {playlist.visibility === 'PUBLIC'
                            ? 'Publique'
                            : 'Privee'}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucune playlist pour le moment.
          </Typography>
        )}
      </Paper>

      <Box sx={{ flex: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: '#1a1d24', mb: 2 }}
        >
          {displayedPlaylist?.name ?? 'Sélectionnez une playlist'}
        </Typography>

        {selectedPlaylistForSettings ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 3,
              backgroundColor: 'rgba(248, 249, 255, 0.92)',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              justifyContent="space-between"
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                  Visibilite de la playlist
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Choisissez si cette playlist est publique ou privee.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant={
                    selectedPlaylistVisibility === 'PRIVATE'
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() =>
                    void onUpdatePlaylistVisibility(
                      selectedPlaylistForSettings,
                      'PRIVATE',
                    )
                  }
                  disabled={
                    playlistActionId === selectedPlaylistForSettings.id ||
                    selectedPlaylistVisibility === 'PRIVATE'
                  }
                >
                  Privee
                </Button>
                <Button
                  size="small"
                  variant={
                    selectedPlaylistVisibility === 'PUBLIC'
                      ? 'contained'
                      : 'outlined'
                  }
                  onClick={() =>
                    void onUpdatePlaylistVisibility(
                      selectedPlaylistForSettings,
                      'PUBLIC',
                    )
                  }
                  disabled={
                    playlistActionId === selectedPlaylistForSettings.id ||
                    selectedPlaylistVisibility === 'PUBLIC'
                  }
                >
                  Publique
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        {playlistError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {playlistError}
          </Alert>
        ) : null}

        {displayedLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : displayedPlaylist?.tracks && displayedPlaylist.tracks.length > 0 ? (
          <Paper
            variant="outlined"
            sx={{ borderRadius: 3, overflow: 'hidden' }}
          >
            <List sx={{ py: 0 }}>
              {displayedPlaylist.tracks.map((track, index) => {
                const artistNames = track.artists
                  ?.map((artist) => artist.name)
                  .join(', ');
                const albumName = track.album?.name;
                const secondaryText =
                  artistNames && albumName
                    ? `${artistNames} · ${albumName}`
                    : artistNames || albumName || '';

                return (
                  <ListItem
                    key={track.id ?? `${track.name}-${index}`}
                    sx={{
                      borderBottom:
                        index < displayedPlaylist.tracks!.length - 1
                          ? '1px solid #f0f0f0'
                          : 'none',
                    }}
                  >
                    <ListItemAvatar>
                      <TrackPreviewArtwork
                        trackId={track.spotifyId ?? track.id}
                        imageUrl={track.album?.image ?? null}
                        alt={track.album?.name || track.name}
                        size={48}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {track.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {secondaryText}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        ) : (
          <Box
            sx={{
              mt: 2,
              borderRadius: 3,
              border: '1px dashed #c7d2e5',
              backgroundColor: 'rgba(236, 242, 255, 0.6)',
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              color: '#64748b',
            }}
          >
            {selectedId
              ? 'Cette playlist est vide. Ajoutez vos sons préférés.'
              : 'Sélectionnez une playlist dans la colonne de gauche.'}
          </Box>
        )}
      </Box>
    </Stack>
  );
}
