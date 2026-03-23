'use client';

import { me } from '@/lib/api/auth.api';
import { clearToken, setToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import { Alert, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const Page = styled('div')({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background:
    'radial-gradient(1200px 600px at 20% -10%, #f7e8d7 0%, transparent 60%), radial-gradient(900px 500px at 120% 0%, #d9efe8 0%, transparent 55%), #f4f4ef',
});

const Card = styled('div')({
  width: '100%',
  maxWidth: '420px',
  padding: '32px',
  borderRadius: '20px',
  backgroundColor: '#ffffff',
  boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  textAlign: 'center',
});

const Title = styled(Typography)({
  fontSize: '24px',
  fontWeight: 700,
  color: '#1f2937',
});

const Message = styled(Typography)({
  color: '#6b7280',
});

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, clearUser } = useUserSession();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function completeAuthentication() {
      const token = searchParams.get('token');

      if (!token) {
        clearToken();
        clearUser();
        if (active) {
          setError('Token OAuth manquant.');
          router.replace('/auth');
        }
        return;
      }

      try {
        setToken(token);
        const response = await me();
        const user = 'user' in response ? response.user : response;

        if (!active) return;

        setUser({ user });
        router.replace('/');
      } catch (cause) {
        clearToken();
        clearUser();

        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : 'Connexion Google impossible.',
        );
        router.replace('/auth');
      }
    }

    void completeAuthentication();

    return () => {
      active = false;
    };
  }, [clearUser, router, searchParams, setUser]);

  return (
    <Page>
      <Card>
        <CircularProgress sx={{ color: '#ea580c' }} />
        <Title>Connexion en cours</Title>
        <Message>
          Finalisation de votre session apres le retour du fournisseur OAuth.
        </Message>
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Card>
    </Page>
  );
}
