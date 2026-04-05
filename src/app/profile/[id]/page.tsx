'use client';

import * as PlaylistAPI from '@/lib/api/playlist.api';
import TrackPreviewArtwork from '@/components/TrackPreviewArtwork';
import { openConversation } from '@/lib/api/messages.api';
import { useUserSession } from '@/lib/auth/userSession';
import {
  getMyFollowers,
  getMyFollowing,
  getUserFollowers,
  getUserFollowing,
  type SocialProfile,
} from '@/lib/api/social.api';
import { buildProfileHref } from '@/lib/profile/profileHref';
import type { Playlist } from '@/type/playlist';
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function buildHandle(name: string, fallback = 'utilisateur') {
  const base = name.trim() || fallback;
  return `@${base.replace(/\s+/g, '').toLowerCase()}`;
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useUserSession();
  const userId = params.id;
  const [followers, setFollowers] = useState<SocialProfile[]>([]);
  const [following, setFollowing] = useState<SocialProfile[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [remoteProfile, setRemoteProfile] = useState<SocialProfile | null>(
    null,
  );
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null,
  );
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null,
  );
  const [socialLoading, setSocialLoading] = useState(true);
  const [mutualLoading, setMutualLoading] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [openingConversation, setOpeningConversation] = useState(false);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUserId = currentUser?.user.id;
    if (!currentUserId || !userId) return;
    if (String(currentUserId) !== String(userId)) return;

    router.replace('/profile');
  }, [currentUser?.user.id, router, userId]);

  useEffect(() => {
    let active = true;

    async function loadSocialProfile() {
      if (!userId || String(currentUser?.user.id) === String(userId)) return;

      try {
        setSocialLoading(true);
        setError('');
        const [nextFollowers, nextFollowing] = await Promise.all([
          getUserFollowers(userId),
          getUserFollowing(userId),
        ]);
        if (!active) return;
        setFollowers(nextFollowers);
        setFollowing(nextFollowing);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Impossible de charger ce profil.',
        );
      } finally {
        if (active) setSocialLoading(false);
      }
    }

    void loadSocialProfile();

    return () => {
      active = false;
    };
  }, [currentUser?.user.id, userId]);

  useEffect(() => {
    let active = true;

    async function loadMutualStatus() {
      if (!currentUser?.user.id || !userId) return;
      if (String(currentUser.user.id) === String(userId)) return;

      try {
        setMutualLoading(true);
        const [myFollowing, myFollowers] = await Promise.all([
          getMyFollowing(),
          getMyFollowers(),
        ]);
        if (!active) return;

        const followsUser = myFollowing.some(
          (profile) => String(profile.id) === String(userId),
        );
        const followedByUser = myFollowers.some(
          (profile) => String(profile.id) === String(userId),
        );

        setCanMessage(followsUser && followedByUser);
      } catch {
        if (!active) return;
        setCanMessage(false);
      } finally {
        if (active) setMutualLoading(false);
      }
    }

    void loadMutualStatus();

    return () => {
      active = false;
    };
  }, [currentUser?.user.id, userId]);

  const profile = useMemo(() => {
    const name =
      remoteProfile?.name ?? searchParams.get('name') ?? 'Utilisateur';
    const email = remoteProfile?.email ?? searchParams.get('email') ?? '';
    const avatarUrl =
      remoteProfile?.avatarUrl ?? searchParams.get('avatarUrl') ?? '';
    const handle =
      remoteProfile?.handle ??
      searchParams.get('handle') ??
      buildHandle(name, userId);

    return {
      id: userId,
      name,
      email,
      avatarUrl,
      handle,
    };
  }, [
    remoteProfile?.avatarUrl,
    remoteProfile?.email,
    remoteProfile?.handle,
    remoteProfile?.name,
    searchParams,
    userId,
  ]);

  useEffect(() => {
    let active = true;

    async function loadPublicPlaylists() {
      if (!userId || String(currentUser?.user.id) === String(userId)) return;

      try {
        setPlaylistsLoading(true);
        const response = await PlaylistAPI.getUserPublicPlaylists(userId);

        if (!active) return;

        setRemoteProfile(response.user);
        setPlaylists(response.lists);
        setSelectedPlaylistId((prev) => prev ?? response.lists[0]?.id ?? null);
      } finally {
        if (active) setPlaylistsLoading(false);
      }
    }

    void loadPublicPlaylists();

    return () => {
      active = false;
    };
  }, [currentUser?.user.id, userId]);

  useEffect(() => {
    let active = true;

    async function loadSelectedPlaylist() {
      if (!selectedPlaylistId) {
        setSelectedPlaylist(null);
        return;
      }

      try {
        setPlaylistLoading(true);
        const playlist = await PlaylistAPI.getPlaylistById(selectedPlaylistId);
        if (!active) return;
        setSelectedPlaylist(playlist);
      } catch {
        if (!active) return;
        const fallback =
          playlists.find((playlist) => playlist.id === selectedPlaylistId) ??
          null;
        setSelectedPlaylist(fallback);
      } finally {
        if (active) setPlaylistLoading(false);
      }
    }

    void loadSelectedPlaylist();

    return () => {
      active = false;
    };
  }, [playlists, selectedPlaylistId]);

  const renderLinkedProfileName = (entry: SocialProfile) => {
    const href = buildProfileHref(entry);

    if (!href) return entry.name;

    return (
      <Typography
        component={Link}
        href={href}
        variant="body1"
        sx={{
          fontWeight: 600,
          color: '#1a1d24',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        {entry.name}
      </Typography>
    );
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
                alt={profile.name}
                src={profile.avatarUrl || undefined}
                sx={{ width: 96, height: 96, bgcolor: '#c9d3e3', fontSize: 32 }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: '#1a1d24' }}
                >
                  {profile.name}
                </Typography>
                <Typography sx={{ color: '#4a5568', mt: 1 }}>
                  {profile.handle}
                </Typography>
                {profile.email ? (
                  <Typography sx={{ color: '#64748b', mt: 0.5 }}>
                    {profile.email}
                  </Typography>
                ) : null}
                {currentUser?.user.id ? (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      disabled={
                        mutualLoading || openingConversation || !canMessage
                      }
                      onClick={async () => {
                        if (!userId || !canMessage) return;
                        try {
                          setOpeningConversation(true);
                          const conversation = await openConversation(userId);
                          router.push(`/messages/${conversation.id}`);
                        } finally {
                          setOpeningConversation(false);
                        }
                      }}
                    >
                      {openingConversation
                        ? 'Ouverture...'
                        : canMessage
                          ? 'Envoyer un message'
                          : 'Messagerie indisponible'}
                    </Button>
                    {!mutualLoading && !canMessage ? (
                      <Typography
                        variant="body2"
                        sx={{ color: '#64748b', mt: 1 }}
                      >
                        La messagerie privee est reservee aux suivis mutuels.
                      </Typography>
                    ) : null}
                  </Box>
                ) : null}
              </Box>
            </Stack>

            <Divider />

            {error ? (
              <Typography sx={{ color: '#c62828' }}>{error}</Typography>
            ) : null}

            {socialLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={3}
                  alignItems="flex-start"
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      flex: 1,
                      width: '100%',
                      borderRadius: 3,
                      p: 2,
                      bgcolor: 'rgba(248, 249, 255, 0.92)',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: '#1a1d24', mb: 1 }}
                    >
                      Followings ({following.length})
                    </Typography>
                    {following.length > 0 ? (
                      <List sx={{ py: 0 }}>
                        {following.map((entry) => {
                          const profileHref = buildProfileHref(entry);

                          return (
                            <ListItem
                              key={`following-${entry.id}`}
                              sx={{ px: 0 }}
                            >
                              <ListItemAvatar>
                                {profileHref ? (
                                  <Link
                                    href={profileHref}
                                    style={{
                                      color: 'inherit',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <Avatar src={entry.avatarUrl || undefined}>
                                      {entry.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                  </Link>
                                ) : (
                                  <Avatar src={entry.avatarUrl || undefined}>
                                    {entry.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                )}
                              </ListItemAvatar>
                              <ListItemText
                                primary={renderLinkedProfileName(entry)}
                                secondary={entry.email || entry.handle}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucun abonnement public affiche.
                      </Typography>
                    )}
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      flex: 1,
                      width: '100%',
                      borderRadius: 3,
                      p: 2,
                      bgcolor: 'rgba(248, 249, 255, 0.92)',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: '#1a1d24', mb: 1 }}
                    >
                      Followers ({followers.length})
                    </Typography>
                    {followers.length > 0 ? (
                      <List sx={{ py: 0 }}>
                        {followers.map((entry) => {
                          const profileHref = buildProfileHref(entry);

                          return (
                            <ListItem
                              key={`follower-${entry.id}`}
                              sx={{ px: 0 }}
                            >
                              <ListItemAvatar>
                                {profileHref ? (
                                  <Link
                                    href={profileHref}
                                    style={{
                                      color: 'inherit',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <Avatar src={entry.avatarUrl || undefined}>
                                      {entry.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                  </Link>
                                ) : (
                                  <Avatar src={entry.avatarUrl || undefined}>
                                    {entry.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                )}
                              </ListItemAvatar>
                              <ListItemText
                                primary={renderLinkedProfileName(entry)}
                                secondary={entry.email || entry.handle}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucun follower public affiche.
                      </Typography>
                    )}
                  </Paper>
                </Stack>

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
                      Playlists publiques
                    </Typography>

                    {playlistsLoading ? (
                      <Box
                        sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                      >
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
                              onClick={() => setSelectedPlaylistId(playlist.id)}
                              sx={{
                                borderRadius: 2,
                                px: 1.5,
                                bgcolor:
                                  selectedPlaylistId === playlist.id
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
                        Aucune playlist publique trouvee.
                      </Typography>
                    )}
                  </Paper>

                  <Box sx={{ flex: 1, width: '100%' }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: '#1a1d24', mb: 2 }}
                    >
                      {selectedPlaylist?.name ?? 'Selectionnez une playlist'}
                    </Typography>

                    {playlistLoading ? (
                      <Box
                        sx={{ display: 'flex', justifyContent: 'center', p: 4 }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : selectedPlaylist?.tracks &&
                      selectedPlaylist.tracks.length > 0 ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <List sx={{ py: 0 }}>
                          {selectedPlaylist.tracks.map((track, index) => {
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
                                    index < selectedPlaylist.tracks!.length - 1
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
                        {selectedPlaylistId
                          ? 'Cette playlist est vide ou ses details ne sont pas accessibles.'
                          : 'Aucune playlist publique selectionnee.'}
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
