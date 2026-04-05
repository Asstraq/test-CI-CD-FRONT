'use client';

import NotificationsMenu from '@/components/NotificationsMenu';
import { Role } from '@/enum/roles';
import { useAuth } from '@/hooks/useAuth';
import { useUserSession } from '@/lib/auth/userSession';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user } = useUserSession();
  const { signOut, authLoading } = useAuth();
  const router = useRouter();

  return (
    <AppBar
      position="relative"
      elevation={0}
      sx={{
        zIndex: (theme) => theme.zIndex.appBar,
        overflow: 'visible',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', overflow: 'visible' }}>
        <Typography
          component={Link}
          href="/"
          variant="h6"
          sx={{ textDecoration: 'none', color: '#1a1d24', fontWeight: 600 }}
        >
          SoundBook
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {user ? (
            <>
              <NotificationsMenu />
              <Button
                component={Link}
                href="/messages"
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Messages
              </Button>
              {user.user.role === Role.ADMIN ? (
                <Button
                  component={Link}
                  href="/admin"
                  variant="outlined"
                  sx={{ textTransform: 'none', borderRadius: 999 }}
                >
                  Back office
                </Button>
              ) : null}
              <Button
                component={Link}
                href="/profile"
                variant="contained"
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Profil
              </Button>
              <Button
                variant="outlined"
                sx={{ textTransform: 'none', borderRadius: 999 }}
                onClick={async () => {
                  await signOut();
                  router.replace('/auth');
                }}
                disabled={authLoading}
              >
                {authLoading ? 'Déconnexion...' : 'Déconnexion'}
              </Button>
            </>
          ) : (
            <Button
              component={Link}
              href="/auth"
              variant="outlined"
              sx={{ textTransform: 'none', borderRadius: 999 }}
            >
              Connexion
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
