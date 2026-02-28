'use client';

import SearchInput from '@/app/homePage/SearchInput';
import FeedPost from '@/components/FeedPost';
import { useUserSession } from '@/lib/auth/userSession';
import {
  getAuthorById,
  getSeededFeed,
  getSeededFollowedUsers,
} from '@/lib/mock/feed.seed';
import {
  Alert,
  Box,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';

export default function HomeFeedPage() {
  const { user } = useUserSession();

  const feed = useMemo(() => getSeededFeed(user), [user]);

  const followedUsers = useMemo(() => getSeededFollowedUsers(user), [user]);

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
            <Stack spacing={2}>
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
                {user ? 'Partages de votre reseau' : 'Partages publics'}
              </Typography>
              <Typography sx={{ color: '#4a5568' }}>
                {user
                  ? 'Vous voyez les publications publiques et celles reservees aux abonnes de vos comptes suivis.'
                  : 'Connectez-vous pour voir aussi les publications reservees aux abonnes des comptes que vous suivez.'}
              </Typography>

              {user ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {followedUsers.length > 0 ? (
                    followedUsers.map((followed) => (
                      <Chip
                        key={followed.id}
                        label={`Vous suivez ${followed.handle}`}
                        sx={{ borderRadius: 2, backgroundColor: '#e5ecff' }}
                      />
                    ))
                  ) : (
                    <Chip
                      label="Aucun suivi seed detecte pour ce compte"
                      sx={{ borderRadius: 2, backgroundColor: '#ffeecf' }}
                    />
                  )}
                </Stack>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Apercu visiteur: seules les publications publiques sont
                  affichees.
                </Alert>
              )}
            </Stack>
          </Paper>

          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={3}
            alignItems="flex-start"
          >
            <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
              {feed.map((share) => {
                const author = getAuthorById(share.authorId);
                if (!author) return null;
                return (
                  <FeedPost key={share.id} share={share} author={author} />
                );
              })}
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
                  Rechercher un son
                </Typography>
                <Typography variant="body2" sx={{ color: '#62708b' }}>
                  Ajoutez facilement des titres a vos playlists depuis votre
                  accueil.
                </Typography>
                <SearchInput />
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
