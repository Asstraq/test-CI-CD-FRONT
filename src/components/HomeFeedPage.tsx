'use client';

import SearchInput from '@/app/homePage/SearchInput';
import FeedPost from '@/components/FeedPost';
import { me as getMe } from '@/lib/api/auth.api';
import { getFeed } from '@/lib/api/feed.api';
import { upsertReview } from '@/lib/api/reviews.api';
import {
  followUser,
  getMyFollowers,
  getMyFollowing,
  getUserFollowing,
  searchUsers,
  unfollowUser,
  type SocialProfile,
} from '@/lib/api/social.api';
import {
  searchSpotifyMedia,
  type MediaSearchResult,
} from '@/lib/api/spotify.api';
import { getToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import { buildProfileHref } from '@/lib/profile/profileHref';
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

type ProfileSearchState = {
  loading: boolean;
  error: string;
  results: SocialProfile[];
};

type SuggestedProfile = SocialProfile & {
  commonFollows: number;
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

const defaultProfileSearchState: ProfileSearchState = {
  loading: false,
  error: '',
  results: [],
};

function shuffleArray<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

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

function getFeedEntryKey(entry: FeedEntry) {
  if (typeof entry.share.reviewId === 'number') {
    return `review-${entry.share.reviewId}`;
  }

  const spotifyId =
    entry.share.shared.kind === 'ALBUM'
      ? (entry.share.shared.spotifyId ?? '')
      : '';
  const authorKey =
    entry.author.id || entry.author.email || entry.author.name.toLowerCase();

  return `${authorKey}-${spotifyId}-${entry.share.content.trim().toLowerCase()}`;
}

function mergeFeedEntries(prev: FeedEntry[], next: FeedEntry[]) {
  const merged = next.map((entry) => {
    const key = getFeedEntryKey(entry);
    const previous = prev.find(
      (candidate) => getFeedEntryKey(candidate) === key,
    );

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

  const seen = new Set(merged.map((entry) => getFeedEntryKey(entry)));

  for (const entry of prev) {
    const key = getFeedEntryKey(entry);
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
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearch, setUserSearch] = useState<ProfileSearchState>(
    defaultProfileSearchState,
  );
  const [following, setFollowing] = useState<SocialProfile[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

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
    if (!userSearchQuery.trim()) {
      setUserSearch(defaultProfileSearchState);
      return;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setUserSearch((prev) => ({ ...prev, loading: true, error: '' }));
      try {
        const results = await searchUsers(userSearchQuery.trim());
        if (!active) return;
        const currentId = user?.user.id ? String(user.user.id) : null;
        const currentEmail = user?.user.email ?? null;
        setUserSearch({
          loading: false,
          error: '',
          results: results.filter(
            (profile) =>
              profile.id &&
              String(profile.id) !== currentId &&
              profile.email !== currentEmail,
          ),
        });
      } catch (error) {
        if (!active) return;
        setUserSearch({
          loading: false,
          error:
            error instanceof Error ? error.message : 'Recherche impossible.',
          results: [],
        });
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [canAccessFeed, user?.user.email, user?.user.id, userSearchQuery]);

  useEffect(() => {
    let active = true;

    async function loadSocialData() {
      if (!canAccessFeed || !user?.user.id) {
        setFollowing([]);
        setSuggestions([]);
        setSocialError('');
        setSocialLoading(false);
        return;
      }

      setSocialLoading(true);
      setSocialError('');

      try {
        const currentUserId = String(user.user.id);
        const currentUserEmail = user.user.email;
        const [myFollowing, myFollowers] = await Promise.all([
          getMyFollowing(),
          getMyFollowers(),
        ]);
        if (!active) return;

        setFollowing(myFollowing);

        const candidateMap = new Map<string, SocialProfile>();
        [...myFollowers, ...feed.map((entry) => entry.author)].forEach(
          (profile) => {
            if (
              !profile.id ||
              String(profile.id) === currentUserId ||
              profile.email === currentUserEmail ||
              profile.id === 'unknown-author' ||
              profile.id === 'unknown-user'
            )
              return;
            if (myFollowing.some((followed) => followed.id === profile.id))
              return;
            candidateMap.set(profile.id, profile);
          },
        );

        const candidates = [...candidateMap.values()].slice(0, 8);
        const myFollowingIds = new Set(
          myFollowing.map((profile) => profile.id),
        );

        const suggestionEntries = await Promise.all(
          candidates.map(async (candidate) => {
            if (
              !candidate.id ||
              candidate.id === 'unknown-author' ||
              candidate.id === 'unknown-user'
            ) {
              return {
                ...candidate,
                commonFollows: 0,
              };
            }

            try {
              const candidateFollowing = await getUserFollowing(candidate.id);
              const commonFollows = candidateFollowing.filter((profile) =>
                myFollowingIds.has(profile.id),
              ).length;

              return {
                ...candidate,
                commonFollows,
              };
            } catch {
              return {
                ...candidate,
                commonFollows: 0,
              };
            }
          }),
        );

        let finalSuggestions = suggestionEntries;

        const hasCommonFollows = suggestionEntries.some(
          (entry) => entry.commonFollows > 0,
        );

        if (!hasCommonFollows || suggestionEntries.length < 5) {
          const fallbackQueries = shuffleArray(['a', 'e', 'i', 'o', 'u']).slice(
            0,
            3,
          );
          const fallbackUsers = (
            await Promise.all(
              fallbackQueries.map(async (query) => {
                try {
                  return await searchUsers(query);
                } catch {
                  return [];
                }
              }),
            )
          ).flat();

          const knownIds = new Set(
            finalSuggestions.map((profile) => profile.id),
          );
          const randomFallback = shuffleArray(fallbackUsers)
            .filter((profile) => {
              if (!profile.id || knownIds.has(profile.id)) return false;
              if (String(profile.id) === currentUserId) return false;
              if (profile.email === currentUserEmail) return false;
              if (myFollowing.some((followed) => followed.id === profile.id))
                return false;
              return true;
            })
            .slice(0, Math.max(0, 5 - finalSuggestions.length))
            .map((profile) => ({
              ...profile,
              commonFollows: 0,
            }));

          finalSuggestions = [...finalSuggestions, ...randomFallback];
        }

        if (!active) return;
        const dedupedSuggestions = [
          ...new Map(
            finalSuggestions.map((profile) => [profile.id, profile]),
          ).values(),
        ];
        setSuggestions(
          dedupedSuggestions
            .sort((a, b) => {
              if (b.commonFollows !== a.commonFollows) {
                return b.commonFollows - a.commonFollows;
              }
              return a.name.localeCompare(b.name);
            })
            .slice(0, 5),
        );
      } catch (error) {
        if (!active) return;
        setSocialError(
          error instanceof Error
            ? error.message
            : 'Impossible de charger les suggestions.',
        );
      } finally {
        if (active) setSocialLoading(false);
      }
    }

    void loadSocialData();

    return () => {
      active = false;
    };
  }, [canAccessFeed, feed, user?.user.email, user?.user.id]);

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

  const followingIds = useMemo(
    () => new Set(following.map((profile) => profile.id)),
    [following],
  );

  const handleToggleFollow = async (profile: SocialProfile) => {
    if (!canAccessFeed || followLoadingId) return;

    const isFollowing = followingIds.has(profile.id);
    setFollowLoadingId(profile.id);
    setSocialError('');

    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
        setFollowing((prev) => prev.filter((entry) => entry.id !== profile.id));
      } else {
        await followUser(profile.id);
        setFollowing((prev) => [...prev, profile]);
      }
    } catch (error) {
      setSocialError(
        error instanceof Error
          ? error.message
          : 'Action sociale impossible pour le moment.',
      );
    } finally {
      setFollowLoadingId(null);
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

  const getProfileHref = (profile: SocialProfile) => buildProfileHref(profile);

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
                <Stack spacing={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                      Rechercher un profil
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#62708b' }}>
                      Nom, prenom ou adresse mail.
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Trouver un utilisateur"
                    value={userSearchQuery}
                    onChange={(event) => setUserSearchQuery(event.target.value)}
                    placeholder="jane@music.dev, Martin, Sarah..."
                    InputProps={{
                      endAdornment: userSearch.loading ? (
                        <CircularProgress size={18} />
                      ) : null,
                    }}
                  />
                  {userSearch.error ? (
                    <Alert severity="error">{userSearch.error}</Alert>
                  ) : null}
                  {userSearch.results.length > 0 ? (
                    <Stack spacing={1}>
                      {userSearch.results.slice(0, 5).map((profile) => {
                        const profileHref = getProfileHref(profile);

                        return (
                          <Paper
                            key={`search-${profile.id}`}
                            variant="outlined"
                            sx={{ p: 1.25, borderRadius: 2 }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.25}
                              alignItems="center"
                            >
                              {profileHref ? (
                                <Link
                                  href={profileHref}
                                  style={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Avatar src={profile.avatarUrl || undefined}>
                                    {profile.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                </Link>
                              ) : (
                                <Avatar src={profile.avatarUrl || undefined}>
                                  {profile.name.charAt(0).toUpperCase()}
                                </Avatar>
                              )}
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                {profileHref ? (
                                  <Typography
                                    component={Link}
                                    href={profileHref}
                                    sx={{
                                      fontWeight: 700,
                                      color: '#1a1d24',
                                      textDecoration: 'none',
                                      display: 'block',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                      },
                                    }}
                                    noWrap
                                  >
                                    {profile.name}
                                  </Typography>
                                ) : (
                                  <Typography sx={{ fontWeight: 700 }} noWrap>
                                    {profile.name}
                                  </Typography>
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#62708b' }}
                                  noWrap
                                >
                                  {profile.email || profile.handle}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant={
                                  followingIds.has(profile.id)
                                    ? 'outlined'
                                    : 'contained'
                                }
                                onClick={() => void handleToggleFollow(profile)}
                                disabled={followLoadingId === profile.id}
                              >
                                {followLoadingId === profile.id
                                  ? '...'
                                  : followingIds.has(profile.id)
                                    ? 'Suivi'
                                    : 'Suivre'}
                              </Button>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  ) : null}

                  <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                    Suggestions de profils
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#62708b' }}>
                    Les profils avec le plus d&apos;abonnements en commun
                    remontent en premier.
                  </Typography>
                  {socialError ? (
                    <Alert severity="error">{socialError}</Alert>
                  ) : null}
                  {socialLoading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography variant="body2">
                        Chargement des suggestions...
                      </Typography>
                    </Stack>
                  ) : suggestions.length > 0 ? (
                    <Stack spacing={1}>
                      {suggestions.map((profile) => {
                        const profileHref = getProfileHref(profile);

                        return (
                          <Paper
                            key={`suggestion-${profile.id}`}
                            variant="outlined"
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              borderColor:
                                profile.commonFollows > 0
                                  ? 'rgba(37, 99, 235, 0.35)'
                                  : 'rgba(112, 130, 180, 0.2)',
                              background:
                                profile.commonFollows > 0
                                  ? 'linear-gradient(180deg, rgba(230,239,255,0.7) 0%, rgba(255,255,255,0.95) 100%)'
                                  : 'rgba(255,255,255,0.95)',
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1.25}
                              alignItems="center"
                            >
                              {profileHref ? (
                                <Link
                                  href={profileHref}
                                  style={{
                                    color: 'inherit',
                                    textDecoration: 'none',
                                  }}
                                >
                                  <Avatar src={profile.avatarUrl || undefined}>
                                    {profile.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                </Link>
                              ) : (
                                <Avatar src={profile.avatarUrl || undefined}>
                                  {profile.name.charAt(0).toUpperCase()}
                                </Avatar>
                              )}
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                {profileHref ? (
                                  <Typography
                                    component={Link}
                                    href={profileHref}
                                    sx={{
                                      fontWeight: 700,
                                      color: '#1a1d24',
                                      textDecoration: 'none',
                                      display: 'block',
                                      '&:hover': {
                                        textDecoration: 'underline',
                                      },
                                    }}
                                    noWrap
                                  >
                                    {profile.name}
                                  </Typography>
                                ) : (
                                  <Typography sx={{ fontWeight: 700 }} noWrap>
                                    {profile.name}
                                  </Typography>
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#62708b' }}
                                  noWrap
                                >
                                  {profile.handle}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#48607f' }}
                                >
                                  {profile.commonFollows > 0
                                    ? `${profile.commonFollows} follow(s) en commun`
                                    : 'Suggestion du reseau'}
                                </Typography>
                              </Box>
                              <Button
                                size="small"
                                variant={
                                  followingIds.has(profile.id)
                                    ? 'outlined'
                                    : 'contained'
                                }
                                onClick={() => void handleToggleFollow(profile)}
                                disabled={followLoadingId === profile.id}
                              >
                                {followLoadingId === profile.id
                                  ? '...'
                                  : followingIds.has(profile.id)
                                    ? 'Suivi'
                                    : 'Suivre'}
                              </Button>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#62708b' }}>
                      Aucune suggestion disponible pour le moment.
                    </Typography>
                  )}

                  <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                    Recherche rapide
                  </Typography>
                  <SearchInput />
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
