'use client';

import { useUserSession } from '@/lib/auth/userSession';
import {
  Avatar,
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

export default function ProfilePage() {
  const { user: userObject } = useUserSession();
  const user = userObject?.user;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f4f4f0 0%, #e9efff 100%)',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="md">
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
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              alignItems="center"
            >
              <Avatar
                alt="Photo de profil"
                src={'/images/profile-placeholder.jpg'}
                sx={{ width: 96, height: 96, bgcolor: '#c9d3e3', fontSize: 32 }}
              />
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: '#1a1d24' }}
                >
                  {user?.nom}
                </Typography>
                <Typography sx={{ color: '#4a5568', mt: 1 }}>
                  {user?.bio}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: '#1a1d24' }}
              >
                Librairie personnelle
              </Typography>
              <Typography sx={{ color: '#4a5568', mt: 1 }}>
                Section prête pour afficher les contenus enregistrés, les
                favoris ou les ressources de l&apos;utilisateur.
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  borderRadius: 3,
                  border: '1px dashed #c7d2e5',
                  backgroundColor: 'rgba(236, 242, 255, 0.6)',
                  p: { xs: 3, md: 4 },
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                Zone vide — connecte ta data pour remplir la librairie.
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
