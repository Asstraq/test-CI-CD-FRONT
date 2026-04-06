'use client';

import { buildProfileHref } from '@/lib/profile/profileHref';
import type { SocialProfile } from '@/lib/api/social.api';
import { dialogContentSx, dialogPaperSx } from './profilePage.shared';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';

type Props = {
  open: boolean;
  newFollowers: SocialProfile[];
  followingIds: Set<string>;
  socialActionId: string | null;
  onClose: () => void;
  onFollowBack: (profile: SocialProfile) => void | Promise<void>;
};

export default function NewFollowersDialog({
  open,
  newFollowers,
  followingIds,
  socialActionId,
  onClose,
  onFollowBack,
}: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: dialogPaperSx } }}
    >
      <DialogTitle>Nouveaux abonnes</DialogTitle>
      <DialogContent sx={dialogContentSx}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Des personnes se sont abonnees a vous depuis votre derniere visite.
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
                      onClick={() => void onFollowBack(profile)}
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
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}
