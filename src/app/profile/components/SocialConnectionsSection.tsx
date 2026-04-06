'use client';

import type { SocialProfile } from '@/lib/api/social.api';
import { buildProfileHref } from '@/lib/profile/profileHref';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';

type Props = {
  following: SocialProfile[];
  followers: SocialProfile[];
  socialLoading: boolean;
  socialError: string;
  socialActionId: string | null;
  onFollowBack: (profile: SocialProfile) => void | Promise<void>;
};

function renderLinkedProfileName(profile: SocialProfile) {
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
}

export default function SocialConnectionsSection({
  following,
  followers,
  socialLoading,
  socialError,
  socialActionId,
  onFollowBack,
}: Props) {
  const followingIds = new Set(following.map((profile) => profile.id));

  return (
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

          {socialError ? <Alert severity="error">{socialError}</Alert> : null}

          {socialLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
                  <ListItem key={`following-${profile.id}`} sx={{ px: 0 }}>
                    <ListItemAvatar>
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

          {socialLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : followers.length > 0 ? (
            <List sx={{ py: 0 }}>
              {followers.map((profile) => {
                const isMutual = followingIds.has(profile.id);
                const profileHref = buildProfileHref(profile);

                return (
                  <ListItem key={`follower-${profile.id}`} sx={{ px: 0 }}>
                    <ListItemAvatar>
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
                        onClick={() => void onFollowBack(profile)}
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
  );
}
