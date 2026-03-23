'use client';

import * as AuthAPI from '@/lib/api/auth.api';
import * as PlaylistAPI from '@/lib/api/playlist.api';
import { buildProfileHref } from '@/lib/profile/profileHref';
import {
  followUser,
  getMyFollowers,
  getMyFollowing,
  type SocialProfile,
} from '@/lib/api/social.api';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserSession } from '@/lib/auth/userSession';
import type { Playlist, PlaylistVisibility } from '@/type/playlist';
import type { UpdateProfilePayload, User } from '@/type/user';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function getFollowerStorageKey(userId: string) {
  return `profile_known_followers_${userId}`;
}

function readKnownFollowers(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getFollowerStorageKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function writeKnownFollowers(userId: string, followerIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    getFollowerStorageKey(userId),
    JSON.stringify(followerIds),
  );
}

type ProfileFormState = {
  nom: string;
  prenom: string;
  pseudo: string;
  email: string;
  bio: string;
  isProfilePublic: boolean;
  displayColor: string;
  theme: string;
};

const THEME_COLOR_PRESETS = [
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
  '#22c55e',
  '#eab308',
];

const dialogPaperSx = {
  maxHeight: 'calc(100dvh - 48px)',
  overscrollBehavior: 'contain',
};

const dialogContentSx = {
  overscrollBehavior: 'contain',
};

function buildProfileFormState(user?: User | null): ProfileFormState {
  return {
    nom: user?.nom ?? '',
    prenom: user?.prenom ?? '',
    pseudo: user?.pseudo ?? '',
    email: user?.email ?? '',
    bio: user?.bio ?? '',
    isProfilePublic: user?.isProfilePublic ?? true,
    displayColor: user?.displayColor ?? '',
    theme: user?.theme ?? 'LIGHT',
  };
}

function getProfileDisplayName(user?: User | null) {
  const fullName = [user?.prenom?.trim(), user?.nom?.trim()]
    .filter(Boolean)
    .join(' ');

  if (fullName) return fullName;
  if (user?.pseudo?.trim()) return user.pseudo.trim();
  if (user?.name?.trim()) return user.name.trim();
  if (user?.email?.trim()) return user.email.trim();
  return 'Mon profil';
}

