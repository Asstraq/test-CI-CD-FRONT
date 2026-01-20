'use client';

import { useFavorites } from '@/hooks/useFavorites';
import { useUserSession } from '@/lib/auth/userSession';
import {
  Avatar,
  Box,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

export default function ProfilePage() {
  const { user: userObject } = useUserSession();
  const user = userObject?.user;
  const { favoritesPlaylist, loading } = useFavorites();

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f4f4f0 0%, #e9efff 100%)',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="md">
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

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1a1d24', mb: 2 }}
              >
                Coups de cœur
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : favoritesPlaylist?.tracks &&
                favoritesPlaylist.tracks.length > 0 ? (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <List sx={{ py: 0 }}>
                    {favoritesPlaylist.tracks.map((track, index) => {
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
                              index < favoritesPlaylist.tracks!.length - 1
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
                  Aucun titre dans vos coups de cœur. Ajoutez vos sons préférés
                  en cliquant sur le bouton cœur.
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
