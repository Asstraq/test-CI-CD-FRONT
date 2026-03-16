'use client';

import * as PlaylistAPI from '@/lib/api/playlist.api';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserSession } from '@/lib/auth/userSession';
import type { Playlist } from '@/type/playlist';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function ProfilePage() {
  const { user: userObject } = useUserSession();
  const user = userObject?.user;
  const { favoritesPlaylist, loading: favoritesLoading } = useFavorites();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listsLoading, setListsLoading] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [createState, setCreateState] = useState({
    name: '',
    description: '',
  });
  const [createOpen, setCreateOpen] = useState(false);

  const favoritesId = favoritesPlaylist?.id ?? null;
  const isFavoritesSelected =
    selectedId !== null && favoritesId !== null && selectedId === favoritesId;

  const displayedPlaylist = useMemo(() => {
    if (isFavoritesSelected && favoritesPlaylist) return favoritesPlaylist;
    return selectedPlaylist;
  }, [favoritesPlaylist, isFavoritesSelected, selectedPlaylist]);

  const displayedLoading = isFavoritesSelected
    ? favoritesLoading
    : listsLoading || playlistLoading;

  const loadPlaylists = useCallback(async () => {
    try {
      setListsLoading(true);
      const { lists } = await PlaylistAPI.getUserPlaylists();
      setPlaylists(lists);

      const defaultId =
        lists.find((list) => list.id === favoritesId)?.id ??
        lists[0]?.id ??
        null;
      setSelectedId((prev) => prev ?? defaultId);
    } finally {
      setListsLoading(false);
    }
  }, [favoritesId]);

  const loadPlaylistById = useCallback(async (playlistId: string) => {
    try {
      setPlaylistLoading(true);
      const list = await PlaylistAPI.getPlaylistById(playlistId);
      setSelectedPlaylist(list);
    } finally {
      setPlaylistLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadPlaylists();
  }, [loadPlaylists, user]);

  useEffect(() => {
    if (!selectedId) return;
    if (selectedId === favoritesId) return;
    void loadPlaylistById(selectedId);
  }, [favoritesId, loadPlaylistById, selectedId]);

  const handleCreate = async () => {
    const name = createState.name.trim();
    if (!name) return;
    const newList = await PlaylistAPI.createPlaylist({
      name,
      description: createState.description.trim() || undefined,
    });
    setCreateState({ name: '', description: '' });
    setCreateOpen(false);
    await loadPlaylists();
    setSelectedId(newList.id);
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f4f4f0 0%, #e9efff 100%)',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(255,255,255,0.7)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Stack spacing={4}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems="center"
            >
              <Avatar
                alt="Photo de profil"
                src={'/images/profile-placeholder.jpg'}
                sx={{ width: 96, height: 96, bgcolor: '#c9d3e3', fontSize: 32 }}
              />
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: '#1a1d24' }}
                >
                  {user?.nom}
                </Typography>
                <Typography sx={{ color: '#4a5568', mt: 1 }}>
                  {user?.bio}
                </Typography>
              </Box>
            </Stack>

            <Divider />

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
                  onClick={() => setCreateOpen(true)}
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
                      <ListItem
                        key={playlist.id}
                        disablePadding
                        sx={{ mb: 0.5 }}
                      >
                        <ListItemButton
                          onClick={() => setSelectedId(playlist.id)}
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
                                sx={{
                                  fontWeight: 600,
                                  color: '#1a1d24',
                                }}
                              >
                                {playlist.name}
                              </Typography>
                            }
                            secondary={
                              playlist.description ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {playlist.description}
                                </Typography>
                              ) : null
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

                {displayedLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : displayedPlaylist?.tracks &&
                  displayedPlaylist.tracks.length > 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
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
                              <Avatar
                                variant="rounded"
                                src={track.album?.image ?? undefined}
                                alt={track.album?.name || track.name}
                                sx={{ width: 48, height: 48 }}
                              />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {track.name}
                                </Typography>
                              }
                              secondary={
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
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
          </Stack>
        </Paper>
      </Container>
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Créer une playlist</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Nom"
              value={createState.name}
              onChange={(event) =>
                setCreateState((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
            />
            <TextField
              label="Description"
              value={createState.description}
              onChange={(event) =>
                setCreateState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateOpen(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!createState.name.trim()}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
