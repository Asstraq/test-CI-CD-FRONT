'use client';

import type { User } from '@/type/user';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

type Props = {
  user?: User | null;
  profileDisplayName: string;
  profileInitial: string;
  onEditProfile: () => void;
  onManagePrivacy: () => void;
};

export default function ProfileHeaderSection({
  user,
  profileDisplayName,
  profileInitial,
  onEditProfile,
  onManagePrivacy,
}: Props) {
  return (
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
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1d24' }}>
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
            onClick={onEditProfile}
            sx={{ mt: 1.5, borderRadius: 2 }}
          >
            Modifier le profil
          </Button>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Confidentialité
          </Typography>
          <Stack spacing={0.75}>
            <Typography sx={{ color: '#1a1d24' }}>
              Profil : {user?.isProfilePublic === false ? 'Privé' : 'Public'}
            </Typography>
            <Typography sx={{ color: '#1a1d24' }}>
              Prénom : {user?.isPrenomPublic === false ? 'Privé' : 'Public'}
            </Typography>
            <Typography sx={{ color: '#1a1d24' }}>
              Email : {user?.isEmailPublic === true ? 'Public' : 'Privé'}
            </Typography>
            <Typography sx={{ color: '#1a1d24' }}>
              Bio : {user?.isBioPublic === false ? 'Privée' : 'Publique'}
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            onClick={onManagePrivacy}
            sx={{ mt: 1.5, borderRadius: 2 }}
          >
            Gérer la confidentialité
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
