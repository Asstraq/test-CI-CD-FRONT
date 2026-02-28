'use client';
import SearchInput from '@/app/homePage/SearchInput';
import { Box, Container, Paper, Stack, Typography } from '@mui/material';

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(120deg, #f7f2ea 0%, #eef3ff 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Space Grotesk", "Segoe UI", sans-serif',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 'auto auto -160px -140px',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(255, 170, 120, 0.35)',
          filter: 'blur(20px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: '-140px -120px auto auto',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'rgba(120, 160, 255, 0.3)',
          filter: 'blur(10px)',
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(255,255,255,0.8)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <Stack spacing={3}>
            <Typography
              variant="overline"
              letterSpacing={2}
              sx={{ color: '#5a6b7a' }}
            >
              Accueil
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 600, color: '#1a1d24' }}>
              SoundBook
            </Typography>
            <Typography sx={{ color: '#4a5568', maxWidth: 520 }}>
              Partagez votre expérience musicale...
            </Typography>
            <SearchInput />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
