'use client';

import * as AuthAPI from '@/lib/api/auth.api';
import * as PlaylistAPI from '@/lib/api/playlist.api';
import CreatePlaylistDialog from './components/CreatePlaylistDialog';
import FollowRequestsSection from './components/FollowRequestsSection';
import NewFollowersDialog from './components/NewFollowersDialog';
import ProfileEditorDialog from './components/ProfileEditorDialog';
import ProfileHeaderSection from './components/ProfileHeaderSection';
import ProfilePlaylistsSection from './components/ProfilePlaylistsSection';
import SocialConnectionsSection from './components/SocialConnectionsSection';
import {
  buildProfileFormState,
  getProfileDisplayName,
  hasProfileChanged,
  readKnownFollowers,
  type ProfileEditorTab,
  type ProfileFormState,
  type ProfileTextField,
  type ProfileVisibilityField,
  writeKnownFollowers,
} from './components/profilePage.shared';
import {
  acceptFollowRequest,
  followUser,
  getIncomingFollowRequests,
  getMyFollowers,
  getMyFollowing,
  rejectFollowRequest,
  type SocialFollowRequest,
  type SocialProfile,
} from '@/lib/api/social.api';
import { useFavorites } from '@/hooks/useFavorites';
import { useUserSession } from '@/lib/auth/userSession';
import type { Playlist, PlaylistVisibility } from '@/type/playlist';
import type { UpdateProfilePayload, User } from '@/type/user';
import { Alert, Box, Container, Divider, Paper, Stack } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { user: userObject, setUser } = useUserSession();
  const user = userObject?.user;
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const requestsSectionRef = useRef<HTMLDivElement | null>(null);
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
  const [incomingRequests, setIncomingRequests] = useState<
    SocialFollowRequest[]
  >([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [socialActionId, setSocialActionId] = useState<string | null>(null);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [newFollowers, setNewFollowers] = useState<SocialProfile[]>([]);
  const [newFollowersOpen, setNewFollowersOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(() =>
    buildProfileFormState(user),
  );
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileEditorTab, setProfileEditorTab] =
    useState<ProfileEditorTab>('profile');
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
    if (!user?.id) return;
    void loadPlaylists();
  }, [loadPlaylists, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    async function syncCurrentProfile() {
      try {
        const response = await AuthAPI.me();
        if (!active) return;
        const currentProfile = 'user' in response ? response.user : response;
        if (hasProfileChanged(currentProfile as User, user)) {
          setUser({ user: currentProfile });
        }
      } catch {}
    }

    void syncCurrentProfile();

    return () => {
      active = false;
    };
  }, [
    setUser,
    user,
    user?.avatarUrl,
    user?.bio,
    user?.displayColor,
    user?.email,
    user?.id,
    user?.isBioPublic,
    user?.isEmailPublic,
    user?.isPrenomPublic,
    user?.isProfilePublic,
    user?.nom,
    user?.prenom,
    user?.pseudo,
    user?.theme,
    user?.updatedAt,
  ]);

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

      const [myFollowing, myFollowers, myIncomingRequests] = await Promise.all([
        getMyFollowing(),
        getMyFollowers(),
        getIncomingFollowRequests(),
      ]);

      setFollowing(myFollowing);
      setFollowers(myFollowers);
      setIncomingRequests(myIncomingRequests);

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
    if (searchParams.get('section') !== 'requests') return;
    if (!requestsSectionRef.current) return;

    window.setTimeout(() => {
      requestsSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  }, [incomingRequests.length, searchParams]);

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

  const handleAcceptRequest = async (request: SocialFollowRequest) => {
    const requesterId = request.requester?.id;
    if (!requesterId) return;

    try {
      setRequestActionId(request.id);
      await acceptFollowRequest(requesterId);
      await loadSocialGraph();
    } finally {
      setRequestActionId(null);
    }
  };

  const handleRejectRequest = async (request: SocialFollowRequest) => {
    const requesterId = request.requester?.id;
    if (!requesterId) return;

    try {
      setRequestActionId(request.id);
      await rejectFollowRequest(requesterId);
      await loadSocialGraph();
    } finally {
      setRequestActionId(null);
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

  const handleProfileFieldChange =
    (field: ProfileTextField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setProfileForm((prev) => ({ ...prev, [field]: value }));
      setProfileError('');
      setProfileSuccess('');
    };

  const handleProfileVisibilityChange =
    (field: ProfileVisibilityField) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setProfileForm((prev) => ({
        ...prev,
        [field]: event.target.checked,
      }));
      setProfileError('');
      setProfileSuccess('');
    };

  const handleOpenProfileEditor = (tab: ProfileEditorTab = 'profile') => {
    setProfileForm(buildProfileFormState(user));
    setSelectedAvatarFile(null);
    setAvatarRemoved(false);
    setProfileError('');
    setProfileSuccess('');
    setProfileEditorTab(tab);
    setProfileEditorOpen(true);
  };

  const handleProfileEditorTabChange = (
    _event: SyntheticEvent,
    value: ProfileEditorTab,
  ) => {
    setProfileEditorTab(value);
    setProfileError('');
    setProfileSuccess('');
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
        isPrenomPublic: profileForm.isPrenomPublic,
        isEmailPublic: profileForm.isEmailPublic,
        isBioPublic: profileForm.isBioPublic,
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
            <ProfileHeaderSection
              user={user}
              profileDisplayName={profileDisplayName}
              profileInitial={profileInitial}
              onEditProfile={() => handleOpenProfileEditor('profile')}
              onManagePrivacy={() => handleOpenProfileEditor('privacy')}
            />

            {profileSuccess ? (
              <Alert severity="success">{profileSuccess}</Alert>
            ) : null}

            <Divider />

            <FollowRequestsSection
              ref={requestsSectionRef}
              loading={socialLoading}
              incomingRequests={incomingRequests}
              requestActionId={requestActionId}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
            />

            <SocialConnectionsSection
              following={following}
              followers={followers}
              socialLoading={socialLoading}
              socialError={socialError}
              socialActionId={socialActionId}
              onFollowBack={handleFollowBack}
            />

            <ProfilePlaylistsSection
              playlists={playlists}
              listsLoading={listsLoading}
              selectedId={selectedId}
              onSelectPlaylist={setSelectedId}
              onOpenCreatePlaylist={() => setCreateOpen(true)}
              displayedPlaylist={displayedPlaylist}
              onUpdatePlaylistVisibility={handleUpdatePlaylistVisibility}
              playlistActionId={playlistActionId}
              playlistError={playlistError}
              displayedLoading={displayedLoading}
            />
          </Stack>
        </Paper>
      </Container>
      <ProfileEditorDialog
        open={profileEditorOpen}
        profileEditorTab={profileEditorTab}
        profileForm={profileForm}
        profileSaving={profileSaving}
        profileError={profileError}
        profileInitial={profileInitial}
        editorAvatarSrc={editorAvatarSrc}
        editorAccentColor={editorAccentColor}
        canRemoveAvatar={canRemoveAvatar}
        avatarInputRef={avatarInputRef}
        onClose={handleCloseProfileEditor}
        onSave={handleSaveProfile}
        onProfileEditorTabChange={handleProfileEditorTabChange}
        onAvatarFileChange={handleAvatarFileChange}
        onSelectAvatarClick={handleSelectAvatarClick}
        onRemoveAvatar={handleRemoveAvatar}
        onProfileFieldChange={handleProfileFieldChange}
        onProfileVisibilityChange={handleProfileVisibilityChange}
        onSelectThemeColor={handleSelectThemeColor}
      />
      <CreatePlaylistDialog
        open={createOpen}
        createState={createState}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        onNameChange={(event) =>
          setCreateState((prev) => ({ ...prev, name: event.target.value }))
        }
        onDescriptionChange={(event) =>
          setCreateState((prev) => ({
            ...prev,
            description: event.target.value,
          }))
        }
      />
      <NewFollowersDialog
        open={newFollowersOpen}
        newFollowers={newFollowers}
        followingIds={followingIds}
        socialActionId={socialActionId}
        onClose={() => setNewFollowersOpen(false)}
        onFollowBack={handleFollowBack}
      />
    </Box>
  );
}
