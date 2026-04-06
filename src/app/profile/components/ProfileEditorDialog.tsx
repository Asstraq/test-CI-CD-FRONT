'use client';

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import type { ChangeEvent, SyntheticEvent } from 'react';
import type {
  ProfileEditorTab,
  ProfileFormState,
  ProfileTextField,
  ProfileVisibilityField,
} from './profilePage.shared';
import {
  THEME_COLOR_PRESETS,
  dialogContentSx,
  dialogPaperSx,
} from './profilePage.shared';

type Props = {
  open: boolean;
  profileEditorTab: ProfileEditorTab;
  profileForm: ProfileFormState;
  profileSaving: boolean;
  profileError: string;
  profileInitial: string;
  editorAvatarSrc: string | null;
  editorAccentColor: string;
  canRemoveAvatar: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onProfileEditorTabChange: (
    event: SyntheticEvent,
    value: ProfileEditorTab,
  ) => void;
  onAvatarFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectAvatarClick: () => void;
  onRemoveAvatar: () => void;
  onProfileFieldChange: (
    field: ProfileTextField,
  ) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onProfileVisibilityChange: (
    field: ProfileVisibilityField,
  ) => (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectThemeColor: (color: string) => void;
};

export default function ProfileEditorDialog({
  open,
  profileEditorTab,
  profileForm,
  profileSaving,
  profileError,
  profileInitial,
  editorAvatarSrc,
  editorAccentColor,
  canRemoveAvatar,
  avatarInputRef,
  onClose,
  onSave,
  onProfileEditorTabChange,
  onAvatarFileChange,
  onSelectAvatarClick,
  onRemoveAvatar,
  onProfileFieldChange,
  onProfileVisibilityChange,
  onSelectThemeColor,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogTitle>Modifier mon profil</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Tabs
            value={profileEditorTab}
            onChange={onProfileEditorTabChange}
            variant="fullWidth"
          >
            <Tab value="profile" label="Profil" />
            <Tab value="privacy" label="Confidentialité" />
          </Tabs>

          {profileEditorTab === 'profile' ? (
            <>
              <Stack spacing={1.5} alignItems="center">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={onAvatarFileChange}
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
                    onClick={onSelectAvatarClick}
                    disabled={profileSaving}
                  >
                    Choisir une photo
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={onRemoveAvatar}
                    disabled={profileSaving || !canRemoveAvatar}
                  >
                    Supprimer
                  </Button>
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={profileForm.nom}
                  onChange={onProfileFieldChange('nom')}
                />
                <TextField
                  fullWidth
                  label="Prenom"
                  value={profileForm.prenom}
                  onChange={onProfileFieldChange('prenom')}
                />
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  label="Pseudo"
                  value={profileForm.pseudo}
                  onChange={onProfileFieldChange('pseudo')}
                />
                <TextField
                  fullWidth
                  required
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={onProfileFieldChange('email')}
                />
              </Stack>

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Bio"
                value={profileForm.bio}
                onChange={onProfileFieldChange('bio')}
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
                      onClick={() => onSelectThemeColor(color)}
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
                    onChange={onProfileFieldChange('displayColor')}
                    sx={{ maxWidth: { md: 180 } }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    select
                    fullWidth
                    label="Mode"
                    value={profileForm.theme}
                    onChange={onProfileFieldChange('theme')}
                  >
                    <MenuItem value="LIGHT">Clair</MenuItem>
                    <MenuItem value="DARK">Sombre</MenuItem>
                  </TextField>
                </Stack>
              </Stack>
            </>
          ) : (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: 'rgba(248, 249, 255, 0.92)',
              }}
            >
              <Stack spacing={2}>
                <Typography sx={{ fontWeight: 700, color: '#1a1d24' }}>
                  Visibilité du profil
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={profileForm.isProfilePublic}
                      onChange={onProfileVisibilityChange('isProfilePublic')}
                    />
                  }
                  label="Profil public"
                />
                <Typography variant="body2" sx={{ color: '#64748b', mt: -1 }}>
                  Désactivé : votre profil n’est plus consultable publiquement.
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={profileForm.isPrenomPublic}
                      onChange={onProfileVisibilityChange('isPrenomPublic')}
                    />
                  }
                  label="Afficher mon prénom"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={profileForm.isEmailPublic}
                      onChange={onProfileVisibilityChange('isEmailPublic')}
                    />
                  }
                  label="Afficher mon email"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={profileForm.isBioPublic}
                      onChange={onProfileVisibilityChange('isBioPublic')}
                    />
                  }
                  label="Afficher ma bio"
                />
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={profileSaving}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={() => void onSave()}
          disabled={profileSaving || !profileForm.email.trim()}
        >
          {profileSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
