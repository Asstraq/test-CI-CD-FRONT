'use client';

import { getGoogleAuthUrl, getMicrosoftAuthUrl } from '@/lib/api/auth.api';
import { Button, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

const providers = [
  {
    id: 'google',
    label: 'Continuer avec Google',
    icon: '/logoOauth/google.png',
    getUrl: getGoogleAuthUrl,
  },
  {
    id: 'microsoft',
    label: 'Continuer avec Microsoft',
    icon: '/logoOauth/microsoft.png',
    getUrl: getMicrosoftAuthUrl,
  },
] as const;

const Wrapper = styled('div')({
  marginTop: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});

const SectionTitle = styled(Typography)({
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#6b7280',
  textAlign: 'center',
});

export function OAuthButtons() {
  const handleClick = (url: string) => {
    window.location.assign(url);
  };

  return (
    <Wrapper>
      <SectionTitle>Ou continuer avec</SectionTitle>
      <Stack spacing={1.2}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outlined"
            onClick={() => handleClick(provider.getUrl())}
            sx={{
              textTransform: 'none',
              borderColor: 'rgba(31, 41, 55, 0.2)',
              color: '#1f2937',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'rgba(15, 23, 42, 0.03)',
              },
            }}
          >
            <Image
              width={24}
              height={24}
              alt={`logo of ${provider.id}`}
              src={provider.icon}
              style={{ marginRight: 12 }}
            />
            {provider.label}
          </Button>
        ))}
      </Stack>
    </Wrapper>
  );
}
