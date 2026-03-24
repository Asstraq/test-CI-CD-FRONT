'use client';

import { BACKEND_URL } from '@/lib/config';
import { useAuth } from '@/hooks/useAuth';
import LikeButton from '@/components/LikeButton';
import {
  openConversation,
  sendConversationMessage,
} from '@/lib/api/messages.api';
import { createTrackShareMessage } from '@/lib/messages/track-share';
import {
  getMyFollowers,
  getMyFollowing,
  type SocialProfile,
} from '@/lib/api/social.api';
import type { AddTrackToPlaylistRequest } from '@/type/playlist';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Track = {
  id: string;
  name: string;
  previewUrl?: string | null;
  album?: { id?: string; name?: string; image?: string | null };
  artists?: Array<{ name: string }>;
};

type SearchResponse = {
  tracks?: Track[];
};

type SearchState = {
  loading: boolean;
  error: string | null;
  results: Track[];
};

type ShareState = {
  open: boolean;
  track: Track | null;
  loadingContacts: boolean;
  contacts: SocialProfile[];
  search: string;
  error: string | null;
  success: string | null;
  sendingToId: string | null;
};

function getPrimaryText(track: Track) {
  return track.name || 'Titre inconnu';
}

function getSecondaryText(track: Track) {
  const artistNames = track.artists?.map((artist) => artist.name).join(', ');
  const albumName = track.album?.name;
  if (artistNames && albumName) return `${artistNames} · ${albumName}`;
  return artistNames || albumName || '';
}

