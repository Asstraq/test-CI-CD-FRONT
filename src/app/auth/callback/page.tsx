'use client';

import {
  completeGoogleAuth,
  completeMicrosoftAuth,
  me,
  updateProfile,
} from '@/lib/api/auth.api';
import { clearToken, setToken } from '@/lib/auth/token';
import { useUserSession } from '@/lib/auth/userSession';
import type { UpdateProfilePayload, User } from '@/type/user';
import { Alert, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

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

type OAuthIdentity = {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
};

function splitDisplayName(displayName: string) {
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length <= 1) {
    return {
      prenom: undefined,
      nom: displayName.trim() || undefined,
    };
  }

  return {
    prenom: nameParts[0],
    nom: nameParts.slice(1).join(' '),
  };
}

function buildOAuthProfilePatch(
  identity: OAuthIdentity | null,
  user: User,
): UpdateProfilePayload | null {
  if (!identity) return null;

  const displayName = identity.displayName.trim();
  const parsedName = splitDisplayName(displayName);
  const normalizedCurrentNom = user.nom?.trim() ?? '';
  const normalizedCurrentPrenom = user.prenom?.trim() ?? '';

  const shouldSplitExistingFullName =
    !normalizedCurrentPrenom &&
    normalizedCurrentNom.length > 0 &&
    normalizedCurrentNom === displayName &&
    Boolean(parsedName.prenom) &&
    Boolean(parsedName.nom);

  const nextPrenom =
    !normalizedCurrentPrenom && parsedName.prenom
      ? parsedName.prenom
      : undefined;
  const nextNom =
    shouldSplitExistingFullName || !normalizedCurrentNom
      ? parsedName.nom
      : undefined;

  const patch: UpdateProfilePayload = {
    nom: nextNom,
    prenom: nextPrenom,
    email: !user.email?.trim() ? (identity.email ?? undefined) : undefined,
    avatarUrl: !user.avatarUrl?.trim() ? identity.avatarUrl : undefined,
  };

  return Object.values(patch).some((value) => value !== undefined)
    ? patch
    : null;
}

function AuthCallbackContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, clearUser } = useUserSession();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function completeAuthentication() {
      const oauthError = searchParams.get('error');
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const token = searchParams.get('token');

      if (oauthError) {
        clearToken();
        clearUser();
        if (active) {
          setError(oauthError);
          router.replace('/auth');
        }
        return;
      }

      if (!token && !(code && state)) {
        clearToken();
        clearUser();
        if (active) {
          setError('Paramètres OAuth manquants.');
          router.replace('/auth');
        }
        return;
      }

      try {
        const isMicrosoftCallback = pathname.includes('/auth/microsoft/');
        const oauthResult = token
          ? null
          : isMicrosoftCallback
            ? await completeMicrosoftAuth(code!, state!)
            : await completeGoogleAuth(code!, state!);
        const oauthIdentity = oauthResult
          ? 'google' in oauthResult
            ? oauthResult.google
            : {
                ...oauthResult.microsoft,
                avatarUrl: null,
              }
          : null;
        const nextToken = token ?? oauthResult!.token;
        setToken(nextToken);
        const response = await me();
        let user = 'user' in response ? response.user : response;
        const patch = buildOAuthProfilePatch(oauthIdentity, user);

        if (patch) {
          const updatedResponse = await updateProfile(patch);
          user =
            'user' in updatedResponse ? updatedResponse.user : updatedResponse;
        }

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
            : 'Connexion OAuth impossible.',
        );
        router.replace('/auth');
      }
    }

    void completeAuthentication();

    return () => {
      active = false;
    };
  }, [clearUser, pathname, router, searchParams, setUser]);

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

const Fallback = () => (
  <Page>
    <Card>
      <CircularProgress sx={{ color: '#ea580c' }} />
      <Title>Connexion en cours</Title>
    </Card>
  </Page>
);

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
