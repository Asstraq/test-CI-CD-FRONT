'use client';

import { buildProfileHref } from '@/lib/profile/profileHref';
import type { SocialFollowRequest, SocialProfile } from '@/lib/api/social.api';
import {
  Avatar,
  Box,
  Button,
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
import { forwardRef } from 'react';

type Props = {
  loading: boolean;
  incomingRequests: SocialFollowRequest[];
  requestActionId: string | null;
  onAcceptRequest: (request: SocialFollowRequest) => void | Promise<void>;
  onRejectRequest: (request: SocialFollowRequest) => void | Promise<void>;
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

const FollowRequestsSection = forwardRef<HTMLDivElement, Props>(
  (
    {
      loading,
      incomingRequests,
      requestActionId,
      onAcceptRequest,
      onRejectRequest,
    },
    ref,
  ) => {
    return (
      <Paper
        ref={ref}
        variant="outlined"
        sx={{
          width: '100%',
          borderRadius: 3,
          p: 2,
          bgcolor: 'rgba(248, 249, 255, 0.92)',
          scrollMarginTop: '96px',
        }}
      >
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, color: '#1a1d24' }}
          >
            Invitations
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Gérez ici les demandes de follow reçues.
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : incomingRequests.length > 0 ? (
            <List sx={{ py: 0 }}>
              {incomingRequests.map((request) => {
                const requester = request.requester;
                if (!requester) return null;
                const profileHref = buildProfileHref(requester);

                return (
                  <ListItem key={`request-${request.id}`} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      {profileHref ? (
                        <Link
                          href={profileHref}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          <Avatar src={requester.avatarUrl || undefined}>
                            {requester.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Link>
                      ) : (
                        <Avatar src={requester.avatarUrl || undefined}>
                          {requester.name.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={renderLinkedProfileName(requester)}
                      secondary={requester.email || requester.handle}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => void onAcceptRequest(request)}
                        disabled={requestActionId === request.id}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => void onRejectRequest(request)}
                        disabled={requestActionId === request.id}
                      >
                        Refuser
                      </Button>
                    </Stack>
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune invitation en attente.
            </Typography>
          )}
        </Stack>
      </Paper>
    );
  },
);

FollowRequestsSection.displayName = 'FollowRequestsSection';

export default FollowRequestsSection;