export default function ProfilePage() {
  const { user: userObject, setUser } = useUserSession();
  const user = userObject?.user;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const {
    favoritesPlaylist,
    loading: favoritesLoading,
    refreshFavorites,
  } = useFavorites();
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
  const [playlistActionId, setPlaylistActionId] = useState<string | null>(null);
  const [playlistError, setPlaylistError] = useState('');
  const [following, setFollowing] = useState<SocialProfile[]>([]);
  const [followers, setFollowers] = useState<SocialProfile[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [socialActionId, setSocialActionId] = useState<string | null>(null);
  const [newFollowers, setNewFollowers] = useState<SocialProfile[]>([]);
  const [newFollowersOpen, setNewFollowersOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() =>
    buildProfileFormState(user),
  );
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const favoritesId = favoritesPlaylist?.id ?? null;
  const isFavoritesSelected =
    selectedId !== null && favoritesId !== null && selectedId === favoritesId;
  const profileDisplayName = useMemo(() => getProfileDisplayName(user), [user]);
  const profileInitial = profileDisplayName.charAt(0).toUpperCase() || 'U';
  const editorAvatarSrc = avatarRemoved
    ? null
    : (avatarPreviewUrl ?? user?.avatarUrl ?? null);
  const canRemoveAvatar = Boolean(
    selectedAvatarFile || (!avatarRemoved && user?.avatarUrl),
  );
  const editorAccentColor =
    profileForm.displayColor || user?.displayColor || '#f97316';

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
      setSelectedPlaylist((prev) => prev ?? lists[0] ?? null);

      const defaultId =
        lists.find((list) => list.id === favoritesId)?.id ??
        lists[0]?.id ??
        null;
      setSelectedId((prev) => prev ?? defaultId);
    } finally {
      setListsLoading(false);
    }
  }, [favoritesId]);

  const loadPlaylistById = useCallback(
    async (playlistId: string) => {
      const localPlaylist =
        playlists.find((playlist) => playlist.id === playlistId) ?? null;

      if (localPlaylist) {
        setSelectedPlaylist(localPlaylist);
      }

      try {
        setPlaylistLoading(true);
        const list = await PlaylistAPI.getPlaylistById(playlistId);
        setSelectedPlaylist({
          ...localPlaylist,
          ...list,
          visibility: list.visibility ?? localPlaylist?.visibility,
        });
      } catch {
        setSelectedPlaylist(localPlaylist);
      } finally {
        setPlaylistLoading(false);
      }
    },
    [playlists],
  );

  useEffect(() => {
    if (!user) return;
    void loadPlaylists();
  }, [loadPlaylists, user]);

  useEffect(() => {
    setProfileForm(buildProfileFormState(user));
  }, [user]);

  useEffect(() => {
    if (!selectedAvatarFile) {
      setAvatarPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedAvatarFile);
    setAvatarPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedAvatarFile]);

  const loadSocialGraph = useCallback(async () => {
    if (!user?.id) return;

    try {
      setSocialLoading(true);
      setSocialError('');

      const [myFollowing, myFollowers] = await Promise.all([
        getMyFollowing(),
        getMyFollowers(),
      ]);

      setFollowing(myFollowing);
      setFollowers(myFollowers);

      const knownFollowerIds = new Set(readKnownFollowers(user.id));
      const unseenFollowers = myFollowers.filter(
        (profile) => !knownFollowerIds.has(profile.id),
      );

      if (unseenFollowers.length > 0) {
        setNewFollowers(unseenFollowers);
        setNewFollowersOpen(true);
      }

      writeKnownFollowers(
        user.id,
        myFollowers.map((profile) => profile.id),
      );
    } catch (error) {
      setSocialError(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les relations sociales.',
      );
    } finally {
      setSocialLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void loadSocialGraph();
  }, [loadSocialGraph, user?.id]);

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

  const followingIds = useMemo(
    () => new Set(following.map((profile) => profile.id)),
    [following],
  );

  const handleFollowBack = async (profile: SocialProfile) => {
    try {
      setSocialActionId(profile.id);
      await followUser(profile.id);
      await loadSocialGraph();
    } finally {
      setSocialActionId(null);
    }
  };

  const applyUpdatedPlaylist = useCallback((updated: Playlist) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === updated.id ? { ...playlist, ...updated } : playlist,
      ),
    );
    setSelectedPlaylist((prev) =>
      prev?.id === updated.id ? { ...prev, ...updated } : prev,
    );
  }, []);

  const handleUpdatePlaylistVisibility = async (
    playlist: Playlist,
    visibility: PlaylistVisibility,
  ) => {
    if (!playlist.id || playlistActionId) return;

    setPlaylistActionId(playlist.id);
    setPlaylistError('');

    try {
      const updated = await PlaylistAPI.updatePlaylist(playlist.id, {
        visibility,
      });
      applyUpdatedPlaylist({
        ...playlist,
        ...updated,
        visibility: updated.visibility ?? visibility,
      });
      if (favoritesId && playlist.id === favoritesId) {
        await refreshFavorites();
      }
    } catch (error) {
      setPlaylistError(
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour la visibilite de la playlist.',
      );
    } finally {
      setPlaylistActionId(null);
    }
  };

  const selectedPlaylistVisibility =
    (playlists.find((playlist) => playlist.id === selectedId)?.visibility ??
      displayedPlaylist?.visibility) === 'PUBLIC'
      ? 'PUBLIC'
      : 'PRIVATE';

  const selectedPlaylistForSettings =
    playlists.find((playlist) => playlist.id === selectedId) ??
    displayedPlaylist;

  const renderLinkedProfileName = (profile: SocialProfile) => {
    const href = buildProfileHref(profile);

    if (!href) return profile.name;

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
        {profile.name}
      </Typography>
    );
  };

  const handleProfileFieldChange =
    (field: keyof Omit<ProfileFormState, 'isProfilePublic'>) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setProfileForm((prev) => ({ ...prev, [field]: value }));
      setProfileError('');
      setProfileSuccess('');
    };

  const handleProfileVisibilityChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setProfileForm((prev) => ({
      ...prev,
      isProfilePublic: event.target.checked,
    }));
    setProfileError('');
    setProfileSuccess('');
  };

  const handleResetProfileForm = () => {
    setProfileForm(buildProfileFormState(user));
    setSelectedAvatarFile(null);
    setAvatarRemoved(false);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleOpenProfileEditor = () => {
    setProfileForm(buildProfileFormState(user));
    setSelectedAvatarFile(null);
    setAvatarRemoved(false);
    setProfileError('');
    setProfileSuccess('');
    setProfileEditorOpen(true);
  };

  const handleCloseProfileEditor = () => {
    if (profileSaving) return;
    setSelectedAvatarFile(null);
    setAvatarRemoved(false);
    setProfileError('');
    setProfileEditorOpen(false);
  };

  const handleSelectAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Le fichier selectionne doit etre une image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image trop volumineuse. Taille maximale: 5 Mo.');
      return;
    }

    setSelectedAvatarFile(file);
    setAvatarRemoved(false);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatarFile(null);
    setAvatarRemoved(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSelectThemeColor = (color: string) => {
    setProfileForm((prev) => ({ ...prev, displayColor: color }));
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    let nextAvatarUrl: string | null | undefined;

    try {
      if (selectedAvatarFile) {
        const upload = await AuthAPI.uploadProfileAvatar(selectedAvatarFile);
        nextAvatarUrl = upload.url;
      } else if (avatarRemoved) {
        nextAvatarUrl = null;
      }

      const payload: UpdateProfilePayload = {
        nom: profileForm.nom.trim() || undefined,
        prenom: profileForm.prenom.trim() || undefined,
        pseudo: profileForm.pseudo.trim() || undefined,
        email: profileForm.email.trim() || undefined,
        bio: profileForm.bio.trim() || undefined,
        isProfilePublic: profileForm.isProfilePublic,
        displayColor: profileForm.displayColor.trim() || undefined,
        theme: profileForm.theme.trim() || undefined,
      };

      if (nextAvatarUrl !== undefined) {
        payload.avatarUrl = nextAvatarUrl;
      }

      const response = await AuthAPI.updateProfile(payload);
      const updatedUser = 'user' in response ? response.user : response;

      setUser({ user: updatedUser });
      setProfileForm(buildProfileFormState(updatedUser));
      setSelectedAvatarFile(null);
      setAvatarRemoved(false);
      setProfileEditorOpen(false);
      setProfileSuccess('Profil mis a jour.');
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour le profil.',
      );
    } finally {
      setProfileSaving(false);
    }
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
              direction={{ xs: 'column', lg: 'row' }}
              spacing={3}
              alignItems={{ xs: 'center', lg: 'flex-start' }}
              justifyContent="space-between"
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                alignItems="center"
                sx={{ flex: 1 }}
              >
                <Avatar
                  alt={profileDisplayName}
                  src={user?.avatarUrl || undefined}
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: user?.displayColor || '#c9d3e3',
                    fontSize: 32,
                  }}
                >
                  {profileInitial}
                </Avatar>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 600, color: '#1a1d24' }}
                  >
                    {profileDisplayName}
                  </Typography>
                  <Typography sx={{ color: '#4a5568', mt: 1 }}>
                    {user?.pseudo?.trim()
                      ? `@${user.pseudo.replace(/^@/, '')}`
                      : user?.email || 'Ajoutez vos informations de profil.'}
                  </Typography>
                  <Typography sx={{ color: '#64748b', mt: 1 }}>
                    {user?.bio?.trim() ||
                      'Ajoutez une bio pour completer votre profil.'}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent={{ xs: 'center', sm: 'flex-start' }}
                    sx={{ mt: 2, flexWrap: 'wrap' }}
                  >
                    <Chip
                      size="small"
                      label={
                        user?.isProfilePublic === false
                          ? 'Profil prive'
                          : 'Profil public'
                      }
                    />
                    {user?.theme ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Theme ${user.theme}`}
                      />
                    ) : null}
                  </Stack>
                </Box>
              </Stack>

              <Paper
                variant="outlined"
                sx={{
                  width: { xs: '100%', lg: 240 },
                  p: 2,
                  borderRadius: 3,
                  bgcolor: 'rgba(248, 249, 255, 0.92)',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#1a1d24' }}
                >
                  Apercu du profil
                </Typography>
                <Stack spacing={1} sx={{ mt: 1.5 }}>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Email
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: '#1a1d24' }}>
                    {user?.email || 'Non renseigne'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Couleur d&apos;affichage
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '1px solid rgba(15, 23, 42, 0.16)',
                        bgcolor: user?.displayColor || '#cbd5e1',
                      }}
                    />
                    <Typography sx={{ color: '#1a1d24' }}>
                      {user?.displayColor || 'Defaut'}
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={handleOpenProfileEditor}
                    sx={{ mt: 1.5, borderRadius: 2 }}
                  >
                    Modifier le profil
                  </Button>
                </Stack>
              </Paper>
            </Stack>

            {profileSuccess ? (
              <Alert severity="success">{profileSuccess}</Alert>
            ) : null}

            <Divider />

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
                <Stack spacing={1.5}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: '#1a1d24' }}
                  >
                    Personnes que je follow
                  </Typography>

                  {socialError ? (
                    <Alert severity="error">{socialError}</Alert>
                  ) : null}

                  {socialLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : following.length > 0 ? (
                    <List sx={{ py: 0 }}>
                      {following.map((profile) => {
                        const followsBack = followers.some(
                          (entry) => entry.id === profile.id,
                        );
                        const profileHref = buildProfileHref(profile);

                        return (
                          <ListItem
                            key={`following-${profile.id}`}
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
                                  <Avatar src={profile.avatarUrl || undefined}>
                                    {profile.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                </Link>
                              ) : (
                                <Avatar src={profile.avatarUrl || undefined}>
                                  {profile.name.charAt(0).toUpperCase()}
                                </Avatar>
                              )}
                            </ListItemAvatar>
                            <ListItemText
                              primary={renderLinkedProfileName(profile)}
                              secondary={profile.email || profile.handle}
                            />
                            {followsBack ? (
                              <Chip label="Vous suit aussi" size="small" />
                            ) : (
                              <Chip
                                label="Suivi simple"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Vous ne suivez encore personne.
                    </Typography>
                  )}
                </Stack>
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
                <Stack spacing={1.5}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: '#1a1d24' }}
                  >
                    Personnes qui me follow
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Suppression d&apos;un follower indisponible pour
                    l&apos;instant: le backend n&apos;expose pas encore
                    d&apos;endpoint dedie.
                  </Typography>

                  {socialLoading ? (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', p: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : followers.length > 0 ? (
                    <List sx={{ py: 0 }}>
                      {followers.map((profile) => {
                        const isMutual = followingIds.has(profile.id);
                        const profileHref = buildProfileHref(profile);

                        return (
                          <ListItem
                            key={`follower-${profile.id}`}
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
                                  <Avatar src={profile.avatarUrl || undefined}>
                                    {profile.name.charAt(0).toUpperCase()}
                                  </Avatar>
                                </Link>
                              ) : (
                                <Avatar src={profile.avatarUrl || undefined}>
                                  {profile.name.charAt(0).toUpperCase()}
                                </Avatar>
                              )}
                            </ListItemAvatar>
                            <ListItemText
                              primary={renderLinkedProfileName(profile)}
                              secondary={profile.email || profile.handle}
                            />
                            {isMutual ? (
                              <Chip label="Suivi mutuel" size="small" />
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => void handleFollowBack(profile)}
                                disabled={socialActionId === profile.id}
                              >
                                {socialActionId === profile.id
                                  ? '...'
                                  : 'Suivre en retour'}
                              </Button>
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucun follower pour le moment.
                    </Typography>
                  )}
                </Stack>
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
                              <Stack spacing={0.25}>
                                {playlist.description ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {playlist.description}
                                  </Typography>
                                ) : null}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
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
                            void handleUpdatePlaylistVisibility(
                              selectedPlaylistForSettings,
                              'PRIVATE',
                            )
                          }
                          disabled={
                            playlistActionId ===
                              selectedPlaylistForSettings.id ||
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
                            void handleUpdatePlaylistVisibility(
                              selectedPlaylistForSettings,
                              'PUBLIC',
                            )
                          }
                          disabled={
                            playlistActionId ===
                              selectedPlaylistForSettings.id ||
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
        open={profileEditorOpen}
        onClose={handleCloseProfileEditor}
        scroll="paper"
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle>Modifier mon profil</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Les changements sont envoyes sur `PATCH /auth/profile` puis
              repercutes dans la session du front.
            </Typography>

            {profileError ? (
              <Alert severity="error">{profileError}</Alert>
            ) : null}

            <Stack spacing={1.5} alignItems="center">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarFileChange}
              />
              <Avatar
                src={editorAvatarSrc || undefined}
                sx={{
                  width: 112,
                  height: 112,
                  bgcolor: editorAccentColor,
                  fontSize: 36,
                }}
              >
                {profileInitial}
              </Avatar>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={handleSelectAvatarClick}
                  disabled={profileSaving}
                >
                  Choisir une photo
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRemoveAvatar}
                  disabled={profileSaving || !canRemoveAvatar}
                >
                  Supprimer
                </Button>
              </Stack>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                JPG, PNG ou WEBP, 5 Mo maximum.
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Nom"
                value={profileForm.nom}
                onChange={handleProfileFieldChange('nom')}
              />
              <TextField
                fullWidth
                label="Prenom"
                value={profileForm.prenom}
                onChange={handleProfileFieldChange('prenom')}
              />
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Pseudo"
                value={profileForm.pseudo}
                onChange={handleProfileFieldChange('pseudo')}
              />
              <TextField
                fullWidth
                required
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileFieldChange('email')}
              />
            </Stack>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Bio"
              value={profileForm.bio}
              onChange={handleProfileFieldChange('bio')}
            />

            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 600, color: '#1a1d24' }}>
                Couleur du theme
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {THEME_COLOR_PRESETS.map((color) => (
                  <Box
                    key={color}
                    component="button"
                    type="button"
                    onClick={() => handleSelectThemeColor(color)}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border:
                        profileForm.displayColor === color
                          ? '3px solid #111827'
                          : '2px solid rgba(15, 23, 42, 0.12)',
                      backgroundColor: color,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="color"
                  label="Palette"
                  value={editorAccentColor}
                  onChange={handleProfileFieldChange('displayColor')}
                  sx={{ maxWidth: { md: 180 } }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  label="Code hex"
                  placeholder="#FF6600"
                  value={profileForm.displayColor}
                  onChange={handleProfileFieldChange('displayColor')}
                />
                <TextField
                  select
                  fullWidth
                  label="Mode"
                  value={profileForm.theme}
                  onChange={handleProfileFieldChange('theme')}
                >
                  <MenuItem value="LIGHT">Clair</MenuItem>
                  <MenuItem value="DARK">Sombre</MenuItem>
                </TextField>
              </Stack>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={profileForm.isProfilePublic}
                  onChange={handleProfileVisibilityChange}
                />
              }
              label="Profil public"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={handleResetProfileForm}
            disabled={profileSaving}
          >
            Reinitialiser
          </Button>
          <Button onClick={handleCloseProfileEditor} disabled={profileSaving}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSaveProfile()}
            disabled={profileSaving || !profileForm.email.trim()}
          >
            {profileSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        scroll="paper"
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle>Créer une playlist</DialogTitle>
        <DialogContent sx={dialogContentSx}>
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
      <Dialog
        open={newFollowersOpen}
        onClose={() => setNewFollowersOpen(false)}
        scroll="paper"
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle>Nouveaux abonnes</DialogTitle>
        <DialogContent sx={dialogContentSx}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Des personnes se sont abonnees a vous depuis votre derniere
              visite.
            </Typography>
            {newFollowers.map((profile) => {
              const isMutual = followingIds.has(profile.id);
              const profileHref = buildProfileHref(profile);
              return (
                <Paper
                  key={`new-follower-${profile.id}`}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: 2 }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        style={{ color: 'inherit', textDecoration: 'none' }}
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
                            '&:hover': { textDecoration: 'underline' },
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
                        sx={{ color: '#64748b' }}
                        noWrap
                      >
                        {profile.email || profile.handle}
                      </Typography>
                    </Box>
                    {isMutual ? (
                      <Chip label="Suivi mutuel" size="small" />
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void handleFollowBack(profile)}
                        disabled={socialActionId === profile.id}
                      >
                        {socialActionId === profile.id ? '...' : 'Suivre'}
                      </Button>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFollowersOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