export default function SearchInput() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({
    loading: false,
    error: null,
    results: [],
  });
  const [share, setShare] = useState<ShareState>({
    open: false,
    track: null,
    loadingContacts: false,
    contacts: [],
    search: '',
    error: null,
    success: null,
    sendingToId: null,
  });

  const createTrackData = (track: Track): AddTrackToPlaylistRequest => ({
    type: 'TRACK',
    spotifyId: track.id ?? '',
    title: track.name,
    imageUrl: track.album?.image ?? null,
  });

  useEffect(() => {
    if (!query.trim()) {
      setState({ loading: false, error: null, results: [] });
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams({ q: query, limit: '5' });
        const res = await fetch(
          `${BACKEND_URL}/spotify/search?${params.toString()}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as SearchResponse;
        const results = data.tracks?.slice(0, 5) ?? [];
        setState({ loading: false, error: null, results });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Erreur inconnue',
          results: [],
        });
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const filteredContacts = useMemo(() => {
    if (!share.search.trim()) return share.contacts;
    const normalizedQuery = share.search.trim().toLowerCase();

    return share.contacts.filter((profile) => {
      const values = [profile.name, profile.handle, profile.email]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

      return values.some((value) => value.includes(normalizedQuery));
    });
  }, [share.contacts, share.search]);

  const handleCloseShareDialog = () => {
    if (share.sendingToId) return;

    setShare((prev) => ({
      ...prev,
      open: false,
      track: null,
      search: '',
      error: null,
      success: null,
      sendingToId: null,
    }));
  };

  const loadShareContacts = async () => {
    setShare((prev) => ({
      ...prev,
      loadingContacts: true,
      error: null,
      success: null,
    }));

    try {
      const [following, followers] = await Promise.all([
        getMyFollowing(),
        getMyFollowers(),
      ]);
      const followerIds = new Set(followers.map((profile) => profile.id));
      const mutuals = following.filter((profile) =>
        followerIds.has(profile.id),
      );

      setShare((prev) => ({
        ...prev,
        loadingContacts: false,
        contacts: mutuals,
      }));
    } catch (error) {
      setShare((prev) => ({
        ...prev,
        loadingContacts: false,
        error:
          error instanceof Error
            ? error.message
            : 'Impossible de charger vos contacts.',
      }));
    }
  };

  const handleOpenShareDialog = async (track: Track) => {
    setShare((prev) => ({
      ...prev,
      open: true,
      track,
      search: '',
      error: null,
      success: null,
      sendingToId: null,
    }));

    await loadShareContacts();
  };

  const buildShareMessage = (track: Track) => {
    const artistNames =
      track.artists
        ?.map((artist) => artist.name)
        .filter(Boolean)
        .join(', ') || 'Artiste inconnu';

    return createTrackShareMessage({
      type: 'track-share',
      spotifyId: track.id,
      title: track.name,
      artist: artistNames,
      album: track.album?.name,
      imageUrl: track.album?.image ?? null,
      previewUrl: track.previewUrl ?? null,
    });
  };

  const handleSendTrackByMessage = async (recipient: SocialProfile) => {
    if (!share.track?.id) return;

    setShare((prev) => ({
      ...prev,
      sendingToId: recipient.id,
      error: null,
      success: null,
    }));

    try {
      const conversation = await openConversation(recipient.id);
      await sendConversationMessage(
        conversation.id,
        buildShareMessage(share.track),
      );

      setShare((prev) => ({
        ...prev,
        sendingToId: null,
        success: `Son envoye a ${recipient.name}.`,
      }));
    } catch (error) {
      setShare((prev) => ({
        ...prev,
        sendingToId: null,
        error:
          error instanceof Error
            ? error.message
            : 'Envoi du message impossible.',
      }));
    }
  };

  return (
    <Box sx={{ maxWidth: 520 }}>
      <TextField
        fullWidth
        label="Rechercher un son"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Daft Punk, Eminem, Orelsan..."
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#fff',
          },
          '& .MuiOutlinedInput-root.Mui-focused': {
            backgroundColor: '#fff',
          },
        }}
        InputProps={{
          endAdornment: state.loading ? <CircularProgress size={18} /> : null,
        }}
      />
      {state.results.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
          {state.error ? (
            <Box sx={{ p: 2 }}>
              <Typography color="error">{state.error}</Typography>
            </Box>
          ) : null}
          <List>
            {state.results.map((track, index) => {
              const albumId = track.album?.id;
              const albumHref = albumId ? `/album/${albumId}` : undefined;
              return (
                <ListItem
                  key={track.id ?? `${getPrimaryText(track)}-${index}`}
                  alignItems="flex-start"
                  sx={{ py: 1.5 }}
                  secondaryAction={
                    user && track.id ? (
                      <LikeButton track={createTrackData(track)} size="small" />
                    ) : null
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={track.album?.image ?? undefined}
                      alt={track.album?.name || track.name}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      albumHref ? (
                        <MuiLink
                          component={Link}
                          href={albumHref}
                          underline="hover"
                          color="inherit"
                          fontWeight={600}
                        >
                          {getPrimaryText(track)}
                        </MuiLink>
                      ) : (
                        getPrimaryText(track)
                      )
                    }
                    secondary={
                      <Stack spacing={1}>
                        {albumHref ? (
                          <Typography variant="body2" color="text.secondary">
                            <MuiLink
                              component={Link}
                              href={albumHref}
                              underline="hover"
                              color="inherit"
                            >
                              {getSecondaryText(track)}
                            </MuiLink>
                          </Typography>
                        ) : (
                          getSecondaryText(track)
                        )}

                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            disabled
                            sx={{ textTransform: 'none', borderRadius: 999 }}
                          >
                            Partager sur le feed
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={!user}
                            startIcon={<ForumRoundedIcon fontSize="small" />}
                            onClick={() => {
                              void handleOpenShareDialog(track);
                            }}
                            sx={{ textTransform: 'none', borderRadius: 999 }}
                          >
                            Envoyer en message
                          </Button>
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      )}
      <Dialog
        open={share.open}
        onClose={handleCloseShareDialog}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              maxHeight: 'calc(100dvh - 48px)',
              overscrollBehavior: 'contain',
            },
          },
        }}
      >
        <DialogTitle>Envoyer ce son en message</DialogTitle>
        <DialogContent sx={{ overscrollBehavior: 'contain' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {share.track ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  backgroundColor: '#f6f8ff',
                  borderColor: 'rgba(112, 130, 180, 0.25)',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    variant="rounded"
                    src={share.track.album?.image ?? undefined}
                    alt={share.track.album?.name || share.track.name}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>
                      {getPrimaryText(share.track)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {getSecondaryText(share.track)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ) : null}

            {share.error ? <Alert severity="error">{share.error}</Alert> : null}
            {share.success ? (
              <Alert severity="success">{share.success}</Alert>
            ) : null}

            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Vous pouvez envoyer ce son uniquement a vos suivis mutuels.
            </Typography>

            <TextField
              fullWidth
              label="Rechercher un contact"
              value={share.search}
              onChange={(event) =>
                setShare((prev) => ({
                  ...prev,
                  search: event.target.value,
                }))
              }
              placeholder="Nom, pseudo ou email"
            />

            {share.loadingContacts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredContacts.length > 0 ? (
              <List sx={{ py: 0 }}>
                {filteredContacts.map((profile) => (
                  <ListItem
                    key={profile.id}
                    disablePadding
                    secondaryAction={
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void handleSendTrackByMessage(profile)}
                        disabled={share.sendingToId === profile.id}
                      >
                        {share.sendingToId === profile.id
                          ? 'Envoi...'
                          : 'Envoyer'}
                      </Button>
                    }
                  >
                    <ListItemButton disabled={Boolean(share.sendingToId)}>
                      <ListItemAvatar>
                        <Avatar src={profile.avatarUrl || undefined}>
                          {profile.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={profile.name}
                        secondary={profile.email || profile.handle}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aucun contact compatible pour la messagerie privee.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseShareDialog}
            disabled={Boolean(share.sendingToId)}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
