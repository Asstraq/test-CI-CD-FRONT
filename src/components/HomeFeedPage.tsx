'use client';

import FeedPost from '@/components/FeedPost';
import { me as getMe } from '@/lib/api/auth.api';
import { getFeed } from '@/lib/api/feed.api';
import { upsertReview } from '@/lib/api/reviews.api';
import {
  searchSpotifyMedia,
  type MediaSearchResult,
} from '@/lib/api/spotify.api';
import { getToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import type { FeedEntry } from '@/type/feed';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Rating,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ComposerState = {
  query: string;
  selected: MediaSearchResult | null;
  content: string;
  rating: number | null;
  containsSpoilers: boolean;
};

type SearchState = {
  loading: boolean;
  error: string;
  results: MediaSearchResult[];
};

const defaultComposerState: ComposerState = {
  query: '',
  selected: null,
  content: '',
  rating: null,
  containsSpoilers: false,
};

const defaultSearchState: SearchState = {
  loading: false,
  error: '',
  results: [],
};

function isComposerValid(state: ComposerState) {
  return Boolean(state.selected?.spotifyId && state.content.trim());
}

function getAuthorName(
  user: NonNullable<ReturnType<typeof useUserSession>['user']>,
) {
  return (
    user.user.nom?.trim() || user.user.email.split('@')[0] || 'Utilisateur'
  );
}

function buildOptimisticEntry(
  currentUser: NonNullable<ReturnType<typeof useUserSession>['user']>,
  selected: MediaSearchResult,
  content: string,
  rating: number | null,
): FeedEntry {
  const authorName = getAuthorName(currentUser);

  return {
    author: {
      id: currentUser.user.id ?? currentUser.user.email,
      email: currentUser.user.email,
      name: authorName,
      handle: `@${authorName.replace(/\s+/g, '').toLowerCase()}`,
      avatarUrl: currentUser.user.avatarUrl?.toString() ?? '',
    },
    share: {
      id: `optimistic-${selected.spotifyId}-${Date.now()}`,
      reviewId: undefined,
      authorId: currentUser.user.id ?? currentUser.user.email,
      visibility: 'PUBLIC',
      content,
      createdAt: new Date().toISOString(),
      rating: rating ?? 0,
      likes: 0,
      comments: 0,
      shared: {
        kind: 'ALBUM',
        spotifyId: selected.spotifyId,
        title: selected.title,
        artist: selected.artist ?? 'Artiste inconnu',
        year: selected.year,
        imageUrl: selected.imageUrl,
      },
    },
  };
}

function mergeFeedEntries(prev: FeedEntry[], next: FeedEntry[]) {
  const merged = next.map((entry) => {
    const spotifyId =
      entry.share.shared.kind === 'ALBUM' ? entry.share.shared.spotifyId : '';
    const key = `${entry.author.id}-${spotifyId}-${entry.share.content.trim()}`;
    const previous = prev.find((candidate) => {
      const candidateSpotifyId =
        candidate.share.shared.kind === 'ALBUM'
          ? candidate.share.shared.spotifyId
          : '';
      return (
        `${candidate.author.id}-${candidateSpotifyId}-${candidate.share.content.trim()}` ===
        key
      );
    });

    if (
      previous?.share.shared.kind === 'ALBUM' &&
      entry.share.shared.kind === 'ALBUM'
    ) {
      return {
        ...entry,
        share: {
          ...entry.share,
          shared: {
            ...entry.share.shared,
            artist:
              entry.share.shared.artist === 'Artiste inconnu'
                ? previous.share.shared.artist
                : entry.share.shared.artist,
          },
        },
      };
    }

    return entry;
  });

  const seen = new Set(
    merged.map((entry) => {
      const spotifyId =
        entry.share.shared.kind === 'ALBUM' ? entry.share.shared.spotifyId : '';
      return `${entry.author.id}-${spotifyId}-${entry.share.content.trim()}`;
    }),
  );

  for (const entry of prev) {
    const spotifyId =
      entry.share.shared.kind === 'ALBUM' ? entry.share.shared.spotifyId : '';
    const key = `${entry.author.id}-${spotifyId}-${entry.share.content.trim()}`;
    if (!seen.has(key)) merged.push(entry);
  }

  return merged.sort(
    (a, b) => +new Date(b.share.createdAt) - +new Date(a.share.createdAt),
  );
}

export default function HomeFeedPage() {
  const { user, setUser } = useUserSession();
  const hasToken = Boolean(getToken());
  const canAccessFeed = hasToken;
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [form, setForm] = useState<ComposerState>(defaultComposerState);
  const [searchState, setSearchState] =
    useState<SearchState>(defaultSearchState);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      if (!hasToken || user) return;

      setSessionLoading(true);
      try {
        const response = await getMe();
        if (!active) return;
        const nextUser = 'user' in response ? response.user : response;
        setUser({ user: nextUser });
      } catch {
        if (!active) return;
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, [hasToken, setUser, user]);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      if (!canAccessFeed) {
        setFeed([]);
        setFeedError('');
        setFeedLoading(false);
        return;
      }

      setFeedLoading(true);
      setFeedError('');

      try {
        const nextFeed = await getFeed();
        if (!active) return;
        setFeed((prev) => mergeFeedEntries(prev, nextFeed));
      } catch (error) {
        if (!active) return;
        setFeedError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger le feed.',
        );
      } finally {
        if (active) setFeedLoading(false);
      }
    }

    void loadFeed();

    return () => {
      active = false;
    };
  }, [canAccessFeed]);

  useEffect(() => {
    if (!canAccessFeed) return;
    if (form.selected && form.query.trim() === form.selected.title.trim()) {
      setSearchState(defaultSearchState);
      return;
    }

    if (!form.query.trim()) {
      setSearchState(defaultSearchState);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearchState((prev) => ({ ...prev, loading: true, error: '' }));

      try {
        const results = await searchSpotifyMedia(form.query, 'ALBUM');
        if (!active) return;
        setSearchState({ loading: false, error: '', results });
      } catch (error) {
        if (!active) return;
        setSearchState({
          loading: false,
          error:
            error instanceof Error ? error.message : 'Recherche impossible.',
          results: [],
        });
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [form.query, form.selected, canAccessFeed]);

  const selectedSummary = useMemo(() => {
    if (!form.selected) return null;

    return {
      title: form.selected.title,
      subtitle:
        form.selected.subtitle ||
        form.selected.artist ||
        form.selected.album ||
        '',
    };
  }, [form.selected]);

  const refreshFeed = async () => {
    if (!canAccessFeed) return;

    setFeedLoading(true);
    setFeedError('');

    try {
      const nextFeed = await getFeed();
      setFeed((prev) => mergeFeedEntries(prev, nextFeed));
    } catch (error) {
      setFeedError(
        error instanceof Error
          ? error.message
          : 'Impossible de rafraichir le feed.',
      );
    } finally {
      setFeedLoading(false);
    }
  };

  const handleSelectResult = (result: MediaSearchResult) => {
    setForm((prev) => ({
      ...prev,
      selected: result,
      query: result.title,
    }));
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitSuccess('');

    if (!user) {
      setSubmitError('Vous devez etre connecte pour partager un media.');
      return;
    }

    if (!hasToken) {
      setSubmitError(
        'Votre session n a pas de token valide. Reconnectez-vous avant de partager.',
      );
      return;
    }

    if (!form.selected?.spotifyId) {
      setSubmitError('Selectionnez un media a partager.');
      return;
    }

    if (!form.content.trim()) {
      setSubmitError('Ajoutez un message a votre partage.');
      return;
    }

    setSubmitting(true);

    try {
      await upsertReview('ALBUM', form.selected.spotifyId, {
        content: form.content.trim(),
        rating: form.rating,
        containsSpoilers: form.containsSpoilers,
      });

      const optimisticEntry = buildOptimisticEntry(
        user,
        form.selected,
        form.content.trim(),
        form.rating,
      );
      setFeed((prev) => mergeFeedEntries(prev, [optimisticEntry]));
      setForm(defaultComposerState);
      setSearchState(defaultSearchState);
      setSubmitSuccess('Partage publie dans le feed.');
      await refreshFeed();
    } catch (error) {
      setSubmitError(
        error instanceof Error && /401/.test(error.message)
          ? 'Session expiree ou token invalide. Reconnectez-vous puis recommencez.'
          : error instanceof Error
            ? error.message
            : 'Publication impossible.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 4, md: 6 },
        background:
          'radial-gradient(circle at 0% 0%, #fcefd8 0, transparent 45%), radial-gradient(circle at 100% 0%, #dce9ff 0, transparent 40%), linear-gradient(165deg, #f4f5f8 0%, #e8edf8 100%)',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid rgba(45, 66, 120, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Stack spacing={1.5}>
              <Typography
                variant="overline"
                letterSpacing={1.4}
                sx={{ color: '#5a6b7a' }}
              >
                Feed SoundBook
              </Typography>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: '#1a1d24' }}
              >
                {canAccessFeed
                  ? 'Partages de votre reseau'
                  : 'Connectez-vous pour partager'}
              </Typography>
              <Typography sx={{ color: '#4a5568' }}>
                {canAccessFeed
                  ? 'Le partage du feed principal est limite aux albums. Chaque publication cree une review album qui remonte ensuite dans le feed social.'
                  : 'Le backend expose le feed uniquement pour un utilisateur authentifie. Connectez-vous pour publier et consulter les partages de votre reseau.'}
              </Typography>
              {!canAccessFeed ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button component={Link} href="/auth" variant="contained">
                    Se connecter
                  </Button>
                  <Button component={Link} href="/auth" variant="outlined">
                    Creer un compte
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          </Paper>

          {!canAccessFeed ? (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              Le systeme de partage du feed principal est reserve aux
              utilisateurs connectes.
            </Alert>
          ) : (
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              alignItems="flex-start"
            >
              <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: 3,
                    border: '1px solid rgba(60, 78, 142, 0.16)',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                  }}
                >
                  <Stack spacing={2}>
                    <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                      Nouveau partage d&apos;album
                    </Typography>

                    <TextField
                      fullWidth
                      label="Rechercher un album"
                      value={form.query}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          query: event.target.value,
                          selected:
                            prev.selected?.title === event.target.value
                              ? prev.selected
                              : null,
                        }))
                      }
                      placeholder="Currents, Blonde, Discovery..."
                      InputProps={{
                        endAdornment: searchState.loading ? (
                          <CircularProgress size={18} />
                        ) : null,
                      }}
                    />

                    {searchState.error ? (
                      <Alert severity="error">{searchState.error}</Alert>
                    ) : null}

                    {searchState.results.length > 0 ? (
                      <Paper variant="outlined" sx={{ borderRadius: 2.5 }}>
                        <List disablePadding>
                          {searchState.results.map((result) => (
                            <ListItemButton
                              key={`${result.kind}-${result.spotifyId}`}
                              onClick={() => {
                                handleSelectResult(result);
                                setSearchState(defaultSearchState);
                              }}
                              selected={
                                form.selected?.spotifyId === result.spotifyId
                              }
                              sx={{ py: 1.25 }}
                            >
                              <ListItemAvatar>
                                <Avatar
                                  variant="rounded"
                                  src={result.imageUrl}
                                  alt={result.title}
                                />
                              </ListItemAvatar>
                              <ListItemText
                                primary={result.title}
                                secondary={result.subtitle || ' '}
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Paper>
                    ) : null}

                    {selectedSummary ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          backgroundColor: '#f6f8ff',
                          borderColor: 'rgba(112, 130, 180, 0.25)',
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Avatar
                            variant="rounded"
                            src={form.selected?.imageUrl}
                            alt={selectedSummary.title}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700 }} noWrap>
                              {selectedSummary.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {selectedSummary.subtitle}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    ) : null}

                    <TextField
                      fullWidth
                      label="Votre message"
                      value={form.content}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          content: event.target.value,
                        }))
                      }
                      multiline
                      minRows={3}
                    />

                    <Box>
                      <Typography gutterBottom sx={{ color: '#4f5f7b' }}>
                        Note optionnelle
                      </Typography>
                      <Rating
                        value={form.rating}
                        max={5}
                        onChange={(_, value) =>
                          setForm((prev) => ({
                            ...prev,
                            rating: value,
                          }))
                        }
                        precision={1}
                      />
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Switch
                        checked={form.containsSpoilers}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            containsSpoilers: event.target.checked,
                          }))
                        }
                      />
                      <Typography variant="body2" sx={{ color: '#4f5f7b' }}>
                        Contient des spoilers
                      </Typography>
                    </Stack>

                    {submitError ? (
                      <Alert severity="error">{submitError}</Alert>
                    ) : null}
                    {submitSuccess ? (
                      <Alert severity="success">{submitSuccess}</Alert>
                    ) : null}

                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={!isComposerValid(form) || submitting}
                    >
                      {submitting ? 'Publication...' : 'Partager dans le feed'}
                    </Button>
                  </Stack>
                </Paper>

                {feedError ? <Alert severity="error">{feedError}</Alert> : null}

                {feedLoading || sessionLoading ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: '1px solid rgba(40, 52, 82, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CircularProgress size={22} />
                      <Typography>
                        {sessionLoading
                          ? 'Initialisation de la session...'
                          : 'Chargement du feed...'}
                      </Typography>
                    </Stack>
                  </Paper>
                ) : feed.length > 0 ? (
                  feed.map((entry) => (
                    <FeedPost
                      key={entry.share.id}
                      share={entry.share}
                      author={entry.author}
                    />
                  ))
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      border: '1px solid rgba(40, 52, 82, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: '#1b2130' }}>
                      Aucun partage pour le moment
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#5c6780', mt: 1 }}
                    >
                      Aucun post n est encore disponible dans le feed.
                    </Typography>
                  </Paper>
                )}
              </Stack>

              <Paper
                elevation={0}
                sx={{
                  width: { xs: '100%', lg: 360 },
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid rgba(45, 66, 120, 0.1)',
                  backgroundColor: 'rgba(255,255,255,0.85)',
                }}
              >
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                    Activite du feed
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#62708b' }}>
                    Les interactions de likes et commentaires passent
                    directement par les posts affiches ci-contre.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#62708b' }}>
                    Le composeur d&apos;album se trouve au-dessus du feed.
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
