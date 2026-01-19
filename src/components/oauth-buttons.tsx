'use client';

import { BACKEND_URL } from '@/lib/config';
import { Button, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Image from 'next/image';

type ProviderId = 'google' | 'github' | 'spotify';

const providers: {
  id: ProviderId;
  label: string;
}[] = [
  {
    id: 'google',
    label: 'Continuer avec Google',
  },
  {
    id: 'github',
    label: 'Continuer avec Github',
  },
  {
    id: 'spotify',
    label: 'Continuer avec Spotify',
  },
];

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

export function OAuthButtons({ basePath = '/auth' }) {
  const handleClick = (provider: ProviderId) => {
    window.location.assign(`${BACKEND_URL}${basePath}/${provider}`);
  };

  return (
    <Wrapper>
      <SectionTitle>Ou continuer avec</SectionTitle>
      <Stack spacing={1.2}>
        {providers.map((provider) => (
          <Button
            key={provider.id}
            variant="outlined"
            onClick={() => handleClick(provider.id)}
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
              src={`/logoOauth/${provider.id}.png`}
              style={{ marginRight: 12 }}
            />
            {provider.label}
          </Button>
        ))}
      </Stack>
    </Wrapper>
  );
}
